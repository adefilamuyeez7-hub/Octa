type AgentRequest = {
  message?: string;
  history?: Array<{ from?: string; text?: string }>;
};

type AgentResult = {
  reply: string;
  meta: string;
  live: boolean;
};

type OpenResponsesMessageItem = {
  type: "message";
  role: "user" | "assistant";
  content: Array<{ type: "input_text"; text: string }>;
};

type XaiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function buildLocalReply(message: string): AgentResult {
  const lower = message.toLowerCase();
  const actions: string[] = [];

  if (lower.includes("hire")) actions.push("drafting the hiring brief");
  if (lower.includes("payroll")) actions.push("preparing payroll review");
  if (lower.includes("review")) actions.push("assembling a performance summary");
  if (lower.includes("notion")) actions.push("syncing the task trail");
  if (lower.includes("schedule") || lower.includes("1:1"))
    actions.push("queuing calendar follow-up");

  const summary =
    actions.length > 0
      ? `I'm ${actions.join(", ")} for: "${message}".`
      : `I logged "${message}" and queued the next HR workflow steps.`;

  return {
    reply: `${summary} I can hand this to Moltbot once a live gateway is configured.`,
    meta: "Local fallback agent - handled just now",
    live: false,
  };
}

function extractReply(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const reply = extractReply(item);
      if (reply) return reply;
    }
    return null;
  }
  if (typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.output)) {
    for (const outputItem of record.output) {
      if (!outputItem || typeof outputItem !== "object") continue;
      const outputRecord = outputItem as Record<string, unknown>;
      if (!Array.isArray(outputRecord.content)) continue;

      const textParts = outputRecord.content
        .map((part) => {
          if (!part || typeof part !== "object") return null;
          const partRecord = part as Record<string, unknown>;
          return typeof partRecord.text === "string" ? partRecord.text : null;
        })
        .filter((part): part is string => Boolean(part));

      if (textParts.length > 0) {
        return textParts.join("\n");
      }
    }
  }

  const candidates = [
    record.reply,
    record.message,
    record.text,
    record.output_text,
    record.content,
    record.response,
    record.result,
  ];

  for (const candidate of candidates) {
    const reply = extractReply(candidate);
    if (reply) return reply;
  }

  if (Array.isArray(record.choices)) {
    for (const choice of record.choices) {
      const reply = extractReply(choice);
      if (reply) return reply;
    }
  }

  return null;
}

function buildOpenResponsesInput(input: AgentRequest): string | OpenResponsesMessageItem[] {
  const history = (input.history ?? []).filter(
    (entry): entry is { from: "you" | "agent"; text: string } =>
      (entry.from === "you" || entry.from === "agent") &&
      typeof entry.text === "string" &&
      entry.text.trim().length > 0,
  );

  if (history.length === 0 && input.message) {
    return input.message;
  }

  return history.map((entry) => ({
    type: "message",
    role: entry.from === "agent" ? "assistant" : "user",
    content: [{ type: "input_text", text: entry.text }],
  }));
}

function buildXaiMessages(input: AgentRequest): XaiChatMessage[] {
  const history = (input.history ?? []).filter(
    (entry): entry is { from: "you" | "agent"; text: string } =>
      (entry.from === "you" || entry.from === "agent") &&
      typeof entry.text === "string" &&
      entry.text.trim().length > 0,
  );

  const conversation =
    history.length > 0
      ? history.map((entry) => ({
          role: entry.from === "agent" ? "assistant" : "user",
          content: entry.text,
        }))
      : input.message
        ? [{ role: "user" as const, content: input.message }]
        : [];

  return [
    {
      role: "system",
      content:
        "You are 0cta, an HR operations copilot. Give direct, useful replies and suggest concrete next steps when helpful.",
    },
    ...conversation,
  ];
}

function normalizeXaiApiUrl(apiUrl: string): { endpoint: "responses" | "chat"; url: string } {
  const trimmed = apiUrl.trim();
  if (!trimmed) {
    return { endpoint: "responses", url: "https://api.x.ai/v1/responses" };
  }
  if (trimmed.endsWith("/chat/completions")) {
    return { endpoint: "chat", url: trimmed };
  }
  if (trimmed.endsWith("/responses")) {
    return { endpoint: "responses", url: trimmed };
  }
  if (trimmed.endsWith("/v1")) {
    return { endpoint: "responses", url: `${trimmed}/responses` };
  }
  if (trimmed.endsWith("/generate")) {
    return { endpoint: "responses", url: trimmed.replace(/\/generate$/, "/responses") };
  }
  return { endpoint: "responses", url: `${trimmed.replace(/\/$/, "")}/responses` };
}

async function callMoltbotGateway(
  input: AgentRequest,
  webhookUrl: string,
  apiKey?: string,
): Promise<AgentResult> {
  const agentId = process.env.MOLTBOT_AGENT_ID || "main";
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      "x-openclaw-agent-id": agentId,
    },
    body: JSON.stringify({
      model: "openclaw",
      input: buildOpenResponsesInput(input),
      user: "octa-dashboard",
      source: "octa-dashboard",
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gateway error ${response.status}: ${raw}`);
  }

  let payload: unknown = raw;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Plain text is acceptable.
  }

  const reply = extractReply(payload) ?? "Moltbot accepted the task but returned an empty reply.";
  return {
    reply,
    meta: `Live via Moltbot gateway (${agentId}) - responded just now`,
    live: true,
  };
}

async function callXaiApi(
  input: AgentRequest,
  apiUrl: string,
  apiKey: string,
  model: string,
): Promise<AgentResult> {
  const endpoint = normalizeXaiApiUrl(apiUrl);
  const payload: Record<string, unknown> =
    endpoint.endpoint === "chat"
      ? {
          model,
          messages: buildXaiMessages(input),
          user: "octa-dashboard",
        }
      : {
          model,
          input: buildXaiMessages(input),
          store: false,
          user: "octa-dashboard",
        };

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Grok API error ${response.status}: ${raw}`);
  }

  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Some Grok endpoints may return plain text.
  }

  const reply =
    extractReply(parsed) ??
    (typeof raw === "string" ? raw.trim() : "Grok returned an empty reply.");
  return {
    reply,
    meta: `Live via xAI (${model}) - responded just now`,
    live: true,
  };
}

export async function runAgent(input: AgentRequest): Promise<AgentResult> {
  const message = input.message?.trim();
  if (!message) {
    throw new Error("Missing message");
  }

  const grokApiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
  const grokApiUrl =
    process.env.XAI_API_URL || process.env.GROK_API_URL || "https://api.x.ai/v1/responses";
  const grokModel = process.env.XAI_MODEL || process.env.GROK_MODEL || "grok-latest";
  const webhookUrl = process.env.MOLTBOT_WEBHOOK_URL || "";
  const apiKey = process.env.MOLTBOT_API_KEY || "";

  if (!grokApiKey && !webhookUrl) {
    return buildLocalReply(message);
  }

  if (grokApiKey) {
    try {
      return await callXaiApi(input, grokApiUrl, grokApiKey, grokModel);
    } catch (error) {
      console.error("grok api error", error);
      return {
        ...buildLocalReply(message),
        meta: "xAI API failed - local fallback used just now",
      };
    }
  }

  try {
    return await callMoltbotGateway(input, webhookUrl, apiKey || undefined);
  } catch (error) {
    console.error("moltbot gateway error", error);
    return {
      ...buildLocalReply(message),
      meta: "Moltbot gateway failed - local fallback used just now",
    };
  }
}

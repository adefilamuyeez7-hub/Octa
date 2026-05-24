import notion from "../lib/notion";
import { appRepository } from "../lib/storage";

type AgentRequest = {
  message?: string;
  provider?: "xai" | "gemini" | "claude" | "groq" | "local";
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
    reply: `${summary} I can hand this to Moltbot once a live webhook is configured.`,
    meta: "Local fallback agent - saved to task queue just now",
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

  const candidatesFields = [
    record.reply,
    record.message,
    record.text,
    record.output_text,
    record.content,
    record.response,
    record.result,
    record.parts,
  ];

  for (const candidate of candidatesFields) {
    const reply = extractReply(candidate);
    if (reply) return reply;
  }

  if (Array.isArray(record.choices)) {
    for (const choice of record.choices) {
      const reply = extractReply(choice);
      if (reply) return reply;
    }
  }

  if (Array.isArray(record.candidates)) {
    for (const choice of record.candidates) {
      const reply = extractReply(choice);
      if (reply) return reply;
    }
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

  const conversation: XaiChatMessage[] =
    history.length > 0
      ? history.map((entry) => ({
          role: entry.from === "agent" ? ("assistant" as const) : ("user" as const),
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

async function callMoltbotWebhook(
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
      message: input.message,
      history: input.history ?? [],
      source: "octa-dashboard",
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Webhook error ${response.status}: ${raw}`);
  }

  let payload: unknown = raw;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Plain text responses are acceptable.
  }

  const reply = extractReply(payload) ?? "Moltbot accepted the task but returned an empty reply.";
  return {
    reply,
    meta: `Live via Moltbot gateway (${agentId}) - responded just now`,
    live: true,
  };
}

async function callGeminiApi(
  input: AgentRequest,
  apiKey: string,
): Promise<AgentResult> {
  const history = (input.history ?? []).filter(
    (entry): entry is { from: "you" | "agent"; text: string } =>
      (entry.from === "you" || entry.from === "agent") &&
      typeof entry.text === "string" &&
      entry.text.trim().length > 0,
  );

  const contents = history.map((entry) => ({
    role: entry.from === "agent" ? "model" : "user",
    parts: [{ text: entry.text }],
  }));

  if (input.message) {
    contents.push({
      role: "user",
      parts: [{ text: input.message }],
    });
  }

  const payload = {
    contents,
    systemInstruction: {
      parts: [
        {
          text: "You are 0cta, an HR operations copilot. Give direct, useful replies and suggest concrete next steps when helpful.",
        },
      ],
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${raw}`);
  }

  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Ignore parse error
  }

  const reply = extractReply(parsed) ?? (typeof raw === "string" ? raw.trim() : "Gemini returned an empty reply.");
  
  return {
    reply,
    meta: `Live via Google Gemini (1.5 Flash) - responded just now`,
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

async function callClaudeApi(
  input: AgentRequest,
  apiKey: string,
): Promise<AgentResult> {
  const history = (input.history ?? []).filter(
    (entry): entry is { from: "you" | "agent"; text: string } =>
      (entry.from === "you" || entry.from === "agent") &&
      typeof entry.text === "string" &&
      entry.text.trim().length > 0,
  );

  const messages = history.map((entry) => ({
    role: entry.from === "agent" ? "assistant" : "user",
    content: entry.text,
  }));

  if (input.message) {
    messages.push({
      role: "user",
      content: input.message,
    });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: "You are 0cta, an HR operations copilot. Give direct, useful replies and suggest concrete next steps when helpful.",
      messages,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${raw}`);
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {}

  const reply = parsed.content?.[0]?.text ?? "Claude returned an empty reply.";

  return {
    reply,
    meta: `Live via Anthropic Claude - responded just now`,
    live: true,
  };
}

export async function agentRun(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const input = (await request.json()) as AgentRequest;
    const message = input.message?.trim();

    if (!message) {
      return Response.json({ error: "Missing message" }, { status: 400 });
    }

    await notion.pushToNotion({
      title: message.slice(0, 80),
      text: message,
      createdAt: new Date().toISOString(),
      via: "agent",
    });
    await appRepository.appendTask({
      type: "agent_request",
      text: message,
      history: input.history ?? [],
      createdAt: new Date().toISOString(),
    });

    const settings = await appRepository.getSettings();

    const grokApiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";
    const grokApiUrl =
      process.env.XAI_API_URL || process.env.GROK_API_URL || "https://api.x.ai/v1/responses";
    const grokModel = process.env.XAI_MODEL || process.env.GROK_MODEL || "grok-latest";
    const geminiApiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || "";
    const claudeApiKey = settings.claudeApiKey || "";
    // Let's use the DB settings to determine provider if passed input provider is empty or not matching.
    const provider = input.provider || settings.llmProvider || "local";
    const webhookUrl = process.env.MOLTBOT_WEBHOOK_URL || "";
    const apiKey = process.env.MOLTBOT_API_KEY || "";

    let result = buildLocalReply(message);
    if (provider === "claude" && claudeApiKey) {
      try {
        result = await callClaudeApi(input, claudeApiKey);
      } catch (error) {
        console.error("claude api error", error);
        result = {
          ...buildLocalReply(message),
          meta: "Claude API failed - local fallback used just now",
        };
      }
    } else if (provider === "gemini" && geminiApiKey) {
      try {
        result = await callGeminiApi(input, geminiApiKey);
      } catch (error) {
        console.error("gemini api error", error);
        result = {
          ...buildLocalReply(message),
          meta: "Gemini API failed - local fallback used just now",
        };
      }
    } else if (grokApiKey) {
      try {
        result = await callXaiApi(input, grokApiUrl, grokApiKey, grokModel);
      } catch (error) {
        console.error("grok api error", error);
        result = {
          ...buildLocalReply(message),
          meta: "xAI API failed - local fallback used just now",
        };
      }
    } else if (webhookUrl) {
      try {
        result = await callMoltbotWebhook(input, webhookUrl, apiKey || undefined);
      } catch (error) {
        console.error("moltbot webhook error", error);
        result = {
          ...buildLocalReply(message),
          meta: "Moltbot webhook failed - local fallback used just now",
        };
      }
    }

    await appRepository.appendTask({
      type: "agent_response",
      text: result.reply,
      live: result.live,
      createdAt: new Date().toISOString(),
    });

    return Response.json(result);
  } catch (error) {
    console.error("agent run error", error);
    return Response.json(
      {
        reply: "The agent request failed before it could run.",
        meta: "Server error",
        live: false,
      },
      { status: 500 },
    );
  }
}

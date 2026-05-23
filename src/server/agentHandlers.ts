import notion from "../lib/notion";
import { appRepository } from "../lib/storage";
import { runAgent, type AgentRequest } from "../lib/agent-core";

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

    const result = await runAgent(input);

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

import { runAgent } from "../_lib/agent";
import { pushToNotion } from "../_lib/notion";

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const input = (await request.json()) as { message?: string; history?: Array<{ from?: string; text?: string }> };
      const message = input.message?.trim();
      if (!message) {
        return Response.json({ error: "Missing message" }, { status: 400 });
      }

      const result = await runAgent(input);
      const notion = await pushToNotion(request, {
        title: message.slice(0, 80),
        text: message,
        createdAt: new Date().toISOString(),
        via: "agent",
      });

      return Response.json({
        ...result,
        notion,
      });
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
  },
};

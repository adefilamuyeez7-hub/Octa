import { pushToNotion } from "../_lib/notion";

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = (await request.json()) as {
        title?: string;
        text?: string;
        type?: string;
        via?: string;
      };
      const text = body.text?.trim() || body.title?.trim() || "";
      if (!text) {
        return Response.json({ error: "Missing task text" }, { status: 400 });
      }

      const task = {
        title: body.title?.trim() || text.slice(0, 80),
        text,
        type: body.type?.trim() || "manual_task",
        via: body.via?.trim() || "manual-task",
        createdAt: new Date().toISOString(),
      };

      const notion = await pushToNotion(request, task);

      return Response.json({
        ok: true,
        task,
        notion,
      });
    } catch (error) {
      console.error("task create error", error);
      return Response.json({ ok: false, error: "Task creation failed" }, { status: 500 });
    }
  },
};

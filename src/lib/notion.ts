import { appRepository } from "./storage";

const NOTION_TOKEN = (import.meta.env && (import.meta.env.VITE_NOTION_TOKEN as string)) || (process && (process.env.NOTION_TOKEN as string));
const NOTION_DB = (import.meta.env && (import.meta.env.VITE_NOTION_DATABASE_ID as string)) || (process && (process.env.NOTION_DATABASE_ID as string));

export async function pushToNotion(task: Record<string, unknown>) {
  if (!NOTION_TOKEN || !NOTION_DB) {
    // Fallback: store locally in JSON DB
    await appRepository.appendTask({ type: "notion_fallback", via: 'fallback', ...task, createdAt: new Date().toISOString() });
    return { ok: true, fallback: true };
  }

  try {
    const payload = {
      parent: { database_id: NOTION_DB },
      properties: {
        Name: { title: [{ text: { content: (task.title as string) ?? (task.text as string) ?? 'Task' } }] },
        Notes: { rich_text: [{ text: { content: (task.text as string) ?? '' } }] },
      },
    };

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Notion API error', res.status, text);
      // fallback
      await appRepository.appendTask({ type: "notion_error", via: 'notion-error', status: res.status, body: text, ...task, createdAt: new Date().toISOString() });
      return { ok: false, status: res.status };
    }
    const json = await res.json();
    return { ok: true, result: json };
  } catch (e) {
    console.error('pushToNotion error', e);
    await appRepository.appendTask({ type: "notion_exception", via: 'notion-exception', error: String(e), ...task, createdAt: new Date().toISOString() });
    return { ok: false, error: String(e) };
  }
}

export default { pushToNotion };

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue }
interface JSONArray extends Array<JSONValue> {}

const DEFAULT_DB = { settings: {}, tasks: [] } as JSONObject;

async function isNodeFsAvailable(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = await import('fs');
    return typeof fs !== 'undefined';
  } catch {
    return false;
  }
}

const DB_PATH = './data/db.json';

export async function readDb(): Promise<JSONObject> {
  if (await isNodeFsAvailable()) {
    const fs = await import('fs');
    try {
      if (!fs.existsSync(DB_PATH)) {
        await fs.promises.mkdir('./data', { recursive: true });
        await fs.promises.writeFile(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
        return DEFAULT_DB;
      }
      const raw = await fs.promises.readFile(DB_PATH, 'utf8');
      return JSON.parse(raw) as JSONObject;
    } catch (e) {
      console.error('jsonDb read error', e);
      return DEFAULT_DB;
    }
  }

  // Browser fallback: localStorage
  try {
    const raw = localStorage.getItem('0cta_db');
    if (!raw) {
      localStorage.setItem('0cta_db', JSON.stringify(DEFAULT_DB));
      return DEFAULT_DB;
    }
    return JSON.parse(raw) as JSONObject;
  } catch (e) {
    console.error('jsonDb localStorage read error', e);
    return DEFAULT_DB;
  }
}

export async function writeDb(db: JSONObject): Promise<void> {
  if (await isNodeFsAvailable()) {
    const fs = await import('fs');
    try {
      await fs.promises.mkdir('./data', { recursive: true });
      await fs.promises.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
      return;
    } catch (e) {
      console.error('jsonDb write error', e);
    }
  }

  try {
    localStorage.setItem('0cta_db', JSON.stringify(db));
  } catch (e) {
    console.error('jsonDb localStorage write error', e);
  }
}

export async function getSettings(): Promise<JSONObject> {
  const db = await readDb();
  return (db.settings as JSONObject) ?? {};
}

export async function setSettings(next: JSONObject): Promise<void> {
  const db = await readDb();
  db.settings = next;
  await writeDb(db);
}

export async function pushTask(task: JSONObject): Promise<void> {
  const db = await readDb();
  const tasks = (db.tasks as JSONArray) || [];
  tasks.push(task);
  db.tasks = tasks;
  await writeDb(db);
}

export default { readDb, writeDb, getSettings, setSettings, pushTask };

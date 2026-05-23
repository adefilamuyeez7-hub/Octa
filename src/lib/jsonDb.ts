import { appRepository } from "./storage";
import type { AppDatabase, AppSettings, JsonObject, TaskRecord } from "./storage/types";

export async function readDb(): Promise<AppDatabase> {
  return appRepository.readDb();
}

export async function writeDb(db: AppDatabase): Promise<void> {
  await appRepository.writeDb(db);
}

export async function getSettings(): Promise<AppSettings> {
  return appRepository.getSettings();
}

export async function setSettings(next: AppSettings): Promise<void> {
  await appRepository.setSettings(next);
}

export async function pushTask(task: JsonObject): Promise<TaskRecord> {
  const createdAt = typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString();
  const type = typeof task.type === "string" ? task.type : "generic";

  return appRepository.appendTask({
    ...task,
    createdAt,
    type,
    title: typeof task.title === "string" ? task.title : undefined,
    text: typeof task.text === "string" ? task.text : undefined,
  });
}

export default { readDb, writeDb, getSettings, setSettings, pushTask };

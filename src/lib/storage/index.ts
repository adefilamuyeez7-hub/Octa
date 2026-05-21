import { createLocalJsonRepository } from "./local-json-repository";

export const appRepository = createLocalJsonRepository(typeof window === "undefined" ? undefined : window.localStorage);

export { createLocalJsonRepository };
export type {
  AppDatabase,
  AppSettings,
  AppUserRecord,
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  StorageRepository,
  TaskRecord,
} from "./types";

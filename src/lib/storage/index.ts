import { createSupabaseRepository } from "./supabase-repository";

// Now exporting the live Supabase database repository
export const appRepository = createSupabaseRepository();

export { createSupabaseRepository };
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

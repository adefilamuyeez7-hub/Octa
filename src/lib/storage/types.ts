export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray | undefined;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

export interface AppSettings extends JsonObject {
  siteName?: string;
  tokenEnabled?: boolean;
  walletEnabled?: boolean;
  burnPolicy?: "per_request" | "per_action" | "monthly_cap";
  walletAddress?: string;
  approvalRequired?: boolean;
  llmProvider?: "gemini" | "groq" | "local";
  geminiApiKey?: string;
  groqApiKey?: string;
  adminWallets?: string[];
  userFeatures?: {
    chatEnabled: boolean;
    tasksEnabled: boolean;
  };
  // Platform access controls
  loginEnabled?: boolean;
  signupEnabled?: boolean;
  waitlistMode?: boolean;
}

export interface AppUserRecord extends JsonObject {
  id: string;
  name: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord extends JsonObject {
  id: string;
  type: string;
  title?: string;
  text?: string;
  createdAt: string;
}

export interface AppDatabase extends JsonObject {
  version: number;
  settings: AppSettings;
  users: AppUserRecord[];
  tasks: TaskRecord[];
}

export interface StorageRepository {
  readDb(): Promise<AppDatabase>;
  writeDb(db: AppDatabase): Promise<void>;
  getSettings(): Promise<AppSettings>;
  setSettings(next: AppSettings): Promise<void>;
  listUsers(): Promise<AppUserRecord[]>;
  saveUser(user: Omit<AppUserRecord, "updatedAt"> & { updatedAt?: string }): Promise<AppUserRecord>;
  listTasks(): Promise<TaskRecord[]>;
  appendTask(task: Omit<TaskRecord, "id"> & { id?: string }): Promise<TaskRecord>;
  exportData(): Promise<AppDatabase>;
}

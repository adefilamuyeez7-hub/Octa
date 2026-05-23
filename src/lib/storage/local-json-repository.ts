import type { AppDatabase, AppSettings, AppUserRecord, StorageRepository, TaskRecord } from "./types";

const STORAGE_KEY = "0cta_db";
const SCHEMA_VERSION = 1;

const DEFAULT_DB: AppDatabase = {
  version: SCHEMA_VERSION,
  settings: {
    llmProvider: "gemini",
    geminiApiKey: "AIzaSyCEMbZgFiUeanec_7Cdkv4G16i4L8dZJzY",
  },
  users: [],
  tasks: [],
};

function cloneDefaultDb(): AppDatabase {
  return {
    version: DEFAULT_DB.version,
    settings: { ...DEFAULT_DB.settings },
    users: [...DEFAULT_DB.users],
    tasks: [...DEFAULT_DB.tasks],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeDb(value: unknown): AppDatabase {
  const record = asRecord(value);
  const settings = asRecord(record.settings) as AppSettings;
  const users = Array.isArray(record.users) ? (record.users.filter((entry) => entry && typeof entry === "object") as AppUserRecord[]) : [];
  const tasks = Array.isArray(record.tasks) ? (record.tasks.filter((entry) => entry && typeof entry === "object") as TaskRecord[]) : [];

  return {
    version: typeof record.version === "number" ? record.version : SCHEMA_VERSION,
    settings,
    users,
    tasks,
  };
}

function buildId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createLocalJsonRepository(storage?: Storage): StorageRepository {
  function readLocalDb(): AppDatabase {
    if (!storage) {
      return cloneDefaultDb();
    }

    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        const next = cloneDefaultDb();
        storage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }

      return normalizeDb(JSON.parse(raw));
    } catch (error) {
      console.error("jsonDb localStorage read error", error);
      return cloneDefaultDb();
    }
  }

  function writeLocalDb(db: AppDatabase): void {
    if (!storage) {
      return;
    }

    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(normalizeDb(db)));
    } catch (error) {
      console.error("jsonDb localStorage write error", error);
    }
  }

  async function updateDb(mutator: (db: AppDatabase) => void): Promise<AppDatabase> {
    const db = readLocalDb();
    mutator(db);
    writeLocalDb(db);
    return db;
  }

  return {
    async readDb() {
      return readLocalDb();
    },
    async writeDb(db) {
      writeLocalDb(db);
    },
    async getSettings() {
      return readLocalDb().settings;
    },
    async setSettings(next) {
      await updateDb((db) => {
        db.settings = { ...next };
      });
    },
    async listUsers() {
      return readLocalDb().users;
    },
    async saveUser(user) {
      const savedUser: AppUserRecord = {
        ...user,
        id: user.id as string,
        name: user.name as string,
        createdAt: user.createdAt as string,
        updatedAt: (user.updatedAt as string) ?? new Date().toISOString(),
      };

      await updateDb((db) => {
        const existingIndex = db.users.findIndex((entry) => entry.id === savedUser.id);
        if (existingIndex >= 0) {
          db.users[existingIndex] = savedUser;
          return;
        }
        db.users.push(savedUser);
      });

      return savedUser;
    },
    async listTasks() {
      return readLocalDb().tasks;
    },
    async appendTask(task) {
      const savedTask: TaskRecord = {
        ...task,
        id: (task.id as string) ?? buildId("task"),
        type: task.type as any,
        createdAt: task.createdAt as string,
      };

      await updateDb((db) => {
        db.tasks.push(savedTask);
      });

      return savedTask;
    },
    async exportData() {
      return readLocalDb();
    },
  };
}

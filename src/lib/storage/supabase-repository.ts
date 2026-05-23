import { supabase } from "../supabaseClient";
import type { AppDatabase, AppSettings, AppUserRecord, StorageRepository, TaskRecord } from "./types";

const SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  siteName: "0cta",
  loginEnabled: true,
  signupEnabled: true,
  waitlistMode: false,
  llmProvider: "local",
};

export function createSupabaseRepository(): StorageRepository {
  return {
    async readDb() {
      const [settings, users, tasks] = await Promise.all([
        this.getSettings(),
        this.listUsers(),
        this.listTasks(),
      ]);

      return {
        version: SCHEMA_VERSION,
        settings,
        users,
        tasks,
      };
    },
    async writeDb(db) {
      // Full overwrite is rarely done in Supabase, but implementing for interface compliance
      await this.setSettings(db.settings);
      for (const user of db.users) {
        await this.saveUser(user);
      }
      for (const task of db.tasks) {
        // Only append if it doesn't exist to avoid violating constraints, 
        // though realistically this isn't how SQL DBs are populated from memory
        await this.appendTask(task); 
      }
    },
    async getSettings() {
      const { data, error } = await supabase
        .from("settings")
        .select("config")
        .eq("id", 1)
        .single();
        
      if (error || !data) {
        console.warn("Could not fetch settings, returning defaults", error);
        return DEFAULT_SETTINGS;
      }
      return data.config as AppSettings;
    },
    async setSettings(next) {
      // Fetch current config to merge
      const { data } = await supabase
        .from("settings")
        .select("config")
        .eq("id", 1)
        .single();
        
      const currentConfig = data?.config || {};
      const mergedConfig = { ...currentConfig, ...next };

      const { error } = await supabase
        .from("settings")
        .upsert({ id: 1, config: mergedConfig, updated_at: new Date().toISOString() });
        
      if (error) {
        console.error("Error saving settings:", error);
      }
    },
    async listUsers() {
      const { data, error } = await supabase.from("users").select("*");
      if (error || !data) {
        console.error("Error fetching users:", error);
        return [];
      }
      
      return data.map((u: any) => ({
        id: u.id,
        name: u.name,
        role: u.role,
        walletAddress: u.wallet_address,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      })) as AppUserRecord[];
    },
    async saveUser(user) {
      const dbUser = {
        id: user.id,
        name: user.name,
        role: user.role,
        // Map camelCase to snake_case if it exists in the user object (we might be storing it there)
        wallet_address: (user as any).walletAddress, 
        updated_at: new Date().toISOString(),
        // We only pass created_at if it exists, otherwise DB handles it
        ...(user.createdAt ? { created_at: user.createdAt } : {}),
      };

      const { data, error } = await supabase
        .from("users")
        .upsert(dbUser)
        .select()
        .single();

      if (error || !data) {
        console.error("Error saving user:", error);
        // Fallback to returning what was passed in
        return {
          ...user,
          updatedAt: new Date().toISOString()
        } as AppUserRecord;
      }

      return {
        id: data.id,
        name: data.name,
        role: data.role,
        walletAddress: data.wallet_address,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as AppUserRecord;
    },
    async listTasks() {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error || !data) {
        console.error("Error fetching tasks:", error);
        return [];
      }
      
      return data.map((t: any) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        text: t.text,
        assigneeId: t.assignee_id,
        status: t.status,
        createdAt: t.created_at,
        ...t.metadata // Spread any extra JSON payload
      })) as TaskRecord[];
    },
    async appendTask(task) {
      // Generate ID if missing (uuid)
      const id = task.id || crypto.randomUUID();
      
      // Extract standard columns and put the rest in metadata
      const { id: _, type, title, text, assigneeId, status, createdAt, ...metadata } = task as any;
      
      const dbTask = {
        id,
        type: task.type,
        title: task.title,
        text: task.text,
        assignee_id: assigneeId,
        status: status || 'pending',
        metadata: metadata || {},
        ...(task.createdAt ? { created_at: task.createdAt } : {}),
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(dbTask)
        .select()
        .single();

      if (error || !data) {
        console.error("Error appending task:", error);
        return { ...task, id } as TaskRecord;
      }

      return {
        id: data.id,
        type: data.type,
        title: data.title,
        text: data.text,
        assigneeId: data.assignee_id,
        status: data.status,
        createdAt: data.created_at,
        ...data.metadata
      } as TaskRecord;
    },
    async exportData() {
      return this.readDb();
    },
  };
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readFile<T>(name: string, defaultValue: T): T {
  ensureDir();
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    return defaultValue;
  }
  try {
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeFile<T>(name: string, data: T): void {
  ensureDir();
  const fp = filePath(name);
  const tmp = fp + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, fp);
}

export function newId(): string {
  return crypto.randomUUID();
}

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  bio: string;
  avatar: string;
  role: "user" | "admin";
  banned: boolean;
  createdAt: string;
}

export interface StoredPost {
  id: string;
  userId: string;
  content: string;
  image: string;
  parentId: string;
  likes: string[];
  retweets: string[];
  createdAt: string;
}

export interface StoredLog {
  id: string;
  event: string;
  userId: string;
  username: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export const users = {
  getAll(): StoredUser[] {
    return readFile<StoredUser[]>("users", []);
  },
  save(all: StoredUser[]): void {
    writeFile("users", all);
  },
  findById(id: string): StoredUser | undefined {
    return this.getAll().find((u) => u.id === id);
  },
  findByUsername(username: string): StoredUser | undefined {
    return this.getAll().find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );
  },
  create(user: StoredUser): StoredUser {
    const all = this.getAll();
    all.push(user);
    this.save(all);
    return user;
  },
  update(updated: StoredUser): StoredUser {
    const all = this.getAll().map((u) => (u.id === updated.id ? updated : u));
    this.save(all);
    return updated;
  },
  delete(id: string): void {
    const all = this.getAll().filter((u) => u.id !== id);
    this.save(all);
  },
};

export const posts = {
  getAll(): StoredPost[] {
    return readFile<StoredPost[]>("posts", []);
  },
  save(all: StoredPost[]): void {
    writeFile("posts", all);
  },
  findById(id: string): StoredPost | undefined {
    return this.getAll().find((p) => p.id === id);
  },
  create(post: StoredPost): StoredPost {
    const all = this.getAll();
    all.unshift(post);
    this.save(all);
    return post;
  },
  update(updated: StoredPost): StoredPost {
    const all = this.getAll().map((p) =>
      p.id === updated.id ? updated : p,
    );
    this.save(all);
    return updated;
  },
  delete(id: string): void {
    const all = this.getAll().filter((p) => p.id !== id);
    this.save(all);
  },
  getRepliesCount(parentId: string): number {
    return this.getAll().filter((p) => p.parentId === parentId).length;
  },
};

export const logs = {
  getAll(): StoredLog[] {
    return readFile<StoredLog[]>("logs", []);
  },
  save(all: StoredLog[]): void {
    writeFile("logs", all);
  },
  create(log: StoredLog): StoredLog {
    const all = this.getAll();
    all.unshift(log);
    if (all.length > 1000) all.splice(1000);
    this.save(all);
    return log;
  },
};

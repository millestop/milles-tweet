import { users, posts, newId } from "./storage.js";
import { hashPassword } from "./auth.js";

export function seedIfEmpty(): void {
  const allUsers = users.getAll();

  if (allUsers.some((u) => u.username === "admin")) {
    return;
  }

  const adminId = newId();
  const now = new Date().toISOString();

  users.create({
    id: adminId,
    username: "admin",
    passwordHash: hashPassword("milasionmilles.co.co"),
    name: "مدير النظام",
    bio: "مدير منصة ميلس تويت",
    avatar: "",
    role: "admin",
    banned: false,
    createdAt: now,
  });
}

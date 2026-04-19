import { Router, Request, Response } from "express";
import { users, newId, StoredUser } from "../lib/storage.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { requireAuth } from "../middlewares/session.js";
import { logNewAccount } from "../lib/discord.js";

const router = Router();

function publicUser(u: StoredUser) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    bio: u.bio,
    avatar: u.avatar,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt,
  };
}

router.post("/register", async (req: Request, res: Response) => {
  const { username, password, name } = req.body as {
    username?: string;
    password?: string;
    name?: string;
  };

  if (!username || !password || !name) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  if (username.length < 3 || username.length > 30) {
    res.status(400).json({ error: "اسم المستخدم يجب أن يكون بين 3 و 30 حرفاً" });
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    res.status(400).json({ error: "اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const existing = users.findByUsername(username);
  if (existing) {
    res.status(400).json({ error: "اسم المستخدم مستخدم بالفعل" });
    return;
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: newId(),
    username,
    passwordHash: hashPassword(password),
    name,
    bio: "",
    avatar: "",
    role: "user",
    banned: false,
    createdAt: now,
  };

  users.create(newUser);

  req.session = req.session || {};
  (req.session as Record<string, unknown>)["userId"] = newUser.id;

  logNewAccount(username, now).catch(() => {});

  res.status(201).json({
    user: publicUser(newUser),
    message: "تم إنشاء الحساب بنجاح",
  });
});

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "اسم المستخدم وكلمة المرور مطلوبان" });
    return;
  }

  const user = users.findByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    return;
  }

  if (user.banned) {
    res.status(403).json({ error: "هذا الحساب محظور" });
    return;
  }

  req.session = req.session || {};
  (req.session as Record<string, unknown>)["userId"] = user.id;

  res.json({
    user: publicUser(user),
    message: "تم تسجيل الدخول بنجاح",
  });
});

router.post("/logout", requireAuth, (req: Request, res: Response) => {
  req.session = null;
  res.json({ message: "تم تسجيل الخروج بنجاح" });
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json(publicUser(req.currentUser!));
});

export default router;

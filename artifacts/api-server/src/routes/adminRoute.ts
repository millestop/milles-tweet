import { Router, Request, Response } from "express";
import { users, posts, logs, newId, StoredUser } from "../lib/storage.js";
import { requireAuth, requireAdmin } from "../middlewares/session.js";
import { logAdminAction } from "../lib/discord.js";

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

router.get("/users", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json(users.getAll().map(publicUser));
});

router.post(
  "/users/:userId/ban",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { banned } = req.body as { banned?: boolean };

    const target = users.findById(userId!);
    if (!target) {
      res.status(404).json({ error: "المستخدم غير موجود" });
      return;
    }

    if (target.role === "admin") {
      res.status(400).json({ error: "لا يمكن حظر المدير" });
      return;
    }

    const updated = { ...target, banned: !!banned };
    users.update(updated);

    const action = banned ? "حظر" : "رفع الحظر";
    const admin = req.currentUser!;

    logs.create({
      id: newId(),
      event: banned ? "ban_user" : "unban_user",
      userId: admin.id,
      username: admin.username,
      details: { targetUserId: target.id, targetUsername: target.username },
      createdAt: new Date().toISOString(),
    });

    logAdminAction(admin.username, action, target.username).catch(() => {});

    res.json(publicUser(updated));
  },
);

router.post(
  "/users/:userId/promote",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { admin: makeAdmin } = req.body as { admin?: boolean };

    const target = users.findById(userId!);
    if (!target) {
      res.status(404).json({ error: "المستخدم غير موجود" });
      return;
    }

    const updated = {
      ...target,
      role: makeAdmin ? ("admin" as const) : ("user" as const),
    };
    users.update(updated);

    const action = makeAdmin ? "ترقية إلى مدير" : "إزالة صلاحيات المدير";
    const admin = req.currentUser!;

    logs.create({
      id: newId(),
      event: makeAdmin ? "promote_admin" : "demote_admin",
      userId: admin.id,
      username: admin.username,
      details: { targetUserId: target.id, targetUsername: target.username },
      createdAt: new Date().toISOString(),
    });

    logAdminAction(admin.username, action, target.username).catch(() => {});

    res.json(publicUser(updated));
  },
);

router.delete(
  "/users/:userId",
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const target = users.findById(userId!);
    if (!target) {
      res.status(404).json({ error: "المستخدم غير موجود" });
      return;
    }

    const admin = req.currentUser!;
    if (target.id === admin.id) {
      res.status(400).json({ error: "لا يمكن حذف حسابك الخاص" });
      return;
    }

    users.delete(target.id);
    const allPosts = posts.getAll().filter((p) => p.userId === target.id);
    for (const post of allPosts) {
      posts.delete(post.id);
    }

    logs.create({
      id: newId(),
      event: "delete_user",
      userId: admin.id,
      username: admin.username,
      details: { targetUserId: target.id, targetUsername: target.username },
      createdAt: new Date().toISOString(),
    });

    logAdminAction(admin.username, "حذف حساب", target.username).catch(() => {});

    res.json({ message: "تم حذف المستخدم بنجاح" });
  },
);

router.get("/posts", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  function enrichPost(post: { userId: string; id: string; content: string; image: string; parentId: string; likes: string[]; retweets: string[]; createdAt: string }) {
    const author = users.findById(post.userId);
    return {
      ...post,
      repliesCount: posts.getRepliesCount(post.id),
      author: author ? publicUser(author) : null,
    };
  }
  res.json(posts.getAll().map(enrichPost));
});

router.get("/logs", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.json(logs.getAll());
});

export default router;

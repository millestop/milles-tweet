import { Router, Request, Response } from "express";
import { users, posts, logs, newId, StoredUser } from "../lib/storage.js";
import { requireAuth } from "../middlewares/session.js";
import { logProfileUpdate } from "../lib/discord.js";

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

router.get("/", (req: Request, res: Response) => {
  const search = (req.query["search"] as string | undefined)?.toLowerCase();
  let all = users.getAll();
  if (search) {
    all = all.filter(
      (u) =>
        u.username.toLowerCase().includes(search) ||
        u.name.toLowerCase().includes(search),
    );
  }
  res.json(all.map(publicUser));
});

router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  const { name, bio, avatar } = req.body as {
    name?: string;
    bio?: string;
    avatar?: string;
  };

  const user = req.currentUser!;
  const changes: Record<string, { old: string; new: string }> = {};

  const updated: StoredUser = { ...user };

  if (name !== undefined && name !== user.name) {
    changes["name"] = { old: user.name, new: name };
    updated.name = name;
  }
  if (bio !== undefined && bio !== user.bio) {
    changes["bio"] = { old: user.bio, new: bio };
    updated.bio = bio;
  }
  if (avatar !== undefined && avatar !== user.avatar) {
    changes["avatar"] = { old: user.avatar, new: avatar };
    updated.avatar = avatar;
  }

  users.update(updated);

  if (Object.keys(changes).length > 0) {
    logProfileUpdate(user.username, changes).catch(() => {});
    logs.create({
      id: newId(),
      event: "profile_update",
      userId: user.id,
      username: user.username,
      details: changes,
      createdAt: new Date().toISOString(),
    });
  }

  res.json(publicUser(updated));
});

router.get("/:username", (req: Request, res: Response) => {
  const { username } = req.params;
  const user = users.findByUsername(username);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }
  res.json(publicUser(user));
});

export default router;

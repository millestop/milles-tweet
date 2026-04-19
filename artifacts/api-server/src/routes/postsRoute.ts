import { Router, Request, Response } from "express";
import { users, posts, logs, newId, StoredPost, StoredUser } from "../lib/storage.js";
import { requireAuth } from "../middlewares/session.js";
import { logNewPost, logInteraction } from "../lib/discord.js";

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

function enrichPost(post: StoredPost) {
  const author = users.findById(post.userId);
  return {
    ...post,
    repliesCount: posts.getRepliesCount(post.id),
    author: author ? publicUser(author) : null,
  };
}

router.get("/stats", (req: Request, res: Response) => {
  const allPosts = posts.getAll();
  const allUsers = users.getAll();
  const totalLikes = allPosts.reduce((sum, p) => sum + p.likes.length, 0);
  const totalRetweets = allPosts.reduce((sum, p) => sum + p.retweets.length, 0);
  res.json({
    totalPosts: allPosts.length,
    totalUsers: allUsers.length,
    totalLikes,
    totalRetweets,
  });
});

router.get("/", (req: Request, res: Response) => {
  const { userId, parentId } = req.query as {
    userId?: string;
    parentId?: string;
  };

  let all = posts.getAll();

  if (userId) {
    all = all.filter((p) => p.userId === userId);
  }

  if (parentId !== undefined) {
    all = all.filter((p) => p.parentId === parentId);
  } else if (!userId) {
    all = all.filter((p) => !p.parentId);
  }

  res.json(all.map(enrichPost));
});

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const { content, image, parentId } = req.body as {
    content?: string;
    image?: string;
    parentId?: string;
  };

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: "محتوى التغريدة مطلوب" });
    return;
  }

  if (content.length > 280) {
    res.status(400).json({ error: "التغريدة يجب ألا تتجاوز 280 حرفاً" });
    return;
  }

  const user = req.currentUser!;
  const now = new Date().toISOString();

  const newPost: StoredPost = {
    id: newId(),
    userId: user.id,
    content: content.trim(),
    image: image || "",
    parentId: parentId || "",
    likes: [],
    retweets: [],
    createdAt: now,
  };

  posts.create(newPost);

  logs.create({
    id: newId(),
    event: "new_post",
    userId: user.id,
    username: user.username,
    details: { postId: newPost.id, content: newPost.content },
    createdAt: now,
  });

  logNewPost(user.username, newPost.content, newPost.id, newPost.image).catch(() => {});

  res.status(201).json(enrichPost(newPost));
});

router.get("/:id", (req: Request, res: Response) => {
  const post = posts.findById(req.params["id"]!);
  if (!post) {
    res.status(404).json({ error: "التغريدة غير موجودة" });
    return;
  }
  res.json(enrichPost(post));
});

router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const post = posts.findById(req.params["id"]!);
  if (!post) {
    res.status(404).json({ error: "التغريدة غير موجودة" });
    return;
  }

  const user = req.currentUser!;
  if (post.userId !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "لا يمكنك حذف هذه التغريدة" });
    return;
  }

  posts.delete(post.id);

  logs.create({
    id: newId(),
    event: "delete_post",
    userId: user.id,
    username: user.username,
    details: { postId: post.id },
    createdAt: new Date().toISOString(),
  });

  res.json({ message: "تم حذف التغريدة بنجاح" });
});

router.post("/:id/like", requireAuth, async (req: Request, res: Response) => {
  const post = posts.findById(req.params["id"]!);
  if (!post) {
    res.status(404).json({ error: "التغريدة غير موجودة" });
    return;
  }

  const user = req.currentUser!;
  const alreadyLiked = post.likes.includes(user.id);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id !== user.id);
  } else {
    post.likes.push(user.id);
  }

  posts.update(post);

  const action = alreadyLiked ? "إلغاء إعجاب" : "إعجاب";

  logs.create({
    id: newId(),
    event: alreadyLiked ? "unlike" : "like",
    userId: user.id,
    username: user.username,
    details: { postId: post.id },
    createdAt: new Date().toISOString(),
  });

  logInteraction(user.username, action, post.id).catch(() => {});

  res.json(enrichPost(post));
});

router.post("/:id/retweet", requireAuth, async (req: Request, res: Response) => {
  const post = posts.findById(req.params["id"]!);
  if (!post) {
    res.status(404).json({ error: "التغريدة غير موجودة" });
    return;
  }

  const user = req.currentUser!;
  const alreadyRetweeted = post.retweets.includes(user.id);

  if (alreadyRetweeted) {
    post.retweets = post.retweets.filter((id) => id !== user.id);
  } else {
    post.retweets.push(user.id);
  }

  posts.update(post);

  const action = alreadyRetweeted ? "إلغاء إعادة تغريد" : "إعادة تغريد";

  logs.create({
    id: newId(),
    event: alreadyRetweeted ? "unretweet" : "retweet",
    userId: user.id,
    username: user.username,
    details: { postId: post.id },
    createdAt: new Date().toISOString(),
  });

  logInteraction(user.username, action, post.id).catch(() => {});

  res.json(enrichPost(post));
});

router.get("/:id/replies", (req: Request, res: Response) => {
  const post = posts.findById(req.params["id"]!);
  if (!post) {
    res.status(404).json({ error: "التغريدة غير موجودة" });
    return;
  }

  const replies = posts.getAll().filter((p) => p.parentId === post.id);
  res.json(replies.map(enrichPost));
});

export default router;

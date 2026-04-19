import { Request, Response, NextFunction } from "express";
import { users, StoredUser } from "../lib/storage.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      currentUser?: StoredUser;
    }
  }
}

export function sessionMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.session?.userId as string | undefined;
  if (userId) {
    const user = users.findById(userId);
    if (user && !user.banned) {
      req.userId = userId;
      req.currentUser = user;
    }
  }
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.userId || !req.currentUser) {
    res.status(401).json({ error: "غير مصرح لك بالوصول" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.currentUser || req.currentUser.role !== "admin") {
    res.status(403).json({ error: "هذا الإجراء للمدير فقط" });
    return;
  }
  next();
}

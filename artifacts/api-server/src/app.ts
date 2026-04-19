import express, { type Express } from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import pinoHttp from "pino-http";
import healthRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/usersRoute.js";
import postsRouter from "./routes/postsRoute.js";
import adminRouter from "./routes/adminRoute.js";
import { logger } from "./lib/logger.js";
import { sessionMiddleware } from "./middlewares/session.js";
import { seedIfEmpty } from "./lib/seed.js";
import type { Request, Response } from "express";

const app: Express = express();

seedIfEmpty();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "mt_session",
    secret: process.env["SESSION_SECRET"] || "milles_tweet_secret_2024_xk9",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  }),
);

app.use(sessionMiddleware);

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/feed", postsRouter);
app.use("/api/admin", adminRouter);

export default app;

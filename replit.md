# Milles Tweet (ميلس تويت)

## Overview

A full-stack Arabic social media platform similar to Twitter, built with React + Vite frontend and Express backend. All UI is in Arabic (RTL layout). The primary brand color is purple (#7241D3).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (`artifacts/millestweet/`)
- **Backend**: Express 5 (`artifacts/api-server/`)
- **Storage**: JSON files (`artifacts/api-server/data/`)
  - `users.json` — user accounts
  - `posts.json` — tweets/posts
  - `logs.json` — system activity logs
- **Sessions**: cookie-session
- **API framework**: Express 5
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/millestweet run dev` — run frontend locally

## Default Admin Account

- **Username**: admin
- **Password**: milasionmilles.co.co
- **Role**: Admin

## Features

- User registration/login/logout (session-based)
- Create posts (text + optional image URL)
- Like and retweet posts (toggle)
- Reply to posts (thread system)
- User profiles with bio and avatar
- Edit profile (name, bio, avatar)
- Search users
- Admin dashboard:
  - View/ban/unban users
  - Promote/demote to admin
  - Delete users
  - Delete posts
  - View system logs
- Discord webhook integration for all system events

## Architecture

- Frontend at `/` (previewPath)
- API server at `/api` previewPath
- Both services proxied through the Replit proxy
- Session cookies with `credentials: include` on all fetch calls

## Discord Webhook

All system events are logged to Discord with Arabic embed messages:
- New accounts (green)
- Profile updates (yellow)
- New posts (purple)
- Interactions/likes/retweets (blue)
- Admin actions (red)

See `.local/skills/pnpm-workspace/SKILL.md` for workspace structure, TypeScript setup, and package details.

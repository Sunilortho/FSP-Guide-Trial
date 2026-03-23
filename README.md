# FSP Guide for Busy Professionals

Medical exam preparation platform with real-time chat, avatar management, and gamified ranking.

## Architecture

```
┌──────────┐    ┌──────────────┐    ┌───────┐    ┌───────┐
│ Next.js  │◄──►│ Chat Server  │◄──►│ Kafka │    │ Redis │
│ (React)  │    │ (Socket.io)  │◄──►│       │    │       │
└──────────┘    └──────────────┘    └───────┘    └───────┘
     │                                               ▲
     └── Firebase (Auth + Firestore + Storage) ──────┘
```

## Features

| Feature | Stack | Description |
|---------|-------|-------------|
| **Real-time Chat** | Socket.io + Kafka + Redis | Durable messaging with presence, typing indicators, read receipts |
| **Avatar System** | Firebase Storage + Next.js API | Upload PNG/JPG/WebP (≤2MB), UUID filenames, initials fallback |
| **Ranking** | Firestore + WebSocket events | Points-based progression: Initiate → Page → Squire → Knight → King |

## Quick Start

### Prerequisites
- Node.js 20+, Docker & Docker Compose

### 1. Clone & Install
```bash
npm install
cd server && npm install && cd ..
```

### 2. Environment Variables

Create `.env` in the project root:
```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Chat Server
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 3. Run with Docker Compose
```bash
docker-compose up --build
```

This starts: **Next.js** (`:3000`), **Chat Server** (`:3001`), **Kafka**, **Redis**, **Zookeeper**.

### 4. Run Locally (without Docker)
```bash
# Terminal 1 – Next.js
npm run dev

# Terminal 2 – Chat Server (requires Redis + Kafka running)
cd server && npm run dev
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Chat server port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker list |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | WebSocket URL for client |
| `MAX_UPLOAD_SIZE` | `2097152` (2MB) | Avatar upload limit |
| `AVATAR_DIR` | `/media/user-avatars` | Avatar storage path |

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ChatWindow` | `components/chat/ChatWindow.tsx` | Real-time chat UI |
| `AvatarUpload` | `components/profile/AvatarUpload.tsx` | Avatar upload with initials fallback |
| `RankBadge` | `components/profile/RankBadge.tsx` | Rank icon overlay |
| `useChat` | `hooks/useChat.ts` | WebSocket connection hook |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload/avatar` | Upload avatar (FormData) |
| `DELETE` | `/api/upload/avatar` | Reset avatar |
| `GET` | `ws://localhost:3001` | WebSocket chat |
| `GET` | `/health` | Chat server health check |
| `GET` | `/users/:id/rank` | Get cached rank |
| `POST` | `/users/:id/rank` | Update cached rank |

## Rank Progression

| Rank | Points | Icon |
|------|--------|------|
| Initiate | 0 | — |
| Page | 50 | 📜 |
| Squire | 200 | ⭐ |
| Knight | 500 | 🛡️ |
| King | 1000 | 👑 |

Points are awarded for: avatar upload (+20), messages sent (+5), daily login (+10).

## Testing

```bash
# Chat: Open two browser tabs, both logged in, click "Open Chat"
# Avatar: Upload a file > 2MB (should reject), upload valid PNG (should succeed)
# Rank: Check profile section shows correct rank badge and progress bar
```

## Scaling Guidelines

- **WebSocket**: Use consistent hashing in the load balancer to preserve sessions on reconnect
- **Kafka**: Increase partitions for higher message throughput
- **Redis**: Use Redis Cluster for horizontal scaling
- **Avatars**: Serve via CDN; cache URLs with 1-hour TTL

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Kafka, Partitioners, EachMessagePayload } from 'kafkajs';
import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// --- Types ---
interface ChatMessage {
  id: string;
  sender_id: string;
  conversation_id: string;
  content: string;
  sent_at: string;
  sequence: number;
}

interface JoinPayload {
  userId: string;
  conversationId: string;
  token?: string;
}

interface TypingPayload {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

interface ReadReceiptPayload {
  userId: string;
  messageId: string;
  conversationId: string;
}

interface SendMessagePayload {
  sender_id: string;
  conversation_id: string;
  content: string;
}

// --- Config ---
const PORT = parseInt(process.env.PORT || '3001', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const HEARTBEAT_INTERVAL = 30_000; // 30s presence heartbeat
const RATE_LIMIT_WINDOW = 1_000; // 1s
const RATE_LIMIT_MAX = 10; // max messages per window

// --- Express + Socket.io ---
const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: HEARTBEAT_INTERVAL,
  pingTimeout: 10_000,
});

// --- Redis ---
const redisClient: RedisClientType = createClient({ url: REDIS_URL }) as RedisClientType;
redisClient.on('error', (err: Error) => console.error('Redis Error:', err.message));

// --- Kafka ---
const kafka = new Kafka({ clientId: 'chat-server', brokers: KAFKA_BROKERS });
const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
const consumer = kafka.consumer({ groupId: 'chat-group' });

// --- Sequence counter (per conversation, stored in Redis) ---
async function nextSequence(conversationId: string): Promise<number> {
  return await redisClient.incr(`seq:${conversationId}`);
}

// --- Rate limiter (per user, sliding window in Redis) ---
async function isRateLimited(userId: string): Promise<boolean> {
  const key = `rl:${userId}`;
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.pExpire(key, RATE_LIMIT_WINDOW);
  }
  return count > RATE_LIMIT_MAX;
}

// --- Message sanitization (basic XSS prevention) ---
function sanitize(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// --- User-socket mapping ---
const userSockets = new Map<string, Set<string>>(); // userId → Set<socketId>

// --- Infrastructure Init ---
async function initInfrastructure(): Promise<void> {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected');

    await producer.connect();
    console.log('✅ Kafka producer connected');

    await consumer.connect();
    await consumer.subscribe({ topic: 'chat-messages', fromBeginning: false });
    console.log('✅ Kafka consumer subscribed');

    // Fan-out: read from Kafka and emit to rooms
    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (!message.value) return;
        const msgData: ChatMessage = JSON.parse(message.value.toString());

        // Store in Redis hot cache (30-day TTL)
        const cacheKey = `msgs:${msgData.conversation_id}`;
        await redisClient.zAdd(cacheKey, { score: msgData.sequence, value: JSON.stringify(msgData) });
        await redisClient.expire(cacheKey, 30 * 24 * 60 * 60);

        // Fan-out to connected clients in the room
        io.to(msgData.conversation_id).emit('new_message', msgData);
      },
    });
  } catch (err) {
    console.error('❌ Infrastructure init failed:', err);
    // Retry after 5s
    setTimeout(initInfrastructure, 5000);
  }
}

// --- Socket.io Connection Handler ---
io.on('connection', (socket: Socket) => {
  let currentUserId: string | null = null;

  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join_conversation', async (data: JoinPayload) => {
    const { userId, conversationId } = data;
    currentUserId = userId;

    socket.join(conversationId);

    // Track user-socket mapping
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Set presence in Redis with TTL (heartbeat will refresh)
    await redisClient.set(`presence:${userId}`, 'online', { EX: 60 });
    io.emit('user_status', { userId, status: 'online' });

    // Send cached recent messages from Redis
    const cacheKey = `msgs:${conversationId}`;
    const cachedMessages = await redisClient.zRange(cacheKey, -50, -1);
    if (cachedMessages.length > 0) {
      const messages: ChatMessage[] = cachedMessages.map((m: string) => JSON.parse(m));
      socket.emit('message_history', messages);
    }

    console.log(`👤 ${userId} joined room: ${conversationId}`);
  });

  socket.on('send_message', async (data: SendMessagePayload) => {
    if (!currentUserId) return;

    // Rate limit check
    if (await isRateLimited(currentUserId)) {
      socket.emit('error', { code: 'RATE_LIMITED', message: 'Too many messages. Please slow down.' });
      return;
    }

    // Build message with sanitized content and sequence number
    const sequence = await nextSequence(data.conversation_id);
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      sender_id: data.sender_id,
      conversation_id: data.conversation_id,
      content: sanitize(data.content),
      sent_at: new Date().toISOString(),
      sequence,
    };

    // Push to Kafka for durable, at-least-once delivery
    try {
      await producer.send({
        topic: 'chat-messages',
        messages: [{ key: data.conversation_id, value: JSON.stringify(message) }],
      });
    } catch (err) {
      console.error('Kafka send failed:', err);
      socket.emit('error', { code: 'SEND_FAILED', message: 'Message delivery failed. Retry.' });
    }
  });

  socket.on('typing', (data: TypingPayload) => {
    socket.to(data.conversationId).emit('display_typing', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  });

  socket.on('read_receipt', async (data: ReadReceiptPayload) => {
    io.to(data.conversationId).emit('message_read', {
      userId: data.userId,
      messageId: data.messageId,
    });
    // Persist read state
    await redisClient.hSet(`read:${data.conversationId}`, data.userId, data.messageId);
  });

  // Heartbeat-based presence refresh
  socket.on('heartbeat', async () => {
    if (currentUserId) {
      await redisClient.set(`presence:${currentUserId}`, 'online', { EX: 60 });
    }
  });

  socket.on('disconnect', async () => {
    if (currentUserId) {
      const sockets = userSockets.get(currentUserId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(currentUserId);
          await redisClient.del(`presence:${currentUserId}`);
          io.emit('user_status', { userId: currentUserId, status: 'offline' });
        }
      }
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// --- REST Endpoints ---
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Get user rank and points
app.get('/users/:userId/rank', async (req: Request, res: Response) => {
  const cached = await redisClient.get(`rank:${req.params.userId}`);
  if (cached) {
    res.json(JSON.parse(cached));
    return;
  }
  // Fallback: caller should query Firestore directly
  res.status(404).json({ error: 'Rank not cached. Query Firestore.' });
});

// Cache rank (called by Next.js API when rank changes)
app.post('/users/:userId/rank', async (req: Request, res: Response) => {
  const { rank, points } = req.body;
  await redisClient.set(`rank:${req.params.userId}`, JSON.stringify({ rank, points }), { EX: 3600 });

  // Emit real-time rank update
  io.emit('rank_update', { userId: req.params.userId, rank, points });
  res.json({ success: true });
});

// Get presence status
app.get('/users/:userId/presence', async (req: Request, res: Response) => {
  const status = await redisClient.get(`presence:${req.params.userId}`);
  res.json({ userId: req.params.userId, status: status || 'offline' });
});

// --- Start ---
httpServer.listen(PORT, async () => {
  console.log(`🚀 Chat server listening on port ${PORT}`);
  await initInfrastructure();
});

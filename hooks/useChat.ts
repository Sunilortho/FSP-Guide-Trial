'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useChat(userId: string, conversationId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId || !conversationId) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_conversation', { userId, conversationId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('display_typing', ({ userId: typingUserId, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(typingUserId);
        else next.delete(typingUserId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, conversationId]);

  const sendMessage = (content: string) => {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit('send_message', {
        sender_id: userId,
        conversation_id: conversationId,
        content,
      });
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        userId,
        conversationId,
        isTyping,
      });
    }
  };

  return {
    messages,
    isConnected,
    typingUsers,
    sendMessage,
    sendTyping,
  };
}

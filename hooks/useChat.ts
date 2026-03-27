'use client';

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  conversation_id: string;
  content: string;
  sent_at: string;
}

export function useChat(userId: string, conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !conversationId) return;

    // Listen to messages in real-time via Firestore
    const messagesRef = collection(db, 'chats', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsConnected(true);
        const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            sender_id: data.sender_id,
            sender_name: data.sender_name || '',
            conversation_id: conversationId,
            content: data.content,
            sent_at: data.createdAt
              ? (data.createdAt as Timestamp).toDate().toISOString()
              : new Date().toISOString(),
          };
        });
        setMessages(msgs);
      },
      (error) => {
        console.error('Chat listener error:', error);
        setIsConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !userId || !conversationId) return;

      try {
        const messagesRef = collection(db, 'chats', conversationId, 'messages');
        await addDoc(messagesRef, {
          sender_id: userId,
          content: content.trim(),
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [userId, conversationId]
  );

  const sendTyping = useCallback((_isTyping: boolean) => {
    // Typing indicators are not implemented with Firestore to keep it simple
    // Could be added via a separate "typing" document if needed
  }, []);

  return {
    messages,
    isConnected,
    typingUsers,
    sendMessage,
    sendTyping,
  };
}

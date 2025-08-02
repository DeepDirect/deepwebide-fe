import { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, type IMessage } from '@stomp/stompjs';
import { type ChatReceivedMessage, type ChatSendMessage } from '@/features/Chat/types';

/**
 * Custom hook to manage STOMP WebSocket connections for chat functionality.
 * @param {string} url - The WebSocket URL to connect to.
 * @param {number} repositoryId - The ID of the repository for which the chat is being used.
 * @returns {Object} An object containing connection status, subscribe and send methods.
 */

const useStompChat = (url: string, repositoryId: number) => {
  const clientRef = useRef<Client | null>(null);
  const [messages, setMessages] = useState<ChatReceivedMessage[]>([]);
  const [connectedCount, setConnectedCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState(false);

  const token = localStorage.getItem('accessToken');
  const params = new URLSearchParams();

  if (token) params.append('token', token);
  params.append('repositoryId', repositoryId.toString());
  const SOCKET_URL = `${url}?${params.toString()}`;

  useEffect(() => {
    if (!repositoryId) {
      console.error('❌ [STOMP] Repository ID is required for WebSocket connection');
      return;
    }

    console.log('🔗 [STOMP] Initializing connection to:', SOCKET_URL);
    const socket = new SockJS(SOCKET_URL);

    // SockJS 이벤트 리스너 추가 (디버깅용)
    socket.onopen = () => console.log('🔌 [STOMP] SockJS connection opened');
    socket.onclose = event => console.log('🔌 [STOMP] SockJS connection closed:', event);
    socket.onerror = error => console.error('❌ [STOMP] SockJS error:', error);

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      maxReconnectDelay: 10000,

      // 개발 중에만 디버그 모드 활성화
      debug: str => console.log('🔧 [STOMP] STOMP Debug:', str),

      onConnect: () => {
        setIsConnected(true);
        console.log('✅ [STOMP] STOMP connected successfully');

        client.subscribe(`/topic/repositories/${repositoryId}/chat`, (message: IMessage) => {
          console.log('📥 [STOMP] [RECEIVE-TOPIC] Message received:', message.body);
          console.log('📥 [STOMP][RECEIVE-TOPIC] Headers:', message.headers);
          const parsedMessage = JSON.parse(message.body);
          if (parsedMessage['type'] === 'USER_JOINED') {
            setConnectedCount(prevCount => prevCount + 1);
          } else if (parsedMessage['type'] === 'USER_LEFT') {
            setConnectedCount(prevCount => Math.max(prevCount - 1, 1));
          }
        });

        client.subscribe(`/sub/repositories/${repositoryId}/chat`, (message: IMessage) => {
          console.log('📥 [STOMP][RECEIVE-SUB] Message received:', message.body);
          console.log('📥 [STOMP][RECEIVE-SUB] Headers:', message.headers);
          try {
            const body: ChatReceivedMessage = JSON.parse(message.body);
            setMessages(prev => [...prev, body]);
            console.log('✅ [RECEIVE-SUB] Message processed and added to state');
          } catch (error) {
            console.error('❌ [RECEIVE-SUB] Failed to parse message:', error);
          }
        });

        console.log('✅ [STOMP] Successfully subscribed to chat topics');
      },

      onDisconnect: () => {
        setIsConnected(false);
        console.log('🔌 [STOMP] Disconnected from STOMP server');
      },

      onStompError: frame => {
        console.error('❌ [STOMP] STOMP Error', frame);
        console.error('❌ [STOMP] Error details:', frame.headers, frame.body);
      },

      onWebSocketError: error => {
        console.error('❌ [STOMP] WebSocket Error:', error);
      },
    });

    client.activate();
    clientRef.current = client;
    return () => {
      console.log('🔌 [STOMP] Cleaning up STOMP client');
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [SOCKET_URL, repositoryId]);

  const send = useCallback(
    (message: ChatSendMessage) => {
      console.log('📤 [STOMP-SEND] Starting to send message:', message);
      if (!clientRef.current || !isConnected) {
        console.warn('❌ [STOMP-SEND] Cannot send message, not connected');
        return;
      }

      const destination = `/app/repositories/${repositoryId}/chat/send`;
      const body = JSON.stringify(message);

      console.log('📤 [STOMP-SEND] Publishing to destination:', destination);
      console.log('📤 [STOMP-SEND] Message body:', body);

      clientRef.current?.publish({
        destination,
        body,
      });
      console.log('✅ [STOMP-SEND] Message published successfully');
    },
    [isConnected, repositoryId]
  );

  return {
    isConnected,
    connectedCount,
    messages,
    send: (message: ChatSendMessage) => {
      console.log('🔥 [STOMP-WRAPPER] Send function wrapper called');
      return send(message);
    },
  };
};

export default useStompChat;

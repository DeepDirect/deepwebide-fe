import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketConfig, buildWebSocketUrl, wsLogger } from '@/utils/websocketConfig';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  profileImageUrl: string;
  content: string;
  timestamp: number;
  type: 'message' | 'system';
}

interface WebSocketMessage {
  type: 'message' | 'join' | 'leave' | 'user_list' | 'message_history';
  data:
    | ChatMessage
    | ChatMessage[]
    | { userId: string; userName: string }
    | Record<string, unknown>;
  roomId?: string;
  userId?: string;
  token?: string;
}

interface UseWebSocketChatProps {
  roomId: string;
  userId: string;
  userName: string;
  profileImageUrl: string;
  enabled?: boolean;
}

interface UseWebSocketChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  onlineUsers: Array<{ userId: string; userName: string }>;
}

export const useWebSocketChat = ({
  roomId,
  userId,
  userName,
  profileImageUrl,
  enabled = true,
}: UseWebSocketChatProps): UseWebSocketChatReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; userName: string }>>([]);

  const cleanup = useCallback(() => {
    wsLogger.info('WebSocket Chat 연결 정리 중...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'leave',
            data: { userId, userName },
            roomId,
            userId,
          })
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsLoading(false);
    isConnectingRef.current = false;
  }, [userId, userName, roomId]);

  const sendWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []); // dependency 제거 - wsRef는 ref이므로 안정적

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'message':
          if (message.data && typeof message.data === 'object' && 'id' in message.data) {
            const chatMessage = message.data as ChatMessage;
            setMessages(prev => {
              if (prev.some(msg => msg.id === chatMessage.id)) {
                return prev;
              }
              return [...prev, chatMessage].sort((a, b) => a.timestamp - b.timestamp);
            });
          }
          break;

        case 'message_history':
          if (Array.isArray(message.data)) {
            const historyMessages = message.data as ChatMessage[];
            setMessages(historyMessages.sort((a, b) => a.timestamp - b.timestamp));
          }
          break;

        case 'user_list':
          if (Array.isArray(message.data)) {
            setOnlineUsers(message.data);
          }
          break;

        case 'join':
        case 'leave':
          wsLogger.info(`사용자 ${message.type}:`, message.data);
          break;

        default:
          wsLogger.warn('알 수 없는 메시지 타입:', message);
      }
    } catch (error) {
      wsLogger.error('WebSocket 메시지 파싱 오류:', error);
    }
  }, []);

  const connect = useCallback(() => {
    if (!roomId || !enabled || isConnectingRef.current) {
      return;
    }

    // 이미 연결되어 있다면 새로 연결하지 않음
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;

    // 기존 연결이 있다면 먼저 정리
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    try {
      wsLogger.info('WebSocket Chat 연결 시작:', roomId);
      setIsLoading(true);

      const config = getWebSocketConfig();
      const token = sessionStorage.getItem('accessToken');

      const wsUrl = buildWebSocketUrl(config.chatWsUrl, {
        roomId,
        userId,
        userName: encodeURIComponent(userName),
        ...(token && { token }),
      });

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        wsLogger.info('WebSocket Chat 연결 성공');
        setIsConnected(true);
        setIsLoading(false);
        isConnectingRef.current = false;

        // sendWebSocketMessage 함수를 직접 호출하지 않고 인라인으로 처리
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'join',
              data: { userId, userName },
              roomId,
              userId,
              token: token || undefined,
            })
          );
        }
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onclose = event => {
        wsLogger.warn('WebSocket Chat 연결 종료:', event.code, event.reason);
        setIsConnected(false);
        setIsLoading(false);
        wsRef.current = null;
        isConnectingRef.current = false;

        // 정상 종료가 아닌 경우만 재연결 시도
        if (enabled && event.code !== 1000) {
          const config = getWebSocketConfig();
          setTimeout(() => {
            connect();
          }, config.reconnectOptions.delay);
        }
      };

      ws.onerror = error => {
        wsLogger.error('WebSocket Chat 오류:', error);
        setIsConnected(false);
        setIsLoading(false);
        isConnectingRef.current = false;
      };
    } catch (error) {
      wsLogger.error('WebSocket Chat 연결 실패:', error);
      setIsLoading(false);
      isConnectingRef.current = false;
    }
  }, [roomId, enabled, userId, userName, handleWebSocketMessage]); // dependency 최적화

  const sendMessage = useCallback(
    (content: string) => {
      if (!wsRef.current || !content.trim() || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const newMessage: ChatMessage = {
        id: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        userName,
        profileImageUrl,
        content: content.trim(),
        timestamp: Date.now(),
        type: 'message',
      };

      sendWebSocketMessage({
        type: 'message',
        data: newMessage,
        roomId,
        userId,
        token: sessionStorage.getItem('accessToken') || undefined,
      });
    },
    [userId, userName, profileImageUrl, roomId, sendWebSocketMessage]
  );

  // useRef로 최신 값들을 안정적으로 참조
  const latestParamsRef = useRef({ enabled, roomId, userId, userName });
  useEffect(() => {
    latestParamsRef.current = { enabled, roomId, userId, userName };
  });

  useEffect(() => {
    const { enabled, roomId, userId } = latestParamsRef.current;
    if (enabled && roomId && userId) {
      connect();
    }
    return cleanup;
  }, [enabled, roomId, userId, connect, cleanup]);

  return {
    messages,
    sendMessage,
    isConnected,
    isLoading,
    onlineUsers,
  };
};

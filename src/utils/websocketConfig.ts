// WebSocket 연결 설정 유틸리티
export const getWebSocketConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const baseUrl = import.meta.env.VITE_BASE_URL;

  return {
    // 채팅 WebSocket URL
    chatWsUrl: isDevelopment
      ? 'ws://localhost:8080/chat'
      : baseUrl.replace(/^https?/, 'wss').replace(/\/$/, '') + '/chat',

    // 재연결 설정
    reconnectOptions: {
      maxAttempts: isDevelopment ? 3 : 10,
      delay: isDevelopment ? 1000 : 3000,
      backoffFactor: 1.5,
    },

    // 인증 설정
    authRequired: !isDevelopment || import.meta.env.VITE_AUTH_SKIP_VALIDATION !== 'true',
  };
};

// WebSocket URL 생성 헬퍼
export const buildWebSocketUrl = (baseUrl: string, params: Record<string, string>) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

// 환경별 로깅
export const wsLogger = {
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`🔌 [WS] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`❌ [WS] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ [WS] ${message}`, ...args);
    }
  },
};

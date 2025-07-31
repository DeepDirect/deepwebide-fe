import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.scss';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ToastUI from './features/Toast/Toast.tsx';

// QueryClient 최적화 설정으로 무한 요청 방지
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 창 포커스 시 자동 refetch 비활성화
      refetchOnWindowFocus: false,

      // 네트워크 재연결 시 자동 refetch 비활성화
      refetchOnReconnect: false,

      // 데이터를 5분간 fresh 상태로 유지
      staleTime: 1000 * 60 * 5, // 5분

      // 캐시 시간을 10분으로 설정
      gcTime: 1000 * 60 * 10, // 10분

      // 컴포넌트 마운트 시에만 fetch
      refetchOnMount: 'always',

      // 에러 재시도 최소화
      retry: (failureCount, error) => {
        // 4xx 에러는 재시도하지 않음
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status: number } };
          if (
            axiosError.response?.status &&
            axiosError.response.status >= 400 &&
            axiosError.response.status < 500
          ) {
            return false;
          }
        }
        // 최대 2번까지만 재시도
        return failureCount < 2;
      },

      // 재시도 간격 늘리기
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // 뮤테이션 재시도 최소화
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
    <ToastUI />
  </React.StrictMode>
);

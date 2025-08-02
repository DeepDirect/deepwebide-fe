import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// 토큰 갱신 중인지 확인하는 플래그
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    // 401 에러이고 아직 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 큐에 추가하고 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 토큰 갱신 요청
        const response = await api.post('/api/auth/token');
        const { accessToken } = response.data.data;

        // 새 토큰을 세션스토리지에 저장
        sessionStorage.setItem('accessToken', accessToken);

        // 대기 중인 요청들 처리
        processQueue(null, accessToken);

        // 원래 요청에 새 토큰으로 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그아웃 처리
        processQueue(refreshError, null);

        // 세션스토리지 정리
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');

        // 로그인 페이지로 리다이렉트 (필요시)
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

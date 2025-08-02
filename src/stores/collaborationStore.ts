import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 기본 타입 정의
interface CursorPosition {
  line: number;
  column: number;
  x?: number;
  y?: number;
}

interface SelectionRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface User {
  id: string;
  name: string;
  color: string;
}

interface UserWithCursor extends User {
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastSeen?: number; // 마지막 활동 시간
}

// Store 상태 인터페이스
interface CollaborationStore {
  // 상태
  users: UserWithCursor[];
  isConnected: boolean;
  roomId: string;
  currentUser: UserWithCursor;
  connectionAttempts: number;
  lastError: string | null;

  // 사용자 관리
  setUsers: (users: UserWithCursor[]) => void;
  addUser: (user: UserWithCursor) => void;
  removeUser: (userId: string) => void;
  setCurrentUser: (user: UserWithCursor) => void;
  clearUsers: () => void;

  // 커서 및 선택 영역 관리
  updateUserCursor: (userId: string, cursor: CursorPosition) => void;
  updateUserSelection: (userId: string, selection: SelectionRange) => void;
  updateUserActivity: (userId: string) => void;

  // 연결 상태 관리
  setConnectionStatus: (isConnected: boolean) => void;
  incrementConnectionAttempts: () => void;
  resetConnectionAttempts: () => void;
  setError: (error: string | null) => void;

  // 룸 관리
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;

  // 유틸리티
  getUserById: (userId: string) => UserWithCursor | undefined;
  getActiveUsers: () => UserWithCursor[];
  getTotalUserCount: () => number;
}

// 사용자 색상 팔레트
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#AED6F1', // Light Blue
  '#A9DFBF', // Light Green
  '#F8C471', // Orange
  '#BB8FCE', // Purple
  '#85C1E9', // Sky Blue
  '#82E0AA', // Lime Green
  '#F9E79F', // Cream
] as const;

// 색상 생성 함수
export const generateUserColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

// 기본 사용자 객체 생성
const createDefaultUser = (): UserWithCursor => ({
  id: '',
  name: '',
  color: USER_COLORS[0],
  lastSeen: Date.now(),
});

// Store 생성
export const useCollaborationStore = create<CollaborationStore>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      users: [],
      isConnected: false,
      roomId: '',
      currentUser: createDefaultUser(),
      connectionAttempts: 0,
      lastError: null,

      // 사용자 관리 액션
      setUsers: users => {
        set({ users: users.map(user => ({ ...user, lastSeen: Date.now() })) });
      },

      addUser: user => {
        const state = get();
        const existingUserIndex = state.users.findIndex(u => u.id === user.id);
        const now = Date.now();

        if (existingUserIndex >= 0) {
          // 기존 사용자 업데이트
          const updatedUsers = [...state.users];
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            ...user,
            lastSeen: now,
          };
          set({ users: updatedUsers });
        } else {
          // 새 사용자 추가 (색상 자동 할당)
          const userWithColor: UserWithCursor = {
            ...user,
            color: user.color || generateUserColor(user.id),
            lastSeen: now,
          };
          set({ users: [...state.users, userWithColor] });
        }
      },

      removeUser: userId => {
        const state = get();
        set({ users: state.users.filter(u => u.id !== userId) });
      },

      setCurrentUser: user => {
        const userWithDefaults: UserWithCursor = {
          ...user,
          color: user.color || generateUserColor(user.id),
          lastSeen: Date.now(),
        };
        set({ currentUser: userWithDefaults });
      },

      clearUsers: () => {
        set({ users: [] });
      },

      // 커서 및 선택 영역 관리
      updateUserCursor: (userId, cursor) => {
        const state = get();
        const updatedUsers = state.users.map(user =>
          user.id === userId ? { ...user, cursor, lastSeen: Date.now() } : user
        );
        set({ users: updatedUsers });

        // 현재 사용자인 경우 currentUser도 업데이트
        if (state.currentUser.id === userId) {
          set({
            currentUser: {
              ...state.currentUser,
              cursor,
              lastSeen: Date.now(),
            },
          });
        }
      },

      updateUserSelection: (userId, selection) => {
        const state = get();
        const updatedUsers = state.users.map(user =>
          user.id === userId ? { ...user, selection, lastSeen: Date.now() } : user
        );
        set({ users: updatedUsers });

        // 현재 사용자인 경우 currentUser도 업데이트
        if (state.currentUser.id === userId) {
          set({
            currentUser: {
              ...state.currentUser,
              selection,
              lastSeen: Date.now(),
            },
          });
        }
      },

      updateUserActivity: userId => {
        const state = get();
        const now = Date.now();

        const updatedUsers = state.users.map(user =>
          user.id === userId ? { ...user, lastSeen: now } : user
        );
        set({ users: updatedUsers });

        if (state.currentUser.id === userId) {
          set({
            currentUser: { ...state.currentUser, lastSeen: now },
          });
        }
      },

      // 연결 상태 관리
      setConnectionStatus: isConnected => {
        set({ isConnected });

        if (isConnected) {
          // 연결 성공 시 에러와 시도 횟수 초기화
          set({ lastError: null, connectionAttempts: 0 });
        }
      },

      incrementConnectionAttempts: () => {
        const state = get();
        set({ connectionAttempts: state.connectionAttempts + 1 });
      },

      resetConnectionAttempts: () => {
        set({ connectionAttempts: 0 });
      },

      setError: error => {
        set({ lastError: error });
      },

      // 룸 관리
      joinRoom: roomId => {
        set({
          roomId,
          connectionAttempts: 0,
          lastError: null,
        });
      },

      leaveRoom: () => {
        set({
          roomId: '',
          users: [],
          isConnected: false,
          connectionAttempts: 0,
          lastError: null,
          currentUser: createDefaultUser(),
        });
      },

      // 유틸리티 함수들
      getUserById: userId => {
        const state = get();
        return state.users.find(user => user.id === userId);
      },

      getActiveUsers: () => {
        const state = get();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5분 전
        return state.users.filter(user => user.lastSeen && user.lastSeen > fiveMinutesAgo);
      },

      getTotalUserCount: () => {
        const state = get();
        return state.users.length + (state.currentUser.id ? 1 : 0);
      },
    }),
    {
      name: 'collaboration-store',
      // 개발 환경에서만 devtools 활성화
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// 비활성 사용자 정리를 위한 유틸리티 함수
export const cleanupInactiveUsers = (): void => {
  const { users, setUsers } = useCollaborationStore.getState();
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // 10분 전

  const activeUsers = users.filter(user => user.lastSeen && user.lastSeen > tenMinutesAgo);

  if (activeUsers.length !== users.length) {
    setUsers(activeUsers);
    console.log(`비활성 사용자 ${users.length - activeUsers.length}명 정리됨`);
  }
};

export const startCleanupTimer = (): NodeJS.Timeout | null => {
  if (typeof window !== 'undefined') {
    // 10분으로 간격 늘리기 (기존 5분에서 변경)
    return setInterval(cleanupInactiveUsers, 10 * 60 * 1000);
  }
  return null;
};

export const stopCleanupTimer = (timerId: NodeJS.Timeout | null): void => {
  if (timerId) {
    clearInterval(timerId);
  }
};

import { create } from 'zustand';

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
}

// Store 상태 인터페이스
interface CollaborationStore {
  // 상태
  users: UserWithCursor[];
  isConnected: boolean;
  roomId: string;
  currentUser: UserWithCursor;

  // 사용자 관리
  setUsers: (users: UserWithCursor[]) => void;
  addUser: (user: UserWithCursor) => void;
  removeUser: (userId: string) => void;
  setCurrentUser: (user: UserWithCursor) => void;

  // 커서 및 선택 영역 관리
  updateUserCursor: (userId: string, cursor: CursorPosition) => void;
  updateUserSelection: (userId: string, selection: SelectionRange) => void;

  // 연결 상태 관리
  setConnectionStatus: (isConnected: boolean) => void;

  // 룸 관리
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
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

// Store 생성
export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  // 초기 상태
  users: [],
  isConnected: false,
  roomId: '',
  currentUser: {
    id: '',
    name: '',
    color: USER_COLORS[0],
  },

  // 사용자 관리 액션
  setUsers: users => set({ users }),

  addUser: user => {
    const state = get();
    const existingUserIndex = state.users.findIndex(u => u.id === user.id);

    if (existingUserIndex >= 0) {
      // 기존 사용자 업데이트
      const updatedUsers = [...state.users];
      updatedUsers[existingUserIndex] = {
        ...updatedUsers[existingUserIndex],
        ...user,
      };
      set({ users: updatedUsers });
    } else {
      // 새 사용자 추가 (색상 자동 할당)
      const colorIndex = state.users.length % USER_COLORS.length;
      const userWithColor = {
        ...user,
        color: user.color || USER_COLORS[colorIndex],
      };
      set({ users: [...state.users, userWithColor] });
    }
  },

  removeUser: userId => {
    const state = get();
    set({ users: state.users.filter(u => u.id !== userId) });
  },

  setCurrentUser: user => set({ currentUser: user }),

  // 커서 및 선택 영역 관리
  updateUserCursor: (userId, cursor) => {
    const state = get();
    const updatedUsers = state.users.map(user => (user.id === userId ? { ...user, cursor } : user));
    set({ users: updatedUsers });
  },

  updateUserSelection: (userId, selection) => {
    const state = get();
    const updatedUsers = state.users.map(user =>
      user.id === userId ? { ...user, selection } : user
    );
    set({ users: updatedUsers });
  },

  // 연결 상태 관리
  setConnectionStatus: isConnected => set({ isConnected }),

  // 룸 관리
  joinRoom: roomId => set({ roomId }),

  leaveRoom: () =>
    set({
      roomId: '',
      users: [],
      isConnected: false,
    }),
}));

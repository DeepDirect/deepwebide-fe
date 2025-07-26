import { create } from 'zustand';
import type { User, CollaborationState } from '@/types/collaboration.types';

interface CursorPosition {
  line: number;
  column: number;
  x?: number;
  y?: number;
}

interface UserWithCursor extends User {
  cursor?: CursorPosition;
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

interface CollaborationStore extends CollaborationState {
  users: UserWithCursor[];

  // 상태 관리
  setUsers: (users: UserWithCursor[]) => void;
  addUser: (user: UserWithCursor) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, cursor: CursorPosition) => void;
  updateUserSelection: (userId: string, selection: UserWithCursor['selection']) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setCurrentUser: (user: UserWithCursor) => void;

  // 룸 관리
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
}

// 사용자 색상 팔레트
const USER_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFEAA7',
  '#DDA0DD',
  '#45B7D1',
  '#96CEB4',
  '#98D8C8',
  '#F7DC6F',
  '#AED6F1',
  '#A9DFBF',
  '#F9E79F',
  '#F8C471',
  '#BB8FCE',
  '#85C1E9',
  '#82E0AA',
  '#F7DC6F',
];

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  users: [],
  isConnected: false,
  roomId: '',
  currentUser: {
    id: '',
    name: '',
    color: USER_COLORS[0],
  },

  setUsers: users => set({ users }),

  addUser: user => {
    const state = get();
    const existingUserIndex = state.users.findIndex(u => u.id === user.id);

    if (existingUserIndex >= 0) {
      const updatedUsers = [...state.users];
      updatedUsers[existingUserIndex] = { ...updatedUsers[existingUserIndex], ...user };
      set({ users: updatedUsers });
    } else {
      const colorIndex = state.users.length % USER_COLORS.length;
      const userWithColor = { ...user, color: user.color || USER_COLORS[colorIndex] };
      set({ users: [...state.users, userWithColor] });
    }
  },

  removeUser: userId => {
    const state = get();
    set({ users: state.users.filter(u => u.id !== userId) });
  },

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

  setConnectionStatus: isConnected => set({ isConnected }),

  setCurrentUser: user => set({ currentUser: user }),

  joinRoom: roomId => set({ roomId }),

  leaveRoom: () =>
    set({
      roomId: '',
      users: [],
      isConnected: false,
    }),
}));

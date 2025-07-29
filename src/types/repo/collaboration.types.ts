// 기본 사용자 타입
export interface User {
  id: string;
  name: string;
  color: string;
}

// 커서 위치 타입
export interface CursorPosition {
  line: number;
  column: number;
}

// 선택 영역 타입
export interface SelectionRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// 커서와 선택 영역을 포함한 사용자 타입
export interface CollaborativeUser extends User {
  cursor?: CursorPosition;
  selection?: SelectionRange;
}

// 협업 상태 타입
export interface CollaborationState {
  users: CollaborativeUser[];
  isConnected: boolean;
  roomId: string;
  currentUser: CollaborativeUser;
}

// Yjs 연결 설정 타입
export interface YjsConnectionConfig {
  websocketUrl: string;
  roomName: string;
  userInfo: User;
}

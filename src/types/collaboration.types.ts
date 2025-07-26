export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
}

export interface CollaborationState {
  users: User[];
  isConnected: boolean;
  roomId: string;
  currentUser: User;
}

export interface YjsConnectionConfig {
  websocketUrl: string;
  roomName: string;
  userInfo: User;
}

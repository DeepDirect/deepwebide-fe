import type * as Y from 'yjs';
import type { MonacoBinding } from 'y-monaco';
import type { MonacoEditorInstance } from './monaco.types';

// Yjs 관련 타입들
export interface YjsDocument extends Y.Doc {
  getText(name: string): Y.Text;
}

// WebsocketProvider를 확장하지 않고 별도 인터페이스로 정의
export interface YjsProvider {
  awareness: {
    clientID: number;
    getStates(): Map<number, unknown>;
    setLocalStateField(field: string, value: unknown): void;
    on(event: 'change', handler: () => void): void;
    off(event: 'change', handler: () => void): void;
  };
  wsconnected: boolean;
  on(event: 'status', handler: (event: { status: string }) => void): void;
  off(event: 'status', handler: (event: { status: string }) => void): void;
  disconnect(): void;
  destroy(): void;
}

export interface MonacoBindingType extends MonacoBinding {
  destroy(): void;
}

export interface Disposable {
  dispose(): void;
}

// 협업 관련 타입들
export interface CursorPosition {
  line: number;
  column: number;
}

export interface SelectionRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

// Yjs 협업 훅 관련 타입들
export interface YjsCollaborationConfig {
  roomId: string;
  editor: MonacoEditorInstance | null;
  userId: string;
  userName: string;
  enabled?: boolean;
}

export interface YjsCollaborationReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

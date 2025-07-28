// src/types/yjs.types.ts
import type * as Y from 'yjs';

// Monaco Editor 관련 타입 정의
export interface MonacoEditorInstance {
  getModel(): MonacoTextModel | null;
  onDidChangeCursorPosition(callback: (event: CursorChangeEvent) => void): Disposable;
  getScrolledVisiblePosition?(position: Position): PixelPosition | null;
  getOption?(optionId: number): unknown;
  onDidScrollChange?(callback: () => void): Disposable | null;
  onDidLayoutChange?(callback: () => void): Disposable | null;
  focus(): void;
  addCommand?(keybinding: number, handler: () => void): void;
  getAction?(actionId: string): MonacoAction | null;
  setSelection?(range: MonacoSelectionRange): void;
  updateOptions?(options: Partial<MonacoEditorOptions>): void;
  getDomNode?(): HTMLElement | null;
  // 기타 Monaco Editor 메서드들을 위한 인덱스 시그니처
  [key: string]: unknown;
}

export interface MonacoTextModel {
  uri?: unknown;
  getValue(): string;
  setValue(value: string): void;
  getFullModelRange?: () => MonacoSelectionRange;
  // 기타 Monaco TextModel 속성들을 위한 인덱스 시그니처
  [key: string]: unknown;
}

export interface Position {
  lineNumber: number;
  column: number;
}

export interface PixelPosition {
  left: number;
  top: number;
}

export interface CursorChangeEvent {
  position: Position;
}

export interface MonacoSelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface MonacoAction {
  run(): void;
}

export interface MonacoEditorOptions {
  theme?: string;
  fontSize?: number;
  fontFamily?: string;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  readOnly?: boolean;
}

export interface Disposable {
  dispose(): void;
}

// Yjs Provider 이벤트 타입
export interface ProviderStatusEvent {
  status: 'connecting' | 'connected' | 'disconnected';
}

export interface AwarenessState {
  user?: {
    id: string;
    name: string;
    color: string;
  };
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

// Yjs 관련 타입
export interface YjsDocument extends Y.Doc {
  getText(name: string): Y.Text;
}

// WebsocketProvider 타입을 extends하지 않고 별도로 정의
export interface YjsProvider {
  // WebsocketProvider의 기본 속성들
  wsconnected: boolean;
  awareness: {
    clientID: number;
    getStates(): Map<number, unknown>;
    setLocalStateField(field: string, value: unknown): void;
    on(event: 'change', callback: () => void): void;
    off?: (event: 'change', callback: () => void) => void;
  };

  // 이벤트 관련
  on(event: 'status', callback: (event: ProviderStatusEvent) => void): void;
  on(event: 'connect', callback: () => void): void;
  on(event: 'disconnect', callback: () => void): void;
  off?(event: string, callback: (...args: unknown[]) => void): void;

  // 생명주기
  connect(): void;
  disconnect(): void;
  destroy(): void;

  // 기타 WebsocketProvider 속성들
  url: string;
  roomname: string;
  doc: Y.Doc;
}

// MonacoBinding 타입 (y-monaco 라이브러리용)
export interface MonacoBindingType {
  destroy(): void;
}

// Yjs 훅 관련 타입
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

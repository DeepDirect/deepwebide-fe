// Monaco Editor의 실제 타입들을 가져옴
export type MonacoEditorInstance = Parameters<import('@monaco-editor/react').OnMount>[0];
export type MonacoInstance = Parameters<import('@monaco-editor/react').OnMount>[1];

// 커서 관련 이벤트 타입
export interface CursorChangeEvent {
  position: {
    lineNumber: number;
    column: number;
  };
}

export interface SelectionChangeEvent {
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

// Monaco 모델 타입
export interface MonacoModel {
  getValue(): string;
  setValue(value: string): void;
  getFullModelRange(): {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

// Monaco 액션 타입
export interface MonacoAction {
  run(): void;
}

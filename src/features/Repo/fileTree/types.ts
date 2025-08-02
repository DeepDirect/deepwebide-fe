// API 응답 타입
export interface ApiFileNode {
  fileId: number;
  fileName: string;
  fileType: 'FILE' | 'FOLDER';
  parentId: number | null;
  path: string;
  children?: ApiFileNode[];
}

export interface ApiFileTreeResponse {
  status: number;
  message: string;
  data: ApiFileNode[] | null;
}

// 내부 사용 타입 - API 데이터에 UI 레벨만 추가
export interface FileTreeNode extends ApiFileNode {
  level: number;
}

// 내부 드래그앤드롭 관련 타입
export interface DragItem {
  id: string;
  type: 'file' | 'folder'; // NOTE: 드래그앤드롭 라이브러리 호환성을 위해 소문자 유지
  path: string;
  name: string;
  node: FileTreeNode;
}

export interface DragDropState {
  draggedItem: DragItem | null;
  dropTarget: { id: string; path: string; canDrop: boolean } | null;
  isDragging: boolean;
  dragPreview: string | null;
}

// 외부 파일 드롭 관련 타입
export interface ExternalDropState {
  isDragOver: boolean;
  dropTarget: {
    nodeId: string;
    path: string;
    type: 'folder' | 'file' | 'root'; // NOTE: 드롭 타겟 분류용 소문자
  } | null;
  dragPreview: string | null;
}

// 드롭 위치 타입
export type DropPosition = 'before' | 'inside' | 'after';

// 컴포넌트 Props 타입
export interface FileTreeProps {
  repoId: string;
  repositoryId: number;
  className?: string;
}

export interface FileTreeItemProps {
  node: FileTreeNode;
  level: number; // level prop 추가!
  isExpanded: boolean;
  isSelected: boolean;
  onFileClick?: (node: FileTreeNode) => void;
  onFolderToggle?: (node: FileTreeNode) => void;
  className?: string;

  // 편집 관련
  isEditing?: boolean;
  onEditSave?: (node: FileTreeNode, newName: string) => Promise<void>;
  onEditCancel?: () => void;

  // 컨텍스트 메뉴 액션
  onNewFile?: (parentNode?: FileTreeNode) => void;
  onNewFolder?: (parentNode?: FileTreeNode) => void;
  onRename?: (node: FileTreeNode) => void;
  onDelete?: (node: FileTreeNode) => void;

  // 내부 드래그앤드롭 props
  isDragging?: boolean;
  isDropTarget?: boolean;
  canDrop?: boolean;
  onDragStart?: (node: FileTreeNode, event: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (node: FileTreeNode, event: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (node: FileTreeNode, event: React.DragEvent) => void;
  getDropPosition?: (nodeId: string) => DropPosition | null;

  // 외부 파일 드롭 props
  isExternalDragOver?: boolean;
  onExternalDragOver?: (node: FileTreeNode, event: React.DragEvent) => void;
  onExternalDragLeave?: (node: FileTreeNode, event: React.DragEvent) => void;
  onExternalDrop?: (node: FileTreeNode, event: React.DragEvent) => void;
}

// API 작업 요청 타입들
export interface CreateFileRequest {
  fileName: string;
  fileType: 'FILE' | 'FOLDER';
  parentId?: number;
}

export interface MoveFileRequest {
  newParentId: number | null; // 루트 이동용
}

export interface RenameFileRequest {
  newFileName: string;
}

// NOTE: 삭제는 요청 바디가 없고 URL 파라미터만 사용하므로 별도 타입 불필요
// DELETE /api/repositories/{repositoryId}/files/{fileId}

// API 작업 응답 타입들
// 생성, 이동, 이름변경 시 응답 - 변경된 파일 정보를 반환
export interface FileOperationResponse {
  status: number;
  message: string;
  data: ApiFileNode | null;
}

// 삭제 시 응답 - 삭제된 파일 정보는 없고 성공 메시지만 반환
export interface DeleteFileResponse {
  status: number;
  message: string;
  data: null;
}

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

// 내부 사용 타입
export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  level: number;
  children?: FileTreeNode[];
}

// 드래그앤드롭 관련 타입
export interface DragItem {
  id: string;
  type: 'file' | 'folder';
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

// 드롭 위치 타입 추가
export type DropPosition = 'before' | 'inside' | 'after';

// 컴포넌트 Props 타입
export interface FileTreeProps {
  data: FileTreeNode[];
  onFileClick?: (node: FileTreeNode) => void;
  onFolderToggle?: (node: FileTreeNode, isExpanded: boolean) => void;
  expandedFolders?: Set<string>;
  selectedFile?: string;
  className?: string;
}

export interface FileTreeItemProps {
  node: FileTreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  onFileClick?: (node: FileTreeNode) => void;
  onFolderToggle?: (node: FileTreeNode) => void;
  className?: string;
  // 드래그앤드롭 props
  isDragging?: boolean;
  isDropTarget?: boolean;
  canDrop?: boolean;
  onDragStart?: (node: FileTreeNode, event: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragOver?: (node: FileTreeNode, event: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (node: FileTreeNode, event: React.DragEvent) => void;
  getDropPosition?: (nodeId: string) => DropPosition | null; // 추가
}

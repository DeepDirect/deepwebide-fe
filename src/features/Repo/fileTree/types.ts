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
}

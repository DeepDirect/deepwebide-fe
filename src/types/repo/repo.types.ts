export type FileType = 'file' | 'folder';

export interface RepoFileNode {
  id: string;
  name: string;
  type: FileType;
  children?: RepoFileNode[];
  parentId?: string;
  path: string;
}

export interface OpenTab {
  id: string;
  name: string;
  path: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
  fileId?: number;
  isLoading?: boolean;
  isDeleted?: boolean;
  hasFileTreeMismatch?: boolean;
}

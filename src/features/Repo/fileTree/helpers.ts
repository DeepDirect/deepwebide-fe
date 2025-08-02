import type { FileTreeNode } from './types';

// 안전하게 fileId를 문자열로 변환하는 함수
export const safeFileIdToString = (fileId: unknown): string => {
  if (fileId === null || fileId === undefined) {
    console.warn('safeFileIdToString: fileId가 null 또는 undefined입니다', fileId);
    return '';
  }

  if (typeof fileId === 'string') {
    return fileId;
  }

  if (typeof fileId === 'number') {
    return fileId.toString();
  }

  // 그 외의 경우 안전하게 문자열로 변환
  try {
    return String(fileId);
  } catch (error) {
    console.error('safeFileIdToString 변환 실패:', error, 'fileId:', fileId);
    return '';
  }
};

// 노드의 유효성을 검사하는 함수
export const isValidNode = (node: unknown): node is FileTreeNode => {
  if (!node || typeof node !== 'object') {
    return false;
  }

  const n = node as Partial<FileTreeNode>;

  // 필수 필드들이 존재하는지 확인
  const hasValidId = n.fileId !== null && n.fileId !== undefined;
  const hasValidFileName = typeof n.fileName === 'string' && n.fileName.length > 0;
  const hasValidFileType = n.fileType === 'FILE' || n.fileType === 'FOLDER';
  const hasValidPath = typeof n.path === 'string';

  if (!hasValidId) {
    console.warn('isValidNode: fileId가 유효하지 않음', n);
  }
  if (!hasValidFileName) {
    console.warn('isValidNode: fileName이 유효하지 않음', n);
  }
  if (!hasValidFileType) {
    console.warn('isValidNode: fileType이 유효하지 않음', n);
  }
  if (!hasValidPath) {
    console.warn('isValidNode: path가 유효하지 않음', n);
  }

  return hasValidId && hasValidFileName && hasValidFileType && hasValidPath;
};

/**
 * 안전하게 노드 ID를 가져오는 함수
 */
export const getNodeId = (node: FileTreeNode): string => {
  if (!isValidNode(node)) {
    console.error('getNodeId: 유효하지 않은 노드', node);
    return '';
  }

  return safeFileIdToString(node.fileId);
};

// 노드 배열을 안전하게 필터링하는 함수
export const filterValidNodes = (nodes: unknown[]): FileTreeNode[] => {
  if (!Array.isArray(nodes)) {
    console.warn('filterValidNodes: nodes가 배열이 아님', nodes);
    return [];
  }

  return nodes.filter(isValidNode);
};

// 트리에서 안전하게 노드를 찾는 함수
export const findNodeById = (nodes: FileTreeNode[], nodeId: string): FileTreeNode | null => {
  if (!Array.isArray(nodes) || !nodeId) {
    return null;
  }

  for (const node of nodes) {
    if (!isValidNode(node)) {
      console.warn('findNodeById: 유효하지 않은 노드 건너뜀', node);
      continue;
    }

    if (getNodeId(node) === nodeId) {
      return node;
    }

    if (node.children && Array.isArray(node.children)) {
      const found = findNodeById(node.children as FileTreeNode[], nodeId);
      if (found) return found;
    }
  }

  return null;
};

// 노드가 폴더인지 안전하게 확인하는 함수
export const isFolder = (node: FileTreeNode): boolean => {
  return isValidNode(node) && node.fileType === 'FOLDER';
};

// 노드가 파일인지 안전하게 확인하는 함수
export const isFile = (node: FileTreeNode): boolean => {
  return isValidNode(node) && node.fileType === 'FILE';
};

// 디버깅용 노드 정보 출력 함수
export const debugNode = (node: unknown, context: string = ''): void => {
  console.log(`[DEBUG ${context}] Node:`, {
    node,
    isValid: isValidNode(node),
    fileId: (node as Partial<FileTreeNode>)?.fileId,
    fileName: (node as Partial<FileTreeNode>)?.fileName,
    fileType: (node as Partial<FileTreeNode>)?.fileType,
    path: (node as Partial<FileTreeNode>)?.path,
  });
};

import type { ApiFileNode, FileTreeNode } from './types';

/**
 * API 응답 데이터를 FileTree 컴포넌트에서 사용할 수 있는 형태로 변환
 */
export const transformApiDataToTree = (
  apiData: ApiFileNode[],
  level: number = 0
): FileTreeNode[] => {
  return apiData.map(node => ({
    id: node.fileId.toString(),
    name: node.fileName,
    type: node.fileType === 'FOLDER' ? 'folder' : 'file',
    path: node.path,
    level,
    children: node.children ? transformApiDataToTree(node.children, level + 1) : undefined,
  }));
};

/**
 * 경로를 기반으로 부모 폴더들을 자동으로 확장하는 함수
 */
export const getExpandedFoldersForPath = (
  filePath: string,
  treeData: FileTreeNode[]
): Set<string> => {
  const expandedFolders = new Set<string>();

  const findAndExpandPath = (nodes: FileTreeNode[], targetPath: string): boolean => {
    for (const node of nodes) {
      if (node.type === 'folder' && targetPath.startsWith(node.path + '/')) {
        expandedFolders.add(node.id);

        if (node.children) {
          findAndExpandPath(node.children, targetPath);
        }
        return true;
      }

      if (node.path === targetPath) {
        return true;
      }

      if (node.children && findAndExpandPath(node.children, targetPath)) {
        if (node.type === 'folder') {
          expandedFolders.add(node.id);
        }
        return true;
      }
    }
    return false;
  };

  findAndExpandPath(treeData, filePath);
  return expandedFolders;
};

/**
 * 트리에서 특정 노드를 찾는 함수
 */
export const findNodeByPath = (nodes: FileTreeNode[], targetPath: string): FileTreeNode | null => {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }

    if (node.children) {
      const found = findNodeByPath(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
};

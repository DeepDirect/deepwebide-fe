import type { ApiFileNode, FileTreeNode } from './types';

// API 응답 데이터에 레벨 정보만 추가

export const addLevelToTree = (apiData: ApiFileNode[], level: number = 0): FileTreeNode[] => {
  return apiData.map(
    node =>
      ({
        ...node,
        level,
        children: node.children ? addLevelToTree(node.children, level + 1) : undefined,
      }) as FileTreeNode
  ); // 타입 단언 추가
};

// 경로를 기반으로 부모 폴더들을 자동으로 확장하는 함수

export const getExpandedFoldersForPath = (
  filePath: string,
  treeData: FileTreeNode[]
): Set<string> => {
  const expandedFolders = new Set<string>();

  const findAndExpandPath = (nodes: FileTreeNode[], targetPath: string): boolean => {
    for (const node of nodes) {
      if (node.fileType === 'FOLDER' && targetPath.startsWith(node.path + '/')) {
        expandedFolders.add(node.fileId.toString());

        if (node.children) {
          findAndExpandPath(node.children as FileTreeNode[], targetPath);
        }
        return true;
      }

      if (node.path === targetPath) {
        return true;
      }

      if (node.children && findAndExpandPath(node.children as FileTreeNode[], targetPath)) {
        if (node.fileType === 'FOLDER') {
          expandedFolders.add(node.fileId.toString());
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
      const found = findNodeByPath(node.children as FileTreeNode[], targetPath);
      if (found) return found;
    }
  }
  return null;
};

//  API 호출용 유틸리티 함수들

// 파일/폴더 생성 요청 데이터
export const createFileRequest = (
  fileName: string,
  fileType: 'FILE' | 'FOLDER',
  parentNode?: FileTreeNode
) => {
  return {
    fileName,
    fileType,
    parentId: parentNode ? parentNode.fileId : null,
  };
};

// 파일/폴더 이름 변경 요청 데이터
export const renameFileRequest = (node: FileTreeNode, newName: string) => {
  return {
    fileId: node.fileId,
    fileName: newName,
  };
};

// 파일/폴더 이동 요청 데이터
export const moveFileRequest = (node: FileTreeNode, targetPath: string) => {
  return {
    fileId: node.fileId,
    targetPath,
  };
};

// 파일/폴더 삭제 요청 데이터
export const deleteFileRequest = (node: FileTreeNode) => {
  return {
    fileId: node.fileId,
  };
};

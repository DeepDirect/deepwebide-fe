import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearch } from '@tanstack/react-router';
import { transformApiDataToTree, getExpandedFoldersForPath } from '../utils';
import type { ApiFileTreeResponse, FileTreeNode } from '../types';

interface UseFileTreeProps {
  apiData?: ApiFileTreeResponse | null;
  isLoading?: boolean;
  error?: string | null;
}

interface UseFileTreeReturn {
  treeData: FileTreeNode[];
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFile: string | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  error: string | null;
}

export const useFileTree = ({
  apiData,
  isLoading = false,
  error = null,
}: UseFileTreeProps): UseFileTreeReturn => {
  const search = useSearch({ strict: false });
  const currentFile = search?.file as string | undefined;

  // 상태 관리
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // API 데이터를 트리 구조로 변환
  const treeData = useMemo(() => {
    if (!apiData?.data || apiData.status !== 200) {
      return [];
    }
    return transformApiDataToTree(apiData.data);
  }, [apiData]);

  // 기본 확장 폴더들을 찾는 함수
  const getDefaultExpandedFolders = useCallback((nodes: FileTreeNode[]): Set<string> => {
    const defaultExpanded = new Set<string>();

    // src 폴더를 찾아서 기본 확장에 추가
    const srcFolder = nodes.find(
      node =>
        node.type === 'folder' &&
        (node.name.toLowerCase() === 'src' || node.name.toLowerCase() === 'source')
    );

    if (srcFolder) {
      defaultExpanded.add(srcFolder.id);
    } else {
      // src 폴더가 없으면 첫 번째 레벨의 폴더들을 최대 2개까지 확장
      const firstLevelFolders = nodes.filter(node => node.type === 'folder').slice(0, 2);

      firstLevelFolders.forEach(folder => {
        defaultExpanded.add(folder.id);
      });
    }

    return defaultExpanded;
  }, []);

  // 트리 데이터가 처음 로드되었을 때 기본 확장 설정
  useEffect(() => {
    if (treeData.length > 0 && !isInitialized) {
      const defaultExpanded = getDefaultExpandedFolders(treeData);

      setExpandedFolders(prev => {
        // 기존 확장된 폴더들과 기본 확장 폴더들을 합치되,
        // 기본 확장이 우선되도록 함
        const combined = new Set([...prev, ...defaultExpanded]);
        return combined;
      });

      setIsInitialized(true);
    }
  }, [treeData, isInitialized, getDefaultExpandedFolders]);

  // URL의 파일 경로가 변경되었을 때 처리
  useEffect(() => {
    if (currentFile && treeData.length > 0) {
      // 현재 파일 경로에 맞춰 필요한 폴더들을 확장
      const foldersToExpand = getExpandedFoldersForPath(currentFile, treeData);

      setExpandedFolders(prev => {
        const newExpanded = new Set(prev);
        foldersToExpand.forEach(folderId => newExpanded.add(folderId));
        return newExpanded;
      });

      setSelectedFile(currentFile);
    } else if (!currentFile) {
      setSelectedFile(null);
    }
  }, [currentFile, treeData]);

  // 트리 데이터가 변경되면 초기화 상태 리셋
  useEffect(() => {
    if (treeData.length === 0) {
      setIsInitialized(false);
      setExpandedFolders(new Set());
      setSelectedFile(null);
    }
  }, [treeData.length]);

  return {
    treeData,
    expandedFolders,
    setExpandedFolders,
    selectedFile,
    setSelectedFile,
    isLoading,
    error,
  };
};

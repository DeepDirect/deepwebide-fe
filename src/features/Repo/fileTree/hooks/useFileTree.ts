import { useState, useEffect, useMemo } from 'react';
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

  // API 데이터를 트리 구조로 변환
  const treeData = useMemo(() => {
    if (!apiData?.data || apiData.status !== 200) {
      return [];
    }
    return transformApiDataToTree(apiData.data);
  }, [apiData]);

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

  // 트리 데이터가 처음 로드되었을 때 기본 확장 설정
  useEffect(() => {
    if (treeData.length > 0 && expandedFolders.size === 0) {
      // 첫 번째 레벨의 폴더들을 기본으로 확장
      const firstLevelFolders = treeData
        .filter(node => node.type === 'folder')
        .map(node => node.id);

      if (firstLevelFolders.length > 0) {
        setExpandedFolders(new Set(firstLevelFolders));
      }
    }
  }, [treeData, expandedFolders.size]);

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

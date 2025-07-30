import { useState, useEffect, useCallback } from 'react';
import { useSearch } from '@tanstack/react-router';
import { addLevelToTree, getExpandedFoldersForPath } from '../utils';
import { useFileTreeQuery } from './useFileTreeApi';
import { useYjsFileTree } from '@/hooks/repo/useYjsFileTree';
import type { FileTreeNode } from '../types';

interface UseFileTreeParams {
  repositoryId: number;
}

interface UseFileTreeResult {
  treeData: FileTreeNode[];
  expandedFolders: Set<string>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedFile: string | null;
  setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useFileTree = ({ repositoryId }: UseFileTreeParams): UseFileTreeResult => {
  const search = useSearch({ strict: false });
  const currentFile = search?.file as string | undefined;

  // 상태 관리
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [treeData, setTreeData] = useState<FileTreeNode[]>([]);
  const [yjsError, setYjsError] = useState<Error | null>(null);

  // API (최초 1회만 사용 + 서버 동기화 유지)
  const {
    data: apiResponse,
    isLoading: isApiLoading,
    error: apiError,
    refetch,
  } = useFileTreeQuery(repositoryId);

  // Yjs 연결
  const { yMap, provider } = useYjsFileTree(repositoryId);

  // 1. YMap -> treeData 실시간 반영
  useEffect(() => {
    if (!yMap) return;
    const syncTree = () => {
      const nodes = Array.from(yMap.values()).map(v => v as unknown as FileTreeNode);
      setTreeData(addLevelToTree(nodes));
    };
    syncTree();
    yMap.observe(syncTree);
    return () => yMap.unobserve(syncTree);
  }, [yMap]);

  // 2. API 변경 감지 시 YMap에 반영 (YMap이 비었거나, 최신 트리와 다를 때만)
  useEffect(() => {
    if (!yMap || !apiResponse) return;
    // 이미 동기화된 경우 중복 set 방지
    const apiIds = new Set((apiResponse || []).map((node: FileTreeNode) => String(node.fileId)));
    const yMapIds = new Set(Array.from(yMap.keys()));
    const isDifferent =
      apiIds.size !== yMapIds.size || Array.from(apiIds).some(id => !yMapIds.has(id));
    if (isDifferent || yMap.size === 0) {
      yMap.clear();
      (apiResponse || []).forEach((node: FileTreeNode) =>
        yMap.set(String(node.fileId), JSON.parse(JSON.stringify(node)))
      );
    }
  }, [yMap, apiResponse]);

  // 3. 기본 확장 폴더 계산
  const getDefaultExpandedFolders = useCallback((nodes: FileTreeNode[]): Set<string> => {
    const defaultExpanded = new Set<string>();
    const srcFolder = nodes.find(
      node =>
        node.fileType === 'FOLDER' &&
        (node.fileName.toLowerCase() === 'src' || node.fileName.toLowerCase() === 'source')
    );
    if (srcFolder) {
      defaultExpanded.add(srcFolder.fileId.toString());
    } else {
      const firstLevelFolders = nodes.filter(node => node.fileType === 'FOLDER').slice(0, 2);
      firstLevelFolders.forEach(folder => {
        defaultExpanded.add(folder.fileId.toString());
      });
    }
    return defaultExpanded;
  }, []);

  // 4. 트리 데이터가 처음 로드되었을 때 기본 확장 설정
  useEffect(() => {
    if (treeData.length > 0 && !isInitialized) {
      const defaultExpanded = getDefaultExpandedFolders(treeData);
      setExpandedFolders(prev => new Set([...prev, ...defaultExpanded]));
      setIsInitialized(true);
    }
  }, [treeData, isInitialized, getDefaultExpandedFolders]);

  // 5. URL의 파일 경로가 변경되었을 때 처리
  useEffect(() => {
    if (currentFile && treeData.length > 0) {
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

  // 6. 트리 데이터가 변경되면 초기화 상태 리셋
  useEffect(() => {
    if (treeData.length === 0) {
      setIsInitialized(false);
      setExpandedFolders(new Set());
      setSelectedFile(null);
    }
  }, [treeData.length]);

  // 7. Yjs 연결 에러 핸들러 (optional)
  useEffect(() => {
    if (!provider) return;
    const onStatus = (event: { status: string }) => {
      if (event.status !== 'connected') {
        setYjsError(new Error('Yjs WebSocket 연결 실패'));
      } else {
        setYjsError(null);
      }
    };
    provider.on('status', onStatus);
    return () => provider.off('status', onStatus);
  }, [provider]);

  return {
    treeData,
    expandedFolders,
    setExpandedFolders,
    selectedFile,
    setSelectedFile,
    isLoading: isApiLoading,
    error: apiError || yjsError,
    refetch,
  };
};

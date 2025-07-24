import { useEffect } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { repoMockData } from '@/mocks/repoMockData';

export const useMockRepoInitializer = () => {
  const setOpenTabs = useTabStore(state => state.setOpenTabs);

  useEffect(() => {
    setOpenTabs(repoMockData.initialTabs);
  }, [setOpenTabs]);
};

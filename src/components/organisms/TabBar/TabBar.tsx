import { useTabStore } from '@/stores/tabStore';
import styles from './TabBar.module.scss';
import clsx from 'clsx';
import { useNavigate } from '@tanstack/react-router';
import closeIcon from '@/assets/icons/close.svg';

interface TabBarProps {
  repoId: string;
}

const TabBar = ({ repoId }: TabBarProps) => {
  const openTabs = useTabStore(state => state.openTabs);
  const closeTab = useTabStore(state => state.closeTab);
  const activateTab = useTabStore(state => state.activateTab);
  const navigate = useNavigate();

  const handleTabClick = (tab: (typeof openTabs)[0]) => {
    if (!tab.isActive) {
      activateTab(tab.id);
      console.log('Navigating to:', {
        to: '/$repoId/',
        params: { repoId },
        search: { file: tab.path },
      });

      try {
        navigate({
          to: '/$repoId/',
          params: { repoId },
          search: { file: tab.path }, // 쿼리 파라미터로 변경
        });
        console.log('Navigation successful');
      } catch (error) {
        console.error('Navigation failed:', error);
      }
    }
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);

    // 탭을 닫은 후 남은 활성 탭으로 네비게이션
    const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
    const activeTab = remainingTabs.find(tab => tab.isActive);

    if (activeTab) {
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: { file: activeTab.path }, // 쿼리 파라미터로 변경
      });
    } else if (remainingTabs.length > 0) {
      // 활성 탭이 없으면 마지막 탭으로
      const lastTab = remainingTabs[remainingTabs.length - 1];
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: { file: lastTab.path }, // 쿼리 파라미터로 변경
      });
    } else {
      // 모든 탭이 닫혔으면 레포 메인으로
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: {}, // 빈 search 객체
      });
    }
  };

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className={styles.tabBar}>
      {openTabs.map(tab => (
        <div
          key={tab.id}
          className={clsx(styles.tab, { [styles.active]: tab.isActive })}
          onClick={() => handleTabClick(tab)}
        >
          <div
            className={clsx(styles.statusIndicator, {
              [styles.dirty]: tab.isDirty,
              [styles.saved]: !tab.isDirty,
            })}
          ></div>
          <span className={styles.tabName}>{tab.name}</span>
          <button className={styles.closeBtn} onClick={e => handleTabClose(e, tab.id)}>
            <img src={closeIcon} alt="닫기 아이콘" width={15} height={15} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;

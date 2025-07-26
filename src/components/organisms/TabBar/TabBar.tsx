import { useTabStore } from '@/stores/tabStore';
import styles from './TabBar.module.scss';
import clsx from 'clsx';
import { useNavigate } from '@tanstack/react-router';
import { getFileIcon } from '@/utils/fileExtensions';
import closeIcon from '@/assets/icons/close.svg';

interface TabBarProps {
  repoId: string;
}

const TabBar = ({ repoId }: TabBarProps) => {
  const { openTabs, closeTab, activateTab } = useTabStore();
  const navigate = useNavigate();

  // 탭 클릭 핸들러
  const handleTabClick = (tab: (typeof openTabs)[0]) => {
    if (!tab.isActive) {
      activateTab(tab.id);

      try {
        navigate({
          to: '/$repoId/',
          params: { repoId },
          search: { file: tab.path },
        });
      } catch (error) {
        console.error('Navigation failed:', error);
      }
    }
  };

  // 탭 닫기 핸들러
  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);

    // 탭을 닫은 후 남은 활성 탭으로 네비게이션
    const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
    const activeTab = remainingTabs.find(tab => tab.isActive);

    if (activeTab) {
      // 다른 활성 탭이 있으면 그 탭으로 이동
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: { file: activeTab.path },
      });
    } else if (remainingTabs.length > 0) {
      // 활성 탭이 없으면 마지막 탭으로
      const lastTab = remainingTabs[remainingTabs.length - 1];
      activateTab(lastTab.id);
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: { file: lastTab.path },
      });
    } else {
      // 모든 탭이 닫혔으면 레포 메인으로
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: {},
      });
    }
  };

  // 탭이 없으면 렌더링하지 않음
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
          title={tab.path}
        >
          <div className={styles.tabContent}>
            <div
              className={clsx(styles.statusIndicator, {
                [styles.dirty]: tab.isDirty,
                [styles.saved]: !tab.isDirty,
              })}
            />
            <img
              src={getFileIcon(tab.name)}
              alt={`${tab.name} 파일 아이콘`}
              className={styles.fileIcon}
            />
            <span className={styles.tabName}>{tab.name}</span>
          </div>
          <button
            className={styles.closeBtn}
            onClick={e => handleTabClose(e, tab.id)}
            title="탭 닫기"
            type="button"
          >
            <img src={closeIcon} alt="닫기" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;

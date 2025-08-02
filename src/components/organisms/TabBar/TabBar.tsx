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

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);

    const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
    const activeTab = remainingTabs.find(tab => tab.isActive);

    if (activeTab) {
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: { file: activeTab.path },
      });
    } else if (remainingTabs.length > 0) {
      const lastTab = remainingTabs[remainingTabs.length - 1];
      activateTab(lastTab.id);
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: { file: lastTab.path },
      });
    } else {
      navigate({
        to: '/$repoId/',
        params: { repoId },
        search: {},
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
          className={clsx(styles.tab, {
            [styles.active]: tab.isActive,
            [styles.deleted]: tab.isDeleted || false,
          })}
          onClick={() => handleTabClick(tab)}
          title={tab.isDeleted ? `${tab.path} (삭제됨)` : tab.path}
        >
          <div className={styles.tabContent}>
            <div
              className={clsx(styles.statusIndicator, {
                [styles.dirty]: tab.isDirty && !(tab.isDeleted || false),
                [styles.saved]: !tab.isDirty && !(tab.isDeleted || false),
                [styles.deleted]: tab.isDeleted || false,
              })}
            />
            <img
              src={getFileIcon(tab.name)}
              alt={`${tab.name} 파일 아이콘`}
              className={styles.fileIcon}
            />
            <span
              className={clsx(styles.tabName, {
                [styles.deletedText]: tab.isDeleted || false,
              })}
            >
              {tab.name}
            </span>
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

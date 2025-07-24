import { useTabStore } from '@/stores/tabStore';
import styles from './TabBar.module.scss';
import clsx from 'clsx';

const TabBar = () => {
  const tabStore = useTabStore();
  const { openTabs, closeTab, activateTab } = tabStore;

  return (
    <div className={styles.tabBar}>
      {openTabs.map(tab => (
        <div
          key={tab.id}
          className={clsx(styles.tab, { [styles.active]: tab.isActive })}
          onClick={() => activateTab(tab.id)}
        >
          <span className={styles.tabName}>
            {tab.name}
            {tab.isDirty && '*'}
          </span>
          <button
            className={styles.closeBtn}
            onClick={e => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};

export default TabBar;

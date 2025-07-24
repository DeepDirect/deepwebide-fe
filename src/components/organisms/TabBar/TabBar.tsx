import { useTabStore } from '@/stores/tabStore';
import styles from './TabBar.module.scss';
import clsx from 'clsx';

const TabBar = () => {
  const openTabs = useTabStore(state => state.openTabs);
  const closeTab = useTabStore(state => state.closeTab);
  const activateTab = useTabStore(state => state.activateTab);

  return (
    <div className={styles.tabBar}>
      {openTabs.map(tab => (
        <div
          key={tab.id}
          className={clsx(styles.tab, { [styles.active]: tab.isActive })}
          onClick={() => {
            if (!tab.isActive) {
              activateTab(tab.id);
            }
          }}
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

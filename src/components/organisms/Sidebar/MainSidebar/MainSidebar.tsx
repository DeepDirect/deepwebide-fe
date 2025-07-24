import { Link, useRouterState } from '@tanstack/react-router';
import SharedByMeIcon from '@/assets/icons/shared-by-me.svg?react';
import SharedWithMeIcon from '@/assets/icons/shared-with-me.svg?react';
import PrivateIcon from '@/assets/icons/private.svg?react';
import styles from './MainSidebar.module.scss';

import { Tooltip } from '@/components/atoms/Tooltip/Tooltip';

export const Sidebar = () => {
  const { location } = useRouterState();
  const currentPath = location.pathname;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Tooltip label="Private">
          <Link
            to="/main/private-repo"
            className={`${styles.icon} ${currentPath === '/main/private-repo' ? styles.active : ''}`}
          >
            <PrivateIcon className={styles.iconImage} />
          </Link>
        </Tooltip>

        <Tooltip label="Shared by me">
          <Link
            to="/main/shared-by-me-repo"
            className={`${styles.icon} ${currentPath === '/main/shared-by-me-repo' ? styles.active : ''}`}
          >
            <SharedByMeIcon className={styles.iconImage} />
          </Link>
        </Tooltip>

        <Tooltip label="Shared with me">
          <Link
            to="/main/shared-with-me-repo"
            className={`${styles.icon} ${currentPath === '/main/shared-with-me-repo' ? styles.active : ''}`}
          >
            <SharedWithMeIcon className={styles.iconImage} />
          </Link>
        </Tooltip>
      </div>
    </aside>
  );
};

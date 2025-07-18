import SharedByMeIcon from '@/assets/icons/shared-by-me.svg?react';
import SharedWithMeIcon from '@/assets/icons/shared-with-me.svg?react';
import PrivateIcon from '@/assets/icons/private.svg?react';
import styles from './MainSidebar.module.scss';

import { Tooltip } from '@/components/atoms/Tooltip/Tooltip';

export const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Tooltip label="Private">
          <button className={styles.icon}>
            <PrivateIcon className={styles.iconImage} />
          </button>
        </Tooltip>

        <Tooltip label="Shared by me">
          <button className={styles.icon}>
            <SharedByMeIcon className={styles.iconImage} />
          </button>
        </Tooltip>

        <Tooltip label="Shared with me">
          <button className={styles.icon}>
            <SharedWithMeIcon className={styles.iconImage} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

import FilesIcon from '@/assets/icons/files.svg?react';
import SaveIcon from '@/assets/icons/save.svg?react';
import ExitIcon from '@/assets/icons/exit.svg?react';
import SettingsIcon from '@/assets/icons/settings.svg?react';
import styles from './RepoSidebar.module.scss';

import { Tooltip } from '@/components/atoms/Tooltip/Tooltip';

export const Sidebar = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Tooltip label="Files">
          <button className={styles.icon}>
            <FilesIcon className={styles.iconImage} />
          </button>
        </Tooltip>

        <Tooltip label="Save">
          <button className={styles.icon}>
            <SaveIcon className={styles.iconImage} />
          </button>
        </Tooltip>

        <Tooltip label="Exit">
          <button className={styles.icon}>
            <ExitIcon className={styles.iconImage} />
          </button>
        </Tooltip>
      </div>
      <div className={styles.bottom}>
        <Tooltip label="Settings">
          <button className={styles.icon}>
            <SettingsIcon className={styles.iconImage} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

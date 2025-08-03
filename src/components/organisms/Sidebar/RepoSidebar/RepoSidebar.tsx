import { useNavigate, useParams } from '@tanstack/react-router';
import FilesIcon from '@/assets/icons/files.svg?react';
import SaveIcon from '@/assets/icons/save.svg?react';
import ExitIcon from '@/assets/icons/exit.svg?react';
import SettingsIcon from '@/assets/icons/settings.svg?react';
import styles from './RepoSidebar.module.scss';
import clsx from 'clsx';

import { Tooltip } from '@/components/atoms/Tooltip/Tooltip';
import { useFileSectionStore } from '@/stores/fileSectionStore';

export const Sidebar = () => {
  const { isVisible, activeSection, toggleSection } = useFileSectionStore();
  const navigate = useNavigate();
  const { repoId } = useParams({ strict: false });

  const handleSettingsClick = () => {
    if (repoId) {
      navigate({
        to: '/$repoId/settings',
        params: { repoId },
      });
    }
  };

  const handleExitClick = () => {
    if (repoId) {
      navigate({
        to: '/main',
      });
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <Tooltip label="Files">
          <button
            className={clsx(styles.icon, {
              [styles.active]: isVisible && activeSection === 'files',
            })}
            onClick={() => toggleSection('files')}
          >
            <FilesIcon className={styles.iconImage} />
          </button>
        </Tooltip>

        <Tooltip label="Save Point">
          <button
            className={clsx(styles.icon, {
              [styles.active]: isVisible && activeSection === 'save',
            })}
            onClick={() => toggleSection('save')}
          >
            <SaveIcon className={styles.iconImage} />
          </button>
        </Tooltip>

        <Tooltip label="Exit">
          <button className={styles.icon} onClick={handleExitClick}>
            <ExitIcon className={styles.iconImage} />
          </button>
        </Tooltip>
      </div>
      <div className={styles.bottom}>
        <Tooltip label="Settings">
          <button className={styles.icon} onClick={handleSettingsClick}>
            <SettingsIcon className={styles.iconImage} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

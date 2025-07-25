import styles from './PrivateSettingsPage.module.scss';
import InfoSection from '@/components/organisms/Settings/InfoSection/InfoSection';
import ShareSection from '@/components/organisms/Settings/ShareSection/ShareSection';
import DeleteSection from '@/components/organisms/Settings/DeleteSection/DeleteSection';
import SettingsIcon from '@/assets/icons/settings.svg?react';
import InfoIcon from '@/assets/icons/info.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import DeleteIcon from '@/assets/icons/trash.svg?react';

const PrivateSettingsPage = () => {
  return (
    <div className={styles.privateSettingsPage}>
      <div className={styles.titleWrapper}>
        <SettingsIcon className={styles.titleIcon} />
        <h2 className={styles.title}>SETTINGS</h2>
      </div>

      <div className={styles.sectionsWrapper}>
        <div className={styles.sectionLabel}>
          <div className={styles.label}>
            <InfoIcon className={styles.icon} />
            <span>INFO</span>
          </div>
          <div className={styles.label}>
            <ShareIcon className={styles.icon} />
            <span>SHARE</span>
          </div>
          <div className={`${styles.label} ${styles.redColor}`}>
            <DeleteIcon className={styles.icon} />
            <span>DELETE</span>
          </div>
        </div>

        <div className={styles.contentArea}>
          <InfoSection
            name="공유한 레포 프로젝트13"
            createdAt="2025-07-18T13:10:00Z"
            updatedAt="2025-07-21T13:10:00Z"
          />

          <ShareSection shareLink="https://example.com/shared-link" />

          <DeleteSection />
        </div>
      </div>
    </div>
  );
};

export default PrivateSettingsPage;

import styles from './PrivateSettingsPage.module.scss';
import InfoSection from '@/components/molecules/Settings/InfoSection/InfoSection';

const PrivateSettingsPage = () => {
  return (
    <div className={styles.privateSettingsPage}>
      <InfoSection
        name="공유한 레포 프로젝트13"
        createdAt="2025-07-18T13:10:00Z"
        updatedAt="2025-07-21T13:10:00Z"
      />
    </div>
  );
};

export default PrivateSettingsPage;

import styles from './SharedByMeSettingsPage.module.scss';
import InfoSection from '@/components/organisms/Settings/InfoSection/InfoSection';
import MemberSection from '@/components/organisms/Settings/MemberSection/MemberSection';
import ShareSection from '@/components/organisms/Settings/ShareSection/ShareSection';
import DeleteSection from '@/components/organisms/Settings/DeleteSection/DeleteSection';
import type { MemberItem } from '@/types/MemberItem';
import SettingsIcon from '@/assets/icons/settings.svg?react';
import InfoIcon from '@/assets/icons/info.svg?react';
import MemberIcon from '@/assets/icons/member.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import DeleteIcon from '@/assets/icons/trash.svg?react';

type memberSectionProps = MemberItem[];

const SharedByMeSettingsPage = () => {
  const members: memberSectionProps = [
    {
      userId: 7,
      nickname: '슬기로운 개발자',
      profileImageUrl: 'https://cdn.pixabay.com/photo/2017/06/13/12/53/profile-2398782_1280.png',
      role: 'OWNER',
    },
    {
      userId: 15,
      nickname: '얄미운 개발자',
      profileImageUrl: 'https://cdn.pixabay.com/photo/2014/04/02/10/25/man-303792_1280.png',
      role: 'MEMBER',
    },
    {
      userId: 27,
      nickname: '강력한 개발자',
      profileImageUrl: 'https://cdn.pixabay.com/photo/2016/04/22/04/57/graduation-1345143_1280.png',
      role: 'MEMBER',
    },
    {
      userId: 30,
      nickname: '고통받는 개발자',
      profileImageUrl: 'https://cdn.pixabay.com/photo/2015/06/11/21/01/head-806232_1280.png',
      role: 'MEMBER',
    },
  ];

  return (
    <div className={styles.sharedByMeSettingsPage}>
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
            <MemberIcon className={styles.icon} />
            <span>MEMBER</span>
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

          <MemberSection members={members} />

          <ShareSection shareLink="https://example.com/shared-link" />

          <DeleteSection />
        </div>
      </div>
    </div>
  );
};

export default SharedByMeSettingsPage;

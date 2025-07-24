import styles from './SharedByMeSettingsPage.module.scss';
import InfoSection from '@/components/organisms/Settings/InfoSection/InfoSection';
import MemberSection from '@/components/organisms/Settings/MemberSection/MemberSection';
import ShareSection from '@/components/organisms/Settings/ShareSection/ShareSection';
import type { MemberItem } from '@/types/MemberItem';

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
      <InfoSection
        name="공유한 레포 프로젝트13"
        createdAt="2025-07-18T13:10:00Z"
        updatedAt="2025-07-21T13:10:00Z"
      />

      <MemberSection members={members} />

      <ShareSection shareLink="https://example.com/shared-link" />
    </div>
  );
};

export default SharedByMeSettingsPage;

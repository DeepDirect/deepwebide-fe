import 'dayjs/locale/ko';

import styles from './MemberSection.module.scss';

import MemberIcon from '@/assets/icons/member.svg?react';
import OwnerIcon from '@/assets/icons/owner.svg?react';
import ScissorIcon from '@/assets/icons/scissor.svg?react';

import { useMemo } from 'react';

type memberSectionProps = {
  members: {
    userId: number;
    nickname: string;
    profileImageUrl: string;
    role: 'OWNER' | 'MEMBER';
  }[];
};

const MemberSection = ({ members }: memberSectionProps) => {
  const sortedMembers = useMemo(() => {
    const owner = members.find(m => m.role === 'OWNER');
    const others = members
      .filter(m => m.role === 'MEMBER')
      .sort((a, b) => a.nickname.localeCompare(b.nickname));

    return owner ? [owner, ...others] : others;
  }, [members]);

  return (
    <section className={styles.infoSection}>
      <div className={styles.sectionTitleWrapper}>
        <MemberIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>Member</h2>
      </div>
      <div className={styles.grid}>
        {sortedMembers.map(member => (
          <>
            <div key={member.userId} className={styles.label}>
              {member.role}
            </div>

            <div key={member.userId} className={styles.member}>
              <img src={member.profileImageUrl} className={styles.profile} />

              <span className={styles.nickname}>{member.nickname}</span>
            </div>
            <div key={member.userId} className={styles.iconWrapper}>
              {member.role === 'OWNER' ? (
                <OwnerIcon className={styles.icon} />
              ) : (
                <button className={styles.iconButton}>
                  <ScissorIcon className={styles.icon} />
                </button>
              )}
            </div>
          </>
        ))}
      </div>
    </section>
  );
};

export default MemberSection;

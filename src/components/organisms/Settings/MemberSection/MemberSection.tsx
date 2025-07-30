import styles from './MemberSection.module.scss';

import MemberIcon from '@/assets/icons/member.svg?react';
import OwnerIcon from '@/assets/icons/owner.svg?react';
import ScissorIcon from '@/assets/icons/scissor.svg?react';

import useRepoSettingsStore from '@/stores/repoSettingsStore';
import { isCurrentUserOwner } from '@/utils/isCurrentUserOwner';

import AlertDialogComponent from '@/components/molecules/AlertDialog/AlertDialog';

import React, { useMemo } from 'react';
import useKickMemberRepository from '@/hooks/settings/useKickMemberRepository';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';

const MemberSection = () => {
  const repoId: number = useParams({ strict: false }).repoId;
  const [isOpen, setIsOpen] = React.useState(false);
  const members = useRepoSettingsStore(state => state.settingsData)?.members;
  const queryClient = useQueryClient();
  const [kickTargetId, setKickTargetId] = useState<number | null>(null);

  const { mutate: kickMemberRepository } = useKickMemberRepository(
    `/api/repositories/${repoId}/kicked`,
    {
      onSuccess: () => {
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: ['repository', 'settings', repoId] });
        console.log('멤버 추방 성공');
        // TODO - 토스트 예정
      },
      onError: error => {
        // TODO 삭제 실패 alert
        console.error('멤버 추방 실패:', error);
      },
    }
  );

  const handleKickMember = (memberId: number) => {
    kickMemberRepository(memberId);
    console.log(`멤버 ${memberId} 추방 요청`);
    setIsOpen(false);
  };

  const sortedMembers = useMemo(() => {
    if (!members || members.length === 0) {
      return [];
    }
    const owner = members.find(m => m.role === 'OWNER');
    const others = members
      .filter(m => m.role === 'MEMBER')
      .sort((a, b) => a.nickname.localeCompare(b.nickname));

    return owner ? [owner, ...others] : others;
  }, [members]);

  return (
    <section className={styles.infoSection} id="memberSection">
      <div className={styles.sectionTitleWrapper}>
        <MemberIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>MEMBER</h2>
      </div>

      <div className={styles.grid}>
        {sortedMembers.map(member => (
          <React.Fragment key={member.userId}>
            <div className={styles.label}>{member.role.toUpperCase()}</div>

            <div className={styles.member}>
              <img src={member.profileImageUrl} className={styles.profile} />
              <span className={styles.nickname}>{member.nickname}</span>
            </div>

            <div className={styles.iconWrapper}>
              {member.role === 'OWNER' ? (
                <OwnerIcon className={styles.icon} />
              ) : (
                <>
                  {members && isCurrentUserOwner(members) && (
                    <button
                      className={styles.iconButton}
                      onClick={() => {
                        setKickTargetId(member.userId);
                        setIsOpen(true);
                      }}
                    >
                      <ScissorIcon className={styles.icon} />
                    </button>
                  )}
                </>
              )}
            </div>

            <AlertDialogComponent
              open={isOpen}
              onOpenChange={open => {
                setIsOpen(open);
                if (!open) setKickTargetId(null);
              }}
              title={'멤버를 추방하시겠습니까?'}
              confirmText={'추방하기'}
              onConfirm={() => {
                if (kickTargetId) {
                  handleKickMember(member.userId);
                }
              }}
            />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};

export default MemberSection;

import 'dayjs/locale/ko';

import dayjs from 'dayjs';

import styles from './InfoSection.module.scss';

import InfoIcon from '@/assets/icons/info.svg?react';
import EditIcon from '@/assets/icons/edit-box.svg?react';
import useRepoSettingsStore from '@/stores/repoSettingsStore';
import ChangeRepoNameModal from '@/features/Modals/ChangeRepoNameModal/ChangeRepoNameModal';
import { useState } from 'react';
import useRepositoryRename from '@/hooks/useRepositoryRename';
import { useParams } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

import { isCurrentUserOwner } from '@/utils/isCurrentUserOwner';

const InfoSection = () => {
  const repoId = useParams({ strict: false }).repoId;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const settingsData = useRepoSettingsStore(state => state.settingsData);

  const queryClient = useQueryClient();
  const { mutate: renameRepository } = useRepositoryRename(`/api/repositories/${repoId}`, {
    onSuccess: () => {
      // 서버 데이터 최신화: 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['repository', 'settings', repoId] });
      setIsModalOpen(false);
    },
    onError: error => {
      // TODO 에러 처리
      console.error('Repository rename failed:', error);
    },
  });

  if (!settingsData) return null;

  return (
    <section className={styles.infoSection} id="infoSection">
      <div className={styles.sectionTitleWrapper}>
        <InfoIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>INFO</h2>
      </div>
      <div className={styles.grid}>
        <div className={styles.label}>NAME</div>
        <div className={`${styles.value} ${styles.nameWrapper}`}>
          <span>{settingsData.repositoryName}</span>
          {(!settingsData.isShared ||
            (settingsData.isShared && isCurrentUserOwner(settingsData.members))) && (
            <button className={styles.editButton} onClick={() => setIsModalOpen(true)}>
              <EditIcon className={styles.icon} />
            </button>
          )}
        </div>

        <ChangeRepoNameModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          currentName={settingsData.repositoryName}
          onConfirm={newName => {
            renameRepository({ repositoryName: newName });
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />

        <div className={styles.label}>CREATED AT</div>
        <div className={styles.value}>
          {dayjs(settingsData.createdAt).locale('ko').format('YYYY년 MM월 DD일 HH시 MM분')}
        </div>

        <div className={styles.label}>UPDATED AT</div>
        <div className={styles.value}>
          {dayjs(settingsData.updatedAt).locale('ko').format('YYYY년 MM월 DD일 HH시 MM분')}
        </div>
      </div>
    </section>
  );
};

export default InfoSection;

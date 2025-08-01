import React, { useEffect } from 'react';
import styles from './SettingsPage.module.scss';
import InfoSection from '@/components/organisms/Settings/InfoSection/InfoSection';
import ShareSection from '@/components/organisms/Settings/ShareSection/ShareSection';
import DeleteSection from '@/components/organisms/Settings/DeleteSection/DeleteSection';
import MemberSection from '@/components/organisms/Settings/MemberSection/MemberSection';

import BackIcon from '@/assets/icons/back.svg?react';
import SettingsIcon from '@/assets/icons/settings.svg?react';
import InfoIcon from '@/assets/icons/info.svg?react';
import ShareIcon from '@/assets/icons/share.svg?react';
import DeleteIcon from '@/assets/icons/trash.svg?react';
import MemberIcon from '@/assets/icons/member.svg?react';
import { useParams, useRouter, useCanGoBack } from '@tanstack/react-router';

import MainHeader from '@/components/organisms/Header/MainHeader/MainHeader';
import useGetRepositorySettings from '@/hooks/settings/useGetRepositorySettings';
import Loading from '@/components/molecules/Loading/Loading';
import useRepoSettingsStore from '@/stores/repoSettingsStore';
import { useToast } from '@/hooks/common/useToast';

const SettingsPage: React.FC = () => {
  const { repoId } = useParams({ strict: false });
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const toast = useToast();

  const { data, isLoading, error } = useGetRepositorySettings(repoId);

  useEffect(() => {
    if (error) {
      toast.error('접근할 수 없는 페이지입니다.');
      router.navigate({ to: '/main' });
    }
  }, [error, router, toast]);

  const settingsData = useRepoSettingsStore(state => state.settingsData);
  const setSettingsData = useRepoSettingsStore(state => state.setSettingsData);

  useEffect(() => {
    if (data && JSON.stringify(settingsData) !== JSON.stringify(data.data)) {
      setSettingsData(data.data);
    }
  }, [data, setSettingsData, settingsData]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (canGoBack) router.history.back();
  };

  if (isLoading || !settingsData) {
    return (
      <div className={styles.settingsLayout}>
        <header className={styles.header}>
          <MainHeader />
        </header>
        <main className={styles.contentArea}>
          <Loading />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.settingsLayout}>
      <header className={styles.header}>
        <MainHeader />
      </header>
      <main className={styles.contentArea}>
        <div className={styles.sharedByMeSettingsPage}>
          <div className={styles.top}>
            <div className={styles.titleWrapper}>
              <SettingsIcon className={styles.titleIcon} />
              <h2 className={styles.title}>SETTINGS</h2>
            </div>
            <button className={styles.backButton} onClick={handleBack}>
              <BackIcon className={styles.icon} />
            </button>
          </div>

          {/* 섹션 스크롤링 버튼 */}
          <div className={styles.sectionsWrapper}>
            <div className={styles.sectionLabel}>
              <div
                className={styles.label}
                role="button"
                onClick={() => scrollToSection('infoSection')}
              >
                <InfoIcon className={styles.icon} />
                <span>INFO</span>
              </div>

              {settingsData.isShared && (
                <div
                  className={styles.label}
                  role="button"
                  onClick={() => scrollToSection('memberSection')}
                >
                  <MemberIcon className={styles.icon} />
                  <span>MEMBER</span>
                </div>
              )}

              <div
                className={styles.label}
                role="button"
                onClick={() => scrollToSection('shareSection')}
              >
                <ShareIcon className={styles.icon} />
                <span>SHARE</span>
              </div>

              {!settingsData.isShared && (
                <div
                  className={`${styles.label} ${styles.redColor}`}
                  role="button"
                  onClick={() => scrollToSection('deleteSection')}
                >
                  <DeleteIcon className={styles.icon} />
                  <span>DELETE</span>
                </div>
              )}
            </div>

            {/* 섹션별 내용 */}
            <div className={styles.contentArea}>
              {/* INFO - 공통 */}
              <InfoSection />

              {/* MEMBERS - 공유 레포지토리 */}
              {settingsData.isShared && <MemberSection />}

              {/* SHARE - 공통 */}
              <ShareSection />

              {/* DELETE - 개인 */}
              {!settingsData.isShared && <DeleteSection />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

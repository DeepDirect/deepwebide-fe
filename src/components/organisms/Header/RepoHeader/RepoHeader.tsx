import { Link, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import styles from './RepoHeader.module.scss';
import Logo from '@/components/atoms/Logo/Logo';
import UserProfile from '@/components/organisms/Header/UserProfile/UserProfile';
import Toggle from '@/components/atoms/Toggle/Toggle';
import MessageTextIcon from '@/assets/icons/message-text.svg?react';
import PathArea from '@/components/organisms/Header/PathArea/PathArea';
import useGetRepositorySettings from '@/hooks/settings/useGetRepositorySettings';
import useRepoSettingsStore from '@/stores/repoSettingsStore';

interface RepoHeaderProps {
  onChatButtonClick?: () => void;
  isChatOpen?: boolean;
  isNewChatMessage?: boolean;
}

const RepoHeader = ({
  onChatButtonClick,
  isChatOpen = false,
  isNewChatMessage,
}: RepoHeaderProps) => {
  const { repoId } = useParams({ strict: false });
  const { data } = useGetRepositorySettings(repoId);
  const settingsData = useRepoSettingsStore(state => state.settingsData);
  const setSettingsData = useRepoSettingsStore(state => state.setSettingsData);

  useEffect(() => {
    if (data && JSON.stringify(settingsData) !== JSON.stringify(data.data)) {
      setSettingsData(data.data);
    }
  }, [data, setSettingsData, settingsData]);

  const isSharedRepo = settingsData?.isShared || false;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/main" title="메인페이지">
          <Logo size={240} clickable />
        </Link>
      </div>

      <div className={styles.center}>
        <PathArea />

        {isSharedRepo && (
          <div className={styles.centerChatButtonContainer}>
            <button
              className={`${styles.chatButton} ${styles.centerChatButton} ${
                isChatOpen ? styles.active : ''
              }`}
              onClick={onChatButtonClick}
            >
              <MessageTextIcon className={styles.icon} />
            </button>
            {!isChatOpen && isNewChatMessage && <div className={styles.centerNewChatAlert}>●</div>}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.toggleWrapper}>
          <Toggle variant="theme" />
        </div>

        {isSharedRepo && (
          <div className={styles.rightChatButtonContainer}>
            <button
              className={`${styles.chatButton} ${styles.rightChatButton} ${
                isChatOpen ? styles.active : ''
              }`}
              onClick={onChatButtonClick}
            >
              <MessageTextIcon className={styles.icon} />
            </button>
            {!isChatOpen && isNewChatMessage && <div className={styles.rightNewChatAlert}>●</div>}
          </div>
        )}

        <UserProfile
          variant="darkModeSupport"
          showChatButton={isSharedRepo}
          onChatButtonClick={onChatButtonClick}
          isChatOpen={isChatOpen}
          isNewChatMessage={isNewChatMessage}
        />
      </div>
    </header>
  );
};

export default RepoHeader;

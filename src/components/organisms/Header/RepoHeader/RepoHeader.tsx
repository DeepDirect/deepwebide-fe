import { Link } from '@tanstack/react-router';
import styles from './RepoHeader.module.scss';
import Logo from '@/components/atoms/Logo/Logo';
import UserProfile from '@/components/organisms/Header/UserProfile/UserProfile';
import Toggle from '@/components/atoms/Toggle/Toggle';
import MessageTextIcon from '@/assets/icons/message-text.svg?react';
import NoteMultipleIcon from '@/assets/icons/note-multiple.svg?react';

interface RepoHeaderProps {
  onChatButtonClick?: () => void;
}

const RepoHeader = ({ onChatButtonClick }: RepoHeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/main" title="메인페이지">
          <Logo size={240} clickable />
        </Link>
      </div>

      <div className={styles.center}>
        <div className={styles.pathArea}>
          <div className={styles.path}>project-name/section01/chapter01.ts</div>
          <NoteMultipleIcon className={styles.icon} />
        </div>

        <button className={styles.chatButton} onClick={onChatButtonClick}>
          <MessageTextIcon className={styles.icon} />
        </button>
      </div>

      <div className={styles.right}>
        <Toggle variant="theme" />
        <UserProfile variant="darkModeSupport" />
      </div>
    </header>
  );
};

export default RepoHeader;

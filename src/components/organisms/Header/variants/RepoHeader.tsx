import styles from './RepoHeader.module.scss';
import MessageTextIcon from '@/assets/icons/message-text.svg?react';
import NoteMultipleIcon from '@/assets/icons/note-multiple.svg?react';

interface RepoHeaderProps {
  onChatButtonClick?: () => void;
}

const RepoHeader = ({ onChatButtonClick }: RepoHeaderProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <div className={styles.pathArea}>
          <div className={styles.path}>project-name/section01/chapter01.ts</div>
          <NoteMultipleIcon className={styles.icon} />
        </div>

        <button className={styles.chatButton} onClick={onChatButtonClick}>
          <MessageTextIcon className={styles.icon} />
        </button>
      </div>
    </div>
  );
};

export default RepoHeader;

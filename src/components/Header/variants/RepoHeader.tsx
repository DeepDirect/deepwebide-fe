import styles from './RepoHeader.module.scss';
import messageText from '@/assets/icons/message-text.svg';
import noteMultiple from '@/assets/icons/note-multiple.svg';

const RepoHeader = () => {
  return (
    <div className={styles.container}>
      <div className={styles.center}>
        <div className={styles.pathArea}>
          <div className={styles.path}>project-name/section01/chapter01.ts</div>
          <img src={noteMultiple} alt="파일 아이콘" width={18} height={18} />
        </div>

        <button className={styles.chatButton} onClick={() => console.log('채팅 열기')}>
          <img src={messageText} alt="채팅 아이콘" width={24} height={24} />
        </button>
      </div>
    </div>
  );
};

export default RepoHeader;

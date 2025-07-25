import styles from './DeleteSection.module.scss';
import DeleteIcon from '@/assets/icons/trash.svg?react';

const DeleteSection = () => {
  return (
    <section className={styles.deleteSection}>
      <div className={styles.sectionTitleWrapper}>
        <DeleteIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>DELETE</h2>
      </div>

      <div className={styles.flex}>
        <div className={`${styles.label} ${styles.textBlue}`}>DELETE</div>

        <div className={styles.buttonWrapper}>
          <button
            className={styles.deleteButton}
            onClick={() => {
              console.log('공유하기기 클릭');
            }}
          >
            <DeleteIcon className={styles.buttonIcon} />
            삭제
          </button>
        </div>
      </div>
    </section>
  );
};

export default DeleteSection;

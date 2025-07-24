import styles from './RepoPage.module.scss';

export function RepoPage() {
  return (
    <div className={styles.repoPage}>
      {/* 파일 구조 섹션 */}
      <div className={styles.fileSection}></div>

      {/* 에디터 + 터미널 그룹 */}
      <div className={styles.editorGroup}>
        {/* 코드 에디터 */}
        <div className={styles.editorSection}></div>

        {/* 터미널 */}
        <div className={styles.terminalSection}></div>
      </div>
    </div>
  );
}

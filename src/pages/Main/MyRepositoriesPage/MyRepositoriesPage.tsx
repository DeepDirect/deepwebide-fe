import styles from './MyRepositoriesPage.module.scss';

import Button from '@/components/atoms/Button/Button';
import FileIcon from '@/assets/icons/file.svg?react';
import Repository from '@/components/Repository/Repository';
import Toggle from '@/components/atoms/Toggle/Toggle';

const MyRepositoriesPage = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.topWrapper}>
        <h1 className={styles.title}>개인 레포</h1>

        <div className={styles.buttonWrapper}>
          <Toggle variant="favorite" />
          <Button className={styles.repoButton}>
            <FileIcon className={styles.iconImage} />새 레포지토리 생성
          </Button>
        </div>
      </div>

      <div className={styles.repositoriesWrapper}>
        <Repository />
        <Repository />
        <Repository />
        <Repository />
        <Repository />
        <Repository />
        <Repository />
      </div>
    </div>
  );
};

export default MyRepositoriesPage;

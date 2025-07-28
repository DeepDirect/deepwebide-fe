import 'dayjs/locale/ko';

import dayjs from 'dayjs';

import styles from './InfoSection.module.scss';

import InfoIcon from '@/assets/icons/info.svg?react';
import EditIcon from '@/assets/icons/edit-box.svg?react';

type infoSectionProps = {
  name: string;
  createdAt: string;
  updatedAt: string;
};

const InfoSection = ({ name, createdAt, updatedAt }: infoSectionProps) => {
  return (
    <section className={styles.infoSection} id="infoSection">
      <div className={styles.sectionTitleWrapper}>
        <InfoIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>INFO</h2>
      </div>
      <div className={styles.grid}>
        <div className={styles.label}>NAME</div>
        <div className={`${styles.value} ${styles.nameWrapper}`}>
          <span>{name}</span>
          <button className={styles.editButton}>
            <EditIcon className={styles.icon} />
          </button>
        </div>

        <div className={styles.label}>CREATED AT</div>
        <div className={styles.value}>
          {dayjs(createdAt).locale('ko').format('YYYY년 MM월 DD일 HH시 MM분')}
        </div>

        <div className={styles.label}>UPDATED AT</div>
        <div className={styles.value}>
          {dayjs(updatedAt).locale('ko').format('YYYY년 MM월 DD일 HH시 MM분')}
        </div>
      </div>
    </section>
  );
};

export default InfoSection;

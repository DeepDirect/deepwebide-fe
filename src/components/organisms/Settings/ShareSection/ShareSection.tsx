import styles from './ShareSection.module.scss';

import ShareIcon from '@/assets/icons/share.svg?react';
import CopyIcon from '@/assets/icons/copy.svg?react';
import CheckIcon from '@/assets/icons/arrow-down-box.svg?react';
import RecycleIcon from '@/assets/icons/recycle.svg?react';
import UnshareIcon from '@/assets/icons/mail-off.svg?react';
import ForwardIcon from '@/assets/icons/forward.svg?react';

type shareSectionProps = {
  shareLink: string;
  onShareLinkCopy?: () => void;
};

const ShareSection = ({ shareLink, onShareLinkCopy }: shareSectionProps) => {
  const handleShareLinkCopy = () => {
    if (shareLink && onShareLinkCopy) {
      navigator.clipboard.writeText(shareLink);
      onShareLinkCopy();
    }
  };

  return (
    <section className={styles.shareSection}>
      <div className={styles.sectionTitleWrapper}>
        <ShareIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>SHARE</h2>
      </div>

      {/* 링크 공유 */}
      <div className={styles.flex}>
        <div className={styles.label}>SHARE LINK</div>

        <div className={styles.shareLinkWrapper}>
          <div className={styles.labelWrapper}>
            <span className={styles.iconLabel}>공유 링크</span>

            <div className={styles.iconWrapper} onClick={handleShareLinkCopy}>
              <CopyIcon className={styles.labelIcon} />
            </div>
          </div>

          <div>
            <input type="text" value={shareLink} readOnly className={styles.input} />
          </div>
        </div>
      </div>

      {/* 입장 코드 */}
      <div className={`${styles.flex} ${styles.entryCodeWrapper}`}>
        <div className={styles.label}>ENTRY CODE</div>

        <div className={styles.checkCodeWrapper}>
          <span>입장 코드 확인하기</span>
          <CheckIcon className={styles.icon} />
        </div>

        <div className={styles.buttonWrapper}>
          <button
            className={styles.reissueButton}
            onClick={() => {
              console.log('재발급 클릭');
            }}
          >
            <RecycleIcon className={styles.buttonIcon} />
            재발급
          </button>
        </div>
      </div>

      {/* 링크 공유 취소 */}
      <div className={`${styles.flex} ${styles.unshareWrapper}`}>
        <div className={`${styles.label} ${styles.textOrange}`}>ENTRY CODE</div>

        <div className={styles.buttonWrapper}>
          <button
            className={styles.unshareButton}
            onClick={() => {
              console.log('공유 취소하기 클릭');
            }}
          >
            <UnshareIcon className={styles.buttonIcon} />
            공유 취소하기
          </button>
        </div>
      </div>

      {/* 레포 떠나기 */}
      <div className={`${styles.flex}`}>
        <div className={`${styles.label} ${styles.textOrange}`}>LEAVE HERE</div>

        <div className={styles.buttonWrapper}>
          <button
            className={styles.unshareButton}
            onClick={() => {
              console.log('떠나기 클릭');
            }}
          >
            <UnshareIcon className={styles.buttonIcon} />
            떠나기
          </button>
        </div>
      </div>

      {/* 공유하기 */}
      <div className={`${styles.flex}`}>
        <div className={`${styles.label} ${styles.textBlue}`}>SHARE</div>

        <div className={styles.buttonWrapper}>
          <button
            className={styles.shareButton}
            onClick={() => {
              console.log('공유하기기 클릭');
            }}
          >
            <ForwardIcon className={styles.buttonIcon} />
            공유하기
          </button>
        </div>
      </div>
    </section>
  );
};

export default ShareSection;

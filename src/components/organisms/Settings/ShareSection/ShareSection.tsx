import styles from './ShareSection.module.scss';

import ShareIcon from '@/assets/icons/share.svg?react';
import CopyIcon from '@/assets/icons/copy.svg?react';
import CheckIcon from '@/assets/icons/arrow-down-box.svg?react';
import RecycleIcon from '@/assets/icons/recycle.svg?react';
import UnshareIcon from '@/assets/icons/mail-off.svg?react';
import ForwardIcon from '@/assets/icons/forward.svg?react';
import useRepoSettingsStore from '@/stores/repoSettingsStore';

type shareSectionProps = {
  onShareLinkCopy?: () => void;
};

const ShareSection = ({ onShareLinkCopy }: shareSectionProps) => {
  const settingsData = useRepoSettingsStore(state => state.settingsData);

  if (!settingsData) return null;

  const handleShareLinkCopy = () => {
    if (settingsData.shareLink && onShareLinkCopy) {
      navigator.clipboard.writeText(settingsData.shareLink);
      onShareLinkCopy();
    }
  };

  return (
    <section className={styles.shareSection} id="shareSection">
      <div className={styles.sectionTitleWrapper}>
        <ShareIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>SHARE</h2>
      </div>

      {/* 링크 공유 */}
      <div className={`${styles.itemWrapper} ${styles.shareWrapper}`}>
        <div className={styles.label}>SHARE LINK</div>

        <div className={styles.linkWrapper}>
          <div className={styles.labelWrapper}>
            <span className={styles.iconLabel}>공유 링크</span>

            <div className={styles.iconWrapper} onClick={handleShareLinkCopy}>
              <CopyIcon className={styles.icon} />
            </div>
          </div>
          {settingsData.shareLink && (
            <input type="text" value={settingsData.shareLink} readOnly className={styles.input} />
          )}
        </div>
      </div>

      {/* 입장 코드 */}
      <div className={`${styles.itemWrapper} ${styles.entryCodeWrapper}`}>
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
      <div className={`${styles.itemWrapper} ${styles.unshareWrapper}`}>
        <div className={`${styles.label} ${styles.orangeColor}`}>UNSHARE</div>

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
      <div className={`${styles.itemWrapper}`}>
        <div className={`${styles.label} ${styles.orangeColor}`}>LEAVE HERE</div>

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
      <div className={`${styles.itemWrapper}`}>
        <div className={`${styles.label} ${styles.blueColor}`}>SHARE</div>

        <div className={styles.buttonWrapper}>
          <button
            className={styles.shareButton}
            onClick={() => {
              console.log('공유하기 클릭');
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

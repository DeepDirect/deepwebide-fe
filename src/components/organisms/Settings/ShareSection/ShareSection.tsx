import styles from './ShareSection.module.scss';

import ShareIcon from '@/assets/icons/share.svg?react';
import CopyIcon from '@/assets/icons/copy.svg?react';
import CheckIcon from '@/assets/icons/arrow-down-box.svg?react';
import RecycleIcon from '@/assets/icons/recycle.svg?react';
import UnshareIcon from '@/assets/icons/mail-off.svg?react';
import ForwardIcon from '@/assets/icons/forward.svg?react';
import useRepoSettingsStore from '@/stores/repoSettingsStore';
import { useParams } from '@tanstack/react-router';
import useShareRepositoryStatus from '@/hooks/common/useShareRepositoryStatus';
import useRepositoryExit from '@/hooks/common/useRepositoryExit';
import useGetRepositoryEntrycode from '@/hooks/common/useGetRepositoryEntrycode';
import useRepositoryNewEntrycode from '@/hooks/common/useRepositoryNewEntrycode';
import AlertDialogComponent from '@/components/molecules/AlertDialog/AlertDialog';
import { useState } from 'react';
import PasswordInput from '@/components/atoms/Input/PasswordInput';
import { useQueryClient } from '@tanstack/react-query';
import { isCurrentUserOwner } from '@/utils/isCurrentUserOwner';
import { useRouter } from '@tanstack/react-router';
import { useToast } from '@/hooks/common/useToast';

type shareSectionProps = {
  onShareLinkCopy?: () => void;
};

const ShareSection = ({ onShareLinkCopy }: shareSectionProps) => {
  const repoId = useParams({ strict: false }).repoId;
  const router = useRouter();
  const [isEntrycodeVisible, setIsEntrycodeVisible] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShareCancelOpen, setIsShareCancelOpen] = useState(false);
  const [isShareExitOpen, setIsShareExitOpen] = useState(false);
  const [isNewEntrtycodeOpen, setIsNewEntrycodeOpen] = useState(false);
  const settingsData = useRepoSettingsStore(state => state.settingsData);
  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate: shareRepositoryStatus } = useShareRepositoryStatus(`/api/repositories/${repoId}`);
  const { mutate: newEntrycode } = useRepositoryNewEntrycode(
    `/api/repositories/${repoId}/new-entrycode`
  );
  const { mutate: exitRepository } = useRepositoryExit(`/api/repositories/${repoId}/exit`);
  const {
    data: entrycodeData,
    isLoading: isEntrycodeLoading,
    isSuccess,
  } = useGetRepositoryEntrycode(`/api/repositories/${repoId}/entrycode`, {
    enabled: isEntrycodeVisible && !!repoId, // 입장 코드를 보려고 할 때만 호출
  });

  if (!settingsData) return null;

  const handleShareLinkCopy = async () => {
    if (settingsData.shareLink) {
      navigator.clipboard.writeText(settingsData.shareLink);
    }
    toast.success('공유 링크가 클립보드에 복사되었습니다.');
    if (onShareLinkCopy) {
      onShareLinkCopy();
    }
  };

  const handleEntryCodeCheck = () => {
    setIsEntrycodeVisible(true);
    toast.success('입장 코드를 확인합니다.');
  };

  const handleEntryCodeCopy = () => {
    if (entrycodeData && entrycodeData.data.entryCode) {
      navigator.clipboard.writeText(entrycodeData.data.entryCode);
    }
    toast.success('입장 코드가 클립보드에 복사되었습니다.');
  };

  // API 사용

  const handleNewEntrycode = () => {
    if (repoId) {
      newEntrycode();
      queryClient.invalidateQueries({ queryKey: ['repository', 'entrycode'] });
      toast.success('입장 코드가 재발급되었습니다.');
    } else {
      toast.error('입장 코드 재발급에 실패했습니다.');
    }
  };

  const handleShareStatus = () => {
    if (repoId && settingsData.isShared) {
      shareRepositoryStatus();
      toast.success('공유 레포지토리를 개인 레포지토리로 전환합니다.');
    } else if (repoId && !settingsData.isShared) {
      shareRepositoryStatus();
      toast.success('개인 레포지토리를 공유 레포지토리로 전환합니다.');
    } else {
      toast.error('레포지토리 공유 모드를 변경할 수 없습니다.');
    }
  };

  const handleExitStatus = () => {
    if (repoId) {
      exitRepository();
      toast.success('공유 레포지토리에서 퇴장합니다.');
      router.navigate({ to: '/main' });
    } else {
      toast.error('공유 레포지토리에서 퇴장할 수 없습니다.');
    }
  };

  return (
    <section className={styles.shareSection} id="shareSection">
      <div className={styles.sectionTitleWrapper}>
        <ShareIcon className={styles.nameIcon} />
        <h2 className={styles.sectionTitle}>SHARE</h2>
      </div>
      {/* 링크 공유 */}
      {settingsData.isShared && (
        <div className={`${styles.itemWrapper} ${styles.shareWrapper}`}>
          <div className={styles.label}>SHARE LINK</div>

          <div className={styles.linkWrapper}>
            <div className={styles.labelWrapper}>
              <span className={styles.iconLabel}>공유 링크</span>

              {/* 공유 링크 복사 아이콘 */}
              <div className={styles.iconWrapper} onClick={handleShareLinkCopy}>
                <CopyIcon className={styles.icon} />
              </div>
            </div>

            {/* 공유 링크 인풋 */}
            {settingsData.shareLink && (
              <input type="text" value={settingsData.shareLink} readOnly className={styles.input} />
            )}
          </div>
        </div>
      )}
      {/* 입장 코드 */}
      {settingsData.isShared && isCurrentUserOwner(settingsData.members) && (
        <div className={`${styles.itemWrapper} ${styles.entryCodeWrapper}`}>
          <div className={styles.label}>ENTRY CODE</div>

          <div className={styles.checkCodeWrapper}>
            <span>
              {!isEntrycodeVisible && (
                <div className={styles.beforeLoadEntryCode}>
                  <div>입장 코드 확인하기</div>
                  <CheckIcon className={styles.icon} onClick={handleEntryCodeCheck} />
                </div>
              )}
              {isEntrycodeVisible && isEntrycodeLoading && <div>입장 코드를 불러오는 중...</div>}
              {isEntrycodeVisible && isSuccess && entrycodeData && (
                <div className={styles.afterLoadEntryCode}>
                  <PasswordInput disabled={true} value={entrycodeData.data.entryCode} />
                  {/* 입장 코드 복사 아이콘 */}
                  <div className={styles.iconWrapper} onClick={handleEntryCodeCopy}>
                    <CopyIcon className={styles.icon} />
                  </div>
                </div>
              )}
            </span>
          </div>

          {/* 입장 코드 재발급 버튼 */}
          <div className={styles.buttonWrapper}>
            <button
              className={styles.reissueButton}
              onClick={() => {
                setIsNewEntrycodeOpen(true);
              }}
            >
              <RecycleIcon className={styles.buttonIcon} />
              재발급
            </button>
          </div>
        </div>
      )}

      {/* 링크 공유 취소 */}
      {settingsData.isShared &&
        isCurrentUserOwner(settingsData.members) &&
        settingsData.members.length === 1 && (
          <div className={`${styles.itemWrapper} ${styles.unshareWrapper}`}>
            <div className={`${styles.label} ${styles.orangeColor}`}>UNSHARE</div>

            <div className={styles.buttonWrapper}>
              <button
                className={styles.unshareButton}
                onClick={() => {
                  setIsShareCancelOpen(true);
                }}
              >
                <UnshareIcon className={styles.buttonIcon} />
                공유 취소하기
              </button>
            </div>
          </div>
        )}

      {/* 레포 떠나기 */}
      {settingsData.isShared && !isCurrentUserOwner(settingsData.members) && (
        <div className={`${styles.itemWrapper}`}>
          <div className={`${styles.label} ${styles.orangeColor}`}>LEAVE HERE</div>

          <div className={styles.buttonWrapper}>
            <button
              className={styles.unshareButton}
              onClick={() => {
                setIsShareExitOpen(true);
              }}
            >
              <UnshareIcon className={styles.buttonIcon} />
              떠나기
            </button>
          </div>
        </div>
      )}

      {/* 공유하기 */}
      {!settingsData.isShared && (
        <div className={`${styles.itemWrapper}`}>
          <div className={`${styles.label} ${styles.blueColor}`}>SHARE</div>
          <div className={styles.buttonWrapper}>
            <button
              className={styles.shareButton}
              onClick={() => {
                setIsShareOpen(true);
              }}
            >
              <ForwardIcon className={styles.buttonIcon} />
              공유하기
            </button>
          </div>
        </div>
      )}

      {/* 레포지토리 떠나기 Alert */}
      <AlertDialogComponent
        open={isShareExitOpen}
        onOpenChange={setIsShareExitOpen}
        title="레포지토리를 떠나시겠습니까?"
        confirmText="퇴장하기"
        cancelText="취소"
        onConfirm={handleExitStatus}
        showCancel
      />
      {/* 레포지토리 공유 Alert */}
      <AlertDialogComponent
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        title="레포지토리를 공유하시겠습니까?"
        confirmText="공유하기"
        cancelText="취소"
        onConfirm={handleShareStatus}
        showCancel
      />
      {/* 레포지토리 공유 취소 Alert */}
      <AlertDialogComponent
        open={isShareCancelOpen}
        onOpenChange={setIsShareCancelOpen}
        title="레포지토리 공유를 취소하시겠습니까?"
        confirmText="취소하기"
        cancelText="취소"
        onConfirm={handleShareStatus}
        showCancel
      />
      {/* 입장코드 재발급 Alert */}
      <AlertDialogComponent
        open={isNewEntrtycodeOpen}
        onOpenChange={setIsNewEntrycodeOpen}
        title="입장 코드를 재발급하시겠습니까?"
        confirmText="발급하기"
        cancelText="취소"
        onConfirm={handleNewEntrycode}
        showCancel
      />
    </section>
  );
};

export default ShareSection;

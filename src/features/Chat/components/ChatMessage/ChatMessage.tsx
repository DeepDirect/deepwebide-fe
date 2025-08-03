import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useTabStore } from '@/stores/tabStore';
import { useFileTreeQuery } from '@/features/Repo/fileTree/hooks/useFileTreeApi';
import { findNodeByPath } from '@/features/Repo/fileTree/utils';
import { useToast } from '@/hooks/common/useToast';
import './ChatMessage.scss';
import { type ChatReceivedMessage } from '@/features/Chat/types';

interface ChatMessageProps {
  message: ChatReceivedMessage;
  isMyMessage: boolean;
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ko');

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMyMessage }) => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const toast = useToast();
  const { openFileByPath } = useTabStore();

  // 현재 repo ID 가져오기
  const repoId = params.repoId as string;
  const repositoryId = repoId ? parseInt(repoId, 10) : 0;

  // 파일트리 데이터 가져오기 (파일 존재 여부 확인용)
  const { data: fileTreeData } = useFileTreeQuery(repositoryId);

  // 시간 포맷팅 함수
  const formatTime = (isoString: string) => {
    const time = dayjs.utc(isoString).tz('Asia/Seoul').format('HH:mm');
    return time;
  };

  // 파일 경로 클릭 핸들러
  const handleFilePathClick = (filePath: string) => {
    if (!repoId) {
      console.warn('repoId가 없어서 파일을 열 수 없습니다.');
      toast.error('저장소 정보를 찾을 수 없습니다.');
      return;
    }

    if (!fileTreeData || fileTreeData.length === 0) {
      console.warn('파일트리 데이터가 없어서 파일 존재 여부를 확인할 수 없습니다.');
      toast.error('파일 목록을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 파일트리에서 해당 경로의 파일이 존재하는지 확인
    const fileNode = findNodeByPath(fileTreeData, filePath);

    if (!fileNode) {
      console.warn('파일트리에서 파일을 찾을 수 없음:', filePath);
      toast.error(`파일을 찾을 수 없습니다: ${filePath}`);
      return;
    }

    if (fileNode.fileType !== 'FILE') {
      console.warn('폴더는 탭으로 열 수 없음:', filePath);
      toast.error('폴더는 열 수 없습니다. 파일만 선택해주세요.');
      return;
    }

    // 파일명 추출 (경로의 마지막 부분)
    const fileName = filePath.includes('/') ? filePath.split('/').pop() || 'untitled' : filePath;

    console.log('채팅에서 파일 경로 클릭:', {
      repoId,
      filePath,
      fileName,
      fileId: fileNode.fileId,
      fileExists: true,
    });

    // 탭으로 파일 열기 (fileId도 함께 전달)
    openFileByPath(repoId, filePath, fileName, fileNode.fileId);

    // URL 업데이트하여 파일 경로 반영
    try {
      navigate({
        to: '/$repoId',
        params: { repoId },
        search: { file: filePath },
        replace: false,
      });

      toast.success(`${fileName} 파일을 열었습니다.`);
    } catch (error) {
      console.error('파일 경로 네비게이션 실패:', error);
      toast.error('파일을 여는 중 오류가 발생했습니다.');
    }
  };

  // 메시지 내용에서 코드 참조 파싱
  const renderMessageContent = (content: string) => {
    // [[Ref: 파일 경로]] 패턴
    const refPattern = /\[\[Ref:\s*([^\]]+)\]\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = refPattern.exec(content)) !== null) {
      // 참조 앞의 일반 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      const filePath = match[1].trim();

      parts.push(
        <span
          key={match.index}
          className="chat-message__reference"
          onClick={() => handleFilePathClick(filePath)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFilePathClick(filePath);
            }
          }}
          title={`${filePath} 파일 열기`}
        >
          [[Ref: {filePath}]]
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className={`chat-message ${isMyMessage ? 'chat-message--my' : 'chat-message--other'}`}>
      <div className="chat-message__bubble">
        {/* 사용자 아바타 */}
        <div className="chat-message__avatar-container">
          {/* 프로필 이미지 */}
          <img
            src={message.senderProfileImageUrl}
            alt={`${message.senderNickname} 프로필`}
            className="chat-message__avatar-image"
          />
        </div>

        {/* 메시지 내용 */}
        <div className="chat-message__content">
          <div className="chat-message__user-name">{message.senderNickname}</div>
          <div className="chat-message__text">{renderMessageContent(message.message)}</div>
        </div>

        {/* 시간 */}
        <div className="chat-message__time">{formatTime(message.sentAt)}</div>
      </div>

      {/* TODO : 읽지 않은 사람 수 - 0명은 표시하지 않음 */}
      {/* {message.unreadNumber > 0 && (
        <div className="chat-message__unread-number">
          {String(message.unreadNumber).padStart(2, '0')}
        </div>
      )} */}
    </div>
  );
};

export default ChatMessage;

import React from 'react';
import { type ChatMessage as ChatMessageData } from '../../types';
import './ChatMessage.scss';

interface ChatMessageProps {
  message: ChatMessageData;
  isMyMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isMyMessage }) => {
  // 시간 포맷팅 함수
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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

      parts.push(
        <span key={match.index} className="chat-message__reference">
          [[Ref: {match[1]}]]
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
            src={message.profile_image_url}
            alt={`${message.username} 프로필`}
            className="chat-message__avatar-image"
          />
        </div>
        {/* 메시지 내용 */}
        <div className="chat-message__content">
          <div className="chat-message__user-name">{message.username}</div>
          <div className="chat-message__text">{renderMessageContent(message.content)}</div>
        </div>
        {/* 시간 */}
        <div className="chat-message__time">{formatTime(message.created_at)}</div>
      </div>

      {/* 읽지 않은 사람 수 - 0명은 표시하지 않음 */}
      {message.unreadNumber > 0 && (
        <div className="chat-message__unread-number">
          {String(message.unreadNumber).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;

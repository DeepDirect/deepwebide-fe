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

  // TODO - 현재는 프로필 이미지에서 이니셜 추출, 추후 이미지로 변경 예정
  const getInitials = (username: string) => {
    return username.slice(0, 2);
  };
  // 아바타 색상 결정 (user_id 기반)
  const getAvatarColor = (userId: string) => {
    const colors = ['green', 'pink', 'yellow'];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // TODO - 메시지 내부에 코드 참조가 포함되어 있으면, 파일로 연결해주는 기능 구현 필요

  return (
    <div className={`chat-message ${isMyMessage ? 'chat-message--my' : 'chat-message--other'}`}>
      <div className="chat-message__bubble">
        {/* 사용자 아바타 */}
        <div
          className={`chat-message__avatar chat-message__avatar--${getAvatarColor(message.user_id)}`}
        >
          {getInitials(message.username)}
        </div>
        {/* 메시지 내용 */}
        <div className="chat-message__content">
          <div className="chat-message__user-name">{message.username}</div>
          <div className="chat-message__text">{message.content}</div>
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

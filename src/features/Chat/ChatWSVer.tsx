import React, { useRef, useEffect, useState } from 'react';
import { type ChatMessage as ChatMessageData } from './types';
import { type ChatMessage as WebSocketChatMessage } from '@/hooks/chat/useWebSocketChat';
import { type SearchMessagesData } from '@/schemas/chat.schema';
import { getCurrentUserId } from '@/utils/authChatUtils';

import ChatMessageComponent from './components/ChatMessage/ChatMessage';
import ChatInput from './components/ChatInput/ChatInput';
import DateDivider from './components/DateDivider/DateDivider';
import ChatSearchBar from './components/ChatSearchBar/ChatSearchBar';
import CurrentMembers from './components/CurrentMembers/CurrentMembers';

import './Chat.scss';
import Loading from '@/components/molecules/Loading/Loading';

interface ChattingProps {
  className?: string;
  // WebSocket 상태를 props로 받기
  messages: WebSocketChatMessage[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isLoading: boolean;
  onlineUsers: Array<{ userId: string; userName: string }>;
}

const ChatWSVer: React.FC<ChattingProps> = ({
  messages: wsMessages,
  sendMessage,
  isConnected,
  isLoading,
  //   onlineUsers,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchResults, setSearchResults] = useState<SearchMessagesData | null>(null);

  // 현재 사용자 ID (메시지 비교용)
  const currentUserId = getCurrentUserId();

  // WebSocket 메시지를 기존 ChatMessage 형식으로 변환
  const messages: ChatMessageData[] = wsMessages.map(msg => ({
    user_id: msg.userId,
    username: msg.userName,
    profile_image_url: msg.profileImageUrl,
    content: msg.content,
    type: msg.type as 'message',
    created_at: new Date(msg.timestamp).toISOString(),
    unreadNumber: 0, // TODO: 실제 읽지 않은 메시지 수 계산
  }));

  // 검색 결과를 ChatMessage 형식으로 변환
  const searchMessages: ChatMessageData[] = searchResults
    ? searchResults.messages.map(msg => ({
        user_id: msg.senderId.toString(),
        username: msg.senderNickname,
        profile_image_url: msg.senderProfileImageUrl,
        content: msg.message,
        type: 'message' as const,
        created_at: msg.sentAt,
        unreadNumber: 0,
      }))
    : [];

  // 검색 결과 처리 함수
  const handleSearchResults = (results: SearchMessagesData | null) => {
    setSearchResults(results);
  };

  // 표시할 메시지 목록 결정 (검색 결과가 있으면 검색 결과를, 없으면 일반 메시지를)
  const displayMessages = searchResults ? searchMessages : messages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 검색 모드가 아닐 때만 자동 스크롤
    if (!searchResults) {
      scrollToBottom();
    }
  }, [messages, searchResults]);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    sendMessage(message);
  };

  // 날짜 포맷 한글화
  const formatDateToKorean = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][
      date.getDay()
    ];

    return `${year}년 ${month}월 ${day}일 ${dayOfWeek}`;
  };

  // 날짜 구분선 표시 여부 결정
  const shouldShowDateDivider = (currentMessage: ChatMessageData, index: number) => {
    // 첫 번째 메시지는 항상 날짜 표시
    if (index === 0) return true;

    const previousMessage = displayMessages[index - 1] as ChatMessageData;
    const currentDate = new Date(currentMessage.created_at).toISOString().split('T')[0];
    const previousDate = new Date(previousMessage.created_at).toISOString().split('T')[0];

    return currentDate !== previousDate;
  };

  return (
    <div className={'chat'}>
      <div className="chat__container">
        {/* 검색 바 */}
        <ChatSearchBar onSearchResults={handleSearchResults} />

        {/* 검색 결과 표시 */}
        {/* {searchResults && (
          <div style={{ padding: '8px', textAlign: 'center', color: '#0066cc', fontSize: '10px' }}>
            🔍 "{searchResults.keyword}" 검색 결과: {searchResults.totalElements}개
          </div>
        )} */}

        {/* 현재 접속중 인원 표시 */}
        {/* <CurrentMembers onlineUsers={onlineUsers} /> */}
        <CurrentMembers />

        {isLoading && <Loading />}

        {!isLoading && !isConnected && (
          <div style={{ padding: '8px', textAlign: 'center', color: '#ff6b6b', fontSize: '10px' }}>
            ⚠️ 채팅 연결 끊김
          </div>
        )}

        {/* {isLoggedIn && !isLoading && isConnected && (
          <div
            style={{ padding: '4px', textAlign: 'center', color: '#02722dff', fontSize: '10px' }}
          >
            ✅ 실시간 채팅 연결됨
          </div>
        )} */}

        {/* 채팅 메시지 목록 */}
        <div className="chat__messages">
          {displayMessages.length === 0 && !isLoading && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              {searchResults
                ? '검색 결과가 없습니다.'
                : '아직 메시지가 없습니다. 첫 메시지를 보내보세요! 👋'}
            </div>
          )}

          {displayMessages.map((message, index) => {
            const shouldShowDate = shouldShowDateDivider(message, index);
            const isMyMessage = message.user_id === currentUserId;

            // 디버깅용 메시지 로그 출력 (검색 모드가 아닐 때만)
            if (!searchResults) {
              console.log(`Message ${index}:`, {
                shouldShowDate,
                date: formatDateToKorean(message.created_at),
                content: message.content,
                isMyMessage,
                currentUserId,
                messageUserId: message.user_id,
              });
            }

            return (
              <React.Fragment key={`${message.user_id}-${message.created_at}-${index}`}>
                {shouldShowDate && <DateDivider date={formatDateToKorean(message.created_at)} />}
                <ChatMessageComponent message={message} isMyMessage={isMyMessage} />
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* 채팅 입력 */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatWSVer;

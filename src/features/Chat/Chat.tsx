import React, { useState, useRef, useEffect } from 'react';
import { type ChatMessage as ChatMessageData } from './types';

import ChatMessage from './components/ChatMessage/ChatMessage';
import ChatInput from './components/ChatInput/ChatInput';
import DateDivider from './components/DateDivider/DateDivider';
import ChatSearchBar from './components/ChatSearchBar/ChatSearchBar';
import CurrentMembers from './components/CurrentMembers/CurrentMembers';

import './Chat.scss';

interface ChattingProps {
  className?: string;
}

const mockMessages: Array<ChatMessageData> = [
  {
    user_id: '3',
    username: '더운 개발자',
    profile_image_url: 'https://example.com/profile/1.png',
    content: '날씨 미쳤다~',
    type: 'message',
    created_at: '2025-07-13T15:33:00Z',
    unreadNumber: 0,
  },
  {
    user_id: 'me',
    username: '슬기로운 개발자',
    profile_image_url: 'https://example.com/profile/2.png',
    content: '그냥 미쳤다~',
    type: 'message',
    created_at: '2025-07-13T15:34:00Z',
    unreadNumber: 0,
  },
  {
    user_id: '3',
    username: '더운 개발자',
    profile_image_url: 'https://example.com/profile/me.png',
    content: '오늘은 비가 많이 오네~',
    type: 'message',
    created_at: '2025-07-14T10:33:00Z',
    unreadNumber: 1,
  },
  {
    user_id: '2',
    username: '쓰러진 개발자',
    profile_image_url: 'https://example.com/profile/3.png',
    content: '집 보내주ㅏ',
    type: 'message',
    created_at: '2025-07-15T11:31:00Z',
    unreadNumber: 2,
  },
];

const Chat: React.FC<ChattingProps> = () => {
  const [messages, setMessages] = useState(mockMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO - 헤더를 통해 열고 닫는 기능 추가

  // TODO - 헤더의 채팅 아이콘에 배지로 읽지 않은 메시지 수 표시 기능 추가

  // TODO - 현재 사용자 ID, 나중에는 사용자 정보에서 가져와야 함
  const currentUserId = 'me';

  // TODO - Redis에서 이전 메시지 모두 불러오는 로직 필요
  // 불러올 때 메시지 읽은 사람 수 계산 병행

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (message: string) => {
    const now = new Date();

    // TODO - 현재 사용자 정보를 가져오는 로직 필요
    const newMessage: ChatMessageData = {
      user_id: currentUserId,
      username: '슬기로운 개발자',
      profile_image_url: 'https://example.com/profile/me.png',
      content: message,
      type: 'message',
      created_at: now.toISOString(),
      unreadNumber: 3,
    };

    setMessages(prev => [...prev, newMessage]);
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

  // 이전 메시지와 날짜가 다른지 확인하여 날짜 구분선을 표시할지 결정
  const shouldShowDateDivider = (currentMessage: ChatMessageData, index: number) => {
    // 첫 번째 메시지는 항상 날짜 표시
    if (index === 0) return true;

    const previousMessage = messages[index - 1] as ChatMessageData;
    const currentDate = new Date(currentMessage.created_at).toISOString().split('T')[0];
    const previousDate = new Date(previousMessage.created_at).toISOString().split('T')[0];

    return currentDate !== previousDate;
  };

  return (
    <div className={'chat'}>
      <div className="chat__container">
        {/* 검색 바 */}
        <ChatSearchBar />

        {/* 현재 접속중 인원 표시 */}
        <CurrentMembers />

        {/* 채팅 메시지 목록 */}
        <div className="chat__messages">
          {messages.map((message, index) => {
            const shouldShowDate = shouldShowDateDivider(message, index);
            const isMyMessage = message.user_id === currentUserId;

            console.log(`Message ${index}:`, {
              shouldShowDate,
              date: formatDateToKorean(message.created_at),
              content: message.content,
            });

            return (
              <React.Fragment key={`${message.user_id}-${message.created_at}-${index}`}>
                {shouldShowDate && <DateDivider date={formatDateToKorean(message.created_at)} />}
                <ChatMessage message={message} isMyMessage={isMyMessage} />
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

export default Chat;

import React, { useRef, useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { getCurrentUserId } from '@/utils/authChatUtils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import ChatMessageComponent from './components/ChatMessage/ChatMessage';
import ChatInput from './components/ChatInput/ChatInput';
import DateDivider from './components/DateDivider/DateDivider';
import ChatSearchBar from './components/ChatSearchBar/ChatSearchBar';
import {
  type ChatSendMessage,
  type ChatReceivedMessage,
  type SendCodeReference,
} from '@/features/Chat/types';

import { useGetChatMessagesInfinite } from '@/hooks/chat/useGetPreviousChat';
import CurrentMembers from './components/CurrentMembers/CurrentMembers';
import Loading from '@/components/molecules/Loading/Loading';
import './Chat.scss';
import type { SearchMessagesData } from '@/schemas/chat.schema';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ko');

interface ChattingProps {
  isConnected: boolean;
  connectedCount: number;
  messages?: ChatReceivedMessage[] | [];
  send: (message: ChatSendMessage) => void;
}

const Chat: React.FC<ChattingProps> = ({ isConnected, connectedCount, messages, send }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { repoId } = useParams({ strict: false });
  const [totalMessages, setTotalMessages] = useState<ChatReceivedMessage[]>([]);
  const prevMessagesRef = useRef<ChatReceivedMessage[]>([]);
  const [searchResults, setSearchResults] = useState<SearchMessagesData | null>(null);
  const [showLoading, setShowLoading] = useState(true);

  // 현재 사용자 ID (메시지 비교용)
  const currentUserId = getCurrentUserId();
  // const { data, isSuccess } = useGetPreviousChat(repoId);
  const { data, fetchNextPage, hasNextPage, isSuccess } = useGetChatMessagesInfinite(repoId);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // SearchMessageData 타입을 ChatReceivedMessage로 변환
  const searchMessages: ChatReceivedMessage[] = searchResults
    ? searchResults.messages
        .map(msg => ({
          ...msg,
          type: 'CHAT' as const,
          repositoryId: repoId,
          messageId: msg.messageId.toString(),
        }))
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
    : [];

  // 검색 결과 처리 함수
  const handleSearchResults = (results: SearchMessagesData | null) => {
    setSearchResults(results);
  };

  useEffect(() => {
    if (isSuccess && data) {
      const messages = data.pages.flatMap(page => page.data.messages) || [];
      const formattedMessages: ChatReceivedMessage[] = messages
        .map(msg => ({
          ...msg,
          type: 'CHAT' as const,
          repositoryId: repoId,
          messageId: msg.messageId.toString(),
        }))
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      setTotalMessages(formattedMessages);
      if (!isSuccess) {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }
    }
  }, [data, repoId, isSuccess]);

  // props messages가 변경될 때 추가된 메시지만 totalMessages에 추가
  useEffect(() => {
    if (messages && messages.length > 0) {
      const prevLength = prevMessagesRef.current.length;
      const currentLength = messages.length;

      // 새로운 메시지가 추가된 경우
      if (currentLength > prevLength) {
        const newMessages = messages.slice(prevLength); // 추가된 부분만 가져오기
        setTotalMessages(prevTotal => [...prevTotal, ...newMessages]);
      }
      // 현재 messages를 이전 messages로 저장
      prevMessagesRef.current = messages;
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 검색 모드가 아닐 때만 자동 스크롤
    if (!searchResults) {
      scrollToBottom();
    }
  }, [messages, searchResults]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;

    // 스크롤이 최상단 근처에 있을 때
    if (scrollTop <= 0) {
      console.log('hasNextPage:', hasNextPage);
      console.log('params:', data?.pageParams);
      if (hasNextPage) {
        fetchNextPage();
      }
    }
  };

  const handleSendMessage = (message: string, codeReference: SendCodeReference) => {
    if (!message.trim()) return;
    send({
      type: 'CHAT',
      repositoryId: repoId,
      message: message,
      codeReference: codeReference,
    });
  };

  //   날짜 포맷 한글화
  const formatDateToKorean = (dateString: string) => {
    const koreanTime = dayjs.utc(dateString).tz('Asia/Seoul');
    return koreanTime.format('YYYY년 MM월 DD일 dddd');
  };

  // 날짜 구분선 표시 여부 결정
  const shouldShowDateDivider = (currentMessage: ChatReceivedMessage, index: number) => {
    if (index === 0) return true;

    const previousMessage = totalMessages[index - 1] as ChatReceivedMessage;

    // dayjs로 한국 시간 기준 날짜 비교
    const currentDate = dayjs.utc(currentMessage.sentAt).tz('Asia/Seoul').format('YYYY-MM-DD');
    const previousDate = dayjs.utc(previousMessage.sentAt).tz('Asia/Seoul').format('YYYY-MM-DD');

    return currentDate !== previousDate;
  };

  // 표시할 메시지 목록 결정(검색 결과가 있으면 검색 메시지, 없으면 전체 메시지)
  const displayMessages = searchResults ? searchMessages : totalMessages;

  return (
    <div className={'chat'}>
      <div className="chat__container">
        {/* 검색 바 */}
        <ChatSearchBar onSearchResults={handleSearchResults} />

        {/* 현재 접속중 인원 표시 */}
        <CurrentMembers onlineCount={connectedCount} />

        {/* 로딩 중일 때 로딩 컴포넌트 표시 */}
        {(!isConnected || showLoading) && <Loading />}

        {/* 채팅 메시지 목록 */}
        <div className="chat__messages" onScroll={handleScroll}>
          {totalMessages.length === 0 && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              아직 메시지가 없습니다. 첫 메시지를 보내보세요! 👋
            </div>
          )}

          {displayMessages.map((message, index) => {
            const shouldShowDate = shouldShowDateDivider(message, index);
            const isMyMessage = String(message.senderId) === currentUserId;

            return (
              <React.Fragment key={`${message.senderId}-${message.sentAt}-${index}`}>
                {shouldShowDate && <DateDivider date={formatDateToKorean(message.sentAt)} />}
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

export default Chat;

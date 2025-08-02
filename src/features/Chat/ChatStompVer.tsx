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

import { useGetPreviousChat } from '@/hooks/chat/useGetPreviousChat';
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
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [totalMessages, setTotalMessages] = useState<ChatReceivedMessage[]>([]);
  const prevMessagesRef = useRef<ChatReceivedMessage[]>([]);
  const [searchResults, setSearchResults] = useState<SearchMessagesData | null>(null);

  // 현재 사용자 ID (메시지 비교용)
  const currentUserId = getCurrentUserId();

  const {
    data: previousChatData,
    isLoading: isPreviousLoading,
    refetch: refetchPreviousChat,
  } = useGetPreviousChat(
    repoId,
    { size: 20 },
    { enabled: false } // 자동 호출 비활성화
  );

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

  // 초기 로드 시에만 수동으로 데이터 페칭
  useEffect(() => {
    if (isConnected && isInitialLoad && repoId) {
      console.log('🚀 [Chat] 초기 로드 - API 호출 시작');
      refetchPreviousChat(); // Promise 결과는 사용하지 않음
    }
  }, [isConnected, isInitialLoad, repoId, refetchPreviousChat]);

  // 처음 렌더링 후 isInitialLoad를 false로 변경
  useEffect(() => {
    // idle 상태이고 데이터가 있을 때만 실행
    if (!isPreviousLoading && previousChatData && isInitialLoad) {
      console.log('📦 [Chat] 이전 채팅 메시지 수신 완료:', previousChatData);

      // API 응답에서 실제 메시지 배열 추출 및 타입 변환
      const messages = previousChatData.data?.data?.messages || [];
      const formattedMessages: ChatReceivedMessage[] = messages
        .map(msg => ({
          ...msg,
          type: 'CHAT' as const,
          repositoryId: repoId,
          messageId: msg.messageId.toString(),
        }))
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

      setTotalMessages(formattedMessages);
      setIsInitialLoad(false);

      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [previousChatData, isPreviousLoading, isInitialLoad, repoId]);

  // useEffect(() => {
  //   if (previousChatData && isInitialLoad) {
  //     // API 응답에서 실제 메시지 배열 추출 및 타입 변환
  //     const messages = previousChatData.data?.data?.messages || [];
  //     const formattedMessages: ChatReceivedMessage[] = messages
  //       .map(msg => ({
  //         ...msg,
  //         type: 'CHAT' as const,
  //         repositoryId: repoId,
  //         messageId: msg.messageId.toString(),
  //       }))
  //       .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  //     setTotalMessages(formattedMessages);

  //     // 초기 로드 완료 표시
  //     setIsInitialLoad(false);
  //     requestAnimationFrame(() => {
  //       scrollToBottom();
  //     });
  //   }
  // }, [previousChatData, repoId, isInitialLoad]);

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

  // 초기 로드 완료 후 플래그 설정
  useEffect(() => {
    if (previousChatData && isInitialLoad) {
      setIsInitialLoad(false);
      // 초기 로드 완료 후 맨 아래로 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [previousChatData, isInitialLoad]);

  // 온라인 사용자 형식 변환
  // const onlineUsers = stompOnlineUsers.map(user => ({
  //   userId: user.userId.toString(),
  //   userName: user.nickname,
  // }));

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
        {!isConnected && isPreviousLoading && <Loading />}

        {/* 채팅 메시지 목록 */}
        <div className="chat__messages">
          {/* {messages.length === 0 && !isPreviousLoading && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              아직 메시지가 없습니다. 첫 메시지를 보내보세요! 👋
            </div>
          )} */}

          {displayMessages && displayMessages.length === 0 && !isPreviousLoading && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              {searchResults ? '검색 결과가 없습니다.' : <Loading />}
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

          {/* {totalMessages?.map((message, index) => {
            const shouldShowDate = shouldShowDateDivider(message, index);
            const isMyMessage = message.senderId.toString() === currentUserId;

            return (
              <React.Fragment key={`${message.senderId}-${message.sentAt}-${index}`}>
                {shouldShowDate && <DateDivider date={formatDateToKorean(message.sentAt)} />}
                <ChatMessageComponent message={message} isMyMessage={isMyMessage} />
              </React.Fragment>
            );
          })} */}
          <div ref={messagesEndRef} />
        </div>

        {/* 채팅 입력 */}
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Chat;

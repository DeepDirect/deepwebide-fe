import React, { useState } from 'react';
import './ChatInput.scss';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  helpText?: string;
}

const MAX_MESSAGE_LENGTH = 300;

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = '채팅 내용을 입력하세요',
  helpText = '코드 참조 시 #을 입력 후 해당 파일의 위치를 작성해주세요',
}) => {
  const [message, setMessage] = useState('');

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    // 문자열의 실제 길이를 계산
    const currentLength = [...input].length; // 스프레드 연산자를 사용하여 정확한 문자 수 계산

    if (currentLength <= MAX_MESSAGE_LENGTH) {
      setMessage(input);
    }
  };

  // TODO - 웹소켓을 통해 코드 전송하는 기능 구현 필요

  // TODO - 코드 참조 기능 구현 필요

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-input">
      <div className="chat-input__area">
        {/* 메시지 입력 영역 */}
        <textarea
          className="chat-input__input"
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          maxLength={MAX_MESSAGE_LENGTH}
        />

        {/* 문자 수 표시 */}
        <div className="chat-input__character-counter">
          {message.length}/{MAX_MESSAGE_LENGTH}
        </div>

        <div className="chat-input__footer">
          {/* 도움말 텍스트 */}
          <span className="chat-input__help">{helpText}</span>
          {/* 전송 버튼 */}
          <button
            className="chat-input__send-button"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M18 16H8v2H6v-2H4v-2h2v-2h2v2h10V4h2v12h-2zM8 12v-2h2v2H8zm0 6v2h2v-2H8z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

import React, { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetCodePaths } from '@/hooks/chat/useGetCodePaths';
import { type SendCodeReference } from '@/features/Chat/types';

import './ChatInput.scss';

interface ChatInputProps {
  onSendMessage: (message: string, codeReference: SendCodeReference) => void;
  placeholder?: string;
}

const MAX_MESSAGE_LENGTH = 300;

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  placeholder = '채팅 내용을 입력하세요',
}) => {
  const [message, setMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const { repoId } = useParams({ strict: false });

  const { data: codePathsData, isLoading, error } = useGetCodePaths(repoId as string);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    const currentLength = [...input].length;
    if (currentLength <= MAX_MESSAGE_LENGTH) {
      setMessage(input);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      // 선택된 파일 경로가 있으면 메시지에 포함
      const messageToSend = selectedPath
        ? `${message.trim()}\n\n📌 [[Ref: ${selectedPath}]]`
        : message.trim();
      onSendMessage(messageToSend, { path: selectedPath });
      setMessage('');
      setSelectedPath('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReferenceButtonClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handlePathSelect = (path: string) => {
    setSelectedPath(path);
    console.log('Selected path:', path);
    setShowDropdown(false);
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
          {/* 코드 참조 버튼 */}
          <span className="chat-input__reference">
            <button
              className="chat-input__reference-button"
              onClick={handleReferenceButtonClick}
              disabled={isLoading}
            >
              <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M7 5v14H5V3h14v18H9V7h6v10h-2V9h-2v10h6V5H7z" fill="currentColor" />
              </svg>
            </button>

            {/* 드롭다운 */}
            <div className="chat-input__reference-paths">
              {showDropdown && (
                <div className="chat-input__dropdown">
                  {isLoading && <div className="chat-input__loading">로딩 중...</div>}
                  {error && <div className="chat-input__error">경로를 불러올 수 없습니다.</div>}
                  {codePathsData?.data.data.paths && codePathsData.data.data.paths.length > 0 ? (
                    <select
                      className="chat-input__path-select"
                      value={selectedPath}
                      onChange={e => handlePathSelect(e.target.value)}
                      size={Math.min(codePathsData.data.data.paths.length, 5)}
                    >
                      <option value="">파일을 선택하세요</option>
                      {codePathsData.data.data.paths.map((path: string, index: number) => (
                        <option key={index} value={path}>
                          {path}
                        </option>
                      ))}
                    </select>
                  ) : (
                    !isLoading && (
                      <div className="chat-input__no-paths">참조할 수 있는 파일이 없습니다.</div>
                    )
                  )}
                </div>
              )}
            </div>
            {selectedPath && (
              <div className="chat-input__selected-path">
                <span className="chat-input__selected-path-text">{selectedPath}</span>
                <button className="chat-input__remove-path" onClick={() => setSelectedPath('')}>
                  ×
                </button>
              </div>
            )}
          </span>

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

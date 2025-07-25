import { useState } from 'react';
import './ChatSearchBar.scss';

const ChatSearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // TODO - 검색 로직 구현 필요
  // 엔터를 눌렀을 때 검색

  return (
    <div className="chat-search-bar">
      <div className="chat-search-bar__area">
        <input
          type="text"
          className="chat-search-bar__input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            d="M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
};

export default ChatSearchBar;

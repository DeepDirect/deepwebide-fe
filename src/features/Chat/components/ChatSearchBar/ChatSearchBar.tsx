import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetSearchedChat } from '@/hooks/chat/useGetSearchedChat';
import { type SearchMessagesData } from '@/schemas/chat.schema';
import './ChatSearchBar.scss';

interface ChatSearchBarProps {
  onSearchResults?: (results: SearchMessagesData | null) => void;
}

const ChatSearchBar: React.FC<ChatSearchBarProps> = ({ onSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerSearch, setTriggerSearch] = useState(false);
  const { repoId } = useParams({ strict: false });

  const { data: searchResults } = useGetSearchedChat(repoId as string, searchQuery, {
    enabled: !!repoId && triggerSearch,
  });

  useEffect(() => {
    if (onSearchResults && triggerSearch) {
      if (searchResults?.data.data) {
        onSearchResults(searchResults.data.data);
      } else {
        onSearchResults(null);
      }
      setTriggerSearch(false);
    }
  }, [searchResults, onSearchResults, triggerSearch]);

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length === 0) {
      if (onSearchResults) {
        onSearchResults(null);
      }
      return;
    }
    setTriggerSearch(true);
  }, [searchQuery, onSearchResults]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="chat-search-bar">
      <div className="chat-search-bar__area">
        <input
          type="text"
          className="chat-search-bar__input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="검색"
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

import useStompChat from '@/hooks/chat/useStompChat';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';

// const SOCKET_URL = `https://api.deepdirect.site/ws/chat/${token ? `?token=${token}` : ''}&repositoryId=${repositoryId}`;

export const StompConnectionTest: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { repoId } = useParams({ strict: false });

  console.log('repoId from params:', repoId);

  const { isConnected, messages, send } = useStompChat(
    'https://api.deepdirect.site/ws/chat',
    repoId
  );

  const handleSend = () => {
    if (!inputValue.trim()) return;

    send({
      type: 'CHAT',
      repositoryId: repoId,
      message: inputValue,
      codeReference: null,
    });

    setInputValue('');
  };

  return (
    <div>
      <h2>STOMP Chat Room</h2>
      <div style={{ border: '1px solid #ccc', padding: '8px', height: '200px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.repositoryId}</strong>: {msg.message}
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Type a message"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            handleSend();
          }
        }}
      />

      <button onClick={handleSend} disabled={!isConnected}>
        Send
      </button>
    </div>
  );
};

export default StompConnectionTest;

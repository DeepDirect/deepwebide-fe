import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
// const WS_BASE_URL = import.meta.env.VITE_BACKEND_WS_URL2; // Node.js에서는 사용 불가

const server = createServer();
const wss = new WebSocketServer({
  server,
  path: '/chat',
});

// 룸별 연결된 클라이언트 관리
const rooms = new Map();
// 사용자별 연결 정보 관리
const userConnections = new Map();

// 메시지 히스토리 (메모리에 저장, 실제로는 DB 사용)
const messageHistory = new Map();

console.log('🚀 채팅 WebSocket 서버 시작 중...');

wss.on('connection', (ws, request) => {
  // socketio 이용한 채팅
  const url = parse(request.url, true);
  const { roomId, userId, userName, token } = url.query;

  console.log(`👤 사용자 연결: ${userName} (${userId}) → 방: ${roomId}`);

  // 연결 정보 저장
  ws.roomId = roomId;
  ws.userId = userId;
  ws.userName = userName;
  ws.token = token;

  // 기존 동일 사용자 연결이 있다면 제거 (중복 방지)
  if (userConnections.has(userId)) {
    const existingConnection = userConnections.get(userId);
    if (existingConnection.ws.readyState === existingConnection.ws.OPEN) {
      console.log(`🔄 기존 연결 제거: ${userName} (${userId})`);
      existingConnection.ws.close();
    }
    // 룸에서도 제거
    if (rooms.has(existingConnection.roomId)) {
      rooms.get(existingConnection.roomId).delete(existingConnection.ws);
    }
  }

  // 룸에 클라이언트 추가
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  rooms.get(roomId).add(ws);

  // 사용자 연결 정보 저장 (새로운 연결로 업데이트)
  userConnections.set(userId, { ws, roomId, userName });

  // 방 참가 메시지를 다른 사용자들에게 브로드캐스트
  broadcastToRoom(
    roomId,
    {
      type: 'join',
      data: { userId, userName },
    },
    ws
  );

  // 현재 온라인 사용자 목록 전송
  sendUserList(roomId);

  // 메시지 히스토리 전송
  if (messageHistory.has(roomId)) {
    ws.send(
      JSON.stringify({
        type: 'message_history',
        data: messageHistory.get(roomId),
      })
    );
  }

  // 메시지 수신 처리
  ws.on('message', data => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 메시지 수신 [${roomId}]: ${message.type}`, message.data);

      switch (message.type) {
        case 'message':
          handleChatMessage(message, ws);
          break;
        case 'join':
          // 이미 연결 시 처리됨
          break;
        case 'leave':
          handleLeave(ws);
          break;
        default:
          console.log('❓ 알 수 없는 메시지 타입:', message.type);
      }
    } catch (error) {
      console.error('💥 메시지 파싱 오류:', error);
    }
  });

  // 연결 종료 처리
  ws.on('close', () => {
    console.log(`👋 사용자 연결 종료: ${userName} (${userId})`);
    handleLeave(ws);
  });

  // 오류 처리
  ws.on('error', error => {
    console.error(`❌ WebSocket 오류 [${userName}]:`, error);
    handleLeave(ws);
  });
});

// 채팅 메시지 처리
function handleChatMessage(message, senderWs) {
  const { roomId } = senderWs;
  const chatMessage = message.data;

  // 메시지 히스토리에 저장
  if (!messageHistory.has(roomId)) {
    messageHistory.set(roomId, []);
  }
  messageHistory.get(roomId).push(chatMessage);

  // 방의 모든 사용자에게 메시지 브로드캐스트
  broadcastToRoom(roomId, {
    type: 'message',
    data: chatMessage,
  });

  console.log(`💬 메시지 브로드캐스트 [${roomId}]: ${chatMessage.content}`);
}

// 사용자 떠나기 처리
function handleLeave(ws) {
  const { roomId, userId, userName } = ws;

  if (roomId && rooms.has(roomId)) {
    // 룸에서 제거
    rooms.get(roomId).delete(ws);
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
      // 빈 방의 메시지 히스토리도 정리 (선택사항)
      // messageHistory.delete(roomId);
    }

    // 사용자 연결 정보 제거
    userConnections.delete(userId);

    // 떠나기 메시지 브로드캐스트
    broadcastToRoom(
      roomId,
      {
        type: 'leave',
        data: { userId, userName },
      },
      ws
    );

    // 업데이트된 사용자 목록 전송
    sendUserList(roomId);
  }
}

// 방의 모든 사용자에게 메시지 브로드캐스트
function broadcastToRoom(roomId, message, excludeWs = null) {
  if (!rooms.has(roomId)) return;

  const clients = rooms.get(roomId);
  const messageStr = JSON.stringify(message);

  clients.forEach(client => {
    if (client !== excludeWs && client.readyState === client.OPEN) {
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('📤 메시지 전송 오류:', error);
        // 오류 발생한 클라이언트는 제거
        clients.delete(client);
      }
    }
  });
}

// 방의 온라인 사용자 목록 전송
function sendUserList(roomId) {
  if (!rooms.has(roomId)) return;

  const clients = rooms.get(roomId);
  const userMap = new Map(); // 사용자 ID별로 중복 제거

  // 연결된 클라이언트에서 고유한 사용자만 추출
  Array.from(clients)
    .filter(client => client.readyState === client.OPEN)
    .forEach(client => {
      userMap.set(client.userId, {
        userId: client.userId,
        userName: client.userName,
      });
    });

  const userList = Array.from(userMap.values());

  broadcastToRoom(roomId, {
    type: 'user_list',
    data: userList,
  });

  console.log(`👥 사용자 목록 업데이트 [${roomId}]:`, userList.map(u => u.userName).join(', '));
  console.log(`📊 실제 연결 수: ${clients.size}, 고유 사용자 수: ${userList.length}`);
}

// 서버 상태 로깅
setInterval(() => {
  const totalRooms = rooms.size;
  const totalUsers = Array.from(rooms.values()).reduce((total, room) => total + room.size, 0);
  console.log(`📊 서버 상태: ${totalRooms}개 방, ${totalUsers}명 접속`);
}, 30000); // 30초마다

// 서버 시작
const PORT = process.env.CHAT_WS_PORT || 8080;
server.listen(PORT, () => {
  console.log(`💬 채팅 WebSocket 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`🔗 연결 URL: ws://localhost:${PORT}/chat`);
  console.log(
    '📝 연결 예시: ws://localhost:8080/chat?roomId=test&userId=user1&userName=개발자&token=your-token'
  );
});

// 종료 처리
process.on('SIGTERM', () => {
  console.log('🛑 서버 종료 중...');
  wss.close();
  server.close();
});

process.on('SIGINT', () => {
  console.log('🛑 서버 종료 중...');
  wss.close();
  server.close();
  process.exit(0);
});

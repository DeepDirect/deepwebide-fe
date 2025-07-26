import { WebSocketServer } from 'ws';

const PORT = 1234;

console.log('간단한 WebSocket 서버 시작 중...');

// 포트 사용 중인지 먼저 확인
const checkPort = async port => {
  return new Promise(resolve => {
    const testServer = new WebSocketServer({ port }, err => {
      if (err) {
        resolve(false);
      } else {
        testServer.close(() => resolve(true));
      }
    });
  });
};

// 서버 시작
const startServer = async () => {
  try {
    // 포트 체크
    const isPortFree = await checkPort(PORT);
    if (!isPortFree) {
      console.log(`포트 ${PORT}가 이미 사용 중입니다.`);
      console.log('다음 명령어로 포트를 해제하세요:');
      console.log(`lsof -ti:${PORT} | xargs kill -9`);
      process.exit(1);
    }

    const wss = new WebSocketServer({
      port: PORT,
      perMessageDeflate: false,
    });

    // 연결된 클라이언트들을 방별로 관리
    const rooms = new Map();

    wss.on('connection', (ws, request) => {
      const url = request.url || '';
      const roomId = url.substring(1); // URL에서 방 ID 추출
      const clientIP = request.socket.remoteAddress;

      console.log(`새로운 클라이언트 연결: ${roomId} (IP: ${clientIP})`);

      // 방에 클라이언트 추가
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(ws);

      console.log(`방 ${roomId}에 ${rooms.get(roomId).size}명 접속 중`);

      // 메시지 수신 처리
      ws.on('message', message => {
        try {
          const messageStr = message.toString();
          console.log(`메시지 수신 (${roomId}):`, messageStr.substring(0, 50) + '...');

          // 같은 방의 다른 클라이언트들에게만 전송
          const roomClients = rooms.get(roomId);
          if (roomClients) {
            roomClients.forEach(client => {
              if (client !== ws && client.readyState === 1) {
                client.send(message);
              }
            });
          }
        } catch (error) {
          console.error('메시지 처리 오류:', error);
        }
      });

      // 연결 종료 처리
      ws.on('close', (code, reason) => {
        console.log(`클라이언트 연결 종료: ${roomId} (코드: ${code})`);

        // 방에서 클라이언트 제거
        const roomClients = rooms.get(roomId);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(roomId);
            console.log(`빈 방 제거: ${roomId}`);
          } else {
            console.log(`방 ${roomId}에 ${roomClients.size}명 남음`);
          }
        }
      });

      // 에러 처리
      ws.on('error', error => {
        console.error(`WebSocket 클라이언트 에러: ${roomId}`, error);
      });
    });

    wss.on('error', error => {
      console.error('WebSocket 서버 에러:', error);
    });

    wss.on('listening', () => {
      console.log(`WebSocket 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`클라이언트는 ws://localhost:${PORT}로 연결합니다.`);
      console.log('서버를 종료하려면 Ctrl+C를 누르세요.\n');
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

// 서버 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버 종료 중...');
  process.exit(0);
});

// 예외 처리
process.on('uncaughtException', error => {
  console.error('예외 발생:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('처리되지 않은 Promise 거부:', reason);
  process.exit(1);
});

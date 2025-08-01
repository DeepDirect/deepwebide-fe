import { z } from 'zod';

// 채팅방 입장시 메시지 조회
export const ChatMessageSchema = z.object({
  messageId: z.number(),
  senderId: z.number(),
  senderNickname: z.string(),
  senderProfileImageUrl: z.string(),
  message: z.string(),
  codeReference: z
    .object({
      referenceId: z.number(),
      path: z.string(),
    })
    .nullable(),
  isMine: z.boolean(),
  sentAt: z.string(),
});

export const ChatMessagesDataSchema = z.object({
  hasMore: z.boolean(),
  messages: z.array(ChatMessageSchema),
});

export const ChatMessagesResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: ChatMessagesDataSchema,
});

// 실시간 접속자 수
export const CurrentUserSchema = z.object({
  repositoryId: z.number(),
  activeUserCount: z.number(),
});

// 읽은 메시지 오프셋
export const LastReadOffsetSchema = z.object({
  lastReadMessageId: z.number(),
});

// 메시지 검색
export const SearchMessagesSchema = z.object({
  keyword: z.string(),
  totalElements: z.number(),
  messages: z.array(
    z.object({
      messageId: z.number(),
      senderId: z.number(),
      senderNickname: z.string(),
      senderProfileImageUrl: z.string(),
      message: z.string(),
      codeReference: z
        .object({
          referenceId: z.number(),
          path: z.string(),
        })
        .nullable(),
      isMine: z.boolean(),
      sentAt: z.string(),
    })
  ),
});

// 메시지 검색 API 응답
export const SearchMessagesResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: SearchMessagesSchema,
});

// 코드 참조 파일 경로 조회
export const CodeReferencePathsSchema = z.object({
  paths: z.array(z.string()),
});

// 코드 참조 파일 경로 조회 API 응답
export const CodeReferencePathsResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: CodeReferencePathsSchema,
});

// 웹소켓 연결 (ws)
export const WebSocketConnectionSchema = z.object({
  type: z.enum(['USER_JOINED', 'USER_LEFT']),
  repositoryId: z.number(),
  user: z.object({ userId: z.number(), nickname: z.string() }),
  activeUserCount: z.number(),
  message: z.string(),
  timestamp: z.string(),
});

// 메시지 전송 (ws)
export const SendMessageSchema = z.object({
  type: z.enum(['chat']),
  repositoryId: z.number(),
  messageId: z.number(),
  senderId: z.number(),
  senderNickname: z.string(),
  senderProfileImageUrl: z.string(),
  message: z.string(),
  codeReference: z
    .object({
      referenceId: z.number(),
      path: z.string(),
    })
    .nullable(),
  isMine: z.boolean(),
  sentAt: z.string(),
});

// 타입 추론
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatMessagesData = z.infer<typeof ChatMessagesDataSchema>;
export type ChatMessagesResponse = z.infer<typeof ChatMessagesResponseSchema>;
export type SearchMessagesData = z.infer<typeof SearchMessagesSchema>;
export type SearchMessagesResponse = z.infer<typeof SearchMessagesResponseSchema>;
export type CodeReferencePathsResponse = z.infer<typeof CodeReferencePathsResponseSchema>;
export type CodeReferencePaths = z.infer<typeof CodeReferencePathsSchema>;

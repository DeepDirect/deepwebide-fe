// 수신용 코드 참조
interface CodeReference {
  referenceId: number;
  path: string;
}

// 발신용 코드 참조
export interface SendCodeReference {
  path: string;
}

// 수신용 채팅 메시지
export interface ChatMessageInfo {
  repositoryId: number;
  messageId: string;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl: string;
  message: string;
  codeReference: CodeReference | null;
  isMine: boolean;
  sentAt: string;
}

// 수신용 채팅 메시지에 'CHAT' 추가
export interface ChatReceivedMessage extends ChatMessageInfo {
  type: 'CHAT';
}

// 발신용 채팅 메시지
export interface ChatSendMessage {
  type: 'CHAT';
  repositoryId: number;
  message: string;
  codeReference: SendCodeReference | null;
}

export type SendCodeReferenceType = SendCodeReference;
export type ChatReceivedMessageType = ChatReceivedMessage;
export type ChatMessageInfoType = ChatMessageInfo;
export type ChatSendMessageType = ChatSendMessage;

interface CodeReference {
  referenceId: number;
  path: string;
}

export interface SendCodeReference {
  path: string;
}

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

export interface ChatReceivedMessage extends ChatMessageInfo {
  type: 'CHAT';
}

export interface ChatSendMessage {
  type: 'CHAT';
  repositoryId: number;
  message: string;
  codeReference: SendCodeReference | null;
}

export interface SearchedChatMessageElement {
  messageId: string;
  senderId: number;
  senderNickname: string;
  senderProfileImageUrl: string;
  message: string;
  codeReference: CodeReference | null;
  isMine: boolean;
  sentAt: string;
}
export interface SearchedChatMessage {
  keyword: string;
  totalElements: number;
  messages: SearchedChatMessageElement[];
}

export type ChatReceivedMessageType = ChatReceivedMessage;
export type ChatSendMessageType = ChatSendMessage;
export type ChatMessageInfoType = ChatMessageInfo;
export type SendCodeReferenceType = SendCodeReference;

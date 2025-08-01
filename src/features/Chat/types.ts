export interface ChatMessage {
  user_id: string;
  username: string;
  profile_image_url: string;
  content: string;
  type: 'message';
  created_at: string; // ISO 8601 형식
  unreadNumber: number; // 추후 직접 계산하는 것으로 바뀔 예정!
}

export type ChatItem = ChatMessage;

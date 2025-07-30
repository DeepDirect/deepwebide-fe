export type MemberItem = {
  userId: number;
  nickname: string;
  profileImageUrl: string;
  role: 'OWNER' | 'MEMBER';
};

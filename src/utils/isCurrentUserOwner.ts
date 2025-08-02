type Member = {
  userId: number;
  nickname: string;
  profileImageUrl: string;
  role: 'OWNER' | 'MEMBER';
};

export function isCurrentUserOwner(data: Member[]): boolean {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '');
    const currentUserId = user?.id;
    const owner = data.find(member => member.role === 'OWNER');
    return owner?.userId === currentUserId;
  } catch (error) {
    // 에러 처리 로직 필요
    console.error('isCurrentUserOwner 에러:', error);
    return false;
  }
}

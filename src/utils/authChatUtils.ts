// 로그인된 사용자 정보 가져오기
export const getCurrentUser = () => {
  try {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('사용자 정보 파싱 오류:', error);
    return null;
  }
};

// 사용자 ID 가져오기
export const getCurrentUserId = (): string => {
  const user = getCurrentUser();
  return user?.id?.toString();
};

// 사용자 이름 가져오기
export const getCurrentNickname = (): string => {
  const user = getCurrentUser();
  return user?.nickname;
};

// 사용자 프로필 이미지 URL 가져오기
export const getCurrentUserProfileImage = (): string => {
  const user = getCurrentUser();
  return user?.profileImageUrl;
};

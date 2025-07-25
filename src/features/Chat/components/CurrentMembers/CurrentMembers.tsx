import './CurrentMember.scss';

const CurrentMembers: React.FC = () => {
  const members = [
    {
      user_id: '1',
      username: '더운 개발자',
      profile_image_url: 'https://example.com/profile/1.png',
    },
    {
      user_id: '2',
      username: '슬기로운 개발자',
      profile_image_url: 'https://example.com/profile/2.png',
    },
    {
      user_id: '3',
      username: '쓰러진 개발자',
      profile_image_url: 'https://example.com/profile/3.png',
    },
    {
      user_id: '4',
      username: '숨어있는 개발자',
      profile_image_url: 'https://example.com/profile/4.png',
    },
  ];

  // TODO - 호버시 온라인 멤버 리스트도 드롭다운으로 보여주는 기능으로 확장하고 싶습니다...!

  return (
    <div>
      <div className="current-members">
        <div className="current-members__wrapper">
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M15 2H9v2H7v6h2V4h6V2zm0 8H9v2h6v-2zm0-6h2v6h-2V4zM4 16h2v-2h12v2H6v4h12v-4h2v6H4v-6z"
              fill="currentColor"
            />
          </svg>
          {/* TODO - 웹소켓으로 현재 온라인 멤버 수 계산하는 로직 필요 */}
          <div className="current-members__count">{String(members.length).padStart(2, '0')}</div>
        </div>
      </div>
      <hr className="horizontal-line" />
    </div>
  );
};

export default CurrentMembers;

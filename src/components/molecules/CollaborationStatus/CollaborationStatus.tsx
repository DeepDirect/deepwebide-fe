import React from 'react';
import styles from './CollaborationStatus.module.scss';

interface CollaborationStatusProps {
  userCount: number;
  className?: string;
}

const CollaborationStatus: React.FC<CollaborationStatusProps> = ({ userCount, className }) => {
  return (
    <div className={`${styles.collaborationStatus} ${className || ''}`}>
      <span>이 파일에 위치하고 있는 사람 : ({userCount}명)</span>
    </div>
  );
};

export default CollaborationStatus;

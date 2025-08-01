import React from 'react';
import styles from './MonacoCollaborativeEditor.module.scss';

interface EditorPlaceholderProps {
  enableCollaboration: boolean;
  isConnected: boolean;
  isLoading: boolean;
}

const EditorPlaceholder: React.FC<EditorPlaceholderProps> = ({
  enableCollaboration,
  isConnected,
  isLoading,
}) => {
  const getCollaborationStatus = (): string => {
    if (!enableCollaboration) return '';
    if (isLoading) return '연결 중...';
    if (isConnected) return '연결됨';
    return '연결 끊김';
  };

  return (
    <div className={styles.editorPlaceholder}>
      <div className={styles.placeholderContent}>
        <div className={styles.placeholderIcon}>📄</div>
        <h3>파일을 선택해주세요</h3>
        <p>파일을 선택하면 에디터가 시작됩니다.</p>
        {enableCollaboration && (
          <p className={styles.collaborationNote}>🤝 협업 모드 {getCollaborationStatus()}</p>
        )}
      </div>
    </div>
  );
};

export default EditorPlaceholder;

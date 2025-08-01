import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import './CodeRunner.scss';

export interface CodeRunnerProps {
  repoId?: string;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CodeRunner(_props: CodeRunnerProps) {
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([
    {
      command: '',
      output: 'Hello Typescript!',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 다크 모드 초기화
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const executeCommand = (command: string) => {
    const newHistory: CommandHistory = {
      command,
      output: `${command}`,
      timestamp: new Date(),
    };

    setCommandHistory(prev => [...prev, newHistory]);
    setCurrentCommand('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      executeCommand(currentCommand.trim());
    }
  };

  // 새로운 내용이 추가될 때마다 스크롤을 맨 아래로 이동
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [commandHistory]);

  return (
    <div className="code-runner">
      {/* 제어 섹션 */}
      <div className="code-runner__controls">
        {/* 실행 버튼 */}
        <button
          className="code-runner__control-button"
          aria-label="실행"
          onClick={() => {
            if (currentCommand.trim()) {
              executeCommand(currentCommand.trim());
            }
          }}
        >
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor" />
          </svg>
        </button>
        {/* 정지 버튼 */}
        <button className="code-runner__control-button" aria-label="정지">
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* 터미널 콘텐츠 */}
      <div className="code-runner__content" ref={contentRef}>
        <div className="code-runner__output-section">
          {commandHistory.map((item, index) => (
            <div key={index}>
              {item.command && (
                <div className="code-runner__output-line">
                  <span className="code-runner__prompt">
                    <span className="code-runner__project-path">my/project-name</span>
                  </span>
                  <span className="code-runner__command">{item.command}</span>
                </div>
              )}
              {item.output && (
                <div className="code-runner__output-line">
                  <span className="code-runner__output">{item.output}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="code-runner__input-section">
          <div className="code-runner__input-line">
            <span className="code-runner__prompt">
              <span className="code-runner__project-path">my/project-name</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              className="code-runner__command-input"
              value={currentCommand}
              onChange={e => setCurrentCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="명령어를 입력하세요"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeRunner;

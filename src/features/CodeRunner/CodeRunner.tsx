import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useCodeRunnerExecute } from '@/features/Repo/codeRunner/hooks/useCodeRunnerExecute';
import { useCodeRunnerStop } from '@/features/Repo/codeRunner/hooks/useCodeRunnerStop';
import { useCodeRunnerLogs } from '@/features/Repo/codeRunner/hooks/useCodeRunnerLogs';
import { useYjsCodeRunner } from '@/hooks/repo/useYjsCodeRunner';
import type { CodeRunnerProps, CommandHistory } from './types';
import './CodeRunner.scss';

export function CodeRunner(props: CodeRunnerProps) {
  const [localCommandHistory, setLocalCommandHistory] = useState<CommandHistory[]>([
    {
      command: '',
      output: 'Hello DeepWebIDE!',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isStreamingLogs, setIsStreamingLogs] = useState(false);
  const [streamedLogLines, setStreamedLogLines] = useState<string[]>([]);

  const { initializeTheme } = useThemeStore();
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  const codeRunnerExecute = useCodeRunnerExecute(props.repoId);
  const codeRunnerStop = useCodeRunnerStop(props.repoId);
  const { data: logsData, refetch: refetchLogs } = useCodeRunnerLogs(props.repoId);

  const roomId = props.repoId ? `repo-${props.repoId}` : '';

  console.log(`[CodeRunner] 렌더링:`, {
    repoId: props.repoId,
    roomId,
    enableCollaboration: props.enableCollaboration,
    userId: props.userId,
    userName: props.userName,
  });

  const {
    isConnected,
    error: collaborationError,
    commandHistory: collaborativeHistory,
    broadcastCommand,
  } = useYjsCodeRunner({
    roomId,
    userId: props.userId || `user-${Date.now()}`,
    userName: props.userName || 'Anonymous',
    enabled: Boolean(props.enableCollaboration && props.repoId),
  });

  const commandHistory = props.enableCollaboration ? collaborativeHistory : localCommandHistory;

  console.log(`[CodeRunner] 상태:`, {
    enableCollaboration: props.enableCollaboration,
    isConnected,
    collaborationError,
    localHistoryLength: localCommandHistory.length,
    collaborativeHistoryLength: collaborativeHistory.length,
    currentHistoryLength: commandHistory.length,
  });

  const executeCommand = (command: string) => {
    if (!command) return;

    console.log(`[CodeRunner] 명령어 실행: ${command}`);

    if (command === 'logs') {
      setStreamedLogLines([]);

      if (props.enableCollaboration && isConnected) {
        console.log(`[CodeRunner] 협업 모드 logs 브로드캐스트`);
        broadcastCommand(command, '로그 불러오는 중...', new Date());
      } else {
        console.log(`[CodeRunner] 로컬 모드 logs 실행`);
        setLocalCommandHistory(prev => [
          ...prev,
          { command, output: '로그 불러오는 중...', timestamp: new Date() },
        ]);
      }

      setCurrentCommand('');
      refetchLogs();
      setIsStreamingLogs(true);
      return;
    }

    if (props.enableCollaboration && isConnected) {
      console.log(`[CodeRunner] 협업 모드 명령어 브로드캐스트: ${command}`);
      broadcastCommand(command, '실행 중...', new Date());
    } else {
      console.log(`[CodeRunner] 로컬 모드 명령어 실행: ${command}`);
      setLocalCommandHistory(prev => [
        ...prev,
        { command, output: '실행 중...', timestamp: new Date() },
      ]);
    }

    setCurrentCommand('');

    codeRunnerExecute.mutate(undefined, {
      onSuccess: resp => {
        console.log(`[CodeRunner] 실행 성공:`, resp);

        let output: string | ReactNode =
          resp.status === 'SUCCESS' ? resp.output || resp.message : resp.error || resp.message;

        if (resp.port) {
          const url = `http://3.39.22.178:${resp.port}`;
          output = (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="code-runner__open-url-link"
            >
              {url}
            </a>
          );
        }

        if (props.enableCollaboration && isConnected) {
          const outputText =
            typeof output === 'string'
              ? output
              : resp.port
                ? `http://3.39.22.178:${resp.port}`
                : 'Link generated';
          console.log(`[CodeRunner] 협업 모드 결과 브로드캐스트: ${outputText}`);
          broadcastCommand(command, outputText, new Date());
        } else {
          console.log(`[CodeRunner] 로컬 모드 결과 저장`);
          setLocalCommandHistory(prev => [
            ...prev.slice(0, -1),
            {
              command,
              output,
              timestamp: new Date(),
            },
          ]);
        }

        if (command === 'run' || command === '') {
          setTimeout(() => {
            executeCommand('logs');
          }, 1000);
        }
      },
      onError: (e: unknown) => {
        console.error(`[CodeRunner] 실행 실패:`, e);

        let errorMessage = '실패';
        if (typeof e === 'object' && e !== null) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          errorMessage = err.response?.data?.message || err.message || '실패';
        }

        if (props.enableCollaboration && isConnected) {
          console.log(`[CodeRunner] 협업 모드 오류 브로드캐스트: ${errorMessage}`);
          broadcastCommand(command, errorMessage, new Date());
        } else {
          console.log(`[CodeRunner] 로컬 모드 오류 저장`);
          setLocalCommandHistory(prev => [
            ...prev.slice(0, -1),
            {
              command,
              output: errorMessage,
              timestamp: new Date(),
            },
          ]);
        }
      },
    });
  };

  useEffect(() => {
    if (!isStreamingLogs || !logsData?.logs) return;

    console.log(`[CodeRunner] 로그 스트리밍 시작, 라인 수: ${logsData.logs.split('\n').length}`);

    const lines = logsData.logs.split('\n');
    let idx = 0;

    if (!props.enableCollaboration || !isConnected) {
      setLocalCommandHistory(prev => prev.slice(0, -1));
    }
    setStreamedLogLines([]);

    const interval = setInterval(() => {
      setStreamedLogLines(prev => {
        const line = idx < lines.length && typeof lines[idx] === 'string' ? lines[idx] : '';
        return [...prev, line];
      });
      idx++;
      if (idx >= lines.length) {
        clearInterval(interval);
        setIsStreamingLogs(false);
        console.log(`[CodeRunner] 로그 스트리밍 완료`);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [isStreamingLogs, logsData, props.enableCollaboration, isConnected]);

  useEffect(() => {
    if (streamedLogLines.length === 0) return;

    const logsOutput = (
      <div className="code-runner__logs-block">
        {streamedLogLines.map((line, idx) => (
          <div key={idx} className="code-runner__logs-line">
            {typeof line === 'string' ? line.trimStart() : ''}
          </div>
        ))}
      </div>
    );

    if (props.enableCollaboration && isConnected) {
      console.log(`[CodeRunner] 협업 모드 로그 출력 브로드캐스트`);
      broadcastCommand('logs', `Logs displayed (${streamedLogLines.length} lines)`, new Date());
    } else {
      console.log(`[CodeRunner] 로컬 모드 로그 출력 저장`);
      setLocalCommandHistory(prev => [
        ...prev.filter(item => item.command !== 'logs'),
        {
          command: 'logs',
          output: logsOutput,
          timestamp: new Date(),
        },
      ]);
    }
  }, [streamedLogLines, props.enableCollaboration, isConnected, broadcastCommand]);

  // 🔧 수정: stop 이중 처리 문제 해결
  const handleStop = () => {
    console.log(`[CodeRunner] 중지 명령어 실행`);

    // 🔧 즉시 브로드캐스트하지 않고 API 호출만
    codeRunnerStop.mutate(undefined, {
      onSuccess: resp => {
        console.log(`[CodeRunner] 중지 성공:`, resp);

        // 🔧 성공 시에만 브로드캐스트/저장
        if (props.enableCollaboration && isConnected) {
          broadcastCommand('stop', resp.message, new Date());
        } else {
          setLocalCommandHistory(prev => [
            ...prev,
            {
              command: 'stop',
              output: resp.message,
              timestamp: new Date(),
            },
          ]);
        }
      },
      onError: e => {
        console.error(`[CodeRunner] 중지 실패:`, e);

        let errorMessage = '중지 실패';
        if (typeof e === 'object' && e !== null) {
          const err = e as { response?: { data?: { message?: string } }; message?: string };
          errorMessage = err.response?.data?.message || err.message || '중지 실패';
        }

        // 🔧 실패 시에만 브로드캐스트/저장
        if (props.enableCollaboration && isConnected) {
          broadcastCommand('stop', errorMessage, new Date());
        } else {
          setLocalCommandHistory(prev => [
            ...prev,
            {
              command: 'stop',
              output: errorMessage,
              timestamp: new Date(),
            },
          ]);
        }
      },
    });
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand.trim());
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const getConnectionStatusText = () => {
    if (!props.enableCollaboration) return null;
    if (collaborationError) return '연결 오류';
    if (isConnected) return '연결됨';
    return '연결 중...';
  };

  return (
    <div className="code-runner">
      <div className="code-runner__controls">
        <button
          className="code-runner__control-button"
          aria-label="실행"
          onClick={() => {
            executeCommand(currentCommand.trim() || 'run');
          }}
        >
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor" />
          </svg>
        </button>
        <button className="code-runner__control-button" aria-label="정지" onClick={handleStop}>
          <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor" />
          </svg>
        </button>
        {props.enableCollaboration && (
          <div
            className={`code-runner__collaboration-status ${
              collaborationError ? 'error' : isConnected ? 'connected' : 'disconnected'
            }`}
          >
            {collaborationError ? '!' : isConnected ? '●' : '○'}
          </div>
        )}
      </div>

      {props.enableCollaboration && (
        <div className="code-runner__status">
          {getConnectionStatusText()}
          {/* 🔧 디버그 정보 추가 */}
          <div style={{ fontSize: '9px', color: '#999', marginTop: '2px' }}>
            User: {props.userId} ({props.userName})
          </div>
        </div>
      )}

      <div className="code-runner__content" ref={contentRef}>
        <div className="code-runner__output-section">
          {commandHistory.map((item, index) => (
            <div key={index}>
              {item.command && (
                <div className="code-runner__output-line">
                  <span className="code-runner__prompt">
                    <span className="code-runner__project-path">
                      my/{props.repositoryName ?? 'project-name'}
                    </span>
                  </span>
                  <span className="code-runner__command">{item.command}</span>
                </div>
              )}
              {item.output && (
                <div className="code-runner__output-line">
                  {typeof item.output === 'string' ? (
                    <span className="code-runner__output">{item.output}</span>
                  ) : (
                    item.output
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="code-runner__input-section">
          <div className="code-runner__input-line">
            <span className="code-runner__prompt">
              <span className="code-runner__project-path">
                my/{props.repositoryName ?? 'project-name'}
              </span>
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

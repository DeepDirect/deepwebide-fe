import type { ReactNode } from 'react';

export interface CommandHistory {
  command: string;
  output: string | ReactNode;
  timestamp: Date;
}

export interface CodeRunnerProps {
  repoId?: number | string;
  repositoryName?: string;
  enableCollaboration?: boolean;
  userId?: string;
  userName?: string;
}

export interface CodeRunnerState {
  commandHistory: CommandHistory[];
  currentCommand: string;
  isMinimized: boolean;
}

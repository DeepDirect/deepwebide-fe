export interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
}

export interface CodeRunnerProps {
  repoId?: string;
  onCommandExecute?: (command: string) => Promise<string> | string;
  onClose?: () => void;
  initialHistory?: CommandHistory[];
}

export interface CodeRunnerState {
  commandHistory: CommandHistory[];
  currentCommand: string;
  isMinimized: boolean;
}

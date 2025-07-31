export interface HistoryItem {
  historyId: number;
  message: string;
  createdAt: string;
  createdBy: {
    userId: number;
    nickname: string;
  };
}

export interface SaveHistoryRequest {
  message: string;
}

export interface SaveHistoryResponse {
  status: number;
  message: string;
  data: {
    historyId: number;
  };
}

export interface RestoreHistoryResponse {
  status: number;
  message: string;
  data: {
    historyId: number;
    restoredAt: string;
  };
}

export interface HistoriesResponse {
  status: number;
  message: string;
  data: HistoryItem[];
}

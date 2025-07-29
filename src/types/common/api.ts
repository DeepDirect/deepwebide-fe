export type ApiMeta = {
  message: string;
  status: number;
};

export type ApiResponse<T> = ApiMeta & {
  data: T;
};

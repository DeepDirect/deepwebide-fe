import api from './api';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';

export type ApiResponse<Res> = Promise<AxiosResponse<Res>>;

export const apiClient = {
  get: <Res, Params = Record<string, unknown>>(url: string, params?: Params): ApiResponse<Res> =>
    api.get(url, { params }),

  post: <Req, Res>(url: string, data?: Req, config?: AxiosRequestConfig): ApiResponse<Res> =>
    api.post(url, data, config),

  put: <Req, Res>(url: string, data?: Req): ApiResponse<Res> => api.put(url, data),

  patch: <Req, Res>(url: string, data?: Req): ApiResponse<Res> => api.patch(url, data),

  delete: <Req, Res>(url: string, data?: Req): ApiResponse<Res> => api.delete(url, { data }),
};

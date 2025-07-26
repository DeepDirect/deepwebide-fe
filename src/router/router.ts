import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree';
import type { AuthState } from '@/types/authState.types';

/*
이전 코드
export const router = createRouter({
  routeTree,
  context: {
    auth: undefined as unknown as AuthState,
  },
});
*/

export const createAppRouter = (auth: AuthState) =>
  createRouter({
    routeTree,
    context: { auth },
  });

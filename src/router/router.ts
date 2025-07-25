import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree';
import type { AuthState } from '@/types/authState.types';

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined as unknown as AuthState,
  },
});

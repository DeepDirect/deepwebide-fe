import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree';
import { useAuthStore } from '@/stores/authStore';

const auth = useAuthStore.getState();
export const router = createRouter({
  routeTree,
  context: {
    auth,
  },
});

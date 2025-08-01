import { RouterProvider } from '@tanstack/react-router';
import { createAppRouter } from './router/router';
import { useAuthStore } from '@/stores/authStore';

const App = () => {
  const auth = useAuthStore();
  const router = createAppRouter(auth);

  return <RouterProvider router={router} />;
};

export default App;

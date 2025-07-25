import { RouterProvider } from '@tanstack/react-router';
import { router } from './router/router';
import { useAuthStore } from './stores/authStore';

function App() {
  const auth = useAuthStore();

  return <RouterProvider router={router} context={{ auth }} />;
}

export default App;

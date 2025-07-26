export interface AuthState {
  isLoggedIn: boolean;
  signin: () => void;
  signout: () => void;
}

import type { SignInRequest, SignInResponse, SignInUser } from '@/api/auth.api';

export interface AuthState {
  isLoggedIn: boolean;
  signin: (data: SignInRequest) => Promise<SignInResponse>;
  signout: () => Promise<void>;
  setAuthSocialLogin: (data: SignInUser) => void;
}

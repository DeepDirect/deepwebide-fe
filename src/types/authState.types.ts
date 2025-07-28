import type { SignInRequest, SignInResponse } from '@/api/auth.api';

export interface AuthState {
  isLoggedIn: boolean;
  signin: (data: SignInRequest) => Promise<SignInResponse>;
  signout: () => Promise<void>;
}

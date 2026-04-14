
import { createContext } from 'react';
import { User } from '../types';

export interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string, expiresIn?: string) => Promise<{ success: boolean, twoFactorRequired?: boolean, email?: string }>;
  verify2FA: (email: string, code: string) => Promise<boolean>;
  setup2FA: () => Promise<{ secret: string, qrCode: string }>;
  confirm2FA: (code: string, secret: string) => Promise<boolean>;
  toggle2FA: (enabled: boolean) => Promise<boolean>;
  register: (name: string, email: string, pass: string) => Promise<boolean>;
  loginWithPhone: (phone: string) => Promise<boolean>;
  loginWithSocial: (provider: 'google' | 'facebook' | 'github') => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
  resetToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

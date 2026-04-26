
import React, { ReactNode } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { User } from '../types';
import { api } from '../services/api';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);

  const adminEmail = (process.env.VITE_ADMIN_EMAIL || 'Nhatlinhckm2016@gmail.com').toLowerCase();

  const assignRole = React.useCallback((userData: any): User => {
    if (!userData) return userData;
    const userEmail = (userData.email || '').toLowerCase();
    const isAdmin = userEmail === adminEmail;
    
    console.log('Assigning role for:', userEmail, 'Admin email:', adminEmail, 'Is Admin:', isAdmin);
    
    return {
      ...userData,
      role: isAdmin ? 'ADMIN' : (userData.role || 'USER')
    };
  }, [adminEmail]);

  // Load user from backend on mount
  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      try {
        const data = await api.auth.me();
        if (data.user) {
          setUser(assignRole(data.user));
        }
      } catch (error) {
        console.log('No active session or invalid token:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    };
    checkAuth();
  }, [assignRole]);

  const login = async (email: string, pass: string, expiresIn: string = '24h'): Promise<{ success: boolean, twoFactorRequired?: boolean, email?: string }> => {
    try {
      const data = await api.auth.login(email, pass, expiresIn);
      if (data.twoFactorRequired) {
        return { success: false, twoFactorRequired: true, email: data.email };
      }
      if (data.user && data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(assignRole(data.user));
        return { success: true };
      }
      return { success: false };
    } catch {
      console.error('Login error');
      return { success: false };
    }
  };

  const verify2FA = async (email: string, code: string): Promise<boolean> => {
    try {
      const data = await api.auth.login2FA(email, code);
      if (data.user && data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(assignRole(data.user));
        return true;
      }
      return false;
    } catch {
      console.error('2FA verification error');
      return false;
    }
  };

  const setup2FA = async (): Promise<{ secret: string, qrCode: string }> => {
    try {
      return await api.auth.setup2FA();
    } catch (error) {
      console.error('2FA setup error:', error);
      throw error;
    }
  };

  const confirm2FA = async (code: string, secret: string): Promise<boolean> => {
    try {
      const data = await api.auth.verify2FA(code, secret);
      if (data.success && user) {
        setUser({ ...user, twoFactorEnabled: true });
      }
      return data.success;
    } catch (error) {
      console.error('2FA confirmation error:', error);
      return false;
    }
  };

  const toggle2FA = async (enabled: boolean): Promise<boolean> => {
    try {
      const data = await api.auth.toggle2FA(enabled);
      if (user) {
        setUser({ ...user, twoFactorEnabled: data.enabled });
      }
      return true;
    } catch (error) {
      console.error('2FA toggle error:', error);
      return false;
    }
  };

  const loginWithPhone = async (phone: string): Promise<boolean> => {
    // For now, simulate phone login as a normal login or a special register
    return register(`User ${phone.slice(-4)}`, `${phone}@phone.com`, '123456');
  };

  const loginWithSocial = async (provider: 'google' | 'facebook' | 'github'): Promise<boolean> => {
    try {
      if (provider === 'google' && auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        const data = await api.auth.loginWithFirebase(idToken);
        if (data.user) {
          setUser(assignRole(data.user));
          return true;
        }
      } else if (provider === 'google' && !auth) {
        alert('Google Login is not configured. Please set up Firebase API keys in settings.');
        return false;
      }
      // Fallback for other providers if not configured
      return register(`${provider} User`, `${provider}@social.com`, '123456');
    } catch (error) {
      console.error('Social login error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<boolean> => {
    try {
      const data = await api.auth.register(name, email, pass);
      if (data.user && data.token) {
        localStorage.setItem('auth_token', data.token);
        setUser(assignRole(data.user));
        return true;
      }
      return false;
    } catch {
      console.error('Register error');
      return false;
    }
  };

  const resetToken = async () => {
    if (!user) return;
    try {
      await api.auth.resetToken(user.id);
      await logout();
    } catch (error) {
      console.error('Reset token error:', error);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
      if (auth) {
        await auth.signOut();
      }
      localStorage.removeItem('auth_token');
      setUser(null);
    } catch {
      console.error('Logout error');
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (user) {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        // In a real app, you'd call api.auth.updateProfile(updatedData)
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, verify2FA, setup2FA, confirm2FA, toggle2FA, register, loginWithPhone, loginWithSocial, logout, updateProfile, resetToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth moved to useAuth.ts

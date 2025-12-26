import client from './client';

import type { SignupData, LoginData } from '../types/auth.api';
import type { ApiResponse, User } from '../types';


export const authApi = {
  signup: async (data: SignupData) => {
    return client.post<ApiResponse<User>>('/auth/signup', data);
  },
  login: async (data: LoginData) => {
    return client.post<ApiResponse<LoginData>>('/auth/login', data);
  },
  logout: async () => {
    return client.get<ApiResponse<null>>('/auth/logout');
  },
  getMyProfile: async () => {
    return client.get<ApiResponse<User>>(`/auth/user/me`);
  },
  
  verifyEmail: async (token: string) => {
    return client.get(`/auth/verify-email?token=${token}`);
  },
};

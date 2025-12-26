import client from './client';

import type { SignupFormData, LoginFormData } from '../types/auth.api';
import type { ApiResponse, User } from '../types';


export const authApi = {
  signup: async (data: SignupFormData) => {
    return client.post<ApiResponse<User>>('/auth/signup', data);
  },
  login: async (data: LoginFormData) => {
    return client.post<ApiResponse<LoginFormData>>('/auth/login', data);
  },
  logout: async () => {
    return client.get<ApiResponse<null>>('/auth/logout');
  },
  getMyProfile: async () => {
    return client.get<ApiResponse<User>>(`/auth/user/me`);
  },
  
  // verifyEmail: async (token: string) => {
  //   return client.get(`/auth/verify-email?token=${token}`);
  // },
};

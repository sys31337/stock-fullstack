import axiosInstance from '@shared/services/api';
import { Payload } from '@shared/types/payload';
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => useMutation((payload: Payload) => axiosInstance.request({
  method: 'POST',
  url: 'users/login',
  data: payload,
}));

export const useSetNewPassword = () => useMutation((data: { code: string, uid: string, password: string }) => axiosInstance.request({
  method: 'PATCH',
  url: 'users/reset-password',
  data,
}));

export const useLogout = () => useMutation((token) => axiosInstance.request({
  method: 'POST',
  url: 'users/logout',
  headers: {
    Authorization: `Bearer ${token}`,
  },
}));

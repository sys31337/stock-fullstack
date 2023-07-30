import axiosInstance from '@shared/services/api';
import authService from '@shared/services/auth';
import Any from '@shared/types/any';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useAuthenticated(): boolean {
  return authService.isAuthenticated();
}

export const useLogout = () => useMutation((token) => axiosInstance.request({
  method: 'POST',
  url: 'users/logout',
  headers: {
    Authorization: `Bearer ${token}`,
  },
}));

export const useGetUserInfo = () => useQuery(['Get user Info'], () => axiosInstance
  .request<Any>({
    method: 'GET',
    url: 'users/current',
  })
  .then(({ data }) => data), { retry: false });

export function logoutUser() {
  return axiosInstance.get('/logout').then(() => {
    authService.resetUserInfo();
    // eslint-disable-next-line no-restricted-globals
    location.replace('/connexion');
  });
}
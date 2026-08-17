import axiosInstance from '@web/shared/services/api';
import authService from '@web/shared/services/auth';
import parseJwt from '@web/shared/utils/parseJWT';
import Any from '@web/shared/types/any';
import { useMutation, useQuery } from '@tanstack/react-query';

export function useAuthenticated(): boolean {
  const userInfo = authService.loadUserInfo();
  if (!userInfo?.user_id) return false;

  const token = userInfo.token || userInfo.accessToken;
  if (token) {
    try {
      const decoded = parseJwt(token);
      const now = Math.ceil(Date.now() / 1000);
      if (decoded.exp < now) {
        authService.resetUserInfo();
        return false;
      }
    } catch {
      authService.resetUserInfo();
      return false;
    }
  }

  return true;
}

export function useIsPOSUser(): boolean {
  const userInfo = authService.loadUserInfo();
  if (!userInfo?.user_id) return false;

  const token = userInfo.token || userInfo.accessToken;
  if (token) {
    try {
      const decoded = parseJwt(token);
      return decoded.type === 'POS';
    } catch {
      return false;
    }
  }

  return userInfo.type === 'POS';
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
  authService.resetUserInfo();
  window.location.hash = '#/connexion';
  return axiosInstance.get('/logout').catch(() => {});
}
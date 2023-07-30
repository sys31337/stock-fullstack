import { GoogleAuthInfo } from '@shared/models/LoggedUserInfo';
import authService from '@shared/services/auth';
import { refreshGoogleTokens } from '@shared/utils/refreshToken';
import axios, { InternalAxiosRequestConfig } from 'axios';

const addGoogleAccessToken = (request: InternalAxiosRequestConfig) => {
  const { googleAccessToken } = authService.loadGoogleInfo() as GoogleAuthInfo;
  if (googleAccessToken) {
    request.headers.set('Authorization', `Bearer ${googleAccessToken}`);
  }
};

const headers = {
  'Content-Type': 'application/json',
};

export const axiosGoogleInstance = axios.create({
  headers,
});

export const empty = '';

axiosGoogleInstance.interceptors.request.use(
  async (config) => {
    const { googleTokenExpiresAt } = authService.loadGoogleInfo() as GoogleAuthInfo;
    const currentTime = Math.ceil(Date.now());
    const isExpired = googleTokenExpiresAt && currentTime >= googleTokenExpiresAt;
    if (isExpired) {
      refreshGoogleTokens();
    }

    addGoogleAccessToken(config);

    return config;
  },
  async (error) => Promise.reject(error),
);

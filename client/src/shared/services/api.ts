/* eslint-disable camelcase */
import { config as cfg } from '@config';
import i18n from 'i18next';
import axios from 'axios';
import authService from '@shared/services/auth';
import parseJwt from '@shared/utils/parseJWT';
import Any from '@shared/types/any';
import { logoutUser } from '@shared/hooks/useAuthentication';

const noTokenUrls = ['challenge-progress', 'users/login', 'embeds/fetch', 'challenges/fetch'];

const addLocalizationHeaders = (request: Any) => {
  request.headers?.set('Accept-Language', i18n.language);
};

const addAuthHeaders = (request: Any) => {
  request.headers?.delete('x-public');
};

const axiosInstance = axios.create({
  baseURL: `${cfg.baseAppUrl}/api/v1/`,
});

const refreshAccessToken = async (refreshToken) => {
  const response = await axios.request({
    method: 'POST',
    url: `${cfg.baseAppUrl}/api/v1/users/token`,
    data: {
      refreshToken,
    },
  });

  const {
    data: { accessToken: token, refreshToken: newRefreshToken, googleToken },
  } = response;
  const { userId, fullname } = parseJwt(token);

  const userData = {
    userId,
    fullname,
    token,
    refreshToken: newRefreshToken,
    googleToken,
  };

  authService.saveUserInfo(userData);
  return response;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    if (noTokenUrls.some((substring) => (config.url as string).includes(substring))) return config;
    const { refreshToken, token: accessToken }: Any = authService.loadUserInfo() || { googleAccessToken: null, googleTokenExpiresAt: Date.now() - 3600 };
    if (refreshToken && accessToken) {
      const expiresAt = parseJwt(accessToken).exp;
      const currentTime = Math.ceil(Date.now() / 1000);
      const notExpired = currentTime < expiresAt;
      if (notExpired) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
        try {
          const response = await refreshAccessToken(refreshToken);
          const { data } = response;
          const { accessToken: at } = data;
          config.headers.Authorization = `Bearer ${at}`;
        } catch (error) {
          authService.resetUserInfo();
          // eslint-disable-next-line no-restricted-globals
          location.replace('/connexion');
        }
      }
    }
    addAuthHeaders(config);
    addLocalizationHeaders(config);
    return config;
  },
  async (error) => {
    const isUnauthorized = error.status === 401 || error.status === 403;
    if (isUnauthorized) {
      await logoutUser();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

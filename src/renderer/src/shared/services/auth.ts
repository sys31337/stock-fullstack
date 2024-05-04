import cacheService from '@web/shared/services/cache';
import Any from '@web/shared/types/any';

type LoggedUserInfo = Any;

class AuthService {
  userInfo?: Any;

  eslintSatisfy?: string;

  constructor() {
    this.userInfo = this.loadUserInfo();
  }

  /* User Backend Related */
  isAuthenticated(): boolean {
    return !!this.userInfo?.user_id && this.userInfo.user_id !== 'Guest';
  }

  saveUserInfo(userInfo: LoggedUserInfo) {
    this.userInfo = userInfo;
    cacheService.set('USER_INFO_KEY', userInfo);
    return userInfo;
  }

  loadUserInfo(): LoggedUserInfo | undefined {
    this.eslintSatisfy = '';
    return cacheService.get<LoggedUserInfo>('USER_INFO_KEY');
  }

  currentUserId() {
    return this.userInfo?.user_id;
  }
  /* Logout */
  resetUserInfo() {
    cacheService.remove('USER_INFO_KEY');
    this.userInfo = undefined;
  }
}

const authService = new AuthService();

export default authService;

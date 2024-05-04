interface Cookie {
  name: string;
  body: string;
}

class CookiesService {
  fallBack = '';

  parseCookie(cookie: string): Cookie {
    cookie = cookie.trim() || this.fallBack;
    const { 0: name, 1: body } = cookie.split('=');
    return { name, body };
  }

  getAllCookies(): Cookie[] {
    return document.cookie.split(';').map(this.parseCookie);
  }

  getCookie(cookieName: string): string {
    return this.getAllCookies().find(({ name }) => name === cookieName)?.body || '';
  }
}

export const cookiesService = new CookiesService();

export const empty = '';

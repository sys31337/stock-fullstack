class CacheService {
  fallBack = null;

  get<T>(key: string): T | undefined {
    const value = localStorage.getItem(key) || this.fallBack;
    return (value != null && value !== 'undefined' ? JSON.parse(value as string) : undefined);
  }

  set(key: string, value: unknown): void {
    this.fallBack = null;
    return localStorage.setItem(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.fallBack = null;
    return localStorage.removeItem(key);
  }

  clear(): void {
    this.fallBack = null;
    return localStorage.clear();
  }
}

const cacheService = new CacheService();

export default cacheService;

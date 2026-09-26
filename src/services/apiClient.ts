const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const CACHE_TTL = {
  SHORT: 3 * 60 * 1000,
  MEDIUM: 15 * 60 * 1000,
  LONG: 60 * 60 * 1000,
  PERMANENT: 24 * 60 * 60 * 1000,
};

interface CacheRecord<T> { data: T; timestamp: number; ttl: number }

class ApiClient {
  private memoryCache = new Map<string, CacheRecord<unknown>>();

  async get<T>(endpoint: string, ttl = CACHE_TTL.MEDIUM, bypassCache = false): Promise<T> {
    const cacheKey = `aegis_api_${endpoint}`;
    if (!bypassCache) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) return cached.data as T;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(body || `API request failed (${response.status})`);
      }
      const data = (await response.json()) as T;
      this.memoryCache.set(cacheKey, { data, timestamp: Date.now(), ttl });
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error('Request timed out.');
      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }
}

export const apiClient = new ApiClient();

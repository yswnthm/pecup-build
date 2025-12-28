import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiSuccess, apiError, fetchApi } from '@/lib/api-utils';

// Mock NextResponse for server-side helpers
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

describe('api-utils', () => {
  describe('apiSuccess', () => {
    it('returns a successful response with data', async () => {
      const data = { foo: 'bar' };
      const res = apiSuccess(data);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it('allows custom status code', async () => {
      const res = apiSuccess({}, 201);
      expect(res.status).toBe(201);
    });
  });

  describe('apiError', () => {
    it('returns an error response with message', async () => {
      const res = apiError('Something went wrong', 400, 'ERR_CODE', { detail: 'more info' });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Something went wrong');
      expect(body.error.code).toBe('ERR_CODE');
      expect(body.error.details).toEqual({ detail: 'more info' });
    });

    it('defaults to status 500', () => {
      const res = apiError('Server error');
      expect(res.status).toBe(500);
    });
  });

  describe('fetchApi', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it('returns data on successful response', async () => {
      const mockData = { id: 1 };
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const result = await fetchApi('/api/test');
      expect(result).toEqual(mockData);
    });

    it('throws error on non-ok response', async () => {
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: { message: 'Not Found' } }),
      });

      await expect(fetchApi('/api/test')).rejects.toThrow('Not Found');
    });

    it('handles legacy responses without success field', async () => {
      const mockLegacyData = [{ id: 1 }];
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => mockLegacyData,
      });

      const result = await fetchApi('/api/test');
      expect(result).toEqual(mockLegacyData);
    });

    it('throws default error message if no error field in response', async () => {
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(fetchApi('/api/test')).rejects.toThrow('Request failed with status 500');
    });
  });
});

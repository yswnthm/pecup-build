import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSubjects, useResources, useDynamicData } from '@/hooks/use-academic-data'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('use-academic-data hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  describe('useSubjects', () => {
    it('fetches subjects successfully', async () => {
      const mockData = { subjects: [{ code: 'CS101', name: 'Intro', resource_type: 'theory' }] };
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      })

      const { result } = renderHook(() => useSubjects({ year: 3, branch: 'CSE', semester: 1 }), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockData)
    })

    it('handles API errors', async () => {
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: { message: 'Server Error' } }),
      })

      const { result } = renderHook(() => useSubjects({ year: 3, branch: 'CSE', semester: 1 }), { wrapper })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Server Error')
    })
  })

  describe('useResources', () => {
    it('fetches resources successfully', async () => {
      const mockResources = [{ id: '1', title: 'Note 1' }];
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: mockResources }),
      })

      const { result } = renderHook(() => useResources({ category: 'notes', subject: 'CS101' }), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockResources)
    })
  })

  describe('useDynamicData', () => {
    it('fetches dynamic data successfully', async () => {
      const mockDynamic = { recentUpdates: [], upcomingExams: [], usersCount: 100 };
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { dynamic: mockDynamic } }),
      })

      const { result } = renderHook(() => useDynamicData({ branch: 'CSE', year: 3 }), { wrapper })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockDynamic)
    })
  })
})

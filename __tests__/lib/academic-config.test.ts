import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AcademicConfigManager } from '@/lib/academic-config'

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }))
}))

describe('AcademicConfigManager', () => {
  let manager: AcademicConfigManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = AcademicConfigManager.getInstance()
    manager.clearCache()
  })

  describe('calculateAcademicYear', () => {
    it('returns 1 for no batch year', async () => {
      const year = await manager.calculateAcademicYear(undefined)
      expect(year).toBe(1)
    })

    it('returns mapped year for valid batch year (default)', async () => {
      const year = await manager.calculateAcademicYear(2023)
      expect(year).toBe(3)
    })

    it('returns 1 for future batch year', async () => {
      const futureYear = new Date().getFullYear() + 1
      const year = await manager.calculateAcademicYear(futureYear)
      expect(year).toBe(1)
    })
  })

  describe('isCommonSubject', () => {
    it('returns true for common subject and allowed branch', () => {
      expect(manager.isCommonSubject('CN', 3, 'CSE')).toBe(true)
      expect(manager.isCommonSubject('CN', 3, 'DS')).toBe(true)
    })

    it('returns false for common subject and disallowed branch', () => {
      expect(manager.isCommonSubject('CN', 3, 'ECE')).toBe(false)
    })

    it('returns false for non-common subject', () => {
      expect(manager.isCommonSubject('NON_EXISTENT', 1, 'CSE')).toBe(false)
    })
  })

  describe('getCommonSubjectBranches', () => {
    it('returns allowed branches for common subject', () => {
      const branches = manager.getCommonSubjectBranches('CN', 3)
      expect(branches).toContain('CSE')
      expect(branches).toContain('DS')
      expect(branches).not.toContain('ECE')
    })

    it('returns empty array for non-common subject', () => {
      expect(manager.getCommonSubjectBranches('ANY', 1)).toEqual([])
    })
  })
})

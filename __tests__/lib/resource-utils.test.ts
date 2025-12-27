import { describe, it, expect } from 'vitest'
import { getResourceTypeForCategory, getSubjectFilterDescription, buildSubjectsQuery } from '@/lib/resource-utils'

describe('resource-utils', () => {
  describe('getResourceTypeForCategory', () => {
    it('returns records for records category', () => {
      expect(getResourceTypeForCategory('records')).toBe('records')
      expect(getResourceTypeForCategory('RECORDS')).toBe('records')
    })

    it('returns resources for notes, assignments, and papers', () => {
      expect(getResourceTypeForCategory('notes')).toBe('resources')
      expect(getResourceTypeForCategory('assignments')).toBe('resources')
      expect(getResourceTypeForCategory('papers')).toBe('resources')
    })

    it('returns null for unknown categories', () => {
      expect(getResourceTypeForCategory('random')).toBeNull()
    })
  })

  describe('getSubjectFilterDescription', () => {
    it('returns correct description for records', () => {
      expect(getSubjectFilterDescription('records')).toContain('laboratory')
    })

    it('returns correct description for resources', () => {
      expect(getSubjectFilterDescription('notes')).toContain('theory')
    })
  })

  describe('buildSubjectsQuery', () => {
    it('builds query with all params and resource_type', () => {
      const searchParams = new URLSearchParams({
        year: '3',
        semester: '1',
        branch: 'CSE'
      })
      const result = buildSubjectsQuery(searchParams, 'notes')
      expect(result.get('year')).toBe('3')
      expect(result.get('semester')).toBe('1')
      expect(result.get('branch')).toBe('CSE')
      expect(result.get('resource_type')).toBe('resources')
    })
  })
})

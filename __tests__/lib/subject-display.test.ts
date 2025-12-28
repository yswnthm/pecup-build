import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSubjectDisplay, getSubjectDisplayByCode } from '@/lib/subject-display'

describe('subject-display', () => {
  describe('getSubjectDisplay', () => {
    it('returns code when preferAbbreviation is true', () => {
      const subject = { code: 'CS101', name: 'Intro to CS' }
      expect(getSubjectDisplay(subject, true)).toBe('CS101')
    })

    it('returns name when preferAbbreviation is false', () => {
      const subject = { code: 'CS101', name: 'Intro to CS' }
      expect(getSubjectDisplay(subject, false)).toBe('Intro to CS')
    })

    it('falls back to code if name is missing', () => {
      const subject = { code: 'CS101' }
      expect(getSubjectDisplay(subject, false)).toBe('CS101')
    })

    it('returns empty string if both missing', () => {
      expect(getSubjectDisplay({}, false)).toBe('')
    })
  })

  describe('getSubjectDisplayByCode', () => {
    const subjects = [
      { code: 'CS101', name: 'Intro to CS' },
      { code: 'MATH101', name: 'Calculus I' }
    ]

    it('finds subject by code and returns display', () => {
      expect(getSubjectDisplayByCode(subjects, 'cs101', true)).toBe('CS101')
      expect(getSubjectDisplayByCode(subjects, 'math101', false)).toBe('Calculus I')
    })

    it('returns normalized input if subject not found', () => {
      expect(getSubjectDisplayByCode(subjects, 'phy101', true)).toBe('PHY101')
      expect(getSubjectDisplayByCode(subjects, 'phy101', false)).toBe('phy101')
    })

    it('handles empty or null input', () => {
      expect(getSubjectDisplayByCode(subjects, '', true)).toBe('')
      expect(getSubjectDisplayByCode(undefined, 'cs101', true)).toBe('CS101')
    })
  })
})

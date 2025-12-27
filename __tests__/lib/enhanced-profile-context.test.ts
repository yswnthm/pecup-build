import { describe, it, expect } from 'vitest'
import { getPublicProfileFromPath } from '@/lib/enhanced-profile-context'

describe('getPublicProfileFromPath', () => {
  it('parses valid compact format /r23/cse/31', () => {
    const profile = getPublicProfileFromPath('/r23/cse/31')
    expect(profile).not.toBeNull()
    expect(profile?.branch).toBe('CSE')
    expect(profile?.year).toBe(3)
    expect(profile?.semester).toBe(1)
  })

  it('parses valid hyphenated format /r23/cse/3-1', () => {
    // This is expected to fail with current implementation
    const profile = getPublicProfileFromPath('/r23/cse/3-1')
    expect(profile).not.toBeNull()
    expect(profile?.branch).toBe('CSE')
    expect(profile?.year).toBe(3)
    expect(profile?.semester).toBe(1)
  })

  it('parses mixed case /R23/Cse/31', () => {
    const profile = getPublicProfileFromPath('/R23/Cse/31')
    expect(profile).not.toBeNull()
    expect(profile?.branch).toBe('CSE')
  })

  it('rejects invalid regulation prefix', () => {
    const profile = getPublicProfileFromPath('/a23/cse/31')
    expect(profile).toBeNull()
  })

  it('rejects invalid year', () => {
    const profile = getPublicProfileFromPath('/r23/cse/51')
    expect(profile).toBeNull()
  })

  it('rejects invalid semester', () => {
    const profile = getPublicProfileFromPath('/r23/cse/33')
    expect(profile).toBeNull()
  })

  it('rejects malformed yearSem', () => {
    const profile = getPublicProfileFromPath('/r23/cse/abc')
    expect(profile).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { generateBreadcrumbs } from '@/lib/navigation-utils'

describe('generateBreadcrumbs', () => {
  it('generates dashboard breadcrumb', () => {
    const items = generateBreadcrumbs('r23', 'cse', '31')
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Home')
    expect(items[0].isCurrentPage).toBe(true)
    expect(items[0].href).toBeUndefined()
  })

  it('generates category breadcrumb', () => {
    const items = generateBreadcrumbs('r23', 'cse', '31', 'notes')
    expect(items).toHaveLength(2)
    expect(items[0].label).toBe('Home')
    expect(items[0].href).toBe('/r23/cse/31')
    expect(items[1].label).toBe('Notes')
    expect(items[1].isCurrentPage).toBe(true)
  })

  it('generates subject breadcrumb', () => {
    const items = generateBreadcrumbs('r23', 'cse', '31', 'notes', 'res', 'Renewable Energy')
    expect(items).toHaveLength(3)
    expect(items[0].href).toBe('/r23/cse/31')
    expect(items[1].label).toBe('Notes')
    expect(items[1].href).toBe('/r23/cse/31/notes')
    expect(items[2].label).toBe('Renewable Energy')
    expect(items[2].isCurrentPage).toBe(true)
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mocks
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}))
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  createSupabaseAdmin: vi.fn(),
}))

// Mock academic config to avoid env + DB access
vi.mock('@/lib/academic-config', () => ({
  AcademicConfigManager: {
    getInstance: () => ({
      // Deterministic value for tests
      calculateAcademicYear: vi.fn(async (batchYear?: number) => 3),
    }),
  },
}))

type QueryResult<T> = { data: T; error: null } | { data: null; error: { message: string } }

function makeSimpleBuilder<T>(result: QueryResult<T>) {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    gte: () => builder,
    lte: () => builder,
    is: () => builder,
    in: () => builder,
    maybeSingle: () => result,
    then: (resolve: any) => resolve(result),
  }
  return builder
}

function makeSupabaseMock() {
  const supabase = {
    from: (table: string) => {
      switch (table) {
        case 'profiles': {
          const profile = {
            id: 'p1',
            roll_number: '123',
            name: 'Test User',
            email: 'test@example.com',
            branch: { id: 'b1', name: 'CSE', code: 'CSE' },
            year: { id: 'y1', batch_year: 2023, display_name: 'Y3' },
            semester: { id: 's1', semester_number: 5 },
            section: 'A',
            role: 'student',
          }
          return makeSimpleBuilder({ data: profile as any, error: null })
        }
        case 'subject_offerings': {
          const offerings = [
            { subject_id: 's1', display_order: 1 },
            { subject_id: 's2', display_order: 2 },
          ]
          const state: any = { select: '' }
          const builder: any = {
            select: (s: string) => {
              state.select = s
              return builder
            },
            eq: () => builder,
            order: () => builder,
            limit: () => builder,
            in: () => builder,
            then: (resolve: any) => {
              if (state.select && state.select.includes('regulation')) {
                return resolve({ data: [{ regulation: '2020' }], error: null })
              }
              return resolve({ data: offerings as any, error: null })
            },
          }
          builder.maybeSingle = () => ({ data: null, error: null })
          return builder
        }
        case 'subjects': {
          const subjects = [
            { id: 's1', code: 'CS101', name: 'Intro', resource_type: 'theory' },
            { id: 's2', code: 'CS102', name: 'DS', resource_type: 'lab' },
          ]
          return makeSimpleBuilder({ data: subjects as any, error: null })
        }
        case 'branches': {
          return makeSimpleBuilder({ data: [{ id: 'b1', code: 'CSE' }] as any, error: null })
        }
        case 'years': {
          return makeSimpleBuilder({ data: [{ id: 'y1', batch_year: 2023 }] as any, error: null })
        }
        case 'semesters': {
          return makeSimpleBuilder({ data: [{ id: 's1', semester_number: 5 }] as any, error: null })
        }
        case 'recent_updates': {
          return makeSimpleBuilder({ data: [] as any, error: null })
        }
        case 'exams': {
          return makeSimpleBuilder({ data: [] as any, error: null })
        }
        case 'reminders': {
          return makeSimpleBuilder({ data: [] as any, error: null })
        }
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    },
  }
  return supabase
}

describe('bulk-academic-data GET', () => {
  let getServerSession: any
  let createSupabaseAdmin: any

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T00:00:00Z'))
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 200 and expected keys', async () => {
    ;({ createSupabaseAdmin } = await import('@/lib/supabase'))
    createSupabaseAdmin.mockReturnValue(makeSupabaseMock())

    const { GET } = await import('@/app/api/bulk-academic-data/route')
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({
          branch: 'CSE',
          year: '3',
          semester: '1'
        })
      }
    } as any
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('profile')
    expect(body.profile).toBeNull()
    expect(body).toHaveProperty('subjects')
    expect(body).toHaveProperty('static')
    expect(body).toHaveProperty('dynamic')
  })

  it('returns 200 even without session (stateless)', async () => {
    const { GET } = await import('@/app/api/bulk-academic-data/route')
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    } as any
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeNull()
  })

  it('returns 500 when Supabase creation throws', async () => {
    ;({ createSupabaseAdmin } = await import('@/lib/supabase'))
    createSupabaseAdmin.mockImplementation(() => {
      throw new Error('boom')
    })

    const { GET } = await import('@/app/api/bulk-academic-data/route')
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    } as any
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error?.code).toBe('INTERNAL_ERROR')
  })
})

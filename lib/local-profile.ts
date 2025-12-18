export interface LocalProfile {
  name: string
  roll_number: string
  branch: string // code E.g. "CSE"
  year: number // academic year E.g. 1
  semester: number
  section?: string
  email?: string // Optional now
  
  // ID references needed for some API calls
  branch_id?: string
  year_id?: string
  semester_id?: string
}

const LOCAL_STORAGE_KEY = 'pecup_local_profile'

export const LocalProfileService = {
  save: (profile: LocalProfile) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile))
  },

  get: (): LocalProfile | null => {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('Failed to parse local profile', e)
      return null
    }
  },

  clear: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  },

  hasProfile: (): boolean => {
    return !!LocalProfileService.get()
  }
}

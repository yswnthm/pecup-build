'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ProfileCache, StaticCache, SubjectsCache, DynamicCache, ProfileDisplayCache, ResourcesCache } from './simple-cache'
import { PerfMon } from './performance-monitor'
import { LocalProfileService, LocalProfile } from './local-profile'


// Narrow shapes for bulk static and dynamic data with safe extensibility
export interface EnhancedProfileStaticData {
	branches?: Array<{ id: string; name?: string; code?: string }>
	years?: Array<{ id: string; batch_year?: number; display_name?: string }>
	semesters?: Array<{ id: string; semester_number?: number; year_id?: string }>
	subjects?: Array<{ id: string; code: string; name: string; resource_type?: string }>
	[key: string]: unknown
}

export interface EnhancedProfileDynamicData {
	recentUpdates?: Array<{ id: string; title?: string; created_at?: string }>
	upcomingExams?: Array<{ subject: string; exam_date: string; branch: string; year: string }>
	resourcesCount?: number
	usersCount?: number
	lastSyncedAt?: string
	[key: string]: unknown
}

// Type guard for EnhancedProfileStaticData
function isEnhancedProfileStaticData(obj: unknown): obj is EnhancedProfileStaticData {
	return obj !== null && typeof obj === 'object'
}

// Type guard for EnhancedProfileDynamicData
function isEnhancedProfileDynamicData(obj: unknown): obj is EnhancedProfileDynamicData {
	return obj !== null && typeof obj === 'object'
}

interface Profile {
	id: string // Local profile might not have ID, but we can generate one or use undefined. Interface expects ID.
	name?: string
	email: string
	roll_number?: string
	branch?: string | null
	year?: number | null
	semester?: number | null
	section?: string
	role?: string

	// IDs for compat
	branch_id?: string
	year_id?: string
	semester_id?: string
}

export interface Subject {
	id: string
	code: string
	name: string
	resource_type?: string
}

export interface ProfileContextType {
	profile: Profile | null
	subjects: Subject[]
	staticData: EnhancedProfileStaticData | null
	dynamicData: EnhancedProfileDynamicData | null
	resources: Record<string, Record<string, any[]>> | null
	loading: boolean
	error: string | null
	warnings?: string[] | null
	refreshProfile: () => Promise<void>
	refreshSubjects: () => Promise<void>
	forceRefresh: () => Promise<void>

}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function getPublicProfileFromPath(pathname: string): Profile | null {
	// Pattern: /[regulation]/[branch]/[year][sem]
	// Example: /r23/cse/31 or /r23/aiml/22
	// We use a basic split approach first
	const parts = pathname.split('/').filter(Boolean)
	// parts[0] is strictly regulation (starts with r)
	// parts[1] is branch
	// parts[2] is yearSem (2 digits)

	if (parts.length < 3) return null

	// Check if first part looks like a regulation (e.g. r23, r20)
	const regulation = parts[0]
	if (!regulation.startsWith('r') && !regulation.startsWith('R')) return null;

	const branchCode = parts[1]
	const yearSem = parts[2]

	// Validate yearSem is either "31" or "3-1" format
	let year: number
	let semester: number

	if (/^\d{2}$/.test(yearSem)) {
		year = parseInt(yearSem[0], 10)
		semester = parseInt(yearSem[1], 10)
	} else if (/^\d-\d$/.test(yearSem)) {
		const [y, s] = yearSem.split('-')
		year = parseInt(y, 10)
		semester = parseInt(s, 10)
	} else {
		return null
	}

	// Validate ranges
	if (year < 1 || year > 4) return null
	if (semester < 1 || semester > 2) return null

	return {
		id: 'public-user',
		email: 'guest@pecup.in',
		name: 'Guest User',
		branch: branchCode.toUpperCase(),
		year: year,
		semester: semester,
		role: 'student',
		// We don't have IDs, but APIs handle codes generally
	}
}

export function ProfileProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [profile, setProfile] = useState<Profile | null>(null)
	const [subjects, setSubjects] = useState<Subject[]>([])
	const [staticData, setStaticData] = useState<EnhancedProfileStaticData | null>(null)
	const [dynamicData, setDynamicData] = useState<EnhancedProfileDynamicData | null>(null)
	const [resources, setResources] = useState<Record<string, Record<string, any[]>> | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [warnings, setWarnings] = useState<string[] | null>(null)

	// Load from local storage on mount
	useEffect(() => {
		const localProfile = LocalProfileService.get()

		if (!localProfile) {
			// Check if we are on a public route
			const publicProfile = getPublicProfileFromPath(pathname)
			if (publicProfile) {
				setProfile(publicProfile)
				setLoading(false)
				fetchContextData(publicProfile)
				return
			}

			// Check query params
			const branchParam = searchParams.get('branch')
			const yearParam = searchParams.get('year')
			// semester is optional usually, but good to have
			const semesterParam = searchParams.get('semester')

			if (branchParam && yearParam) {
				const paramProfile: Profile = {
					id: 'query-user',
					email: 'guest@pecup.in',
					name: 'Guest User',
					branch: branchParam,
					year: parseInt(yearParam, 10),
					semester: semesterParam ? parseInt(semesterParam, 10) : undefined,
					role: 'student'
				}
				setProfile(paramProfile)
				setLoading(false)
				fetchContextData(paramProfile)
				return
			}

			// Don't redirect if we are already on onboarding or public un-profiled pages (like login?)
			// But traditionally we redirect to onboarding if no profile.
			// Let's keep it safe: if not public profile path and not onboarding, redirect.
			if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/login') && pathname !== '/') {
				router.replace('/onboarding')
			}
			setLoading(false)
			return
		}

		// Convert LocalProfile to Profile
		const convertedProfile: Profile = {
			id: localProfile.roll_number, // Use roll number as ID
			name: localProfile.name,
			email: localProfile.email || 'local-user',
			roll_number: localProfile.roll_number,
			branch: localProfile.branch,
			year: localProfile.year,
			semester: localProfile.semester,
			section: localProfile.section,
			role: 'student',
			branch_id: localProfile.branch_id,
			year_id: localProfile.year_id,
			semester_id: localProfile.semester_id,
		}

		setProfile(convertedProfile)
		setLoading(false)

		// Fetch fresh data in background
		fetchContextData(convertedProfile)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const fetchContextData = async (currentP: Profile) => {
		if (!currentP.branch || !currentP.year || !currentP.semester) return

		// Parallel fetch for granular data
		Promise.all([
			fetchSubjects(currentP),
			fetchDynamicInfo(currentP)
		]).catch(err => {
			console.error('Error fetching context data', err)
			setError('Failed to load some data')
		})
	}

	const fetchSubjects = async (p: Profile) => {
		try {
			const query = new URLSearchParams({
				branch: p.branch!,
				year: String(p.year),
				semester: String(p.semester)
			})
			const res = await fetch(`/api/subjects?${query.toString()}`)
			if (res.ok) {
				const data = await res.json()
				setSubjects(data.subjects || [])
			}
		} catch (e) {
			console.error('Failed to fetch subjects', e)
		}
	}

	const fetchDynamicInfo = async (p: Profile) => {
		try {
			// Fetch users count (global)
			fetch('/api/users-count').then(r => r.json()).then(d => {
				setDynamicData(prev => ({ ...prev, usersCount: d.totalUsers }))
			}).catch(() => {})

			// Fetch recent updates
			const query = new URLSearchParams({
				branch: p.branch!,
				year: String(p.year)
			})
			fetch(`/api/recent-updates?${query.toString()}`).then(r => r.json()).then(d => {
				// Assuming d is array of updates
				setDynamicData(prev => ({ ...prev, recentUpdates: Array.isArray(d) ? d : [] }))
			}).catch(() => {})

			// We could also fetch exams here if there was a separate API
		} catch (e) {
			console.error('Failed to fetch dynamic info', e)
		}
	}

	// Simple fetch with optional retry/backoff for transient failures
	const fetchWithRetry = async (url: string, init: RequestInit, retries: number, backoffMs: number) => {
		try {
			const res = await fetch(url, init)
			if (!res.ok) {
				// Try to parse error body for structured message
				let message = `Request failed with status ${res.status}`
				try {
					const body = await res.json()
					if (body?.error?.message) message = body.error.message
				} catch (_) { }
				throw new Error(message)
			}
			return res
		} catch (err) {
			if (retries > 0) {
				await new Promise(resolve => setTimeout(resolve, backoffMs))
				return fetchWithRetry(url, init, retries - 1, backoffMs * 2)
			}
			throw err
		}
	}

	// Simple invalidation on user actions
	const refreshProfile = async () => {
		const localProfile = LocalProfileService.get()
		if (localProfile) {
			const convertedProfile: Profile = {
				id: localProfile.roll_number,
				name: localProfile.name,
				email: localProfile.email || 'local-user',
				roll_number: localProfile.roll_number,
				branch: localProfile.branch,
				year: localProfile.year,
				semester: localProfile.semester,
				section: localProfile.section,
				role: 'student',
				branch_id: localProfile.branch_id,
				year_id: localProfile.year_id,
				semester_id: localProfile.semester_id,
			}
			setProfile(convertedProfile)
			await fetchContextData(convertedProfile)
		}
	}

	const refreshSubjects = async () => {
		if (profile) await fetchSubjects(profile)
	}

	const forceRefresh = async () => {
		if (profile) await fetchContextData(profile)
	}



	// Refresh dynamic data on tab visibility change if cache expired
	useEffect(() => {
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible' && profile) {
				const cachedDynamic = DynamicCache.get(isEnhancedProfileDynamicData)
				if (!cachedDynamic) {
					fetchBulkData(false).catch((err) => {
						if (process.env.NODE_ENV !== 'production') {
							// eslint-disable-next-line no-console
							console.error('visibilitychange refresh failed:', err)
						}
					})
				}
			}
		}

		document.addEventListener('visibilitychange', onVisibilityChange)
		return () => {
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile])


	return (
		<ProfileContext.Provider
			value={{
				profile,
				subjects,
				staticData,
				dynamicData,
				resources,
				loading,
				error,
				warnings,
				refreshProfile,
				refreshSubjects,
				forceRefresh,

			}}
		>
			{children}
		</ProfileContext.Provider>
	)
}

export function useProfile() {
	const context = useContext(ProfileContext)
	if (context === undefined) {
		throw new Error('useProfile must be used within a ProfileProvider')
	}
	return context
}

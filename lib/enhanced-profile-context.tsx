'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
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

export function ProfileProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
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
			router.replace('/onboarding')
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

		// Load other cached data
		const cachedStatic = StaticCache.get(isEnhancedProfileStaticData)
		const cachedDynamic = DynamicCache.get(isEnhancedProfileDynamicData)

		if (cachedStatic) setStaticData(cachedStatic)
		if (cachedDynamic) setDynamicData(cachedDynamic)

		// Try to load subjects from cache
		if (localProfile.branch && localProfile.year && localProfile.semester) {
			const cachedSubjects = SubjectsCache.get(localProfile.branch, localProfile.year, localProfile.semester)
			if (cachedSubjects) setSubjects(cachedSubjects)
		}

		setLoading(false)

		// Fetch fresh data in background
		fetchBulkData(false, convertedProfile)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

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

	const fetchBulkData = async (showLoading = true, currentProfileOverride?: Profile) => {
		const currentP = currentProfileOverride || profile
		if (!currentP) return

		if (showLoading) setLoading(true)
		setError(null)

		try {
			const params = new URLSearchParams()
			if (currentP.branch) params.set('branch', currentP.branch)
			if (currentP.year) params.set('year', String(currentP.year))
			if (currentP.semester) params.set('semester', String(currentP.semester))
			if (currentP.branch_id) params.set('branch_id', currentP.branch_id)
			if (currentP.year_id) params.set('year_id', currentP.year_id)
			if (currentP.semester_id) params.set('semester_id', currentP.semester_id)

			const response = await fetchWithRetry(
				`/api/bulk-academic-data?${params.toString()}`,
				{ cache: 'no-store' },
				// Retry only when user is waiting (showLoading)
				showLoading ? 2 : 0,
				500
			)
			if (!response.ok) throw new Error('Failed to fetch data')

			const data = await response.json()

			// Update state - keep existing profile (local), update everything else
			// IF the API returned a profile (it shouldn't now, but just in case), we ignore it or merge?
			// We ignore it because local storage is source of truth for profile identity.

			setSubjects(Array.isArray(data.subjects) ? data.subjects : [])
			setStaticData((data.static as EnhancedProfileStaticData) ?? null)
			setDynamicData((data.dynamic as EnhancedProfileDynamicData) ?? null)
			setResources(data.resources || null)
			setWarnings(Array.isArray(data.contextWarnings) ? data.contextWarnings : null)

			// Update caches
			StaticCache.set(data.static)
			DynamicCache.set(data.dynamic)

			if (
				currentP.branch &&
				currentP.year &&
				currentP.semester
			) {
				SubjectsCache.set(
					currentP.branch,
					currentP.year,
					currentP.semester,
					Array.isArray(data.subjects) ? data.subjects : []
				)
			}

			// Cache resources
			if (data.resources) {
				Object.keys(data.resources).forEach(subject => {
					Object.keys(data.resources[subject]).forEach(category => {
						ResourcesCache.set(category, subject, data.resources[subject][category])
					})
				})
			}


		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err)
			setError(message || 'Failed to load data')
			if (process.env.NODE_ENV !== 'production') {
				// eslint-disable-next-line no-console
				console.error('Bulk fetch error:', err)
			}
		} finally {
			setLoading(false)
		}
	}

	// Simple invalidation on user actions
	const refreshProfile = async () => {
		// Technically profile is local, so "refreshing" it just means re-reading local storage?
		// Or re-fetching dependent data.
		const localProfile = LocalProfileService.get()
		if (localProfile) {
			// Update in-memory profile incase local storage changed
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
			await fetchBulkData(true, convertedProfile)
		}
	}

	const refreshSubjects = async () => {
		if (!profile || !profile.branch || !profile.year || !profile.semester) return
		SubjectsCache.clearForContext(profile.branch, profile.year, profile.semester)
		await fetchBulkData(true)
	}

	const forceRefresh = async () => {
		if (process.env.NODE_ENV !== 'production') {
			console.log('[DEBUG] Force refresh triggered')
		}
		StaticCache.clear()
		DynamicCache.clear()
		ResourcesCache.clearAll()
		if (profile && profile.branch && profile.year && profile.semester) {
			SubjectsCache.clearForContext(profile.branch, profile.year, profile.semester)
		}
		await fetchBulkData(true)
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

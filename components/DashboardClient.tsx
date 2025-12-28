"use client"

import { useMemo, useCallback } from 'react'
import Link from "next/link"
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { FileText, BookOpen, FileCheck, Database, Users, Loader2, CalendarDays, Clock, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'


import { Header } from '@/components/Header'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { generateBreadcrumbs } from '@/lib/navigation-utils'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const Hero = dynamic(() => import('@/components/Hero'), {
    loading: () => <Skeleton className="h-[200px] w-full" />,
})

const UpcomingExams = dynamic(() => import('@/components/UpcomingExams'), {
    ssr: false,
})

const RecentUpdates = dynamic(() => import('@/components/RecentUpdates'), {
    ssr: false,
})

import { useProfile } from '@/lib/enhanced-profile-context'
import { useDynamicData } from '@/hooks/use-academic-data'
import { CATEGORY_TITLES, CATEGORY_DESCRIPTIONS } from '@/lib/constants'

// Types
type Exam = {
    subject: string
    exam_date: string
    branch: string
    year: string
}



export function DashboardClient() {
    const { profile } = useProfile()

    // Fetch dynamic data using React Query
    const { data: dynamicData, isLoading: dynamicLoading, error: dynamicError } = useDynamicData({
        branch: profile?.branch,
        year: profile?.year,
        enabled: !!profile?.branch // Only fetch if we have context, or fetch global if not? Actually global updates are good too.
    })

    // Construct query params for resource links or context-based paths
    const getCategoryPath = useCallback((basePath: string) => {
        if (profile?.branch && profile?.year && profile?.semester) {
            const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/(r\d+)\/\//i) : null;
            const regulation = match ? match[1] : 'r23';

            if (typeof window !== 'undefined' && window.location.pathname.startsWith(`/${regulation}`)) {
                const cleanCategory = basePath.replace('/resources/', '');
                const yearSem = `${profile.year}${profile.semester}`;
                return `/${regulation}/${profile.branch.toLowerCase()}/${yearSem}/${cleanCategory}`;
            }
        }

        // Fallback to legacy query params
        const p = new URLSearchParams()
        if (profile?.year) p.set('year', String(profile.year))
        if (profile?.semester) p.set('semester', String(profile.semester))
        if (profile?.branch) p.set('branch', profile.branch)
        const s = p.toString()
        return `${basePath}${s ? `?${s}` : ''}`
    }, [profile])

    // Helpers
    const getRoleDisplay = useCallback((role: string) => {
        switch (role) {
            case 'student':
                return null
            case 'representative':
                return <Badge variant="default">Representative</Badge>
            case 'admin':
                return <Badge variant="destructive">Admin</Badge>
            case 'yeshh':
                return <Badge variant="destructive">Yeshh</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }, [])


    // Prefetching
    const queryClient = useQueryClient()

    const prefetchCategory = useCallback((category: string) => {
        if (!profile?.branch || !profile?.year || !profile?.semester) return

        const params = new URLSearchParams()
        params.append('category', category.toLowerCase())
        // We don't have subject/unit here, typically just category listing or default
        params.append('branch', profile.branch)
        params.append('year', String(profile.year))
        params.append('semester', String(profile.semester))

        queryClient.prefetchQuery({
            queryKey: ['resources', category.toLowerCase(), undefined, undefined, profile.year, profile.branch, profile.semester],
            queryFn: async () => {
                const res = await fetch(`/api/resources?${params.toString()}`)
                if (!res.ok) throw new Error('Failed to fetch resources')
                return res.json()
            },
            staleTime: 1000 * 60 * 5 // 5 min
        })
    }, [profile, queryClient])

    const categories = useMemo(() => [
        {
            name: CATEGORY_TITLES.notes,
            description: CATEGORY_DESCRIPTIONS.notes,
            icon: FileText,
            path: "/resources/notes",
            categoryKey: "notes",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            name: CATEGORY_TITLES.assignments,
            description: CATEGORY_DESCRIPTIONS.assignments,
            icon: BookOpen,
            path: "/resources/assignments",
            categoryKey: "assignments",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            name: CATEGORY_TITLES.papers,
            description: CATEGORY_DESCRIPTIONS.papers,
            icon: FileCheck,
            path: "/resources/papers",
            categoryKey: "papers",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            name: CATEGORY_TITLES.records,
            description: CATEGORY_DESCRIPTIONS.records,
            icon: Database,
            path: "/resources/records",
            categoryKey: "records",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
    ], [])

    const breadcrumbs = useMemo(() => {
        if (profile?.branch && profile?.year && profile?.semester) {
            const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/(r\d+)\//i) : null;
            const regulation = match ? match[1] : 'r23';
            return generateBreadcrumbs(regulation, profile.branch.toLowerCase(), `${profile.year}${profile.semester}`);
        }
        return [{ label: "♡", isCurrentPage: true }];
    }, [profile]);


    const updates = dynamicData?.recentUpdates || []

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-4 p-4 md:p-6 lg:p-8"
        >
            <Header />

            <div className="space-y-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div>
                        <Breadcrumb items={breadcrumbs} />
                    </div>
                    <div className="flex items-center gap-4">
                        {profile?.role && getRoleDisplay(profile.role)}
                    </div>
                </div>

                {/* Hero */}
                <Hero />

                {/* Admin Access Info */}
                {(profile?.role === 'admin' || profile?.role === 'yeshh') && (
                    <Card className="p-4">
                        <h3 className="font-semibold mb-2">Admin Access</h3>
                        <p className="text-sm text-muted-foreground">
                            You have full access to manage all resources, users, and system settings across all branches and years.
                        </p>
                    </Card>
                )}
            </div>

            {/* Main Grid - Resource Categories */}
            <div id="resources" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((category) => (
                    <Link
                        key={category.name}
                        href={getCategoryPath(category.path)}
                        className="block"
                        onMouseEnter={() => prefetchCategory(category.categoryKey)}
                    >
                        <Card className="h-full transition-all-smooth hover-lift">
                            <CardHeader className={`rounded-t-lg ${category.color}`}>
                                <div className="flex items-center gap-3">
                                    <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                                    <CardTitle className="text-xl">{category.name}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <CardDescription className="text-sm">{category.description}</CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Useful Resources Card */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Useful Resources</CardTitle>
                    <CardDescription>mandatory and useful resources by PEC.UP</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-all duration-200">
                            <FileText className="h-4 w-4 text-primary" />
                            <span><a href="https://drive.google.com/file/d/1iVaySLAjlTKk_dABrmPhAQt3x1rrxuiI/view?usp=sharing">Syllabus</a></span>
                            <span className="ml-auto text-xs text-muted-foreground">28 October 2025</span>
                        </li>
                        <li className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-all duration-200">
                            <BookOpen className="h-4 w-4 text-primary" />
                            <span><a href="https://drive.google.com/file/d/1R69NBdzUpX-h-HjOer63KTlhWfh2xymX/view?usp=sharing">Mid-1 Timetable</a></span>
                            <span className="ml-auto text-xs text-muted-foreground">28 October 2025</span>
                        </li>
                        <li className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-all duration-200">
                            <FileCheck className="h-4 w-4 text-primary" />
                            <span><a href="https://drive.google.com/file/d/1Noyor92EgQMpHARdUedBSy6GfOrMje24/view?usp=sharing">Mid-2 Timetable</a></span>
                            <span className="ml-auto text-xs text-muted-foreground">28 October 2025</span>
                        </li>
                        <li className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-all duration-200">
                            <FileCheck className="h-4 w-4 text-primary" />
                            <span><a href="https://drive.google.com/file/d/1wA2lhhJPucAxWxcRkeaj_meWTVJaHGai/view?usp=sharing">Sem Timetable</a></span>
                            <span className="ml-auto text-xs text-muted-foreground">10 November 2025</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>


            {dynamicError && (
                <Alert variant="destructive" className="mt-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading data</AlertTitle>
                    <AlertDescription>Failed to load recent updates or exams.</AlertDescription>
                </Alert>
            )}

            {/* Upcoming Exams (from dynamicData) */}
            <UpcomingExams exams={dynamicData?.upcomingExams || []} />

            {/* Recent Updates */}
            <RecentUpdates updates={updates} isLoading={dynamicLoading} />


        </motion.div>
    )
}


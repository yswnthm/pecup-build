"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from "next/link"
import { motion } from 'framer-motion'
import { FileText, BookOpen, FileCheck, Database, Users, Loader2, ExternalLink, CalendarDays, Clock, Edit, FileQuestion, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'


import { Header } from '@/components/Header'
import { Breadcrumb } from '@/components/Breadcrumb'

import Hero from '@/components/Hero'
import Loader from '@/components/Loader'

import { useProfile } from '@/lib/enhanced-profile-context'

// Types
type Exam = {
    subject: string
    exam_date: string
    branch: string
    year: string
}

interface RecentUpdate {
    id: string | number
    title: string
    date: string
    description?: string
}

const SHOW_ACTUAL_USER_COUNT = true;

export function DashboardClient() {
    const { profile, dynamicData, loading, error } = useProfile()

    // State from Resources Page logic (for links)
    const [year, setYear] = useState<number | 'all'>('all')
    const [semester, setSemester] = useState<number | 'all'>('all')
    const [branch, setBranch] = useState<string | ''>('')

    // State from Home Page logic (for data)
    const [usersCount, setUsersCount] = useState<number>(0)

    const [updates, setUpdates] = useState<RecentUpdate[]>([])
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(true)
    const [updatesError, setUpdatesError] = useState<string | null>(null)



    // Construct query params for resource links or context-based paths
    const getCategoryPath = (basePath: string) => {
        // Check if we have a full context to use the clean URL format
        // We need branch, year, semester, and a regulation (defaulting to r23 if not in URL, but safer to rely on context if available)
        // Actually, Profile doesn't store regulation explicitly usually, but let's check if we are in a context-aware route.
        // For now, let's assume if we have all parts we can construct it.
        // HOWEVER, the profile object doesn't have regulation. 
        // We can check the current pathname to see if it starts with /r...
        // Or we can try to guess.
        
        // Better approach: If we are on a page that provided the context (public profile), use that.
        // The URL pattern is usually /[regulation]/[branch]/[yearSem]
        
        // Let's rely on the profile. If it's a "public-user" (guest) from URL, we can reconstruct the path?
        // Actually, let's just use the current window location if available, or pass it as prop?
        // DashboardClient is used in app/[regulation]/[branch]/[yearSem]/page.tsx.
        
        if (profile?.branch && profile?.year && profile?.semester) {
             // Basic regex to check if current path is a context path
             const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/(r\d+)\//i) : null;
             const regulation = match ? match[1] : 'r23'; // Default to r23 if not found, or maybe fallback to query params?
             
             // Check if we are actually in a context route or just have a logged in user
             // If logged in user at root /, we might want to stick to /resources/notes?params... or redirect to context?
             // The requirement is specifically for the /r23/cse/11 URL to work.
             
             if (typeof window !== 'undefined' && window.location.pathname.startsWith(`/${regulation}`)) {
                 // We are likely in a context route
                 const cleanCategory = basePath.replace('/resources/', '');
                 const yearSem = `${profile.year}${profile.semester}`;
                 return `/${regulation}/${profile.branch.toLowerCase()}/${yearSem}/${cleanCategory}`;
             }
        }

        // Fallback to legacy query params
        const p = new URLSearchParams()
        if (year !== 'all') p.set('year', String(year))
        if (semester !== 'all') p.set('semester', String(semester))
        if (branch) p.set('branch', branch)
        const s = p.toString()
        return `${basePath}${s ? `?${s}` : ''}`
    }

    const categories = [
        {
            name: "Notes",
            description: "Lecture notes and study materials",
            icon: FileText,
            path: "/resources/notes",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            name: "Assignments",
            description: "Assignment questions all batches",
            icon: BookOpen,
            path: "/resources/assignments",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            name: "Papers",
            description: "mid-1, mid-2, previous year papers",
            icon: FileCheck,
            path: "/resources/papers",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            name: "Records",
            description: "records and manuals for specific weeks",
            icon: Database,
            path: "/resources/records",
            color: "bg-primary/10",
            iconColor: "text-primary",
        },
    ]

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
                        <Breadcrumb items={[
                            { label: "♡", isCurrentPage: true }
                        ]} />
                    </div>
                    <div className="flex items-center gap-4">
                        {profile?.role && getRoleDisplay(profile.role)}
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
                            <Users className="h-3 w-3 text-primary" />
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-sm">
                                    {SHOW_ACTUAL_USER_COUNT ? usersCount.toLocaleString() : "300+"}
                                </span>
                                <span className="text-xs text-muted-foreground">users</span>
                            </div>
                        </div>
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
                    <Link key={category.name} href={getCategoryPath(category.path)} className="block">
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



            {/* No Exams Message */}


            {error && (
                <Alert variant="destructive" className="mt-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading data</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Upcoming Exams (from dynamicData) */}
            {dynamicData?.upcomingExams && dynamicData.upcomingExams.length > 0 && (
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                <CardTitle>Upcoming Exams (next 5 days)</CardTitle>
                            </div>
                            <CardDescription>Based on your branch and year</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {dynamicData.upcomingExams.map((exam: Exam, idx: number) => (
                                    <div key={`${exam.subject}-${exam.exam_date}-${idx}`} className="flex items-center justify-between border-l-4 border-primary pl-4">
                                        <div>
                                            <h3 className="font-medium">{exam.subject}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {exam.exam_date && !isNaN(new Date(exam.exam_date).getTime()) ? new Date(exam.exam_date).toDateString() : "Date unavailable"}
                                            </p>
                                        </div>
                                        <Badge variant="outline">{exam.branch} • {exam.year}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Recent Updates */}
            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Updates</CardTitle>
                        <CardDescription>Latest changes to the resource hub</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingUpdates && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Loading updates...</span>
                            </div>
                        )}
                        {updatesError && !isLoadingUpdates && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error Loading Updates</AlertTitle>
                                <AlertDescription>{updatesError}</AlertDescription>
                            </Alert>
                        )}
                        {!isLoadingUpdates && !updatesError && updates.length > 0 && (
                            <div className="space-y-4">
                                {updates.map((update) => (
                                    <div key={update.id} className="border-l-4 border-primary pl-4 transition-colors hover:bg-muted/50 py-1">
                                        <h3 className="font-medium">
                                            {update.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{update.date}</p>
                                        {update.description && <p className="text-sm text-muted-foreground mt-1">{update.description}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isLoadingUpdates && !updatesError && updates.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent updates found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>


        </motion.div>
    )
}

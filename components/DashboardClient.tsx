"use client"

import { useMemo } from 'react'
import Link from "next/link"
import { motion } from 'framer-motion'
import { FileText, BookOpen, FileCheck, Database, Users, Loader2, CalendarDays, Clock, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'


import { Header } from '@/components/Header'
import { Breadcrumb } from '@/components/Breadcrumb'
import { generateBreadcrumbs } from '@/lib/navigation-utils'

import Hero from '@/components/Hero'

import { useProfile } from '@/lib/enhanced-profile-context'
import { useDynamicData } from '@/hooks/use-academic-data'

// Types
type Exam = {
    subject: string
    exam_date: string
    branch: string
    year: string
}

const SHOW_ACTUAL_USER_COUNT = true;

export function DashboardClient() {
    const { profile } = useProfile()
    
    // Fetch dynamic data using React Query
    const { data: dynamicData, isLoading: dynamicLoading, error: dynamicError } = useDynamicData({
        branch: profile?.branch,
        year: profile?.year,
        enabled: !!profile?.branch // Only fetch if we have context, or fetch global if not? Actually global updates are good too.
    })

    // Construct query params for resource links or context-based paths
    const getCategoryPath = (basePath: string) => {
        if (profile?.branch && profile?.year && profile?.semester) {
             const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/(r\d+)\//i) : null;
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
    }

    // Helpers
    const getRoleDisplay = (role: string) => {
        switch (role) {
            case 'student':
                return <Badge variant="secondary">Student</Badge>
            case 'representative':
                return <Badge variant="default">Representative</Badge>
            case 'admin':
                return <Badge variant="destructive">Admin</Badge>
            case 'yeshh':
                return <Badge variant="destructive">Yeshh</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
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

    const breadcrumbs = useMemo(() => {
        if (profile?.branch && profile?.year && profile?.semester) {
             const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/(r\d+)\//i) : null;
             const regulation = match ? match[1] : 'r23';
             return generateBreadcrumbs(regulation, profile.branch.toLowerCase(), `${profile.year}${profile.semester}`);
        }
        return [{ label: "♡", isCurrentPage: true }];
    }, [profile]);

    const usersCount = dynamicData?.usersCount || 0
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


            {dynamicError && (
                <Alert variant="destructive" className="mt-8">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading data</AlertTitle>
                    <AlertDescription>Failed to load recent updates or exams.</AlertDescription>
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
                        {dynamicLoading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Loading updates...</span>
                            </div>
                        )}
                        {!dynamicLoading && updates.length > 0 && (
                            <div className="space-y-4">
                                {updates.map((update: any) => (
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
                        {!dynamicLoading && updates.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No recent updates found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>


        </motion.div>
    )
}


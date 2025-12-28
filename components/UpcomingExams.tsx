"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock } from "lucide-react"

type Exam = {
    subject: string
    exam_date: string
    branch: string
    year: string
}

interface UpcomingExamsProps {
    exams: Exam[]
}

export default function UpcomingExams({ exams }: UpcomingExamsProps) {
    if (!exams || exams.length === 0) return null

    return (
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
                        {exams.map((exam, idx) => (
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
    )
}

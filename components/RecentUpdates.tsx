"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface RecentUpdatesProps {
    updates: any[]
    isLoading: boolean
}

export default function RecentUpdates({ updates, isLoading }: RecentUpdatesProps) {
    return (
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Recent Updates</CardTitle>
                    <CardDescription>Latest changes to the resource hub</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Loading updates...</span>
                        </div>
                    )}
                    {!isLoading && updates.length > 0 && (
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
                    {!isLoading && updates.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent updates found.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

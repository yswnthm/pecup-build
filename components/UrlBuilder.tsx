"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ArrowRight } from "lucide-react"
import { REGULATIONS, BRANCH_CODES } from "@/lib/constants"

export function UrlBuilder() {
    const router = useRouter()
    const [regulation, setRegulation] = React.useState("r23")
    const [branch, setBranch] = React.useState("cse")
    const [year, setYear] = React.useState("3")
    const [semester, setSemester] = React.useState("1")
    const [loading, setLoading] = React.useState(false)

    const handleFetch = () => {
        setLoading(true)
        const url = `/${regulation}/${branch}/${year}${semester}`
        router.push(url)
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-1 p-1 rounded-md border bg-background/50 shadow-sm w-full max-w-xl mx-auto text-xs">
            <Select value={regulation} onValueChange={setRegulation}>
                <SelectTrigger className="w-full sm:w-[70px] border-0 bg-transparent focus:ring-0 h-8 text-xs">
                    <SelectValue placeholder="Reg" />
                </SelectTrigger>
                <SelectContent>
                    {REGULATIONS.map((r) => (
                        <SelectItem key={r} value={r.toLowerCase()} className="text-xs">
                            {r.toUpperCase()}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-muted-foreground hidden sm:inline text-xs">/</span>

            <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="w-full sm:w-[80px] border-0 bg-transparent focus:ring-0 h-8 text-xs">
                    <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                    {BRANCH_CODES.map((b) => (
                        <SelectItem key={b} value={b.toLowerCase()} className="text-xs">
                            {b.toUpperCase()}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-muted-foreground hidden sm:inline text-xs">/</span>

            <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-full sm:w-[80px] border-0 bg-transparent focus:ring-0 h-8 text-xs">
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    {["1", "2", "3", "4"].map((y) => (
                        <SelectItem key={y} value={y} className="text-xs">
                            Year {y}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-muted-foreground hidden sm:inline text-xs">-</span>

            <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-full sm:w-[80px] border-0 bg-transparent focus:ring-0 h-8 text-xs">
                    <SelectValue placeholder="Sem" />
                </SelectTrigger>
                <SelectContent>
                    {["1", "2"].map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                            Sem {s}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                size="icon"
                variant="ghost"
                className="ml-auto rounded-full hover:bg-primary/10 hover:text-primary shrink-0 h-7 w-7"
                onClick={handleFetch}
                disabled={loading}
            >
                <ArrowRight className="h-3 w-3" />
            </Button>
        </div>
    )
}

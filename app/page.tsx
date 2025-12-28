import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"

const UrlBuilder = dynamic(() => import("@/components/UrlBuilder").then(mod => mod.UrlBuilder), {
  loading: () => <Skeleton className="h-10 w-full max-w-xl mx-auto" />,
})

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 space-y-8 font-sans">
      <h1 className="text-6xl font-bold tracking-tight">pecup.</h1>

      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Direct Access</h2>
          <p className="text-muted-foreground text-sm">
            Access resources directly by using the URL format:
          </p>
          <code className="bg-muted px-2 py-1 rounded text-sm block mt-2">
            pecup.in/[regulation]/[branch]/[year][sem]
          </code>
        </div>

        <div className="space-y-4 text-left border rounded-lg p-6 bg-card/50">
          <h3 className="font-medium border-b pb-2">Examples</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">CSE - 3rd Year, 1st Sem (R23)</p>
              <a href="/r23/cse/31" className="text-primary hover:underline text-sm font-medium">
                pecup.in/r23/cse/31
              </a>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">AIML - 2nd Year, 2nd Sem (R23)</p>
              <a href="/r23/aiml/22" className="text-primary hover:underline text-sm font-medium">
                pecup.in/r23/aiml/22
              </a>
            </div>
          </div>
        </div>

        <UrlBuilder />

        <p className="text-xs text-muted-foreground pt-8">
          No onboarding required for direct links.
        </p>
      </div>
    </div>
  )
}
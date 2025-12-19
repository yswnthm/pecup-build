import { DashboardClient } from "@/components/DashboardClient"

export default function PublicDashboardPage({
    params,
}: {
    params: { regulation: string; branch: string; yearSem: string }
}) {
    // We don't need to do much here because the ProfileProvider is now smart enough
    // to pick up the params from the URL path and hydrate the context.
    // The DashboardClient will then just read from the context as usual.

    return <DashboardClient />
}

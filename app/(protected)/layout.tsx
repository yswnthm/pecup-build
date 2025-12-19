export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    // This layout was redundant as the root layout already provides the ProfileProvider.
    // Kept as a pass-through in case we need protected-route specific layout in future.
    return (
        <>
            {children}
        </>
    )
}

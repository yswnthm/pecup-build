"use client";

import { AppleHelloEnglishEffect } from "@/components/ui/shadcn-io/apple-hello-effect";

export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
            <div className="relative">
                <AppleHelloEnglishEffect
                    speed={1.1}
                    className="h-16 sm:h-20 md:h-24 lg:h-28"
                />
            </div>
        </div>
    );
}

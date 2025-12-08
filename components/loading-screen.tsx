"use client";

import { useState, useEffect } from "react";
import { AppleHelloEnglishEffect } from "@/components/ui/shadcn-io/apple-hello-effect";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_DURATION = 3500; // 3.5 seconds
const SESSION_KEY = "app_first_load_complete";

export function LoadingScreen({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [showContent, setShowContent] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Check if this is the first load in this session
        const hasLoadedBefore = sessionStorage.getItem(SESSION_KEY);

        if (hasLoadedBefore) {
            // Not first load, skip loading screen
            setIsLoading(false);
            setShowContent(true);
            return;
        }

        // First load - show loading animation
        const timer = setTimeout(() => {
            setIsLoading(false);
            // Mark as loaded in session storage
            sessionStorage.setItem(SESSION_KEY, "true");

            // Delay showing content slightly to allow fade out to complete
            setTimeout(() => {
                setShowContent(true);
            }, 500);
        }, LOADING_DURATION);

        return () => clearTimeout(timer);
    }, []);

    // Prevent hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <>
            <AnimatePresence mode="wait">
                {isLoading && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
                    >
                        <div className="relative">
                            <AppleHelloEnglishEffect
                                speed={1.1}
                                className="h-16 sm:h-20 md:h-24 lg:h-28"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {children}
                </motion.div>
            )}
        </>
    );
}

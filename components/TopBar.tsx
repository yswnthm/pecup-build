'use client'

import { ThemeToggle } from './theme-toggle'

export function TopBar() {
  return (
    <div className="flex w-full items-center justify-between px-4 md:px-16 pt-6 pb-0 mb-0">
      <div className="text-2xl md:text-3xl font-bold text-primary">PEC.UP</div>
      <div className="flex gap-2">
        <ThemeToggle />
      </div>
    </div >
  )
}
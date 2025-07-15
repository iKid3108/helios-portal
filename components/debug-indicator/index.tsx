"use client"

import { useAppStore } from "@/stores/app"
import s from "./debug-indicator.module.scss"

/**
 * A simple indicator that shows when debug mode is enabled
 * This can be placed anywhere in the application
 */
export const DebugIndicator = () => {
  const { debugMode, hasHydrated } = useAppStore()

  if (!hasHydrated || !debugMode) return null

  return (
    <div className={s["debug-indicator"]} title="Debug Mode Enabled">
      DEBUG MODE
    </div>
  )
}

export default DebugIndicator

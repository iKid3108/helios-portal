"use client"

import { useAppStore } from "@/stores/app"
import { useEffect, useRef, useState } from "react"

/**
 * Component that listens for changes in the app store settings
 * and triggers a page refresh when necessary
 */
export const SettingsListener = () => {
  // We don't need this component anymore since we're handling refreshes in the settings modal
  // and we've updated the store to persist both debugMode and rpcUrl

  // This component doesn't render anything
  return null
}

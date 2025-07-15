"use client"

import { useEffect, useRef, useState } from "react"
import s from "./network-status.module.scss"
import clsx from "clsx"
import { useBlockInfo } from "@/hooks/useBlockInfo"
import { Link } from "@/components/link"
import { useAppStore } from "@/stores/app"

export function NetworkStatus() {
  const { lastBlockNumber, blockTime, error } = useBlockInfo()
  const { debugMode, hasHydrated } = useAppStore()
  const [isMounting, setIsMounting] = useState(false)
  const [connectionError, setConnectionError] = useState<boolean>(false)
  const prevBlockNumber = useRef<number | null>(null)
  const fetchStart = useRef<number | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Start timer when fetching new block
  useEffect(() => {
    if (lastBlockNumber && prevBlockNumber.current !== lastBlockNumber) {
      // Block number changed, so we just finished a fetch
      if (fetchStart.current) {
        const timer = setTimeout(() => setIsMounting(false), 1000)
        prevBlockNumber.current = lastBlockNumber
        return () => clearTimeout(timer)
      }
      setIsMounting(true)
      const timer = setTimeout(() => setIsMounting(false), 1000)
      prevBlockNumber.current = lastBlockNumber
      // Clear any connection error when we get a successful block
      setConnectionError(false)
      return () => clearTimeout(timer)
    } else if (!lastBlockNumber) {
      // Start a new fetch
      fetchStart.current = Date.now()
    }
  }, [lastBlockNumber])

  // Handle RPC connection errors
  useEffect(() => {
    if (error) {
      // If there's an error, set the connection error state after a short delay
      // This prevents flickering for temporary network issues
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }

      errorTimeoutRef.current = setTimeout(() => {
        setConnectionError(true)
      }, 1000) // Wait 1 seconds before showing the error

      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current)
        }
      }
    } else {
      // Clear the error state if there's no error
      setConnectionError(false)
    }
  }, [error])

  // Determine status color
  let statusColor: "green" | "orange" | "red" = "green"
  if (blockTime) {
    if (blockTime > 60) statusColor = "red"
    else if (blockTime > 30) statusColor = "orange"
  }

  // If there's a connection error, force red status
  if (connectionError) {
    statusColor = "red"
  }

  // Explorer link
  const explorerUrl = lastBlockNumber
    ? `https://explorer.helioschainlabs.org/blocks/${lastBlockNumber}`
    : "#"

  if (!hasHydrated) return null
  if (!debugMode) return null

  // Show error indicator even when there's no block number if in debug mode
  if (connectionError && !lastBlockNumber && debugMode) {
    return (
      <div className={s["network-status__fixed"]}>
        <div className={s["network-status"]}>
          {/* Debug mode indicator */}
          <div className={s["debug-badge"]} title="Debug Mode Enabled">
            DEBUG
          </div>

          <div
            className={clsx(
              s["network-status__block"],
              s["network-status__block--danger"]
            )}
            title="RPC connection error"
          >
            Error
          </div>
          <span
            className={clsx(
              s["network-status__dot"],
              s["network-status__dot--danger"]
            )}
          />
        </div>
      </div>
    )
  }

  // If no block number and no error, don't show anything
  if (!lastBlockNumber) return null

  return (
    <div className={s["network-status__fixed"]}>
      <div className={s["network-status"]}>
        {/* Debug mode indicator */}
        <div className={s["debug-badge"]} title="Debug Mode Enabled">
          DEBUG
        </div>

        <Link
          href={explorerUrl}
          className={clsx(
            s["network-status__block"],
            statusColor === "green" && s["network-status__block--healthy"],
            statusColor === "orange" && s["network-status__block--warning"],
            statusColor === "red" && s["network-status__block--danger"]
          )}
          title="View block in explorer"
        >
          #{lastBlockNumber}
        </Link>
        <span
          className={clsx(
            s["network-status__dot"],
            statusColor === "orange" && s["network-status__dot--warning"],
            statusColor === "red" && s["network-status__dot--danger"]
          )}
        >
          {isMounting && <span className={s["network-status__spinner"]} />}
        </span>
      </div>
    </div>
  )
}

export default NetworkStatus

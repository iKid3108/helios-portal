"use client"

import { useEffect, useRef, useState } from "react"
import s from "./network-status.module.scss"
import clsx from "clsx"
import { useBlockInfo } from "@/hooks/useBlockInfo"
import { Link } from "@/components/link"

export function NetworkStatus() {
  const { lastBlockNumber, blockTime } = useBlockInfo()
  const [isMounting, setIsMounting] = useState(false)
  const prevBlockNumber = useRef<number | null>(null)
  const fetchStart = useRef<number | null>(null)

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
      return () => clearTimeout(timer)
    } else if (!lastBlockNumber) {
      // Start a new fetch
      fetchStart.current = Date.now()
    }
  }, [lastBlockNumber])

  // Determine status color
  let statusColor: "green" | "orange" | "red" = "green"
  if (blockTime) {
    const age = Date.now() - blockTime * 1000
    if (age > 30000) statusColor = "red"
    else if (age > 15000) statusColor = "orange"
  }

  // Explorer link
  const explorerUrl = lastBlockNumber
    ? `https://explorer.helioschainlabs.org/blocks/${lastBlockNumber}`
    : "#"

  if (!lastBlockNumber) return null

  return (
    <div className={s["network-status__fixed"]}>
      <div className={s["network-status"]}>
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

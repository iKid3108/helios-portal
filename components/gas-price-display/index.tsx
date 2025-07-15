"use client"

import { useAppStore } from "@/stores/app"
import { useGasPrice } from "@/hooks/useGasPrice"
import { getGasPriceLabel } from "@/utils/gas"
import { formatGwei } from "@/utils/format"
import s from "./gas-price-display.module.scss"

/**
 * A component that displays the current gas price in debug mode
 */
export const GasPriceDisplay = () => {
  const { debugMode, gasPriceOption } = useAppStore()
  const { adjustedGasPrice, isLoading } = useGasPrice()

  // Only show in debug mode
  if (!debugMode) return null

  // Format gas price from wei to Gwei
  const gweiValue = isLoading ? "..." : formatGwei(adjustedGasPrice)

  return (
    <div className={s["gas-price-display"]} title="Current Gas Price Setting">
      <div className={s["gas-price-display__label"]}>Gas: {gweiValue} Gwei</div>
      <div className={s["gas-price-display__option"]}>
        ({getGasPriceLabel(gasPriceOption)})
      </div>
    </div>
  )
}

export default GasPriceDisplay

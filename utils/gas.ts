import { GAS_PRICE_MULTIPLIERS, GasPriceOption } from "@/stores/app"
import { ethers } from "ethers"

/**
 * Calculates the adjusted gas price based on the selected gas price option
 * @param baseGasPrice The base gas price from the network
 * @param option The selected gas price option (low, average, fast)
 * @returns The adjusted gas price as bigint
 */
export function calculateAdjustedGasPrice(
  baseGasPrice: string | bigint,
  option: GasPriceOption
): bigint {
  // Convert string to bigint if needed
  const gasPrice =
    typeof baseGasPrice === "string" ? BigInt(baseGasPrice) : baseGasPrice

  // Get the multiplier for the selected option
  const multiplier = GAS_PRICE_MULTIPLIERS[option]

  // Calculate the adjusted gas price
  // For bigint, we need to use integer math
  // First multiply by multiplier * 100, then divide by 100
  const multiplierBasis = 100n
  const adjustedGasPrice =
    (gasPrice * BigInt(Math.round(multiplier * 100))) / multiplierBasis

  return adjustedGasPrice
}

/**
 * Returns a human-readable label for the gas price option
 * @param option The gas price option
 * @returns A user-friendly label
 */
export function getGasPriceLabel(option: GasPriceOption): string {
  switch (option) {
    case "low":
      return "Low (Slower)"
    case "average":
      return "Average"
    case "fast":
      return "Fast (Higher Fee)"
    default:
      return "Average"
  }
}

/**
 * Returns an estimated time description for the gas price option
 * @param option The gas price option
 * @returns A description of the expected transaction time
 */
export function getGasPriceTimeEstimate(option: GasPriceOption): string {
  switch (option) {
    case "low":
      return "May take longer to confirm"
    case "average":
      return "Standard confirmation time"
    case "fast":
      return "Faster confirmation"
    default:
      return "Standard confirmation time"
  }
}

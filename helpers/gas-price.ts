import { useAppStore } from "@/stores/app"
import { calculateAdjustedGasPrice } from "@/utils/gas"
import { getGasPrice } from "./rpc-calls"

/**
 * Gets the adjusted gas price based on the user's selected gas price option
 * @returns The adjusted gas price as a string
 */
export async function getAdjustedGasPrice(): Promise<string> {
  try {
    // Get the base gas price from the network
    const baseGasPrice = await getGasPrice()

    // If no gas price is available, return a default value
    if (!baseGasPrice) {
      console.warn("No gas price available, using default")
      return "20000000000" // 20 Gwei as a fallback
    }

    // Get the user's selected gas price option from the store
    const { gasPriceOption, debugMode } = useAppStore.getState()

    // Only apply gas price adjustments in debug mode
    if (!debugMode) {
      return baseGasPrice
    }

    // Calculate the adjusted gas price
    const adjustedGasPrice = calculateAdjustedGasPrice(
      baseGasPrice,
      gasPriceOption
    )

    // Return the adjusted gas price as a string
    return adjustedGasPrice.toString()
  } catch (error) {
    console.error("Error getting adjusted gas price:", error)
    // If there's an error, return a default gas price
    return "20000000000" // 20 Gwei as a fallback
  }
}

import { WhitelistedAsset } from "@/hooks/useWhitelistedAssets"
import { TOKEN_COLORS } from "@/config/constants"

/**
 * Get the asset symbol from denom using whitelisted assets data
 * @param denom - The asset denomination
 * @param assets - Array of whitelisted assets
 * @returns The asset symbol or the original denom if not found
 */
export const getAssetSymbol = (
  denom: string,
  assets: WhitelistedAsset[]
): string => {
  const asset = assets.find((asset) => asset.denom === denom)
  return asset?.symbol || denom
}

/**
 * Get the asset info from denom using whitelisted assets data
 * @param denom - The asset denomination
 * @param assets - Array of whitelisted assets
 * @returns The asset info or null if not found
 */
export const getAssetInfo = (
  denom: string,
  assets: WhitelistedAsset[]
): WhitelistedAsset | null => {
  return assets.find((asset) => asset.denom === denom) || null
}

/**
 * Format asset display name with symbol and chain info
 * @param denom - The asset denomination
 * @param assets - Array of whitelisted assets
 * @returns Formatted display name
 */
export const getAssetDisplayName = (
  denom: string,
  assets: WhitelistedAsset[]
): string => {
  const asset = assets.find((asset) => asset.denom === denom)

  if (!asset) {
    return denom
  }

  // For native Helios token
  if (asset.denom === "ahelios") {
    return asset.symbol
  }

  // For cross-chain assets, show symbol with chain info
  return `${asset.symbol} (Chain: ${asset.chainId})`
}

/**
 * Get the asset icon name based on symbol
 * @param symbol - The asset symbol
 * @returns The icon name for the asset
 */
export const getAssetIcon = (symbol: string): string => {
  const symbolLower = symbol.toLowerCase()

  // Special case for HLS/Helios native token
  if (symbolLower === "hls" || symbolLower === "helios") {
    return "helios"
  }

  // Map wrapped tokens to their base token icons since wrapped token icons might not exist
  const wrappedTokenMap: Record<string, string> = {
    weth: "token:ethereum",
    wbnb: "token:bnb",
    wpol: "token:polygon",
    wmatic: "token:polygon",
    wavax: "token:avax",
    wusdt: "token:usdt",
    wusdc: "token:usdc",
    wdai: "token:dai",
    wlink: "token:chainlink",
    wuni: "token:uniswap",
    waave: "token:aave",
    wsol: "token:solana",
    warb: "token:arbitrum"
  }

  // Check if it's a wrapped token with a specific mapping
  if (wrappedTokenMap[symbolLower]) {
    return wrappedTokenMap[symbolLower]
  }

  // For all other tokens, use the token: prefix with the symbol
  return `token:${symbolLower}`
}

/**
 * Get the asset color based on symbol
 * @param symbol - The asset symbol
 * @returns The color for the asset
 */
export const getAssetColor = (symbol: string): string => {
  const symbolLower = symbol.toLowerCase() as keyof typeof TOKEN_COLORS
  return TOKEN_COLORS[symbolLower] || "#6B7280"
}

/**
 * Get asset display properties (icon, color, etc.)
 * @param denom - The asset denomination
 * @param assets - Array of whitelisted assets
 * @returns Asset display properties
 */
export const getAssetDisplayProps = (
  denom: string,
  assets: WhitelistedAsset[]
) => {
  const asset = assets.find((asset) => asset.denom === denom)
  const symbol = asset?.symbol || denom

  return {
    symbol,
    icon: getAssetIcon(symbol),
    color: getAssetColor(symbol),
    displayName: getAssetDisplayName(denom, assets)
  }
}

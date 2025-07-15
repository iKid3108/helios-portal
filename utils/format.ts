/**
 * Formats a wei value to Gwei
 * @param wei The wei value as a string or bigint
 * @returns The formatted Gwei value as a string
 */
export function formatGwei(wei: string | bigint | null | undefined): string {
  if (!wei) return "0.00"

  // Convert to bigint if it's a string
  const weiBigInt = typeof wei === "string" ? BigInt(wei) : wei

  // 1 Gwei = 10^9 wei
  const gweiValue = Number(weiBigInt) / 1_000_000_000

  // Format to 2 decimal places
  return gweiValue.toFixed(2)
}

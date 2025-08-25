"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { useAccount, useWalletClient, usePublicClient } from "wagmi"
import { parseUnits, encodeFunctionData } from "viem"
import { toast } from "sonner"
import {
  PRECOMPILE_CONTRACT_ADDRESS,
  precompileAbi
} from "@/constant/helios-contracts"
import { HELIOS_NETWORK_ID } from "@/config/app"
import { getErrorMessage } from "@/utils/string"
import { Feedback } from "@/types/feedback"

interface TransactionReceipt {
  transactionHash: string
  logs: any[]
  [key: string]: any
}

export type TokenParams = {
  name: string
  symbol: string
  denom: string
  totalSupply: string
  decimals: string
  logoBase64?: string
}

export type DeployedToken = {
  address: string
  name: string
  symbol: string
  denom: string
  totalSupply: string
  decimals: number
  logoBase64: string
  txHash: string
  timestamp: number
}

export const useCreateToken = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<Feedback>({
    status: "primary",
    message: ""
  })
  const [deployedToken, setDeployedToken] = useState<DeployedToken | null>(null)

  const resetFeedback = () => {
    setFeedback({ status: "primary", message: "" })
  }

  const validateTokenParams = useCallback((params: TokenParams): boolean => {
    // Check name
    if (!params.name.trim()) {
      toast.error("Token name is required")
      return false
    }

    // Check symbol
    if (!params.symbol.trim()) {
      toast.error("Token symbol is required")
      return false
    }

    // Validate symbol format (alphanumeric only)
    const symbolRegex = /^[a-zA-Z0-9]+$/
    if (!symbolRegex.test(params.symbol.trim())) {
      toast.error("Token symbol must contain only letters and numbers")
      return false
    }

    // Check denomination
    if (!params.denom.trim()) {
      toast.error("Token denomination is required")
      return false
    }

    // Validate denom format (lowercase letters, numbers, and underscores only)
    const denomRegex = /^[a-z0-9_]+$/
    if (!denomRegex.test(params.denom.trim())) {
      toast.error(
        "Denomination must contain only lowercase letters, numbers, and underscores"
      )
      return false
    }

    // Add helpful note about denomination uniqueness
    if (params.denom.trim().length < 3) {
      toast.error(
        "Denomination should be at least 3 characters long to ensure uniqueness"
      )
      return false
    }

    // Check total supply
    if (
      !params.totalSupply.trim() ||
      isNaN(Number(params.totalSupply)) ||
      Number(params.totalSupply) <= 0
    ) {
      toast.error("Total supply must be a valid number greater than 0")
      return false
    }

    // Check if total supply is too large
    try {
      parseUnits(params.totalSupply, parseInt(params.decimals) || 18)
    } catch {
      toast.error("Total supply value is too large or invalid")
      return false
    }

    // Check decimals
    if (
      !params.decimals.trim() ||
      isNaN(Number(params.decimals)) ||
      Number(params.decimals) < 0 ||
      Number(params.decimals) > 18 ||
      !Number.isInteger(Number(params.decimals))
    ) {
      toast.error("Decimals must be an integer between 0 and 18")
      return false
    }

    // Check logo size if present
    if (params.logoBase64 && params.logoBase64.length > 100000) {
      toast.error("Logo image is too large. Please use a smaller image")
      return false
    }

    return true
  }, [])

  const extractTokenAddressFromReceipt = useCallback(
    (receipt: TransactionReceipt): string => {
      try {
        // Look for the log that contains the contract address
        // The precompile adds a log with the contract address in the data field
        const createLog = receipt.logs.find(
          (log: any) =>
            log.address.toLowerCase() ===
            PRECOMPILE_CONTRACT_ADDRESS.toLowerCase()
        )

        if (createLog && createLog.data && createLog.data !== "0x") {
          // The contract address is stored in the data field as bytes (32 bytes padded)
          // Extract the last 20 bytes (40 hex characters) for the address
          let addressHex = createLog.data.slice(-40)

          // Ensure it's a valid address format
          if (
            addressHex.length === 40 &&
            addressHex.match(/^[a-fA-F0-9]{40}$/)
          ) {
            return `0x${addressHex}`
          }

          // If data is exactly 66 chars (0x + 64 hex), it's 32 bytes padded
          if (createLog.data.length === 66) {
            addressHex = createLog.data.slice(-40)
            if (addressHex.match(/^[a-fA-F0-9]{40}$/)) {
              return `0x${addressHex}`
            }
          }
        }

        // Fallback: look for any ERC20-related logs that might contain the address
        for (const log of receipt.logs) {
          // Check if this could be a Transfer event from the newly created token
          // Transfer events have 3 topics: event signature, from, to
          if (
            log.topics.length === 3 &&
            log.address.match(/^0x[a-fA-F0-9]{40}$/)
          ) {
            // Check if the 'from' address is the zero address (mint operation)
            const fromAddress = log.topics[1]
            if (
              fromAddress ===
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            ) {
              // This is likely a mint operation from the newly created token
              return log.address
            }
          }
        }

        console.error("Could not find contract address in transaction receipt")
        return ""
      } catch (error) {
        console.error("Failed to extract token address from receipt:", error)
        return ""
      }
    },
    []
  )

  const createTokenMutation = useMutation({
    mutationFn: async (params: TokenParams) => {
      if (!walletClient || !publicClient || !address) {
        throw new Error("Wallet not connected")
      }

      // Check if we're on the correct network
      const chainId = await publicClient.getChainId()
      console.log("Current chain ID:", chainId, "Expected:", HELIOS_NETWORK_ID)

      if (chainId !== HELIOS_NETWORK_ID) {
        throw new Error(
          `Please switch to Helios network (Chain ID: ${HELIOS_NETWORK_ID})`
        )
      }

      try {
        // Ensure decimals is a valid number between 0 and 18
        const decimals = Math.min(
          Math.max(parseInt(params.decimals) || 18, 0),
          18
        )

        // Format total supply with the correct number of decimals
        const totalSupplyWei = parseUnits(params.totalSupply, decimals)

        // Trim the logo if it's too large (optional)
        const logoBase64 = params.logoBase64 || ""

        console.log("Deployment parameters:", {
          name: params.name,
          symbol: params.symbol,
          denom: params.denom,
          totalSupply: totalSupplyWei.toString(),
          decimals: decimals,
          logoBase64Length: logoBase64.length
        })

        setFeedback({
          status: "primary",
          message: "Preparing transaction..."
        })

        // Validate parameters before encoding
        const name = params.name.trim()
        const symbol = params.symbol.trim()
        const denom = params.denom.trim()

        if (!name || !symbol || !denom) {
          throw new Error("Name, symbol, and denom cannot be empty")
        }

        if (decimals < 0 || decimals > 18) {
          throw new Error("Decimals must be between 0 and 18")
        }

        // Prepare the arguments with proper types
        const args = [
          name,
          symbol,
          denom,
          totalSupplyWei,
          decimals, // This should be uint8
          logoBase64
        ]

        console.log("Function arguments:", {
          name,
          symbol,
          denom,
          totalSupply: totalSupplyWei.toString(),
          decimals,
          logoBase64Length: logoBase64.length
        })

        // Encode the function data
        const data = encodeFunctionData({
          abi: precompileAbi,
          functionName: "createErc20",
          args: args
        })

        console.log("Encoded data:", data)

        // Check if the precompile contract exists
        try {
          const code = await publicClient.getCode({
            address: PRECOMPILE_CONTRACT_ADDRESS as `0x${string}`
          })
          console.log("Precompile contract code:", code)
        } catch (error) {
          console.warn("Could not get precompile contract code:", error)
        }

        setFeedback({
          status: "primary",
          message: "Simulating transaction..."
        })

        toast.info("Simulating transaction to validate parameters...")

        // Simulate the transaction first to catch errors early
        try {
          await publicClient.call({
            account: address,
            to: PRECOMPILE_CONTRACT_ADDRESS as `0x${string}`,
            data: data
          })
          console.log("Transaction simulation successful")
          toast.success("Transaction simulation successful!")
        } catch (simulationError: any) {
          console.warn(
            "Transaction simulation failed:",
            simulationError.message
          )

          // Check for specific errors that should stop execution
          if (
            simulationError.message?.includes(
              "denom metadata already registered"
            )
          ) {
            throw new Error(
              "Denom metadata already registered, choose a unique base denomination"
            )
          }

          if (simulationError.message?.includes("circuit breaker")) {
            throw new Error(
              "Network is currently overloaded. Please try again in a few moments."
            )
          }

          // Check for other validation errors
          if (
            simulationError.message?.includes("name cannot be empty") ||
            simulationError.message?.includes("symbol cannot be empty") ||
            simulationError.message?.includes("denom cannot be empty") ||
            simulationError.message?.includes("cannot contain spaces") ||
            simulationError.message?.includes("length exceeds") ||
            simulationError.message?.includes(
              "total supply must be greater than zero"
            ) ||
            simulationError.message?.includes("decimals cannot exceed")
          ) {
            // Extract the actual error message from the RPC error format
            const descMatch = simulationError.message.match(/desc = (.+?):/)
            if (descMatch) {
              throw new Error(descMatch[1])
            }

            // Fallback: try to extract from other common error formats
            const match = simulationError.message.match(
              /execution reverted: (.+)/
            )
            const actualError = match ? match[1] : simulationError.message
            throw new Error(actualError)
          }

          // For other simulation errors, warn but continue with gas estimation
          toast.warning("Simulation failed, proceeding with gas estimation...")
          console.log(
            "Continuing with gas estimation despite simulation failure"
          )
        }

        setFeedback({
          status: "primary",
          message: "Estimating gas..."
        })

        toast.info("Estimating gas for token deployment...")

        // Estimate gas with better error handling and longer timeout for slow networks
        let gasEstimate
        let intermediateTimeout: NodeJS.Timeout | null = null

        try {
          console.log("Estimating gas with params:", {
            account: address,
            to: PRECOMPILE_CONTRACT_ADDRESS,
            data: data
          })

          // Use a longer timeout for gas estimation since the network can be slow
          const estimationPromise = publicClient.estimateGas({
            account: address,
            to: PRECOMPILE_CONTRACT_ADDRESS as `0x${string}`,
            data: data
          })

          // Add intermediate feedback for long gas estimation
          intermediateTimeout = setTimeout(() => {
            setFeedback({
              status: "primary",
              message: "Network is slow, still estimating gas... Please wait."
            })
            toast.info("Network is slow, still estimating gas... Please wait.")
          }, 30000) // Show message after 30 seconds

          // Add a timeout wrapper with increased timeout for slow networks
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Gas estimation timeout")), 60000) // 60 second timeout
          })

          gasEstimate = (await Promise.race([
            estimationPromise,
            timeoutPromise
          ])) as bigint

          // Clear the intermediate timeout since estimation completed
          if (intermediateTimeout) clearTimeout(intermediateTimeout)
          console.log("Gas estimate:", gasEstimate)
          toast.success("Gas estimation completed successfully!")
        } catch (error: any) {
          // Clear the intermediate timeout in case of error
          if (intermediateTimeout) clearTimeout(intermediateTimeout)
          console.warn(
            "Gas estimation failed, using default gas limit:",
            error.message
          )

          // Most validation errors should have been caught during simulation
          // Only handle network-specific errors here

          // Show user-friendly message for network issues
          if (
            error.message?.includes("timeout") ||
            error.message?.includes("took too long")
          ) {
            setFeedback({
              status: "primary",
              message: "Network is slow, using estimated gas limit..."
            })
            toast.warning("Network is slow...")
          } else if (error.message?.includes("Missing or invalid parameters")) {
            // This can happen during gas estimation but the transaction might still work
            setFeedback({
              status: "primary",
              message: "Using estimated gas limit..."
            })
            toast.info("Using estimated gas limit...")
          }

          // Use a reasonable default gas limit for token creation if estimation fails
          gasEstimate = BigInt(800000) // Increased default gas limit
        }

        // Add 20% buffer to gas estimate
        const gasLimit = (gasEstimate * 120n) / 100n

        // Small delay to let network stabilize if there were issues
        if (gasEstimate === BigInt(800000)) {
          toast.info(
            "Proceeding with default gas limit due to network issues..."
          )
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        setFeedback({
          status: "primary",
          message: "Waiting for wallet confirmation..."
        })

        // Show toast before wallet confirmation
        toast.info("Please confirm the transaction in your wallet...")

        // Send the transaction with user rejection handling
        let txHash
        try {
          txHash = await walletClient.sendTransaction({
            account: address,
            to: PRECOMPILE_CONTRACT_ADDRESS as `0x${string}`,
            data: data,
            gas: gasLimit
          })
        } catch (error: any) {
          // Handle user rejection
          if (
            error.message?.includes("User rejected") ||
            error.message?.includes("user rejected") ||
            error.message?.includes("User denied") ||
            error.message?.includes("user denied") ||
            error.code === 4001 ||
            error.code === "ACTION_REJECTED"
          ) {
            throw new Error("User rejected the request")
          }
          // Re-throw other errors
          throw error
        }

        console.log("Token deployment tx hash:", txHash)

        setFeedback({
          status: "primary",
          message: "Transaction submitted, waiting for confirmation..."
        })

        // Show toast when transaction is submitted
        toast.info(
          "Transaction submitted to network, waiting for confirmation..."
        )
        // Wait for transaction receipt with longer timeout
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 180000 // 3 minute timeout
        })

        // Check if transaction was successful
        if (receipt.status === "reverted" || Number(receipt.status) === 0) {
          // Most errors should have been caught during gas estimation
          // This is a fallback for any remaining transaction failures
          throw new Error(
            "Transaction failed. Please check your parameters and try again."
          )
        }

        toast.success("Transaction confirmed! Processing token deployment...")

        // Extract the contract address from the receipt
        const contractAddress = extractTokenAddressFromReceipt(receipt as any)

        if (!contractAddress) {
          throw new Error(
            "Failed to extract token address from transaction receipt"
          )
        }

        setFeedback({
          status: "success",
          message: "Token deployed successfully!"
        })

        // Show success toast
        toast.success("Token deployed successfully!")

        const deployedTokenData: DeployedToken = {
          address: contractAddress,
          name: params.name.trim(),
          symbol: params.symbol.trim(),
          denom: params.denom.trim(),
          totalSupply: params.totalSupply,
          decimals: decimals,
          logoBase64: logoBase64,
          txHash: txHash,
          timestamp: Date.now()
        }

        setDeployedToken(deployedTokenData)

        return { receipt, deployedToken: deployedTokenData }
      } catch (error: any) {
        console.error("Token deployment failed:", error)

        // Don't show error feedback for user rejection
        if (
          error.message?.includes("User rejected") ||
          error.message?.includes("user rejected") ||
          error.message?.includes("User denied") ||
          error.message?.includes("user denied")
        ) {
          setFeedback({
            status: "primary",
            message: ""
          })
        } else {
          setFeedback({
            status: "danger",
            message: getErrorMessage(error) || "Error during token deployment"
          })
        }

        throw error
      }
    },
    onError: (error: any) => {
      console.error("Token deployment mutation error:", error)

      // Don't show error feedback for user rejection
      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("user rejected") ||
        error.message?.includes("User denied") ||
        error.message?.includes("user denied")
      ) {
        setFeedback({
          status: "primary",
          message: ""
        })
      } else {
        setFeedback({
          status: "danger",
          message: getErrorMessage(error) || "Error during token deployment"
        })
      }
    }
  })

  const createToken = async (params: TokenParams) => {
    if (!validateTokenParams(params)) return null

    try {
      const result = await createTokenMutation.mutateAsync(params)
      return result
    } catch (error: any) {
      console.error("Token deployment failed:", error)
      throw error
    }
  }

  const reset = useCallback(() => {
    setDeployedToken(null)
    resetFeedback()
    createTokenMutation.reset()
  }, [createTokenMutation])

  return {
    createToken,
    reset,
    deployedToken,
    isLoading: createTokenMutation.isPending,
    feedback,
    error: createTokenMutation.error
  }
}

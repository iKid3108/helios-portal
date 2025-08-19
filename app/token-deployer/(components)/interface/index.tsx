"use client"

import React from "react"
import { Button } from "@/components/button"
import { Card } from "@/components/card"
import { Heading } from "@/components/heading"
import { Icon } from "@/components/icon"
import { Input } from "@/components/input"
import { Modal } from "@/components/modal"
import { formatNumber } from "@/lib/utils/number"
import Image from "next/image"
import { ChangeEvent, useState, useCallback } from "react"
import { toast } from "sonner"
import s from "./interface.module.scss"
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient
} from "wagmi"
import {
  PRECOMPILE_CONTRACT_ADDRESS,
  precompileAbi
} from "@/constant/helios-contracts"
import { HELIOS_NETWORK_ID } from "@/config/app"
import { parseUnits, getContractAddress } from "viem"
import { getErrorMessage } from "@/utils/string"

type TokenForm = {
  name: string
  symbol: string
  denom: string
  totalSupply: string
  decimals: string
  logoBase64: string
  inProgress: boolean
}

type DeployedToken = {
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

export const TokenDeployerInterface = () => {
  const chainId = useChainId()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [showPreview, setShowPreview] = useState(false)
  const [deployedToken, setDeployedToken] = useState<DeployedToken | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false)

  const [form, setForm] = useState<TokenForm>({
    name: "",
    symbol: "",
    denom: "",
    totalSupply: "",
    decimals: "18",
    logoBase64: "",
    inProgress: false
  })

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash
  })

  // Handle transaction confirmation status
  React.useEffect(() => {
    if (isConfirming && hash) {
      toast.info("Transaction is being confirmed...")
    }
  }, [isConfirming, hash])

  // Handle transaction errors
  React.useEffect(() => {
    if (writeError || confirmError) {
      const errorMessage = writeError
        ? getErrorMessage(writeError)
        : getErrorMessage(confirmError)

      toast.error(errorMessage || "Transaction failed")
      setForm((prev) => ({ ...prev, inProgress: false }))
      setShowPreview(false) // Close the preview modal if open
    }
  }, [writeError, confirmError])

  // Reset form state if transaction is pending for too long
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (isPending && form.inProgress) {
      timeoutId = setTimeout(() => {
        // Check if still pending after timeout
        if (form.inProgress) {
          toast.error("Transaction dropped. Please try again.")
          setForm((prev) => ({ ...prev, inProgress: false }))
          setShowPreview(false)
        }
      }, 30000) // 30 seconds timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isPending, form.inProgress])

  const handleInputChange =
    (field: keyof TokenForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value

      // Validation for specific fields
      if (field === "decimals") {
        const decimalsValue = parseInt(value)
        if (
          value !== "" &&
          (isNaN(decimalsValue) || decimalsValue < 0 || decimalsValue > 18)
        ) {
          return
        }
      }

      if (field === "totalSupply") {
        if (value !== "" && (isNaN(Number(value)) || Number(value) < 0)) {
          return
        }
      }

      setForm((prev) => ({
        ...prev,
        [field]: value
      }))
    }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPEG)")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = () => {
        // Create canvas to resize image to 200x200
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        canvas.width = 200
        canvas.height = 200

        if (ctx) {
          ctx.drawImage(img, 0, 0, 200, 200)
          const base64 = canvas.toDataURL("image/png").split(",")[1]
          setForm((prev) => ({
            ...prev,
            logoBase64: base64
          }))
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const validateForm = (): boolean => {
    // Check name
    if (!form.name.trim()) {
      toast.error("Token name is required")
      return false
    }

    // Check symbol
    if (!form.symbol.trim()) {
      toast.error("Token symbol is required")
      return false
    }

    // Validate symbol format (alphanumeric only)
    const symbolRegex = /^[a-zA-Z0-9]+$/
    if (!symbolRegex.test(form.symbol.trim())) {
      toast.error("Token symbol must contain only letters and numbers")
      return false
    }

    // Check denomination
    if (!form.denom.trim()) {
      toast.error("Token denomination is required")
      return false
    }

    // Validate denom format (lowercase letters, numbers, and underscores only)
    const denomRegex = /^[a-z0-9_]+$/
    if (!denomRegex.test(form.denom.trim())) {
      toast.error(
        "Denomination must contain only lowercase letters, numbers, and underscores"
      )
      return false
    }

    // Check total supply
    if (
      !form.totalSupply.trim() ||
      isNaN(Number(form.totalSupply)) ||
      Number(form.totalSupply) <= 0
    ) {
      toast.error("Total supply must be a valid number greater than 0")
      return false
    }

    // Check if total supply is too large
    try {
      parseUnits(form.totalSupply, parseInt(form.decimals) || 18)
    } catch {
      toast.error("Total supply value is too large or invalid")
      return false
    }

    // Check decimals
    if (
      !form.decimals.trim() ||
      isNaN(Number(form.decimals)) ||
      Number(form.decimals) < 0 ||
      Number(form.decimals) > 18 ||
      !Number.isInteger(Number(form.decimals))
    ) {
      toast.error("Decimals must be an integer between 0 and 18")
      return false
    }

    // Check logo size if present
    if (form.logoBase64 && form.logoBase64.length > 100000) {
      toast.error("Logo image is too large. Please use a smaller image")
      return false
    }

    return true
  }

  const handlePreview = () => {
    if (!validateForm()) return
    setShowPreview(true)
  }

  const predictTokenAddress = useCallback(async (): Promise<string> => {
    if (!address || !publicClient) return ""

    try {
      // Get the current nonce from the blockchain
      const nonce = await publicClient.getTransactionCount({
        address: address as `0x${string}`
      })

      return getContractAddress({
        from: address as `0x${string}`,
        nonce: BigInt(nonce)
      })
    } catch (error) {
      console.error("Failed to predict token address:", error)
      return ""
    }
  }, [address, publicClient])

  const handleDeploy = async () => {
    if (!validateForm()) return

    if (!address) {
      toast.error("Please connect your wallet to deploy tokens")
      return
    }

    if (chainId !== HELIOS_NETWORK_ID) {
      toast.error("Please switch to Helios network to deploy tokens")
      return
    }

    setForm((prev) => ({ ...prev, inProgress: true }))

    // Reset the flag for new deployment and clear any stored transaction hash
    setHasProcessedSuccess(false)
    localStorage.removeItem("lastProcessedTxHash")

    // Set a timeout to reset the form state if the transaction takes too long
    const timeoutId = setTimeout(() => {
      if (form.inProgress) {
        toast.error("Transaction timeout. Check your wallet for status.")
        setForm((prev) => ({ ...prev, inProgress: false }))
      }
    }, 60000) // 60 seconds timeout

    try {
      toast.info("Initiating token deployment...")

      // Ensure decimals is a valid number between 0 and 18
      const decimals = Math.min(Math.max(parseInt(form.decimals) || 18, 0), 18)

      // Format total supply with the correct number of decimals
      const totalSupplyWei = parseUnits(form.totalSupply, decimals)

      // Trim the logo if it's too large (optional)
      const logoBase64 = form.logoBase64 || ""

      console.log("Deployment parameters:", {
        name: form.name,
        symbol: form.symbol,
        denom: form.denom,
        totalSupply: totalSupplyWei.toString(),
        decimals: decimals,
        logoBase64Length: logoBase64.length
      })

      await writeContract({
        address: PRECOMPILE_CONTRACT_ADDRESS as `0x${string}`,
        abi: precompileAbi,
        functionName: "createErc20",
        args: [
          form.name.trim(),
          form.symbol.trim(),
          form.denom.trim(),
          totalSupplyWei,
          decimals,
          logoBase64
        ]
      })

      toast.info("Transaction submitted, waiting for confirmation...")
      clearTimeout(timeoutId) // Clear the timeout if transaction is submitted
    } catch (err: any) {
      clearTimeout(timeoutId) // Clear the timeout if there's an error
      console.error("Token deployment error:", err)
      toast.error(getErrorMessage(err) || "Failed to deploy token")
      setForm((prev) => ({ ...prev, inProgress: false }))
    }
  }

  // Handle successful deployment
  React.useEffect(() => {
    let isMounted = true

    // Store the current transaction hash to prevent reprocessing
    const currentHash = hash

    if (isConfirmed && currentHash && !hasProcessedSuccess) {
      const handleSuccess = async () => {
        if (!isMounted) return

        // Set this flag immediately to prevent multiple executions
        setHasProcessedSuccess(true)

        const predictedAddress = await predictTokenAddress()

        const deployedTokenData: DeployedToken = {
          address: predictedAddress,
          name: form.name,
          symbol: form.symbol,
          denom: form.denom,
          totalSupply: form.totalSupply,
          decimals: parseInt(form.decimals),
          logoBase64: form.logoBase64,
          txHash: currentHash,
          timestamp: Date.now()
        }

        setDeployedToken(deployedTokenData)
        setShowPreview(false)
        setShowSuccess(true)
        setForm((prev) => ({ ...prev, inProgress: false }))

        // Store in localStorage for recents
        const recents = JSON.parse(
          localStorage.getItem("deployedTokens") || "[]"
        )
        recents.unshift(deployedTokenData)
        localStorage.setItem(
          "deployedTokens",
          JSON.stringify(recents.slice(0, 10))
        ) // Keep only last 10

        toast.success("Token deployed successfully!")

        // Store this hash in localStorage to prevent reprocessing on page refresh
        localStorage.setItem("lastProcessedTxHash", currentHash)
      }

      // Check if we've already processed this hash (in case of page refresh)
      const lastProcessedHash = localStorage.getItem("lastProcessedTxHash")
      if (lastProcessedHash !== currentHash) {
        handleSuccess()
      }
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [isConfirmed, hash, hasProcessedSuccess, form, predictTokenAddress])

  const handleAddToWallet = async () => {
    if (!deployedToken || !window.ethereum) return

    try {
      await (window.ethereum.request as any)({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: deployedToken.address,
            symbol: deployedToken.symbol,
            decimals: deployedToken.decimals,
            image: deployedToken.logoBase64
              ? `data:image/png;base64,${deployedToken.logoBase64}`
              : undefined
          }
        }
      })
      toast.success("Token added to wallet!")
    } catch {
      toast.error("Failed to add token to wallet")
    }
  }

  const resetForm = () => {
    setForm({
      name: "",
      symbol: "",
      denom: "",
      totalSupply: "",
      decimals: "18",
      logoBase64: "",
      inProgress: false
    })
    setDeployedToken(null)
    setShowSuccess(false)
    setShowPreview(false)

    // We don't reset hasProcessedSuccess here to prevent the modal from reopening
    // It will be reset when a new deployment is initiated
  }

  const isFormValid =
    form.name && form.symbol && form.denom && form.totalSupply && form.decimals
  const isHeliosNetwork = chainId === HELIOS_NETWORK_ID
  const isWalletConnected = !!address

  return (
    <>
      <Card className={s.interface}>
        <Heading
          icon="hugeicons:coins-01"
          title="Token Deployer"
          description="Create your own HRC20 token on Helios blockchain."
        />

        <div className={s.content}>
          <div className={s.form}>
            {/* Token Name */}
            <Input
              label="Token Name"
              icon="hugeicons:text"
              type="text"
              value={form.name}
              placeholder="e.g., Helios Token"
              onChange={handleInputChange("name")}
              maxLength={50}
            />

            {/* Token Symbol */}
            <Input
              label="Token Symbol"
              icon="hugeicons:tag-01"
              type="text"
              value={form.symbol}
              placeholder="e.g., HLS"
              onChange={handleInputChange("symbol")}
              maxLength={10}
              style={{ textTransform: "uppercase" }}
            />

            {/* Token Denomination */}
            <Input
              label="Denomination (smallest unit)"
              icon="hugeicons:coins-01"
              type="text"
              value={form.denom}
              placeholder="e.g., ahelios"
              onChange={handleInputChange("denom")}
              maxLength={20}
            />

            {/* Total Supply */}
            <Input
              label="Total Supply"
              icon="hugeicons:coins-02"
              type="text"
              value={form.totalSupply}
              placeholder="e.g., 1000000"
              onChange={handleInputChange("totalSupply")}
            />

            {/* Decimals */}
            <Input
              label="Decimals (0-18)"
              icon="hugeicons:balance-scale"
              type="number"
              value={form.decimals}
              placeholder="18"
              onChange={handleInputChange("decimals")}
              min={0}
              max={18}
            />

            {/* Logo Upload */}
            <div className={s.uploadSection}>
              <label className={s.uploadLabel}>
                Upload Logo (200x200px, optional)
              </label>
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className={s.fileInput}
              />
              <label htmlFor="logo" className={s.fileLabel}>
                <Icon icon="hugeicons:image-01" />
                {form.logoBase64 ? "Change Logo" : "Upload Logo"}
              </label>
              {form.logoBase64 && (
                <div className={s.logoPreview}>
                  <Image
                    src={`data:image/png;base64,${form.logoBase64}`}
                    alt="Token logo"
                    width={50}
                    height={50}
                  />
                  <span>Logo uploaded successfully</span>
                </div>
              )}
            </div>

            {/* Wallet Connection Warning */}
            {!isWalletConnected && (
              <div className={s.walletWarning}>
                <Icon icon="hugeicons:alert-02" />
                Please connect your wallet to deploy tokens
              </div>
            )}

            {/* Network Warning */}
            {isWalletConnected && !isHeliosNetwork && (
              <div className={s.warning}>
                <Icon icon="hugeicons:alert-02" />
                Please switch to Helios network to deploy tokens
              </div>
            )}

            {/* Action Buttons */}
            <div className={s.actions}>
              <Button
                variant="secondary"
                onClick={handlePreview}
                disabled={
                  !isFormValid || !isHeliosNetwork || !isWalletConnected
                }
                className={s.previewBtn}
              >
                Preview Token
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={
                  !isFormValid ||
                  !isHeliosNetwork ||
                  !isWalletConnected ||
                  form.inProgress ||
                  isPending ||
                  isConfirming
                }
                className={s.deployBtn}
              >
                {form.inProgress || isPending || isConfirming
                  ? "Deploying..."
                  : !isWalletConnected
                  ? "Connect Wallet"
                  : "Deploy Token"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Review Token Details"
        className={s.modal}
      >
        <Card className={s.previewCard}>
          <div className={s.preview}>
            <div className={s.previewItem}>
              <span className={s.previewLabel}>Name:</span>
              <span className={s.previewValue}>{form.name}</span>
            </div>
            <div className={s.previewItem}>
              <span className={s.previewLabel}>Symbol:</span>
              <span className={s.previewValue}>
                {form.symbol.toUpperCase()}
              </span>
            </div>
            <div className={s.previewItem}>
              <span className={s.previewLabel}>Denomination:</span>
              <span className={s.previewValue}>{form.denom}</span>
            </div>
            <div className={s.previewItem}>
              <span className={s.previewLabel}>Total Supply:</span>
              <span className={s.previewValue}>
                {formatNumber(Number(form.totalSupply))}{" "}
                {form.symbol.toUpperCase()}
              </span>
            </div>
            <div className={s.previewItem}>
              <span className={s.previewLabel}>Decimals:</span>
              <span className={s.previewValue}>{form.decimals}</span>
            </div>
            {form.logoBase64 && (
              <div className={s.previewItem}>
                <span className={s.previewLabel}>Logo:</span>
                <Image
                  src={`data:image/png;base64,${form.logoBase64}`}
                  alt="Token logo"
                  width={50}
                  height={50}
                  className={s.previewLogo}
                />
              </div>
            )}
          </div>

          <div className={s.modalActions}>
            <Button
              variant="secondary"
              onClick={() => setShowPreview(false)}
              className={s.editButton}
            >
              Edit
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={form.inProgress || isPending || isConfirming}
            >
              {form.inProgress || isPending || isConfirming
                ? "Deploying..."
                : "Confirm Deploy"}
            </Button>
          </div>
        </Card>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false)
        }}
        title="Token Deployed Successfully!"
        className={s.modal}
      >
        <Card className={s.successCard}>
          <Heading
            icon="hugeicons:checkmark-circle-02"
            title="Deployment Complete"
            description="Your token has been successfully created on the Helios blockchain"
          />

          {deployedToken && (
            <div className={s.success}>
              <div className={s.successItem}>
                <span className={s.successLabel}>Token Address:</span>
                <div className={s.addressContainer}>
                  <code className={s.address}>{deployedToken.address}</code>
                  <Button
                    variant="secondary"
                    size="xsmall"
                    onClick={() => {
                      navigator.clipboard.writeText(deployedToken.address)
                      toast.success("Address copied!")
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className={s.successItem}>
                <span className={s.successLabel}>Transaction Hash:</span>
                <div className={s.addressContainer}>
                  <code className={s.txHash}>{deployedToken.txHash}</code>
                  <Button
                    variant="secondary"
                    size="xsmall"
                    onClick={() => {
                      navigator.clipboard.writeText(deployedToken.txHash)
                      toast.success("Transaction hash copied!")
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className={s.successActions}>
                <Button
                  variant="secondary"
                  onClick={handleAddToWallet}
                  iconLeft="hugeicons:wallet-01"
                >
                  Add to Wallet
                </Button>
                <Button onClick={resetForm}>Deploy Another Token</Button>
              </div>
            </div>
          )}
        </Card>
      </Modal>
    </>
  )
}

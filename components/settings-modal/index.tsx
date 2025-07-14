"use client"

import { Button } from "@/components/button"
import { Input } from "@/components/input/input"
import { Modal } from "@/components/modal"
import { useAppStore } from "@/stores/app"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import s from "./settings-modal.module.scss"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const { debugMode, setDebugMode, rpcUrl, setRpcUrl } = useAppStore()

  // Initialize local state from the current store values
  // Using useEffect to ensure we always have the latest values from the store
  const [localDebugMode, setLocalDebugMode] = useState(debugMode)
  const [localRpcUrl, setLocalRpcUrl] = useState(rpcUrl)

  // Update local state when the modal is opened
  useEffect(() => {
    if (open) {
      setLocalDebugMode(debugMode)
      setLocalRpcUrl(rpcUrl)
    }
  }, [debugMode, rpcUrl, open])

  const handleSave = () => {
    // Check if debug mode or RPC URL has changed
    const debugModeChanged = debugMode !== localDebugMode
    const rpcUrlChanged = rpcUrl !== localRpcUrl && localDebugMode

    // Update settings in the store
    setDebugMode(localDebugMode)

    // Update RPC URL based on debug mode
    if (localDebugMode) {
      // In debug mode, use the custom RPC URL
      setRpcUrl(localRpcUrl)
    } else if (debugMode && !localDebugMode) {
      // If debug mode was turned off, reset to default RPC URL
      // This ensures we don't use a custom RPC URL when debug mode is off
      setRpcUrl("https://testnet1.helioschainlabs.org")
    }

    // Manually update localStorage to ensure settings are persisted immediately
    try {
      const storeData = JSON.parse(
        localStorage.getItem("helios-app-store") || "{}"
      )
      storeData.state = {
        ...storeData.state,
        debugMode: localDebugMode,
        rpcUrl: localDebugMode
          ? localRpcUrl
          : "https://testnet1.helioschainlabs.org"
      }
      localStorage.setItem("helios-app-store", JSON.stringify(storeData))
    } catch (e) {
      console.error("Error updating localStorage:", e)
    }

    toast.success("Settings saved successfully!")
    onClose()

    // Manually refresh the page if settings changed
    if (debugModeChanged || rpcUrlChanged) {
      toast.info("Refreshing page to apply new settings...", {
        duration: 2000,
        onAutoClose: () => {
          window.location.reload()
        }
      })
    }
  }

  const handleCancel = () => {
    setLocalDebugMode(debugMode) // Reset to original value
    setLocalRpcUrl(rpcUrl) // Reset to original value
    onClose()
  }

  return (
    <Modal
      title="Settings"
      className={s.modal}
      open={open}
      onClose={onClose}
      responsiveBottom
    >
      <div className={s.content}>
        <div className={s.section}>
          <h3 className={s.sectionTitle}>Debug Mode</h3>
          <p className={s.sectionDescription}>
            Enable debug mode to show additional development information like
            the latest block number in the bottom right corner.
          </p>

          <div className={s.toggleGroup}>
            <label className={s.toggle}>
              <input
                type="checkbox"
                checked={localDebugMode}
                onChange={(e) => {
                  const newDebugMode = e.target.checked
                  setLocalDebugMode(newDebugMode)

                  // If debug mode is being turned off, reset RPC URL input to default
                  if (!newDebugMode) {
                    setLocalRpcUrl("https://testnet1.helioschainlabs.org")
                  }
                }}
                className={s.toggleInput}
              />
              <span className={s["toggle-track"]}>
                <span className={s["toggle-thumb"]}></span>
              </span>
              <span className={s.toggleLabel}>
                {localDebugMode ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </div>

        {localDebugMode && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>RPC Configuration</h3>
            <p className={s.sectionDescription}>
              Configure RPC endpoints for different networks.
            </p>

            <div className={s.rpcList}>
              <div className={s.rpcItem}>
                <Input
                  label="Helios Testnet RPC"
                  value={localRpcUrl}
                  onChange={(e) => setLocalRpcUrl(e.target.value)}
                  helperText="Custom RPC endpoint for Helios testnet"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={s.actions}>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} icon="hugeicons:checkmark-circle-02">
          Save Settings
        </Button>
      </div>
    </Modal>
  )
}

"use client"

import { Button } from "@/components/button"
import { Input } from "@/components/input/input"
import { Modal } from "@/components/modal"
import { useAppStore } from "@/stores/app"
import { useState } from "react"
import { toast } from "sonner"
import s from "./settings-modal.module.scss"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const { debugMode, setDebugMode } = useAppStore()
  const [localDebugMode, setLocalDebugMode] = useState(debugMode)
  console.log("ModaldebugMode", localDebugMode, debugMode)

  const handleSave = () => {
    setDebugMode(localDebugMode)
    toast.success("Settings saved successfully!")
    onClose()
  }

  const handleCancel = () => {
    setLocalDebugMode(debugMode) // Reset to original value
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
                onChange={(e) => setLocalDebugMode(e.target.checked)}
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

        <div className={s.section}>
          <h3 className={s.sectionTitle}>RPC Configuration</h3>
          <p className={s.sectionDescription}>
            Configure RPC endpoints for different networks. (Coming soon)
          </p>

          <div className={s.rpcList}>
            <div className={s.rpcItem}>
              <Input
                label="Helios Testnet RPC"
                value="https://testnet1.helioschainlabs.org"
                disabled
                helperText="Default RPC endpoint for Helios testnet"
              />
            </div>
          </div>
        </div>
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

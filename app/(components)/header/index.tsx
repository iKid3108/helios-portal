"use client"

import { Link } from "@/components/link"
import { Logotype } from "@/components/logotype"
import { Button } from "@/components/button"
import { SettingsModal } from "@/components/settings-modal"
import routes from "@/config/routes"
import { Chains } from "../chains"
import { Nav } from "../nav"
import { Wallet } from "../wallet"
import s from "./header.module.scss"
import { useState } from "react"

export const Header = () => {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSettingsOpen = () => {
    setSettingsOpen(true)
  }

  const handleSettingsClose = () => {
    setSettingsOpen(false)
  }

  return (
    <>
      <header className={s.header}>
        <Link className={s.logotype} href={routes.dashboard}>
          <Logotype />
        </Link>
        <Nav />
        <div className={s.right}>
          <Button
            variant="secondary"
            icon="hugeicons:settings-02"
            border
            onClick={handleSettingsOpen}
            title="Settings"
          />
          <Chains />
          <Wallet />
        </div>
      </header>

      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
    </>
  )
}

"use client"

import { Card } from "@/components/card"
import { Heading } from "@/components/heading"
import { Icon } from "@/components/icon"
import s from "./notes.module.scss"

export const ImportantNotes = () => {
  const notes = [
    {
      icon: "hugeicons:lock",
      text: "Token parameters cannot be modified after deployment"
    },
    {
      icon: "hugeicons:coins-01",
      text: "Deployment requires a small amount of HLS for gas fees"
    },
    {
      icon: "hugeicons:neural-network",
      text: "Ensure you're connected to the Helios network"
    }
  ]

  return (
    <Card className={s.notes}>
      <Heading
        icon="hugeicons:shield-energy"
        title="Important Notes"
        description="Please read before deploying"
      />

      <div className={s.content}>
        {notes.map((note, index) => (
          <div key={index} className={s.note}>
            <Icon icon={note.icon} />
            <span>{note.text}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

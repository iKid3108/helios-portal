"use client"

import { Card } from "@/components/card"
import { Heading } from "@/components/heading"
import { Icon } from "@/components/icon"
import s from "./tips.module.scss"

export const BestPractices = () => {
  const tips = [
    {
      icon: "hugeicons:text",
      title: "Token Symbol",
      description:
        "Use 3-5 characters for better readability (e.g., HLS, USDT, BTC)"
    },
    {
      icon: "hugeicons:coins-01",
      title: "Denomination",
      description:
        "The smallest unit of your token (e.g., 'ahelios' for Helios, 'wei' for Ethereum)"
    },
    {
      icon: "hugeicons:balance-scale",
      title: "Decimals",
      description:
        "18 decimals is standard for most tokens, allowing for precise fractional amounts."
    },
    {
      icon: "hugeicons:security-check",
      title: "Security",
      description:
        "Double-check all details before deployment. Token parameters cannot be changed after creation."
    }
  ]

  return (
    <Card className={s.tips}>
      <Heading
        icon="hugeicons:bubble-chat-question"
        title="Best Practices"
        description="Tips for creating a successful token"
      />

      <div className={s.content}>
        {tips.map((tip, index) => (
          <div key={index} className={s.tip}>
            <div className={s.tipIcon}>
              <Icon icon={tip.icon} />
            </div>
            <div className={s.tipContent}>
              <h4 className={s.tipTitle}>{tip.title}</h4>
              <p className={s.tipDescription}>{tip.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

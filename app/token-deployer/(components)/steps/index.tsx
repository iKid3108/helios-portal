"use client"

import { Card } from "@/components/card"
import { Heading } from "@/components/heading"
import { Icon } from "@/components/icon"
import s from "./steps.module.scss"

export const DeploymentSteps = () => {
  const steps = [
    {
      icon: "hugeicons:edit-01",
      title: "Fill Token Details",
      description:
        "Enter your token name, symbol, denomination, total supply, and decimals."
    },
    {
      icon: "hugeicons:image-01",
      title: "Upload Logo (Optional)",
      description:
        "Add a 200x200px logo for your token. Supports PNG and JPEG formats."
    },
    {
      icon: "hugeicons:eye",
      title: "Preview Token",
      description:
        "Review all token details before deployment to ensure everything is correct."
    },
    {
      icon: "hugeicons:rocket-01",
      title: "Deploy Token",
      description:
        "Deploy your HRC20 token to the Helios blockchain with a single transaction."
    },
    {
      icon: "hugeicons:wallet-01",
      title: "Add to Wallet",
      description:
        "Automatically add your newly created token to your wallet for easy access."
    }
  ]

  return (
    <Card className={s.steps}>
      <Heading
        icon="hugeicons:chart-up"
        title="Deployment Steps"
        description="Follow these steps to deploy your token"
      />

      <div className={s.content}>
        {steps.map((step, index) => (
          <div key={index} className={s.step}>
            <div className={s.stepIcon}>
              <Icon icon={step.icon} />
              <span className={s.stepNumber}>{index + 1}</span>
            </div>
            <div className={s.stepContent}>
              <h4 className={s.stepTitle}>{step.title}</h4>
              <p className={s.stepDescription}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

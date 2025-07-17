"use client"

import { Button } from "@/components/button"
import { Input } from "@/components/input/input"
import { Select } from "@/components/input/select"
import { Message } from "@/components/message"
import { Modal } from "@/components/modal"
import { useCreateProposal } from "@/hooks/useCreateProposal"
import { useState } from "react"
import { toast } from "sonner"
import { useAccount } from "wagmi"
import s from "./proposal.module.scss"

interface ModalProposalProps {
  open: boolean
  onClose: () => void
}

export const ModalProposal = ({ open, onClose }: ModalProposalProps) => {
  const [proposalType, setProposalType] = useState<string>("")
  const [proposalTitle, setProposalTitle] = useState<string>("")
  const [proposalDescription, setProposalDescription] = useState<string>("")
  const [initialDeposit, setInitialDeposit] = useState<number>(1)
  const [denom, setDenom] = useState<string>("")
  const [magnitude, setMagnitude] = useState<string>("")
  const [direction, setDirection] = useState<string>("")

  const { address } = useAccount()
  const { createProposal, feedback, resetFeedback, isLoading } =
    useCreateProposal()

  const handleSubmit = async () => {
    if (!proposalTitle.trim()) {
      toast.error("Please enter a proposal title")
      return
    }

    if (!proposalDescription.trim()) {
      toast.error("Please enter a proposal description")
      return
    }

    if (!proposalType) {
      toast.error("Please select a proposal type")
      return
    }

    if (proposalType === "text-proposal") {
      try {
        resetFeedback()

        // Create the message object for text proposal
        const msg = JSON.stringify({
          "@type": "/helios.hyperion.v1.MsgUpdateOutTxTimeout",
          signer: address,
          chain_id: 11155111,
          target_batch_timeout: 3600000,
          target_outgoing_tx_timeout: 3600000
        })

        // Convert HLS to wei (assuming 18 decimals)
        const depositInWei = (initialDeposit * Math.pow(10, 18)).toString()

        await createProposal(
          proposalTitle,
          proposalDescription,
          msg,
          depositInWei
        )

        toast.success("Text proposal submitted successfully!")
        onClose()

        // Reset form
        setProposalTitle("")
        setProposalDescription("")
        setProposalType("")
        setInitialDeposit(100)
      } catch (error) {
        console.error("Failed to create proposal:", error)
        toast.error("Failed to submit proposal. Please try again.")
      }
    } else {
      // For other proposal types, show the old success message
      toast.success("Proposal submitted successfully")
      onClose()
    }
  }

  const showWeightChangeInputs = proposalType === "asset-weight-change"
  const isTextProposal = proposalType === "text-proposal"

  // Show blockchain feedback for text proposals
  const showBlockchainFeedback = isTextProposal && feedback.message

  return (
    <Modal
      title="Submit a Governance Proposal"
      className={s.modal}
      open={open}
      onClose={onClose}
      responsiveBottom
    >
      <div className={s.content}>
        <Input
          icon="hugeicons:edit-02"
          label="Proposal Title"
          placeholder="Enter a clear & concise title"
          value={proposalTitle}
          onChange={(e) => setProposalTitle(e.target.value)}
        />
        <Select
          icon="hugeicons:list-setting"
          label="Proposal Type"
          value={proposalType}
          onChange={(e) => setProposalType(e.target.value)}
          options={[
            { value: "parameter-change", label: "Parameter Change" },
            { value: "asset-addition", label: "Asset Addition" },
            { value: "asset-weight-change", label: "Asset Weight Change" },
            { value: "text-proposal", label: "Text Proposal" },
            { value: "software-upgrade", label: "Software Upgrade" }
          ]}
        />
        <Input
          icon="hugeicons:ai-content-generator-01"
          type="textarea"
          label="Proposal Description"
          placeholder="Provide a detailed description of your proposal including rationale and expected impact."
          value={proposalDescription}
          onChange={(e) => setProposalDescription(e.target.value)}
        />

        {showWeightChangeInputs && (
          <div className={s.weightChangeGroup}>
            <Input
              icon="ph:currency-circle-dollar"
              label="Denom"
              placeholder="Enter token denom (e.g., ETH, BNB, USDT)"
              value={denom}
              onChange={(e) => setDenom(e.target.value)}
            />

            <Select
              icon="mdi:arrow-expand-vertical"
              label="Magnitude"
              value={magnitude}
              onChange={(e) => setMagnitude(e.target.value)}
              options={[
                { value: "SMALL", label: "SMALL" },
                { value: "MEDIUM", label: "MEDIUM" },
                { value: "HIGH", label: "HIGH" }
              ]}
            />
            <Select
              icon="mdi:arrow-up-down"
              label="Direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              options={[
                { value: "UP", label: "UP" },
                { value: "DOWN", label: "DOWN" }
              ]}
            />
          </div>
        )}

        <Input
          icon="helios"
          label="Initial Deposit (HLS)"
          type="number"
          value={initialDeposit}
          onChange={(e) => setInitialDeposit(Number(e.target.value))}
          min={1}
          helperText="Minimum deposit: 1 HLS. This deposit will be returned if the proposal reaches quorum."
        />

        {showBlockchainFeedback && (
          <Message
            icon={
              feedback.status === "success"
                ? "hugeicons:checkmark-circle-02"
                : feedback.status === "danger"
                ? "hugeicons:alert-circle"
                : "hugeicons:loading-03"
            }
            title={
              feedback.status === "success"
                ? "Success"
                : feedback.status === "danger"
                ? "Error"
                : "Processing"
            }
            className={s.message}
            variant={feedback.status === "danger" ? "warning" : "warning"}
          >
            {feedback.message}
          </Message>
        )}

        <Message
          icon="hugeicons:information-circle"
          title="Important Information"
          className={s.message}
          variant="warning"
        >
          Once submitted, your proposal will be visible to all network
          participants and cannot be modified. Ensure all details are accurate
          and the description is clear before submitting.
        </Message>
      </div>

      <div className={s.group}>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          className={s.confirm}
          onClick={handleSubmit}
          icon="hugeicons:keyframes-double-add"
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit Proposal"}
        </Button>
      </div>
    </Modal>
  )
}

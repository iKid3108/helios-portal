"use client"

import { Icon } from "@/components/icon"
import { useVote } from "@/hooks/useVote"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAccount } from "wagmi"
import styles from "./voting-section.module.scss"

interface VotingSectionProps {
  proposalId: number
  status: string
  votingEndTime: string
}

// Vote options enum matching your smart contract
enum VoteOption {
  YES = 1,
  ABSTAIN = 2,
  NO = 3,
  NO_WITH_VOTE = 4
}

export function VotingSection({
  proposalId,
  status,
  votingEndTime
}: VotingSectionProps) {
  const { address, isConnected } = useAccount()
  const { vote, feedback, resetFeedback, isLoading } = useVote()
  const [selectedVote, setSelectedVote] = useState<VoteOption | null>(null)
  const [voteMetadata, setVoteMetadata] = useState("")
  const [hasVoted, setHasVoted] = useState(false)

  const submitVote = async () => {
    if (!address || selectedVote === null) return

    try {
      await vote(proposalId, selectedVote, voteMetadata)
    } catch (error) {
      console.error("Error submitting vote:", error)
    }
  }

  // Handle toast notifications based on feedback status
  useEffect(() => {
    if (!feedback.message) return

    const handleToast = async () => {
      if (feedback.status === "primary" && isLoading) {
        toast.loading(feedback.message, { id: "vote-status" })
      } else if (feedback.status === "success") {
        toast.success(feedback.message, { id: "vote-status" })
        // Mark as voted but allow voting again
        setHasVoted(true)
        setVoteMetadata("")
        // Reset hasVoted after showing confirmation briefly
        setTimeout(() => setHasVoted(false), 3000)
      } else if (feedback.status === "danger") {
        toast.error(feedback.message, { id: "vote-status" })
      }

      // Reset feedback after handling
      setTimeout(() => resetFeedback(), 100)
    }

    handleToast()
  }, [feedback, isLoading, resetFeedback])

  const canVote =
    status === "VOTING_PERIOD" && new Date() < new Date(votingEndTime)
  // const canVote = status === "REJECTED"

  const getStatusMessage = () => {
    if (status === "DEPOSIT_PERIOD") return "Voting has not started yet"
    if (status === "VOTING_PERIOD" && new Date() >= new Date(votingEndTime))
      return "Voting period has ended"
    if (status === "EXECUTED") return "Proposal has been executed"
    if (status === "REJECTED") return "Proposal was rejected"
    return null
  }

  const statusMessage = getStatusMessage()

  return (
    <div className={styles.votingSection}>
      <h3 className={styles.sectionTitle}>
        <Icon icon="mdi:vote-outline" width={20} height={20} /> Cast Your Vote
      </h3>
      {statusMessage && (
        <div className={styles.statusMessage}>
          <Icon
            icon="mdi:alert-circle-outline"
            width={18}
            height={18}
            className={styles.statusIcon}
          />
          <p>{statusMessage}</p>
        </div>
      )}
      {!isConnected ? (
        <div className={styles.walletPrompt}>
          <div className={styles.promptContent}>
            <h4 className={styles.promptTitle}>
              <Icon
                icon="mdi:wallet-outline"
                width={24}
                height={24}
                className={styles.promptIcon}
              />
              Connect Your Wallet
            </h4>
            <p className={styles.promptText}>
              Please connect your wallet using the button in the header to
              participate in governance voting.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.connectedWallet}>
          <div className={styles.walletInfo}>
            <Icon
              icon="mdi:wallet-outline"
              width={18}
              height={18}
              className={styles.walletIndicator}
            />
            <span>Connected:</span>
            <span className={`${styles.address} ${styles.displayAddress1}`}>
              {address}
            </span>
            <span className={`${styles.address} ${styles.displayAddress2}`}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          {canVote && (
            <>
              {hasVoted && (
                <div className={styles.voteConfirmation}>
                  <Icon
                    icon="mdi:check-circle"
                    width={18}
                    height={18}
                    className={styles.confirmationIcon}
                  />
                  <span>Your vote has been successfully submitted!</span>
                </div>
              )}
              <form
                className={styles.voteForm}
                onSubmit={(e) => {
                  e.preventDefault()
                  submitVote()
                }}
              >
                <div className={styles.voteOptions}>
                  <label className={styles.voteOption}>
                    <input
                      type="radio"
                      name="voteOption"
                      value={VoteOption.YES}
                      checked={selectedVote === VoteOption.YES}
                      onChange={() => setSelectedVote(VoteOption.YES)}
                      disabled={isLoading}
                    />
                    <span className={`${styles.optionLabel} ${styles.yes}`}>
                      <Icon
                        icon="mdi:thumb-up-outline"
                        width={18}
                        height={18}
                        className={styles.optionIcon}
                      />{" "}
                      Vote Yes
                    </span>
                  </label>
                  <label className={styles.voteOption}>
                    <input
                      type="radio"
                      name="voteOption"
                      value={VoteOption.NO}
                      checked={selectedVote === VoteOption.NO}
                      onChange={() => setSelectedVote(VoteOption.NO)}
                      disabled={isLoading}
                    />
                    <span className={`${styles.optionLabel} ${styles.no}`}>
                      <Icon
                        icon="mdi:thumb-down-outline"
                        width={18}
                        height={18}
                        className={styles.optionIcon}
                      />{" "}
                      Vote No
                    </span>
                  </label>
                  <label className={styles.voteOption}>
                    <input
                      type="radio"
                      name="voteOption"
                      value={VoteOption.ABSTAIN}
                      checked={selectedVote === VoteOption.ABSTAIN}
                      onChange={() => setSelectedVote(VoteOption.ABSTAIN)}
                      disabled={isLoading}
                    />
                    <span className={`${styles.optionLabel} ${styles.abstain}`}>
                      <Icon
                        icon="mdi:minus-circle-outline"
                        width={18}
                        height={18}
                        className={styles.optionIcon}
                      />{" "}
                      Abstain
                    </span>
                  </label>
                  <label className={styles.voteOption}>
                    <input
                      type="radio"
                      name="voteOption"
                      value={VoteOption.NO_WITH_VOTE}
                      checked={selectedVote === VoteOption.NO_WITH_VOTE}
                      onChange={() => setSelectedVote(VoteOption.NO_WITH_VOTE)}
                      disabled={isLoading}
                    />
                    <span className={`${styles.optionLabel} ${styles.novote}`}>
                      <Icon
                        icon="mdi:cancel"
                        width={18}
                        height={18}
                        className={styles.optionIcon}
                      />{" "}
                      No with Vote
                    </span>
                  </label>
                </div>
                <div className={styles.metadataSection}>
                  <label
                    htmlFor="voteMetadata"
                    className={styles.metadataLabel}
                  >
                    Vote Comment (Optional):
                  </label>
                  <textarea
                    id="voteMetadata"
                    className={styles.metadataInput}
                    value={voteMetadata}
                    onChange={(e) => setVoteMetadata(e.target.value)}
                    placeholder="Add a comment about your vote..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
                <button
                  className={styles.submitVoteButton}
                  type="submit"
                  disabled={selectedVote === null || isLoading}
                >
                  {isLoading ? (
                    <span className={styles.loadingContent}>
                      <span className={styles.spinner}></span> Submitting...
                    </span>
                  ) : hasVoted ? (
                    <>
                      <Icon icon="mdi:refresh" width={16} height={16} /> Vote
                      Again
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:send" width={16} height={16} /> Submit
                      Vote
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

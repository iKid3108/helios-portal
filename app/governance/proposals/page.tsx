"use client"

import BackSection from "@/components/back"
import { Heading } from "@/components/heading"
import { Icon } from "@/components/icon"
import { truncateAddress } from "@/lib/utils"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { useAccount } from "wagmi"
import { ModalProposal } from "../(components)/proposal/modal"
import styles from "./page.module.scss"
import { useQuery } from "@tanstack/react-query"
import { getProposalsByPageAndSize, getProposalTotalCount } from "@/helpers/rpc-calls"
import { toHex } from "@/utils/number"

interface ProposalData {
  id: string
  meta: string
  status: string
  votes: string
  title: string
  result: string
  resultClass: string
  voteFor: string
  voteAgainst: string
  voteAbstain: string
  voteNoWithVeto: string
  voteForPercent: string
  voteAgainstPercent: string
  voteAbstainPercent: string
  voteNoWithVetoPercent: string
}

const AllProposals: React.FC = () => {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const { isConnected } = useAccount()
  const [isCreateLoading, setIsCreateLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Get total proposals count
  const { data: totalProposals = 0 } = useQuery({
    queryKey: ["proposalTotalCount"],
    queryFn: () => getProposalTotalCount(),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })

  // Get proposals for current page
  const { data: rawProposals = [], isLoading, error } = useQuery({
    queryKey: ["proposals", currentPage, pageSize],
    queryFn: () => getProposalsByPageAndSize(toHex(currentPage), toHex(pageSize)),
    enabled: !!currentPage && !!pageSize,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  })

  // Calculate total pages
  const totalPages = Math.ceil((totalProposals || 0) / pageSize)
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // Transform raw proposals data
  const proposals: ProposalData[] = (rawProposals || []).map((item: any) => {
    const yes = BigInt(item.currentTallyResult?.yes_count || "0")
    const no = BigInt(item.currentTallyResult?.no_count || "0")
    const abstain = BigInt(item.currentTallyResult?.abstain_count || "0")
    const noWithVeto = BigInt(
      item.currentTallyResult?.no_with_veto_count || "0"
    )

    const total = yes + no + abstain + noWithVeto || 1n
    const voteForPercent = Number((yes * 100n) / total)
    const voteAgainstPercent = Number((no * 100n) / total)
    const voteAbstainPercent = Number((abstain * 100n) / total)
    const voteNoWithVetoPercent = Number((noWithVeto * 100n) / total)

    // Convert from smallest unit (assuming 18 decimals)
    const yesFormatted = (yes / 10n ** 18n).toString()
    const noFormatted = (no / 10n ** 18n).toString()
    const abstainFormatted = (abstain / 10n ** 18n).toString()
    const noWithVetoFormatted = (noWithVeto / 10n ** 18n).toString()

    return {
      id: item.id.toString(),
      meta: `By ${item.proposer}`,
      status: `Ends: ${new Date(item.votingEndTime).toLocaleString(
        "en-US",
        {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }
      )}`,
      votes: `${yesFormatted} For – ${noFormatted} Against – ${abstainFormatted} Abstain – ${noWithVetoFormatted} No with Vote`,
      title: item.title,
      result: item.status,
      resultClass:
        item.status === "PASSED"
          ? styles.executed
          : item.status === "REJECTED"
          ? styles.rejected
          : styles.voting_period,
      voteFor: `${yesFormatted}shares`,
      voteAgainst: `${noFormatted}shares`,
      voteAbstain: `${abstainFormatted}shares`,
      voteNoWithVeto: `${noWithVetoFormatted}shares`,
      voteForPercent: `${voteForPercent}%`,
      voteAgainstPercent: `${voteAgainstPercent}%`,
      voteAbstainPercent: `${voteAbstainPercent}%`,
      voteNoWithVetoPercent: `${voteNoWithVetoPercent}%`
    }
  })

  const handleCreateProposal = () => {
    setIsCreateLoading(true)
    setTimeout(() => {
      setIsCreateLoading(false)
      setShowModal(true)
    }, 200)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || isLoading) return
    setCurrentPage(page)
  }

  // Handle previous page
  const handlePrevious = () => {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1)
    }
  }

  // Handle next page
  const handleNext = () => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1)
    }
  }

  // Pagination component
  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = []
      const maxVisiblePages = 5

      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      // Adjust start if we're near the end
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      return pages
    }

    const pageNumbers = getPageNumbers()
    const showFirstPage = pageNumbers.length > 0 && pageNumbers[0] > 1
    const showLastPage = pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < totalPages
    const showFirstEllipsis = showFirstPage && pageNumbers[0] > 2
    const showLastEllipsis = showLastPage && pageNumbers[pageNumbers.length - 1] < totalPages - 1

    return (
      <div className={styles["pagination"]}>
        <button
          className={`${styles["pagination-btn"]} ${
            !hasPreviousPage ? styles.disabled : ""
          }`}
          onClick={handlePrevious}
          disabled={!hasPreviousPage || isLoading}
        >
          Previous
        </button>

        <div className={styles["page-numbers"]}>
          {showFirstPage && (
            <>
              <button
                className={styles["page-btn"]}
                onClick={() => handlePageChange(1)}
                disabled={isLoading}
              >
                1
              </button>
              {showFirstEllipsis && (
                <span className={styles["ellipsis"]}>...</span>
              )}
            </>
          )}

          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`${styles["page-btn"]} ${
                page === currentPage ? styles.active : ""
              }`}
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
            >
              {page}
            </button>
          ))}

          {showLastPage && (
            <>
              {showLastEllipsis && (
                <span className={styles["ellipsis"]}>...</span>
              )}
              <button
                className={styles["page-btn"]}
                onClick={() => handlePageChange(totalPages)}
                disabled={isLoading}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          className={`${styles["pagination-btn"]} ${
            !hasNextPage ? styles.disabled : ""
          }`}
          onClick={handleNext}
          disabled={!hasNextPage || isLoading}
        >
          Next
        </button>
      </div>
    )
  }

  // Show loading state on initial load
  if (isLoading && proposals.length === 0) {
    return (
      <div className={styles["all-proposals"]}>
        <div className={styles.proposalContainer}>
          <Heading
            icon="material-symbols:library-books-outline"
            title="All Proposals"
            className={styles.sectionTitle}
          />
          {isConnected && (
            <button
              className={styles["create-proposal"]}
              onClick={handleCreateProposal}
              disabled={isCreateLoading}
            >
              {isCreateLoading ? (
                <>
                  <span className={styles.myloader}></span>Loading…
                </>
              ) : (
                "Create Proposal"
              )}
            </button>
          )}
        </div>
        <div className={styles["proposal-list"]}>
          <div className={styles.loader}>
            <p>Loading proposals...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if there's an error and no data loaded
  if (error && proposals.length === 0) {
    return (
      <div className={styles["all-proposals"]}>
        <div className={styles.proposalContainer}>
          <Heading
            icon="material-symbols:library-books-outline"
            title="All Proposals"
            className={styles.sectionTitle}
          />
          {isConnected && (
            <button
              className={styles["create-proposal"]}
              onClick={handleCreateProposal}
              disabled={isCreateLoading}
            >
              {isCreateLoading ? (
                <>
                  <span className={styles.myloader}></span>Loading…
                </>
              ) : (
                "Create Proposal"
              )}
            </button>
          )}
        </div>
        <div className={styles["proposal-list"]}>
          <div className={styles["error-state"]}>
            <h3>Failed to load proposals</h3>
            <p>{error.message}</p>
            <button
              className={styles["retry-button"]}
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              {isLoading ? "Retrying..." : "Try Again"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles["all-proposals"]}>
        <div className={styles.proposalContainer}>
          <Heading
            icon="material-symbols:library-books-outline"
            title="All Proposals"
            className={styles.sectionTitle}
          />
          {isConnected && (
            <button
              className={styles["create-proposal"]}
              onClick={handleCreateProposal}
              disabled={isCreateLoading}
            >
              {isCreateLoading ? (
                <>
                  <span className={styles.myloader}></span>Loading…
                </>
              ) : (
                "Create Proposal"
              )}
            </button>
          )}
        </div>

        {/* Show error banner if there's an error but we have existing data */}
        {error && proposals.length > 0 && (
          <div className={styles["error-banner"]}>
            <p>{error.message}</p>
            <button
              className={styles["retry-button-small"]}
              onClick={() => window.location.reload()}
              disabled={isLoading}
            >
              Retry
            </button>
          </div>
        )}

        {/* Proposal count and pagination info */}
        {proposals.length > 0 && (
          <div className={styles["proposal-stats"]}>
            <div className={styles["stats-info"]}>
              <span className={styles["total-count"]}>
                {totalProposals} proposal{totalProposals !== 1 ? "s" : ""} total
              </span>
              <span className={styles["page-info"]}>
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>
        )}

        <div className={styles["proposal-list"]}>
          {proposals.length === 0 && !isLoading ? (
            // Empty state when no proposals exist
            <div className={styles["empty-state"]}>
              <h3>No proposals found</h3>
              <p>
                There are currently no proposals to display.{" "}
                {isConnected && "Create the first proposal to get started!"}
              </p>
            </div>
          ) : (
            // Show proposals when they exist
            proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={styles["proposal-card"]}
                onClick={() =>
                  router.push(`/governance/proposals/${proposal.id}`)
                }
              >
                <div className={styles["card-content"]}>
                  <div className={styles["proposal-header"]}>
                    <div className={styles["proposal-info"]}>
                      <div className={styles["proposer-info"]}>
                        <Icon icon="material-symbols:person" />
                        <span className={styles["proposer-label"]}>
                          Proposal by
                        </span>
                        <a
                          href={`https://explorer.helioschainlabs.org/address/${proposal.meta.replace(
                            "By ",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.proposerLink_mobile}
                          title="View on Helios Explorer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>
                            {truncateAddress(proposal.meta.replace("By ", ""))}
                          </span>
                        </a>
                        <a
                          href={`https://explorer.helioschainlabs.org/address/${proposal.meta.replace(
                            "By ",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.proposerLink_full}
                          title="View on Helios Explorer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{proposal.meta.replace("By ", "")}</span>
                        </a>
                      </div>
                      <h3 className={styles["proposal-title"]}>
                        {proposal.title}
                      </h3>
                    </div>
                    <div className={styles["proposal-status"]}>
                      <div className={styles["end-date"]}>
                        <Icon icon="material-symbols:event" />
                        &nbsp;
                        {proposal.status}
                      </div>
                      <div
                        className={`${styles["status-badge"]} ${proposal.resultClass}`}
                      >
                        <Icon
                          icon={
                            proposal.result === "PASSED"
                              ? "material-symbols:check-circle"
                              : proposal.result === "REJECTED"
                              ? "material-symbols:cancel"
                              : "material-symbols:how-to-vote"
                          }
                        />
                        &nbsp; {proposal.result}
                      </div>
                    </div>
                  </div>

                  <div className={styles["vote-section"]}>
                    <span>Voting Results</span>
                    <div className={styles.captionContainer}>
                      <span className={styles.captionVotes}>
                        Total votes cast
                      </span>
                    </div>
                    <div className={styles["vote-bar"]}>
                      <div
                        className={styles["vote-for"]}
                        style={{ width: proposal.voteForPercent }}
                      />
                      <div
                        className={styles["vote-abstain"]}
                        style={{ width: proposal.voteAbstainPercent }}
                      />
                      <div
                        className={styles["vote-against"]}
                        style={{ width: proposal.voteAgainstPercent }}
                      />
                      <div
                        className={styles["vote-no-veto"]}
                        style={{ width: proposal.voteNoWithVetoPercent }}
                      />
                    </div>

                    <div className={styles["vote-details"]}>
                      <div className={styles["vote-stats"]}>
                        <span className={styles["vote-for-text"]}>
                          <Icon icon="material-symbols:thumb-up" />
                          <span>
                            For: {proposal.voteFor} ({proposal.voteForPercent})
                          </span>
                        </span>
                        <span className={styles["vote-abstain-text"]}>
                          <Icon icon="material-symbols:panorama-fish-eye" />
                          <span>
                            Abstain: {proposal.voteAbstain} (
                            {proposal.voteAbstainPercent})
                          </span>
                        </span>
                        <span className={styles["vote-against-text"]}>
                          <Icon icon="material-symbols:thumb-down" />
                          <span>
                            Against: {proposal.voteAgainst} (
                            {proposal.voteAgainstPercent})
                          </span>
                        </span>
                        {proposal.voteNoWithVeto !== "0HLS" && (
                          <span className={styles["vote-no-veto-text"]}>
                            <Icon icon="material-symbols:do-not-disturb-on" />
                            <span>
                              No With Vote: {proposal.voteNoWithVeto} (
                              {proposal.voteNoWithVetoPercent})
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator for page changes */}
          {isLoading && proposals.length > 0 && (
            <div className={styles.loader}>
              <p>Loading proposals...</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {proposals.length > 0 && !isLoading && <Pagination />}
      </div>
      <ModalProposal open={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

const ProposalDashboard: React.FC = () => {
  return (
    <div className={styles.dashboard}>
      <BackSection isVisible={false} />
      <AllProposals />
    </div>
  )
}

export default ProposalDashboard

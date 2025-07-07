"use client"

import BackSection from "@/components/back"
import { Heading } from "@/components/heading"
import { request } from "@/helpers/request"
import { truncateAddress } from "@/lib/utils"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { ModalProposal } from "../(components)/proposal/modal"
import styles from "./page.module.scss"

// Updated fetchProposals function using the new request utility
const fetchProposals = async (page: number, pageSize: number) => {
  try {
    const result = await request<any[]>("eth_getProposalsByPageAndSize", [
      `0x${page.toString(16)}`,
      `0x${pageSize.toString(16)}`
    ])

    return result || []
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to fetch proposals")
  }
}

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
  const [proposals, setProposals] = useState<ProposalData[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState<number | null>(null) // null means unknown
  const [hasNextPage, setHasNextPage] = useState(true)
  const { isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateProposal = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowModal(true)
    }, 200)
  }

  const loadProposals = async (page: number) => {
    if (loading) return

    setLoading(true)
    setError(null)
    console.log("Fetching proposals for page:", page)

    try {
      const rawData = await fetchProposals(page, pageSize)

      setHasLoadedInitial(true)

      if (!rawData || rawData.length === 0) {
        // We've reached the end - set total pages to the previous page
        const actualTotalPages = Math.max(1, page - 1)
        setTotalPages(actualTotalPages)
        setHasNextPage(false)

        // If we're on page 1 and get no results, show empty state
        if (page === 1) {
          setProposals([])
        } else {
          // If we're on a page beyond the total, redirect to last valid page
          setCurrentPage(actualTotalPages)
          if (actualTotalPages > 0) {
            loadProposals(actualTotalPages)
          }
        }
        return
      }

      // Update hasNextPage based on returned data length
      const isLastPage = rawData.length < pageSize
      setHasNextPage(!isLastPage)

      // If this page has fewer items than pageSize, we know this is the last page
      if (isLastPage) {
        setTotalPages(page)
      }

      const newProposals: ProposalData[] = rawData.map((item: any) => {
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

        // Convert from smallest unit (assuming 18 decimals like your original code)
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
          voteFor: `${yesFormatted}HLS`,
          voteAgainst: `${noFormatted}HLS`,
          voteAbstain: `${abstainFormatted}HLS`,
          voteNoWithVeto: `${noWithVetoFormatted}HLS`,
          voteForPercent: `${voteForPercent}%`,
          voteAgainstPercent: `${voteAgainstPercent}%`,
          voteAbstainPercent: `${voteAbstainPercent}%`,
          voteNoWithVetoPercent: `${voteNoWithVetoPercent}%`
        }
      })

      setProposals(newProposals)
    } catch (error: unknown) {
      console.error("Failed to fetch proposals", error)
      const message =
        error instanceof Error ? error.message : "Failed to load proposals"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page === currentPage || loading) return
    setCurrentPage(page)
    loadProposals(page)
  }

  // Handle previous page
  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  // Handle next page
  const handleNext = () => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1)
    }
  }

  // Initial load effect
  useEffect(() => {
    if (!hasLoadedInitial) {
      loadProposals(1)
    }
  }, [])

  // Pagination component
  const Pagination = () => {
    const getPageNumbers = () => {
      const pages = []
      const maxVisiblePages = 5

      if (totalPages === null) {
        // We don't know total pages yet, show conservative pagination
        // Only show current page and next page button (handled by hasNextPage)
        pages.push(currentPage)

        // Add previous page if it exists
        if (currentPage > 1) {
          pages.unshift(currentPage - 1)
        }

        // Add next page if we think it might exist (but don't show the button yet)
        // The Next button will handle this
      } else {
        // We know the total, show normal pagination
        let startPage = Math.max(
          1,
          currentPage - Math.floor(maxVisiblePages / 2)
        )
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

        // Adjust start if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1)
        }

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i)
        }
      }

      return pages
    }

    return (
      <div className={styles["pagination"]}>
        <button
          className={`${styles["pagination-btn"]} ${
            currentPage === 1 ? styles.disabled : ""
          }`}
          onClick={handlePrevious}
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>

        <div className={styles["page-numbers"]}>
          {totalPages !== null && currentPage > 3 && (
            <>
              <button
                className={styles["page-btn"]}
                onClick={() => handlePageChange(1)}
                disabled={loading}
              >
                1
              </button>
              {currentPage > 4 && (
                <span className={styles["ellipsis"]}>...</span>
              )}
            </>
          )}

          {getPageNumbers().map((page) => (
            <button
              key={page}
              className={`${styles["page-btn"]} ${
                page === currentPage ? styles.active : ""
              }`}
              onClick={() => handlePageChange(page)}
              disabled={loading}
            >
              {page}
            </button>
          ))}

          {totalPages !== null && currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && (
                <span className={styles["ellipsis"]}>...</span>
              )}
              <button
                className={styles["page-btn"]}
                onClick={() => handlePageChange(totalPages)}
                disabled={loading}
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
          disabled={!hasNextPage || loading}
        >
          Next
        </button>

        {totalPages !== null && (
          <div className={styles["page-info"]}>
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>
    )
  }

  // Show loading state on initial load
  if (!hasLoadedInitial && loading) {
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
              disabled={isLoading}
            >
              {isLoading ? (
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

  // Show error state if there's an error and no initial data loaded
  if (error && !hasLoadedInitial) {
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
              disabled={isLoading}
            >
              {isLoading ? (
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
            <p>{error}</p>
            <button
              className={styles["retry-button"]}
              onClick={() => loadProposals(currentPage)}
              disabled={loading}
            >
              {loading ? "Retrying..." : "Try Again"}
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
              disabled={isLoading}
            >
              {isLoading ? (
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
        {error && hasLoadedInitial && (
          <div className={styles["error-banner"]}>
            <p>{error}</p>
            <button
              className={styles["retry-button-small"]}
              onClick={() => loadProposals(currentPage)}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        <div className={styles["proposal-list"]}>
          {proposals.length === 0 && hasLoadedInitial && !loading ? (
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
                          className={styles.proposerLink}
                          title="View on Helios Explorer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>
                            {truncateAddress(proposal.meta.replace("By ", ""))}
                          </span>
                        </a>
                      </div>
                      <h3 className={styles["proposal-title"]}>
                        {proposal.title}
                      </h3>
                    </div>
                    <div className={styles["proposal-status"]}>
                      <div className={styles["end-date"]}>
                        {proposal.status}
                      </div>
                      <div
                        className={`${styles["status-badge"]} ${proposal.resultClass}`}
                      >
                        {proposal.result}
                      </div>
                    </div>
                  </div>

                  <div className={styles["vote-section"]}>
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
                          For: {proposal.voteFor} ({proposal.voteForPercent})
                        </span>
                        <span className={styles["vote-abstain-text"]}>
                          Abstain: {proposal.voteAbstain} (
                          {proposal.voteAbstainPercent})
                        </span>
                        <span className={styles["vote-against-text"]}>
                          Against: {proposal.voteAgainst} (
                          {proposal.voteAgainstPercent})
                        </span>
                        {proposal.voteNoWithVeto !== "0HLS" && (
                          <span className={styles["vote-no-veto-text"]}>
                            No With Vote: {proposal.voteNoWithVeto} (
                            {proposal.voteNoWithVetoPercent})
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
          {loading && hasLoadedInitial && (
            <div className={styles.loader}>
              <p>Loading proposals...</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {hasLoadedInitial && !loading && proposals.length > 0 && <Pagination />}
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

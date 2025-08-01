import { useQuery } from "@tanstack/react-query"
import { getProposalsByPageAndSize, getProposalTotalCount } from "@/helpers/rpc-calls"
import { toHex } from "@/utils/number"

export const useProposalInfo = (page = 1, size = 1) => {
  const qProposals = useQuery({
    queryKey: ["proposals", page, size],
    queryFn: () => getProposalsByPageAndSize(toHex(page), toHex(size)),
    enabled: !!page && !!size
  })

  const qProposalTotalCount = useQuery({
    queryKey: ["proposalTotalCount"],
    queryFn: () => getProposalTotalCount()
  })

  const lastProposal =
    qProposals.data && qProposals.data.length > 0 ? qProposals.data[0] : null

  return {
    lastProposal,
    isLoading: qProposals.isLoading,
    error: qProposals.error,
    totalProposals: qProposalTotalCount.data || 0
  }
}

import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { getDelegations } from "@/helpers/rpc-calls"
import { secondsToMilliseconds } from "@/utils/number"

export const useProposalDelegations = () => {
  const { address, isConnected } = useAccount()

  const query = useQuery({
    queryKey: ["proposal-delegations", address],
    queryFn: () => getDelegations(address!),
    enabled: !!address && isConnected,
    refetchInterval: secondsToMilliseconds(60),
    staleTime: secondsToMilliseconds(30)
  })

  return {
    delegations: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isConnected
  }
}

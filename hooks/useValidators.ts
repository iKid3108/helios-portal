import { useQuery } from "@tanstack/react-query"
import { getValidatorsByPageAndSize } from "@/helpers/rpc-calls"
import { toHex } from "@/utils/number"

export const useValidators = (page = 1, size = 100) => {
  const qValidators = useQuery({
    queryKey: ["validators", page, size],
    queryFn: async () => {
      const validators = await getValidatorsByPageAndSize(toHex(page), toHex(size))
      
      if (!validators) return []
      
      // Sort validators: jailed last
      return validators.sort((a, b) => {
        // Among non-active, jailed last
        if (a.jailed && !b.jailed) return 1
        if (!a.jailed && b.jailed) return -1
        return 0
      })
    },
    enabled: !!page && !!size
  })

  return {
    validators: qValidators.data || [],
    isLoading: qValidators.isLoading,
    error: qValidators.error
  }
}

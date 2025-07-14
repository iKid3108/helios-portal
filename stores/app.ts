import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppStore {
  nav: boolean
  setNav: (nav: boolean) => void
  debugMode: boolean
  setDebugMode: (debugMode: boolean) => void
  hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
  rpcUrl: string
  setRpcUrl: (rpcUrl: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      nav: false,
      setNav: (nav) => set({ nav }),
      debugMode: false,
      setDebugMode: (debugMode) => set({ debugMode }),
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      rpcUrl: "https://testnet1.helioschainlabs.org",
      setRpcUrl: (rpcUrl) => set({ rpcUrl })
    }),
    {
      name: "helios-app-store",
      partialize: (state) => ({
        rpcUrl: state.rpcUrl,
        debugMode: state.debugMode
      }), // <-- persist both rpcUrl and debugMode
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)

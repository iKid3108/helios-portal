import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppStore {
  nav: boolean
  setNav: (nav: boolean) => void
  debugMode: boolean
  setDebugMode: (debugMode: boolean) => void
  hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      nav: false,
      setNav: (nav) => set({ nav }),
      debugMode: false,
      setDebugMode: (debugMode) => set({ debugMode }),
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "helios-app-store",
      partialize: (state) => ({}), // <-- do not persist debugMode
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IOnboardingStore {
  onboarding: Record<string, string | string[]>;
  lastProgressedStep: number;
  saveProgress: (onboarding: Record<string, string | string[]>) => void;
  saveLastProgressStep: (step: number) => void;
}

export const useOnboardingStore = create<IOnboardingStore>()(
  persist(
    (set) => ({
      onboarding: {},
      lastProgressedStep: 0,
      saveProgress: (onboarding: Record<string, string | string[]>) =>
        set({ onboarding }),
      saveLastProgressStep: (lastProgressedStep: number) =>
        set({ lastProgressedStep }),
    }),
    {
      name: "studio-onboarding", // name of the item in the storage (must be unique)
    },
  ),
);

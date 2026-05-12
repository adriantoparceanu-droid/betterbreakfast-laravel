import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_USER_PROGRESS, type UserProgress, type CheckInMood } from '@/types/app';

interface UserState {
    progress: UserProgress;
    userId: string | null;
    isHydrated: boolean;

    setUserId: (id: string | null) => void;
    setProgress: (progress: UserProgress) => void;
    updateProgress: (updates: Partial<UserProgress>) => void;
    setHydrated: () => void;

    completeDay: (dayNumber: number) => void;
    selectRecipe: (dayNumber: number, recipeId: string) => void;
    checkIn: (dayNumber: number, mood: CheckInMood) => void;
    togglePantryItem: (ingredient: string) => void;
    setDefaultServings: (servings: number) => void;
    completeOnboarding: (servings: number) => void;
    resetProgress: () => void;
    toggleFoundationStep: (stepId: string) => void;
    completeFoundation: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            progress: DEFAULT_USER_PROGRESS,
            userId: null,
            isHydrated: false,

            setUserId: (id) => set({ userId: id }),
            setProgress: (progress) => set({ progress }),
            updateProgress: (updates) => set((s) => ({ progress: { ...s.progress, ...updates } })),
            setHydrated: () => set({ isHydrated: true }),

            completeDay: (dayNumber) =>
                set((s) => {
                    const completedDays = s.progress.completedDays.includes(dayNumber)
                        ? s.progress.completedDays
                        : [...s.progress.completedDays, dayNumber];
                    return { progress: { ...s.progress, completedDays, currentDay: Math.max(s.progress.currentDay, dayNumber + 1) } };
                }),

            selectRecipe: (dayNumber, recipeId) =>
                set((s) => ({
                    progress: {
                        ...s.progress,
                        selectedRecipes: { ...s.progress.selectedRecipes, [dayNumber]: recipeId },
                        usedRecipeIds: Array.from(new Set([...s.progress.usedRecipeIds, recipeId])),
                    },
                })),

            checkIn: (dayNumber, mood) =>
                set((s) => ({ progress: { ...s.progress, checkIns: { ...s.progress.checkIns, [dayNumber]: mood } } })),

            togglePantryItem: (ingredient) =>
                set((s) => {
                    const checked = s.progress.pantryChecked;
                    return { progress: { ...s.progress, pantryChecked: checked.includes(ingredient) ? checked.filter((i) => i !== ingredient) : [...checked, ingredient] } };
                }),

            setDefaultServings: (servings) =>
                set((s) => ({ progress: { ...s.progress, defaultServings: servings } })),

            completeOnboarding: (servings) =>
                set((s) => ({ progress: { ...s.progress, defaultServings: servings, onboardingDone: true } })),

            resetProgress: () =>
                set((s) => ({
                    progress: {
                        ...DEFAULT_USER_PROGRESS,
                        defaultServings: s.progress.defaultServings,
                        onboardingDone: true,
                        foundationDone: true,
                        foundationChecked: s.progress.foundationChecked,
                    },
                })),

            toggleFoundationStep: (stepId) =>
                set((s) => {
                    const checked = s.progress.foundationChecked;
                    return { progress: { ...s.progress, foundationChecked: checked.includes(stepId) ? checked.filter((x) => x !== stepId) : [...checked, stepId] } };
                }),

            completeFoundation: () =>
                set((s) => ({ progress: { ...s.progress, foundationDone: true } })),
        }),
        {
            name: 'bb-user-progress',
            version: 1,
            partialize: (s) => ({ progress: s.progress, userId: s.userId }),
        },
    ),
);

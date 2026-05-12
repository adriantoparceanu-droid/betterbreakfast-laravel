export type IngredientCategory =
    | 'Proteins' | 'Grains' | 'Dairy' | 'Fruits'
    | 'Vegetables' | 'Seeds & Nuts' | 'Condiments';

export interface Ingredient {
    name: string;
    quantity: number;
    unit: string;
    category: IngredientCategory;
}

export interface Nutrition {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
}

export interface Recipe {
    id: string;
    name: string;
    image: string;
    baseServings: number;
    ingredients: Ingredient[];
    steps: string[];
    nutrition: Nutrition;
    tags: string[];
}

export type CheckInMood = 'energized' | 'full' | 'hungry';

export interface UserProgress {
    currentDay: number;
    completedDays: number[];
    selectedRecipes: Record<string, string>;
    usedRecipeIds: string[];
    checkIns: Record<string, CheckInMood>;
    pantryChecked: string[];
    defaultServings: number;
    onboardingDone: boolean;
    foundationChecked: string[];
    foundationDone: boolean;
}

export const DEFAULT_USER_PROGRESS: UserProgress = {
    currentDay: 1,
    completedDays: [],
    selectedRecipes: {},
    usedRecipeIds: [],
    checkIns: {},
    pantryChecked: [],
    defaultServings: 1,
    onboardingDone: false,
    foundationChecked: [],
    foundationDone: true,
};

export type SyncType = 'PROGRESS_UPDATE' | 'CHECK_IN' | 'SWAP_RECIPE';

export interface SyncQueueItem {
    id?: number;
    userId: string;
    type: SyncType;
    payload: Record<string, unknown>;
    synced: boolean;
    retries: number;
    createdAt: Date;
}

export type AnalyticsEventName = 'COMPLETE_DAY' | 'SWAP_RECIPE';

export interface AnalyticsEventProperties {
    dayNumber?: number;
    fromRecipeId?: string;
    toRecipeId?: string;
}

export interface AnalyticsEvent {
    id?: number;
    anonymousId: string;
    event: AnalyticsEventName;
    properties: AnalyticsEventProperties;
    synced: boolean;
    createdAt: Date;
}

export interface UserProgressLocal {
    id: string;
    progress: UserProgress;
    updatedAt: Date;
}

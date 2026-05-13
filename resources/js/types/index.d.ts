// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    role: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: { user: AuthUser };
};

// ─── Recipe ───────────────────────────────────────────────────────────────────

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
    substitutions?: string;
    whyThisWorks?: string;
}

// ─── User Progress ────────────────────────────────────────────────────────────

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

export const DEFAULT_USER_PROGRESS: UserProgress;

// ─── Sync ─────────────────────────────────────────────────────────────────────

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

// ─── Analytics ───────────────────────────────────────────────────────────────

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

// ─── Local DB (Dexie) ────────────────────────────────────────────────────────

export interface UserProgressLocal {
    id: string;
    progress: UserProgress;
    updatedAt: Date;
}

import { create } from "zustand";
import { AnalyzeMealResponse, ConfidenceLevel, MealItemDraft } from "../types/api";

interface MealDraftState {
  photoUrl: string | null;
  overallConfidence: ConfidenceLevel | null;
  notes: string | null;
  needsClarification: boolean;
  clarificationReason: string | null;
  items: MealItemDraft[];
  setFromAnalysis: (res: AnalyzeMealResponse) => void;
  setManual: () => void;
  updateItem: (id: string, patch: Partial<MealItemDraft>) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

function makeId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
}

function emptyItem(): MealItemDraft {
  return {
    id: makeId(),
    name: "",
    estimatedWeightG: 100,
    weightConfidence: null,
    cookingMethod: null,
    caloriesKcal: 0,
    proteinG: 0,
    fatG: 0,
    carbsG: 0,
    isManuallyEdited: true,
  };
}

const initialState = {
  photoUrl: null,
  overallConfidence: null,
  notes: null,
  needsClarification: false,
  clarificationReason: null,
  items: [] as MealItemDraft[],
};

export const useMealDraftStore = create<MealDraftState>()((set) => ({
  ...initialState,

  setFromAnalysis: (res) =>
    set({
      photoUrl: res.photoUrl,
      overallConfidence: res.overall_confidence,
      notes: res.notes,
      needsClarification: res.needs_clarification,
      clarificationReason: res.clarification_reason,
      items: res.items.map((item) => ({
        id: makeId(),
        name: item.name,
        estimatedWeightG: item.estimated_weight_g,
        weightConfidence: item.weight_confidence,
        cookingMethod: item.cooking_method,
        caloriesKcal: item.calories_kcal,
        proteinG: item.protein_g,
        fatG: item.fat_g,
        carbsG: item.carbs_g,
        isManuallyEdited: false,
      })),
    }),

  setManual: () =>
    set({
      ...initialState,
      items: [emptyItem()],
    }),

  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),

  addItem: () => set((state) => ({ items: [...state.items, emptyItem()] })),

  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  reset: () => set(initialState),
}));

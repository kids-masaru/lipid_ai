export interface AnalysisResult {
    id: string;
    date: string; // ISO string
    input: string;
    result: string;
    mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
    risk?: "High" | "Medium" | "Low";
    // Nutrition Data
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
    saturated_fat?: number;
    dietary_fiber?: number;
    // Specific Impact
    cholesterol_impact?: {
        level: "High" | "Medium" | "Low" | "None";
        reason: string;
    };
    neutral_fat_impact?: {
        level: "High" | "Medium" | "Low" | "None";
        reason: string;
    };
}

const STORAGE_KEY = "lipid-ai-history";

export function getHistory(): AnalysisResult[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

export function saveResult(
    input: string,
    result: string,
    mealType: AnalysisResult["mealType"],
    risk?: "High" | "Medium" | "Low",
    nutrition?: {
        calories: number;
        protein: number;
        fat: number;
        carbohydrates: number;
        saturated_fat: number;
        dietary_fiber: number;
    },
    impact?: {
        cholesterol: { level: "High" | "Medium" | "Low" | "None"; reason: string };
        neutral_fat: { level: "High" | "Medium" | "Low" | "None"; reason: string };
    },
    customDate?: string // YYYY-MM-DD format
) {
    const history = getHistory();

    // Use customDate if provided, otherwise use current date
    let dateISO: string;
    if (customDate) {
        // Create date at noon to avoid timezone issues
        dateISO = new Date(customDate + "T12:00:00").toISOString();
    } else {
        dateISO = new Date().toISOString();
    }

    const newResult: AnalysisResult = {
        id: crypto.randomUUID(),
        date: dateISO,
        input,
        result,
        mealType,
        risk,
        ...nutrition,
        cholesterol_impact: impact?.cholesterol,
        neutral_fat_impact: impact?.neutral_fat
    };
    history.unshift(newResult);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function deleteResult(id: string) {
    const history = getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}

export function updateResult(id: string, updates: Partial<AnalysisResult>) {
    const history = getHistory();
    const updatedHistory = history.map(item =>
        item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}

export function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
}

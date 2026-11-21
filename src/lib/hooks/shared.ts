import { api } from "../api";

// --- Hooks ---

// Helper function to extract array from paginated or non-paginated response
export function extractArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
        return response as T[];
    }
    if (typeof response === "object" && response !== null && "results" in response) {
        const results = response.results;
        if (Array.isArray(results)) return results as T[];
    }
    return [];
}

export async function fetchAllPages<T>(path: string, params?: Record<string, string>): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (true) {
        const response = await api.get<unknown>(path, { ...params, page: String(page) });
        if (Array.isArray(response)) return [...results, ...response as T[]];
        if (typeof response !== "object" || response === null || !("results" in response)) {
            return results;
        }

        const pageResults = response.results;
        if (Array.isArray(pageResults)) results.push(...pageResults as T[]);
        if (!("next" in response) || !response.next) return results;
        page += 1;
    }
}

export interface TimetableEntry {
    id: number;
    school_class: number;
    class_name: string;
    day_of_week: string;
    period_start: string;
    period_end: string;
    subject?: number;
    subject_name: string;
    room: string;
    teacher?: number | null;
    teacher_name: string;
}

export function toQueryParams(params?: Record<string, string | number | undefined>): Record<string, string> | undefined {
    if (!params) return undefined;
    return Object.fromEntries(
        Object.entries(params)
            .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
            .map(([key, value]) => [key, String(value)]),
    );
}

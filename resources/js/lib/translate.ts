// Admin-only: ask the backend (Gemini) to translate content to Romanian.
// EN stays the source of truth; the admin reviews the result before saving.

type TranslateType = 'recipe' | 'ingredient' | 'category' | 'module' | 'field' | 'list';

export async function translateContent<T = Record<string, unknown>>(
    type: TranslateType,
    payload: Record<string, unknown>,
): Promise<{ ok: true; translation: T } | { ok: false; error: string }> {
    const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '';
    const csrf = decodeURIComponent(xsrf);

    try {
        const res = await fetch(route('admin.translate'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': csrf,
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify({ type, payload }),
        });
        const json = await res.json();
        if (!res.ok || !json.ok || !json.translation) {
            return { ok: false, error: json.error ?? 'Translation failed.' };
        }
        return { ok: true, translation: json.translation as T };
    } catch {
        return { ok: false, error: 'Network error — could not reach the server.' };
    }
}

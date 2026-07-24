interface LocationFields {
  city?: string | null;
  community?: string | null;
  county?: string | null;
  province: string;
}

// Replaces {{City}} / {{Community}} / {{County}} / {{Province}} placeholders
// (case-insensitive) with the row's actual location values, so each
// location x service combination shows its own rendered meta title/
// description/heading/subheading. City/Community/County are each
// individually optional - `.replace(pattern, null)` would stringify to the
// literal text "null", so every field falls back to '' when unset.
export function renderPlaceholders(text: string | null | undefined, location: LocationFields): string | null {
  if (!text) return text ?? null;
  return text
    .replace(/\{\{\s*city\s*\}\}/gi, location.city || '')
    .replace(/\{\{\s*community\s*\}\}/gi, location.community || '')
    .replace(/\{\{\s*county\s*\}\}/gi, location.county || '')
    .replace(/\{\{\s*province\s*\}\}/gi, location.province || '');
}

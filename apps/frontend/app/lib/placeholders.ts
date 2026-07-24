// Replaces {{City}} / {{Province}} placeholders (case-insensitive) with the
// row's actual location values, so each location x service combination shows
// its own rendered meta title/description/heading/subheading.
export function renderPlaceholders(text: string | null | undefined, city: string, province: string): string | null {
  if (!text) return text ?? null;
  return text
    .replace(/\{\{\s*city\s*\}\}/gi, city)
    .replace(/\{\{\s*province\s*\}\}/gi, province);
}

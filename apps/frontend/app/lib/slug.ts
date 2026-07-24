function slugifyPart(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Preview-only slug for the eventual programmatic page URL structure:
// /{city}/services/{category}/{service-name}
// Not a live route yet - just shown so the taxonomy on the Service page
// reads like the page it will eventually become.
export function buildSlugPreview(city: string, categoryName: string, serviceName: string): string {
  return `/${slugifyPart(city)}/services/${slugifyPart(categoryName)}/${slugifyPart(serviceName)}`;
}

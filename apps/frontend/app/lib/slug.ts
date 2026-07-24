function slugifyPart(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The programmatic page URL for a given location/category/service combo:
// /{place}/services/{category}/{service-name}
// `place` should be the location's primary name (see
// lib/location.ts#primaryLocationName - whichever of City/Community/County
// is actually set). Computed once at import time and stored on
// MasterData.slug (see /api/publish), and matched against the same way by
// the public page route at app/[city]/services/[category]/[service]/page.tsx.
export function buildSlug(place: string, categoryName: string, serviceName: string): string {
  return `/${slugifyPart(place)}/services/${slugifyPart(categoryName)}/${slugifyPart(serviceName)}`;
}

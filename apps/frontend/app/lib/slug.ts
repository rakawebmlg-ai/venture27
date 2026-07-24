export function slugifyPart(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// The programmatic page URL for a given location/service/heading combo:
// /{type}/services/{value}/{service-name}/{heading}
// `type` is which location field is primary for this row ('city',
// 'community', or 'county' - see lib/location.ts#primaryLocationType) and
// `value` is that field's value. Computed once at import time and stored
// on MasterData.slug (see /api/publish), and matched against the same way
// by the public page route at
// app/[type]/services/[value]/[service]/[heading]/page.tsx.
export function buildSlug(type: string, value: string, serviceName: string, heading: string): string {
  return `/${slugifyPart(type)}/services/${slugifyPart(value)}/${slugifyPart(serviceName)}/${slugifyPart(heading)}`;
}

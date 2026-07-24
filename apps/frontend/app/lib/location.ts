// City, Community, and County are all optional on their own - a Location
// can be defined by any one of them, or a mix. These helpers pick a sane
// value out of whichever fields are actually set.

// Full display/prompt text combining every set part, most specific first:
// "Coal Harbour, Vancouver" (community + city), or just "Metro Vancouver"
// if only county was provided.
export function combineLocationName(city?: string | null, community?: string | null, county?: string | null): string {
  return [community, city, county].filter(Boolean).join(', ');
}

// A single name to identify the location (e.g. for the URL slug), picking
// the most specific field that's actually set.
export function primaryLocationName(city?: string | null, community?: string | null, county?: string | null): string {
  return community || city || county || '';
}

export type LocationType = 'city' | 'community' | 'county';

// Which field is "the" one identifying this location, and its value - same
// priority as primaryLocationName, but also names which field won. Used to
// build the /{type}/services/... slug and to route a page into the
// City/Community/County Service sub-section it belongs to.
export function primaryLocationType(city?: string | null, community?: string | null, county?: string | null): { type: LocationType; value: string } | null {
  if (community) return { type: 'community', value: community };
  if (city) return { type: 'city', value: city };
  if (county) return { type: 'county', value: county };
  return null;
}

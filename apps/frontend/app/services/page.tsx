import { redirect } from 'next/navigation';

// /services itself isn't a page anymore - City/Community/County are now
// separate sub-sections (see the sidebar). City is the default landing spot.
export default function ServicesIndexPage() {
  redirect('/services/city');
}

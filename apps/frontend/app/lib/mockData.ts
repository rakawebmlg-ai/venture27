// Mock data for the dashboard

export const stats = {
  locations: 514,
  coreServices: 12,
  masterDataGenerated: 6168, // 514 * 12
  contentGenerated: 4500,
  totalPublished: 4000,
};

export const locations = [
  { id: 1, city: 'Bandung', province: 'Jawa Barat' },
  { id: 2, city: 'Bekasi', province: 'Jawa Barat' },
  { id: 3, city: 'Surabaya', province: 'Jawa Timur' },
  { id: 4, city: 'Semarang', province: 'Jawa Tengah' },
  { id: 5, city: 'Jakarta Selatan', province: 'DKI Jakarta' },
  { id: 6, city: 'Denpasar', province: 'Bali' },
  { id: 7, city: 'Medan', province: 'Sumatera Utara' },
  { id: 8, city: 'Makassar', province: 'Sulawesi Selatan' },
  { id: 9, city: 'Balikpapan', province: 'Kalimantan Timur' },
  { id: 10, city: 'Jayapura', province: 'Papua' },
];

export const coreServices = [
  { id: 1, name: 'Plumbing Services', title: 'Professional Plumbing in {{city}}, {{province}}', desc: 'Reliable plumbing services in {{city}}', heading: 'Expert Plumbers in {{city}}', subheading: '24/7 Service' },
  { id: 2, name: 'Electrical Repair', title: 'Trusted Electrical Repair in {{city}}', desc: 'Safe electrical work across {{province}}', heading: 'Licensed Electricians in {{city}}', subheading: 'Fast & Reliable' },
  { id: 3, name: 'Home Cleaning', title: 'Premium Home Cleaning in {{city}}', desc: 'Sparkling results for homes in {{province}}', heading: 'Best Cleaners in {{city}}', subheading: 'Affordable Rates' },
];

export const generatedMasterData = [
  { id: 1, city: 'Bandung', province: 'Jawa Barat', service: 'Plumbing Services', title: 'Professional Plumbing in Bandung, Jawa Barat', desc: 'Reliable plumbing services in Bandung', heading: 'Expert Plumbers in Bandung', subheading: '24/7 Service', content: '', image: '', status: 'pending', category: 'SEO' },
  { id: 2, city: 'Bekasi', province: 'Jawa Barat', service: 'Plumbing Services', title: 'Professional Plumbing in Bekasi, Jawa Barat', desc: 'Reliable plumbing services in Bekasi', heading: 'Expert Plumbers in Bekasi', subheading: '24/7 Service', content: '', image: '', status: 'pending', category: 'SEO' },
  { id: 3, city: 'Bandung', province: 'Jawa Barat', service: 'Electrical Repair', title: 'Trusted Electrical Repair in Bandung', desc: 'Safe electrical work across Jawa Barat', heading: 'Licensed Electricians in Bandung', subheading: 'Fast & Reliable', content: '<p>Generated content for Bandung...</p>', image: 'bandung-electric.jpg', status: 'generated', category: 'SEO' },
];

export const generationJobs = [
  {
    id: 'gen-001',
    status: 'completed',
    started_at: '2026-07-20 14:30:00',
    completed_at: '2026-07-20 16:45:22',
    total_pages: 6168,
    generated: 6168,
    errors: 0,
    services_count: 12,
    locations_scope: 'All locations',
    email_notification: true,
    error_message: null as string | null,
  }
];

export const generationLogs = [
  { time: '14:30:00', level: 'info', message: 'Generation job started' },
  { time: '14:30:01', level: 'info', message: 'Loading core services and locations...' },
];

'use client';

export const PAGE_SIZE = 10;

// Keeps `page` in [1, totalPages] - without this, a stale page number left
// over from before a search/filter narrowed the list would slice past the
// end of the (now shorter) array and silently render as empty.
export function clampPage(page: number, totalItems: number): number {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  return Math.min(Math.max(1, page), totalPages);
}

export function paginate<T>(items: T[], page: number): T[] {
  const start = (clampPage(page, items.length) - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

function PaginationBarContent({
  page,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '10px 20px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-primary)',
      }}
    >
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Page {clampedPage} of {totalPages} ({totalItems} rows)
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          className="btn btn-ghost btn-sm"
          disabled={clampedPage <= 1}
          onClick={() => onPageChange(clampedPage - 1)}
        >
          Prev
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={clampedPage >= totalPages}
          onClick={() => onPageChange(clampedPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Renders as a table row (<tr><td colSpan>...) since every table in this app
// groups rows into per-category <tbody> blocks - a bare <div> here would get
// hoisted out of the table by the browser and break the layout.
export default function PaginationRow({
  page,
  totalItems,
  colSpan,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  colSpan: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  if (totalPages <= 1) return null;

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <PaginationBarContent page={page} totalItems={totalItems} onPageChange={onPageChange} />
      </td>
    </tr>
  );
}

// Plain div variant for non-table listings (card lists, grids).
export function PaginationBar(props: { page: number; totalItems: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(props.totalItems / PAGE_SIZE));
  if (totalPages <= 1) return null;
  return <PaginationBarContent {...props} />;
}

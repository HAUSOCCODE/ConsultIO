const ITEMS_PER_PAGE = 7;

function pageItems(currentPage, totalPages) {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);

  const visible = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  if (currentPage <= 3) [2, 3].forEach((page) => visible.add(page));
  if (currentPage >= totalPages - 2)
    [totalPages - 2, totalPages - 1].forEach((page) => visible.add(page));

  const pages = [...visible]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const result = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1)
      result.push(`ellipsis-${page}`);
    result.push(page);
  });
  return result;
}

export { ITEMS_PER_PAGE };

export default function Pagination({
  currentPage,
  totalItems,
  onPageChange,
  itemLabel = "records",
  itemsPerPage = ITEMS_PER_PAGE,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);
  const changePage = (nextPage) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages) return;
    onPageChange(nextPage);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm text-slate-600 sm:text-left">
        Showing {start}–{end} of {totalItems} {itemLabel}
      </p>
      <nav
        aria-label="Pagination"
        className="flex min-w-0 flex-wrap items-center justify-center gap-1"
      >
        <button
          type="button"
          onClick={() => changePage(page - 1)}
          disabled={page === 1}
          className="rounded-lg px-2 py-2 text-sm font-semibold text-maroon-800 disabled:cursor-not-allowed disabled:text-slate-400 sm:px-3"
        >
          Previous
        </button>
        {pageItems(page, totalPages).map((item) =>
          typeof item === "string" ? (
            <span
              key={item}
              aria-hidden="true"
              className="px-1 text-sm text-slate-500"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => changePage(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-bold ${item === page ? "bg-maroon-800 text-white" : "text-slate-700 hover:bg-maroon-50"}`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => changePage(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg px-2 py-2 text-sm font-semibold text-maroon-800 disabled:cursor-not-allowed disabled:text-slate-400 sm:px-3"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

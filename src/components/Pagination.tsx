interface PaginationProps {
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

const sizes = [10, 25, 50, 100];

export const Pagination = ({ page, size, total, onPageChange, onSizeChange }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * size + 1;
  const end = Math.min(safePage * size, total);
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    const first = Math.min(Math.max(1, safePage - 2), Math.max(1, totalPages - 4));
    return first + index;
  }).filter((item) => item <= totalPages);

  return (
    <div className="pagination" aria-label="Paginacion">
      <span>Mostrando {start}-{end} de {total}</span>
      <div className="pagination-controls">
        <button type="button" onClick={() => onPageChange(safePage - 1)} disabled={safePage <= 1}>Anterior</button>
        {pages.map((item) => (
          <button key={item} type="button" className={item === safePage ? 'active' : ''} onClick={() => onPageChange(item)}>
            {item}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(safePage + 1)} disabled={safePage >= totalPages}>Siguiente</button>
      </div>
      <label>
        Tamano
        <select value={size} onChange={(event) => onSizeChange(Number(event.target.value))}>
          {sizes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </div>
  );
};

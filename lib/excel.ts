import * as XLSX from 'xlsx';

export function downloadXlsx(filename: string, rows: Record<string, unknown>[], sheet = 'List1') {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, filename);
}

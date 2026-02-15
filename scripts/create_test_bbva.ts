import * as XLSX from 'xlsx';
import path from 'path';

const outPath = path.join(process.cwd(), 'e2e', 'bbva_test.xlsx');

// BBVA Structure based on inspection
const headers = ["F.Valor", "Fecha", "Concepto", "Movimiento", "Importe", "Divisa", "Disponible", "Divisa", "Observaciones"];

const data = [
    headers,
    // Row 5: Expense
    ["15/02/2026", "16/02/2026", "Supermercado Test", "Pago con tarjeta", "-2.71", "EUR", "3649.51", "EUR", "REF-123 SUPERMERCADO TEST"],
    // Row 6: Expense
    ["15/02/2026", "16/02/2026", "Gasolinera Test", "Pago con tarjeta", "-16.06", "EUR", "3652.22", "EUR", "REF-456 GASOLINERA TEST"],
    // Row 7: Expense (High value)
    ["14/02/2026", "16/02/2026", "Electronics Store", "Pago con tarjeta", "-92.32", "EUR", "3668.28", "EUR", "REF-789 ELECTRONICS"],
    // Income example
    ["10/02/2026", "11/02/2026", "Transferencia Recibida", "Transferencia Favor", "1500.00", "EUR", "5000.00", "EUR", "NOMINA FEBRERO"],
    // Bizum
    ["14/02/2026", "16/02/2026", "Bizum", "Enviado: cena", " -13.00", "EUR", "3833.8", "EUR", "ENVIADO: Cena amigos"],
];

// Add some formatting/metadata rows at the top to match real file
const finalData = [
    [], // Row 0
    [null, null, "Últimos movimientos"], // Row 1
    [null, null, "Fecha de generación del informe: 15/02/2026"], // Row 2
    [], // Row 3
    ...data // Row 4 (headers) and data
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(finalData);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

XLSX.writeFile(wb, outPath);
console.log(`Created test file at ${outPath}`);

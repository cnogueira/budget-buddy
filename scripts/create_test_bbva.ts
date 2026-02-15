import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const e2eDir = path.join(process.cwd(), 'e2e');
if (!fs.existsSync(e2eDir)) fs.mkdirSync(e2eDir);

const headers = ["F.Valor", "Fecha", "Concepto", "Movimiento", "Importe", "Divisa", "Disponible", "Divisa", "Observaciones"];

// Common transactions in February to test idempotency
const febTransactions = [
    ["15/02/2026", "16/02/2026", "Supermercado Feb", "Pago con tarjeta", "-25.50", "EUR", "3000.00", "EUR", "REF-FEB-1"],
    ["20/02/2026", "21/02/2026", "Restaurante Feb", "Pago con tarjeta", "-42.00", "EUR", "2958.00", "EUR", "REF-FEB-2"],
];

const janTransactions = [
    ["15/01/2026", "16/01/2026", "Alquiler Enero", "Transferencia", "-800.00", "EUR", "3800.00", "EUR", "ALQUILER JAN"],
    ["20/01/2026", "21/01/2026", "Nomina Enero", "Transferencia Favor", "2500.00", "EUR", "6300.00", "EUR", "NOMINA JAN"],
];

const marTransactions = [
    ["05/03/2026", "06/03/2026", "Gimnasio Marzo", "Recibo", "-50.00", "EUR", "2908.00", "EUR", "GIMNASIO MAR"],
    ["10/03/2026", "11/03/2026", "Cena Marzo", "Pago con tarjeta", "-30.00", "EUR", "2878.00", "EUR", "CENA MAR"],
];

function createExcel(filename: string, data: any[][]) {
    const filePath = path.join(e2eDir, filename);
    const finalData = [
        [], [null, null, "Últimos movimientos"], [null, null, "Informe generado para test"], [],
        headers,
        ...data
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filePath);
    console.log(`Created ${filePath}`);
}

// File 1: Jan + Feb
createExcel('bbva_jan_feb.xlsx', [...janTransactions, ...febTransactions]);

// File 2: Feb + Mar (Feb ones are identical to File 1)
createExcel('bbva_feb_mar.xlsx', [...febTransactions, ...marTransactions]);

console.log("Idempotency test files created in e2e/ directory.");

import * as XLSX from 'xlsx';

export interface ParsedTransaction {
    date: string; // ISO YYYY-MM-DD
    amount: number;
    description: string;
    currency?: string;
    reference?: string;
}

export async function parseBBVA(buffer: ArrayBuffer): Promise<ParsedTransaction[]> {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get raw values with header: 1 to get array of arrays
    // Use raw:false to get formatted strings which is safer for the specific format we saw
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });

    if (rows.length === 0) {
        return [];
    }

    // Find the header row
    // Based on sample: ["F.Valor","Fecha","Concepto","Movimiento","Importe","Divisa","Disponible","Divisa","Observaciones"]
    // It was on row index 4 in the sample.
    let headerRowIndex = -1;
    const requiredHeaders = ['F.Valor', 'Fecha', 'Concepto', 'Importe', 'Divisa'];

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i].map(cell => String(cell).trim());
        // Check if row contains most of the required headers
        const matchCount = requiredHeaders.filter(h => row.includes(h)).length;
        if (matchCount >= 3) { // relaxed check
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.warn("Could not find standard BBVA headers. Attempting fallback or using first row.");
        headerRowIndex = 0;
    }

    const headers = rows[headerRowIndex].map(h => String(h).trim());

    // Map columns by name
    const fValorIdx = headers.indexOf('F.Valor');
    const fechaIdx = headers.indexOf('Fecha');
    const conceptoIdx = headers.indexOf('Concepto');
    const importeIdx = headers.indexOf('Importe');
    const observacionesIdx = headers.indexOf('Observaciones');

    const parsedTransactions: ParsedTransaction[] = [];

    // Start iterating from next row
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Date Parsing
        // prioritize F.Valor (Value Date) as it's usually when the user made the transaction
        let rawDate = (fValorIdx !== -1) ? row[fValorIdx] : null;
        if (!rawDate && fechaIdx !== -1) rawDate = row[fechaIdx]; // Fallback to Fecha

        let dateStr: string | undefined;

        if (rawDate) {
            // Expecting DD/MM/YYYY
            const parts = String(rawDate).split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                // basic validation
                if (year.length === 4) {
                    dateStr = `${year}-${month}-${day}`;
                }
            }
        }

        // Amount Parsing
        let amount: number | undefined;
        if (importeIdx !== -1 && row[importeIdx] !== undefined) {
            let rawAmt = row[importeIdx];
            if (typeof rawAmt === 'number') {
                amount = rawAmt;
            } else {
                // String like "-2.71" or "-1.234,56"
                let amtStr = String(rawAmt).trim();

                // Remove currency symbols if any
                amtStr = amtStr.replace(/[€$]/g, '').trim();

                // Handle EU format (1.234,56) vs US format (1,234.56)
                // Heuristic: look for last separator
                if (amtStr.includes(',') && amtStr.includes('.')) {
                    if (amtStr.lastIndexOf(',') > amtStr.lastIndexOf('.')) {
                        // 1.234,56 -> remove dots, replace comma with dot
                        amtStr = amtStr.replace(/\./g, '').replace(',', '.');
                    } else {
                        // 1,234.56 -> remove commas
                        amtStr = amtStr.replace(/,/g, '');
                    }
                } else if (amtStr.includes(',')) {
                    // 12,34 -> 12.34
                    amtStr = amtStr.replace(',', '.');
                }

                const parsed = parseFloat(amtStr);
                if (!isNaN(parsed)) {
                    amount = parsed;
                }
            }
        }

        // Description
        let description = '';
        if (conceptoIdx !== -1 && row[conceptoIdx]) {
            description = String(row[conceptoIdx]).trim();
        }

        // Final check
        if (dateStr && amount !== undefined) {
            parsedTransactions.push({
                date: dateStr,
                amount: amount,
                description: description || 'Imported Transaction',
            });
        }
    }

    return parsedTransactions;
}

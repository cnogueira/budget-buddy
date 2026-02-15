import * as XLSX from 'xlsx';

export interface ParsedTransaction {
    date: string; // ISO YYYY-MM-DD (Operation Date / 'Fecha')
    value_date: string; // F.Valor
    amount: number;
    description: string;
    balance: number; // 'Disponible'
    notes?: string;   // 'Observaciones'
    fingerprint: string; // Hash or unique combo
}

export async function parseBBVA(buffer: ArrayBuffer): Promise<ParsedTransaction[]> {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get raw values with header: 1 to get array of arrays
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false });

    if (rows.length === 0) {
        return [];
    }

    // Find the header row
    let headerRowIndex = -1;
    const requiredHeaders = ['F.Valor', 'Fecha', 'Concepto', 'Importe', 'Divisa'];

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i].map(cell => String(cell).trim());
        const matchCount = requiredHeaders.filter(h => row.includes(h)).length;
        if (matchCount >= 3) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex === -1) {
        headerRowIndex = 0;
    }

    const headers = rows[headerRowIndex].map(h => String(h).trim());

    const fValorIdx = headers.indexOf('F.Valor');
    const fechaIdx = headers.indexOf('Fecha');
    const conceptoIdx = headers.indexOf('Concepto');
    const importeIdx = headers.indexOf('Importe');
    const disponibleIdx = headers.indexOf('Disponible');
    const observacionesIdx = headers.indexOf('Observaciones');

    const parsedTransactions: ParsedTransaction[] = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Date Parsing - PRIORITIZE 'Fecha' (Operation Date) for stability as requested
        let rawFechaOperacion = (fechaIdx !== -1) ? row[fechaIdx] : null;
        let rawFValor = (fValorIdx !== -1) ? row[fValorIdx] : null;

        const formatDate = (raw: any) => {
            if (!raw) return null;
            const parts = String(raw).split('/');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                if (year.length === 4) return `${year}-${month}-${day}`;
            }
            return null;
        };

        const dateStr = formatDate(rawFechaOperacion);
        const valueDateStr = formatDate(rawFValor) || dateStr;

        if (!dateStr) continue;

        // Amount Parsing
        let amount = 0;
        if (importeIdx !== -1 && row[importeIdx] !== undefined) {
            amount = parseAmount(row[importeIdx]);
        }

        // Balance Parsing
        let balance = 0;
        if (disponibleIdx !== -1 && row[disponibleIdx] !== undefined) {
            balance = parseAmount(row[disponibleIdx]);
        }

        // Description & Notes
        const description = (conceptoIdx !== -1 && row[conceptoIdx]) ? String(row[conceptoIdx]).trim() : 'Imported Transaction';
        const notes = (observacionesIdx !== -1 && row[observacionesIdx]) ? String(row[observacionesIdx]).trim() : '';

        // Fingerprint: stable fields as suggested by user
        // We leave out F.Valor (valueDateStr) but include the rest
        // We include balance to differentiate identical transactions in the same day
        const fingerprint = `${dateStr}|${description}|${amount}|${balance}|${notes}`;

        parsedTransactions.push({
            date: dateStr,
            value_date: valueDateStr || dateStr,
            amount: amount,
            description: description,
            balance: balance,
            notes: notes,
            fingerprint: fingerprint
        });
    }

    return parsedTransactions;
}

function parseAmount(raw: any): number {
    if (typeof raw === 'number') return raw;
    let str = String(raw).trim().replace(/[€$]/g, '');

    if (str.includes(',') && str.includes('.')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            str = str.replace(/,/g, '');
        }
    } else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    const val = parseFloat(str);
    return isNaN(val) ? 0 : val;
}

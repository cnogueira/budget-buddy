
import { parseBBVA } from '@/lib/parsers/bbva-parser';
import * as fs from 'fs';
import * as path from 'path';

// This test file assumes Jest or Vitest environment.
// If using a different runner, adapt accordingly.
// The parser relies on 'fs' only for reading the test file here.

describe('BBVA Parser', () => {
    // Only run if the test file exists
    const filePath = path.join(process.cwd(), 'e2e', 'bbva_test.xlsx');
    const fileExists = fs.existsSync(filePath);

    if (!fileExists) {
        console.warn("Skipping test: e2e/bbva_test.xlsx not found.");
        test.skip('e2e/bbva_test.xlsx not found', () => { });
        return;
    }

    it('should parse the generated test file correctly', async () => {
        const buffer = fs.readFileSync(filePath);
        // buffer.buffer might be needed depending on node version/types
        // Convert Node Buffer to ArrayBuffer
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

        const transactions = await parseBBVA(arrayBuffer);

        expect(transactions).toBeDefined();
        // The generated file has 5 transactions (headers + 5 data rows)
        expect(transactions.length).toBe(5);

        // Check first transaction (Value Date 15/02/2026)
        const t1 = transactions[0];
        // Our parser logic: "15/02/2026" (F.Valor) -> "2026-02-15"
        expect(t1.date).toBe('2026-02-15');
        // Amount "-2.71"
        expect(t1.amount).toBe(-2.71);
        expect(t1.description).toBe('Supermercado Test');

        // Check income (Tx 3)
        // Headers: F.Valor, Fecha, Concepto, Movimiento, Importe...
        // Income row: "10/02/2026", "11/02/2026", "Transferencia Recibida", ..., "1500.00"
        const t4 = transactions[3];
        expect(t4.date).toBe('2026-02-10');
        expect(t4.amount).toBe(1500.00);
        expect(t4.description).toBe('Transferencia Recibida');
    });

    it('should handle empty buffer', async () => {
        const transactions = await parseBBVA(new ArrayBuffer(0));
        expect(transactions).toEqual([]);
    });
});

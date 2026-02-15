
import { parseBBVA } from '@/lib/parsers/bbva-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('BBVA Parser', () => {
    const janFebPath = path.join(process.cwd(), 'e2e', 'bbva_jan_feb.xlsx');

    it('should parse Jan-Feb file correctly', async () => {
        if (!fs.existsSync(janFebPath)) {
            console.warn("Skipping test: e2e/bbva_jan_feb.xlsx not found.");
            return;
        }

        const buffer = fs.readFileSync(janFebPath);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
        const transactions = await parseBBVA(arrayBuffer);

        expect(transactions).toBeDefined();
        expect(transactions.length).toBe(4); // 2 jan + 2 feb

        // Check a transaction (priority on Fecha)
        // janTransactions[0]: ["15/01/2026", "16/01/2026", "Alquiler Enero", ...]
        // Fecha is 16/01/2026
        const t = transactions.find(tx => tx.description === 'Alquiler Enero');
        expect(t).toBeDefined();
        expect(t?.date).toBe('2026-01-16');
        expect(t?.value_date).toBe('2026-01-15');
        expect(t?.amount).toBe(-800.00);
    });

    it('should have unique fingerprints for distinct transactions', async () => {
        if (!fs.existsSync(janFebPath)) return;

        const buffer = fs.readFileSync(janFebPath);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
        const transactions = await parseBBVA(arrayBuffer);

        const fingerprints = transactions.map(t => t.fingerprint);
        const uniqueFingerprints = new Set(fingerprints);
        expect(uniqueFingerprints.size).toBe(transactions.length);
    });

    it('should handle empty buffer', async () => {
        const transactions = await parseBBVA(new ArrayBuffer(0));
        expect(transactions).toEqual([]);
    });
});

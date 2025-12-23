import * as XLSX from 'xlsx';
import { FileProcessor, ProcessedTable, FileProcessorOptions, ColumnSchema } from '../file-processor';
import { db as duckdb } from '../duckdb';
import { FormatDetectionResult } from '../format-detector';

export class ExcelProcessor implements FileProcessor {
    format = 'excel' as const;

    canProcess(file: File, detection: FormatDetectionResult): boolean {
        return detection.format === 'excel';
    }

    async listTables(file: File): Promise<string[]> {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        return workbook.SheetNames;
    }

    async process(
        file: File,
        options?: FileProcessorOptions
    ): Promise<ProcessedTable[]> {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const results: ProcessedTable[] = [];

        // Process specified sheet or all sheets
        const sheetsToProcess = options?.sheet
            ? [options.sheet]
            : workbook.SheetNames;

        for (const sheetName of sheetsToProcess) {
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON for DuckDB ingestion
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: options?.hasHeader === false ? 1 : undefined,
                defval: null,
            }) as Record<string, unknown>[];

            if (jsonData.length === 0) continue;

            const tableName = this.sanitizeTableName(`${file.name}_${sheetName}`);

            // Infer types
            const columns = this.inferColumnsFromData(jsonData);

            // Create table and insert data
            await this.loadIntoDuckDB(tableName, columns, jsonData, options?.maxRows);

            const rowCount = await duckdb.getRowCount(tableName);
            const sampleRows = await duckdb.query(
                `SELECT * FROM "${tableName}" LIMIT ${options?.sampleSize || 100}`
            );

            results.push({
                name: tableName,
                columns,
                rowCount,
                sampleRows,
                sourceFormat: 'excel',
                sourceFile: `${file.name} [${sheetName}]`,
                processedAt: new Date()
            });
        }

        return results;
    }

    async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(firstSheet, { range: rows }) as Record<string, unknown>[];
    }

    private inferColumnsFromData(data: Record<string, unknown>[]): ColumnSchema[] {
        const sample = data.slice(0, 100);
        const columns: ColumnSchema[] = [];

        if (sample.length === 0) return columns;

        const keys = Object.keys(sample[0]);

        for (const key of keys) {
            const values = sample.map(row => row[key]).filter(v => v != null);
            const type = this.inferType(values);

            columns.push({
                name: key,
                type,
                nullable: sample.some(row => row[key] == null)
            });
        }

        return columns;
    }

    private inferType(values: unknown[]): string {
        if (values.length === 0) return 'VARCHAR';

        if (values.every(v => typeof v === 'number')) {
            if (values.every(v => Number.isInteger(v))) {
                return 'BIGINT';
            }
            return 'DOUBLE';
        }

        if (values.every(v => v instanceof Date || !isNaN(Date.parse(String(v))))) {
            return 'TIMESTAMP';
        }

        if (values.every(v => typeof v === 'boolean')) {
            return 'BOOLEAN';
        }

        return 'VARCHAR';
    }

    private async loadIntoDuckDB(
        tableName: string,
        columns: ColumnSchema[],
        data: Record<string, unknown>[],
        maxRows?: number
    ): Promise<void> {
        const columnDefs = columns
            .map(c => `"${c.name}" ${c.type}`)
            .join(', ');

        await duckdb.execute(`CREATE TABLE "${tableName}" (${columnDefs})`);

        const rows = maxRows ? data.slice(0, maxRows) : data;
        const batchSize = 500;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            // We'll use a safer approach: converted values to a temporary JSON string and use read_json_auto
            // But for small-medium excel files, batch inserts are fine.
            const values = batch.map(row =>
                `(${columns.map(c => this.formatValue(row[c.name], c.type)).join(', ')})`
            ).join(', ');

            await duckdb.execute(`INSERT INTO "${tableName}" VALUES ${values}`);
        }
    }

    private formatValue(value: unknown, type: string): string {
        if (value == null) return 'NULL';
        if (type === 'VARCHAR' || type === 'TIMESTAMP') {
            return `'${String(value).replace(/'/g, "''")}'`;
        }
        if (type === 'BOOLEAN') return value ? 'true' : 'false';
        return String(value);
    }

    private sanitizeTableName(name: string): string {
        return name
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();
    }
}

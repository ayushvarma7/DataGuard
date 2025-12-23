import { FileProcessor, ProcessedTable, FileProcessorOptions, ColumnSchema } from '../file-processor';
import { db as duckdb } from '../duckdb';
import { FormatDetectionResult } from '../format-detector';

export class CSVProcessor implements FileProcessor {
    format = 'csv' as const;

    canProcess(file: File, detection: FormatDetectionResult): boolean {
        return ['csv', 'tsv'].includes(detection.format);
    }

    async listTables(file: File): Promise<string[]> {
        // CSV has one "table" - the file itself
        return [this.sanitizeTableName(file.name)];
    }

    async process(
        file: File,
        options?: FileProcessorOptions
    ): Promise<ProcessedTable[]> {
        const tableName = this.sanitizeTableName(file.name);

        // Register file with DuckDB
        await duckdb.registerFile(file);

        // Use specified delimiter or let DuckDB auto-detect
        const delimiter = options?.delimiter;

        // Create table from CSV
        // read_csv_auto is powerful but we can pass hints
        const delimHint = delimiter ? `, delim='${delimiter}'` : '';
        const headerHint = options?.hasHeader !== undefined ? `, header=${options.hasHeader}` : '';

        await duckdb.execute(`
      CREATE TABLE "${tableName}" AS 
      SELECT * FROM read_csv_auto('${file.name}'${delimHint}${headerHint})
      ${options?.maxRows ? `LIMIT ${options.maxRows}` : ''}
    `);

        // Get schema and stats
        const rawSchema = await duckdb.getSchema(tableName);
        const columns: ColumnSchema[] = rawSchema.map((col: any) => ({
            name: col.column_name,
            type: col.column_type,
            nullable: col.null === 'YES'
        }));

        const rowCount = await duckdb.getRowCount(tableName);
        const sampleRows = await duckdb.query(
            `SELECT * FROM "${tableName}" LIMIT ${options?.sampleSize || 100}`
        );

        return [{
            name: tableName,
            columns,
            rowCount,
            sampleRows,
            sourceFormat: file.name.endsWith('.tsv') ? 'tsv' : 'csv',
            sourceFile: file.name,
            processedAt: new Date()
        }];
    }

    async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
        const tempName = `preview_${Math.random().toString(36).substring(7)}`;
        await duckdb.registerFile(file);
        const results = await duckdb.query(
            `SELECT * FROM read_csv_auto('${file.name}') LIMIT ${rows}`
        );
        return results;
    }

    private sanitizeTableName(filename: string): string {
        return filename
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();
    }
}

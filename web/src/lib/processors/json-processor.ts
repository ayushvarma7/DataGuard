import { FileProcessor, ProcessedTable, FileProcessorOptions, ColumnSchema } from '../file-processor';
import { db as duckdb } from '../duckdb';
import { FormatDetectionResult } from '../format-detector';

export class JSONProcessor implements FileProcessor {
    format = 'json' as const;

    canProcess(file: File, detection: FormatDetectionResult): boolean {
        return ['json', 'jsonl'].includes(detection.format);
    }

    async listTables(file: File): Promise<string[]> {
        return [this.sanitizeTableName(file.name)];
    }

    async process(
        file: File,
        options?: FileProcessorOptions
    ): Promise<ProcessedTable[]> {
        const tableName = this.sanitizeTableName(file.name);
        await duckdb.registerFile(file);

        // DuckDB handles both standard JSON and JSONL with auto detection
        await duckdb.execute(`
      CREATE TABLE "${tableName}" AS 
      SELECT * FROM read_json_auto('${file.name}')
      ${options?.maxRows ? `LIMIT ${options.maxRows}` : ''}
    `);

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
            sourceFormat: file.name.endsWith('.jsonl') ? 'jsonl' : 'json',
            sourceFile: file.name,
            processedAt: new Date()
        }];
    }

    async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
        await duckdb.registerFile(file);
        return await duckdb.query(`SELECT * FROM read_json_auto('${file.name}') LIMIT ${rows}`);
    }

    private sanitizeTableName(filename: string): string {
        return filename
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();
    }
}

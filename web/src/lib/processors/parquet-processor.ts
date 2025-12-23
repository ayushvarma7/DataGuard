import { FileProcessor, ProcessedTable, FileProcessorOptions, ColumnSchema } from '../file-processor';
import { db as duckdb } from '../duckdb';
import { FormatDetectionResult } from '../format-detector';

export class ParquetProcessor implements FileProcessor {
    format = 'parquet' as const;

    canProcess(file: File, detection: FormatDetectionResult): boolean {
        return detection.format === 'parquet';
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

        await duckdb.execute(`
      CREATE TABLE "${tableName}" AS 
      SELECT * FROM read_parquet('${file.name}')
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
            sourceFormat: 'parquet',
            sourceFile: file.name,
            processedAt: new Date()
        }];
    }

    async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
        await duckdb.registerFile(file);
        return await duckdb.query(`SELECT * FROM read_parquet('${file.name}') LIMIT ${rows}`);
    }

    private sanitizeTableName(filename: string): string {
        return filename
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();
    }
}

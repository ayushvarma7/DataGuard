import { FileProcessor, ProcessedTable, FileProcessorOptions, ColumnSchema } from '../file-processor';
import { db as duckdb } from '../duckdb';
import { FormatDetectionResult } from '../format-detector';

export class SQLDumpProcessor implements FileProcessor {
    format = 'sql' as const;

    canProcess(file: File, detection: FormatDetectionResult): boolean {
        return detection.format === 'sql';
    }

    async listTables(file: File): Promise<string[]> {
        const text = await file.text();
        // Simple regex to find CREATE TABLE statements
        const tableMatches = text.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["`]?([a-zA-Z0-9_]+)["`]?/gi);
        return Array.from(tableMatches, m => m[1]);
    }

    async process(
        file: File,
        options?: FileProcessorOptions
    ): Promise<ProcessedTable[]> {
        const text = await file.text();
        const tablesBefore = await this.getCurrentTables();

        // Attempt to execute the entire script in DuckDB
        // We might need to pre-process to remove dialect-specific parts
        const processedSQL = this.preprocessSQL(text);

        // Split by semicolons for safer execution and to identify created tables
        const statements = this.splitStatements(processedSQL);

        for (const statement of statements) {
            if (!statement.trim()) continue;
            try {
                await duckdb.execute(statement);
            } catch (e) {
                console.warn('Failed to execute SQL statement:', statement, e);
            }
        }

        const tablesAfter = await this.getCurrentTables();
        const createdTables = tablesAfter.filter(t => !tablesBefore.includes(t));

        const results: ProcessedTable[] = [];

        for (const tableName of createdTables) {
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

            results.push({
                name: tableName,
                columns,
                rowCount,
                sampleRows,
                sourceFormat: 'sql',
                sourceFile: file.name,
                processedAt: new Date()
            });
        }

        return results;
    }

    async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
        // Hard to preview SQL dump without executing. 
        // Return empty or first few lines as a string?
        const text = await file.slice(0, 1024).text();
        return [{ content_preview: text.substring(0, 500) + '...' }];
    }

    private preprocessSQL(sql: string): string {
        return sql
            // Remove MySQL-style backticks
            .replace(/`/g, '"')
            // Remove engine/charset options at the end of CREATE TABLE
            .replace(/ENGINE\s*=\s*[a-zA-Z0-9_]+/gi, '')
            .replace(/DEFAULT\s*CHARSET\s*=\s*[a-zA-Z0-9_]+/gi, '')
            .replace(/COLLATE\s*=\s*[a-zA-Z0-9_]+/gi, '')
            // Remove comments
            .replace(/^--.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '');
    }

    private splitStatements(sql: string): string[] {
        // Very naive split. Doesn't handle semicolons inside strings.
        return sql.split(';');
    }

    private async getCurrentTables(): Promise<string[]> {
        const result = await duckdb.query('SHOW TABLES');
        return result.map((r: any) => r.name);
    }
}

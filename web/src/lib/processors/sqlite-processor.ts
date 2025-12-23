import initSqlJs, { Database } from 'sql.js';
import { FileProcessor, ProcessedTable, FileProcessorOptions, ColumnSchema } from '../file-processor';
import { db as duckdb } from '../duckdb';
import { FormatDetectionResult } from '../format-detector';

export class SQLiteProcessor implements FileProcessor {
    format = 'sqlite' as const;
    private sqljs: Awaited<ReturnType<typeof initSqlJs>> | null = null;

    private async initSqlJs(): Promise<Awaited<ReturnType<typeof initSqlJs>>> {
        if (!this.sqljs) {
            this.sqljs = await initSqlJs({
                locateFile: (file: string) => `https://sql.js.org/dist/${file}`
            });
        }
        return this.sqljs;
    }

    canProcess(file: File, detection: FormatDetectionResult): boolean {
        return detection.format === 'sqlite';
    }

    async listTables(file: File): Promise<string[]> {
        const SQL = await this.initSqlJs();
        const buffer = await file.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));

        try {
            const result = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

            return result[0]?.values.map(row => String(row[0])) || [];
        } finally {
            db.close();
        }
    }

    async process(
        file: File,
        options?: FileProcessorOptions
    ): Promise<ProcessedTable[]> {
        const SQL = await this.initSqlJs();
        const buffer = await file.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));

        const results: ProcessedTable[] = [];

        try {
            const tables = options?.table
                ? [options.table]
                : await this.listTablesFromDB(db);

            for (const tableName of tables) {
                // Get schema
                const schemaResult = db.exec(`PRAGMA table_info("${tableName}")`);
                const columns: ColumnSchema[] = schemaResult[0]?.values.map(row => ({
                    name: String(row[1]),
                    type: this.mapSQLiteType(String(row[2])),
                    nullable: row[3] === 0,
                    primaryKey: row[5] === 1
                })) || [];

                // Get count
                const countResult = db.exec(`SELECT COUNT(*) FROM "${tableName}"`);
                const rowCount = Number(countResult[0]?.values[0][0] || 0);

                // Load into DuckDB
                const duckTableName = this.sanitizeTableName(`${file.name}_${tableName}`);
                await this.loadIntoDuckDB(duckTableName, columns, db, tableName, options?.maxRows);

                const sampleRows = await duckdb.query(
                    `SELECT * FROM "${duckTableName}" LIMIT ${options?.sampleSize || 100}`
                );

                results.push({
                    name: duckTableName,
                    columns,
                    rowCount,
                    sampleRows,
                    sourceFormat: 'sqlite',
                    sourceFile: `${file.name} [${tableName}]`,
                    processedAt: new Date()
                });
            }
        } finally {
            db.close();
        }

        return results;
    }

    async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
        const SQL = await this.initSqlJs();
        const buffer = await file.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));
        try {
            const tables = await this.listTablesFromDB(db);
            if (tables.length === 0) return [];

            const result = db.exec(`SELECT * FROM "${tables[0]}" LIMIT ${rows}`);
            if (!result[0]) return [];

            return result[0].values.map(row => {
                const obj: Record<string, unknown> = {};
                result[0].columns.forEach((col, i) => {
                    obj[col] = row[i];
                });
                return obj;
            });
        } finally {
            db.close();
        }
    }

    private async listTablesFromDB(db: Database): Promise<string[]> {
        const result = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
        return result[0]?.values.map(row => String(row[0])) || [];
    }

    private mapSQLiteType(sqliteType: string): string {
        const upper = sqliteType.toUpperCase();
        if (upper.includes('INT')) return 'BIGINT';
        if (upper.includes('REAL') || upper.includes('FLOAT') || upper.includes('DOUBLE')) return 'DOUBLE';
        if (upper.includes('BOOL')) return 'BOOLEAN';
        if (upper.includes('DATE') || upper.includes('TIME')) return 'TIMESTAMP';
        if (upper.includes('BLOB')) return 'BLOB';
        return 'VARCHAR';
    }

    private async loadIntoDuckDB(
        tableName: string,
        columns: ColumnSchema[],
        sqliteDb: Database,
        sourceTable: string,
        maxRows?: number
    ): Promise<void> {
        const columnDefs = columns
            .map(c => `"${c.name}" ${c.type}`)
            .join(', ');

        await duckdb.execute(`CREATE TABLE "${tableName}" (${columnDefs})`);

        const limit = maxRows ? `LIMIT ${maxRows}` : '';
        const result = sqliteDb.exec(`SELECT * FROM "${sourceTable}" ${limit}`);

        if (result[0]) {
            const batchSize = 500;
            const values = result[0].values;

            for (let i = 0; i < values.length; i += batchSize) {
                const batch = values.slice(i, i + batchSize);
                const insertValues = batch.map(row =>
                    `(${row.map((v, j) => this.formatValue(v, columns[j].type)).join(', ')})`
                ).join(', ');

                await duckdb.execute(`INSERT INTO "${tableName}" VALUES ${insertValues}`);
            }
        }
    }

    private formatValue(value: unknown, type: string): string {
        if (value == null) return 'NULL';
        if (type === 'VARCHAR' || type === 'TIMESTAMP') {
            return `'${String(value).replace(/'/g, "''")}'`;
        }
        if (type === 'BOOLEAN') return value ? 'true' : 'false';
        if (type === 'BLOB') return 'NULL'; // Handling blobs is tricky in simple inserts
        return String(value);
    }

    private sanitizeTableName(name: string): string {
        return name
            .replace(/\.[^.]+$/, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();
    }
}

import { SupportedFormat, FormatDetectionResult } from './format-detector';

export interface ColumnSchema {
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
}

export interface ProcessedTable {
    name: string;
    columns: ColumnSchema[];
    rowCount: number;
    sampleRows: Record<string, unknown>[];
    sourceFormat: SupportedFormat;
    sourceFile: string;
    processedAt: Date;
}

export interface FileProcessorOptions {
    maxRows?: number;           // Limit rows loaded (default: all)
    sampleSize?: number;        // Rows for preview (default: 100)
    sheet?: string;             // For Excel: which sheet
    table?: string;             // For SQLite/SQL: which table
    delimiter?: string;         // For CSV/TSV: custom delimiter
    hasHeader?: boolean;        // Does first row contain headers?
    encoding?: string;          // Text encoding (default: utf-8)
}

export interface FileProcessor {
    format: SupportedFormat;

    // Check if this processor can handle the file
    canProcess(file: File, detection: FormatDetectionResult): boolean;

    // Get available tables/sheets in file
    listTables(file: File): Promise<string[]>;

    // Process file and load into DuckDB
    process(
        file: File,
        options?: FileProcessorOptions
    ): Promise<ProcessedTable[]>;

    // Get preview without full processing
    preview(
        file: File,
        rows?: number
    ): Promise<Record<string, unknown>[]>;
}

// Lazy loading processors to avoid bloat
export async function getProcessor(format: SupportedFormat): Promise<FileProcessor> {
    switch (format) {
        case 'csv':
        case 'tsv': {
            const { CSVProcessor } = await import('./processors/csv-processor');
            return new CSVProcessor();
        }
        case 'parquet': {
            const { ParquetProcessor } = await import('./processors/parquet-processor');
            return new ParquetProcessor();
        }
        case 'excel': {
            const { ExcelProcessor } = await import('./processors/excel-processor');
            return new ExcelProcessor();
        }
        case 'json':
        case 'jsonl': {
            const { JSONProcessor } = await import('./processors/json-processor');
            return new JSONProcessor();
        }
        case 'sqlite': {
            const { SQLiteProcessor } = await import('./processors/sqlite-processor');
            return new SQLiteProcessor();
        }
        case 'sql': {
            const { SQLDumpProcessor } = await import('./processors/sql-dump-processor');
            return new SQLDumpProcessor();
        }
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

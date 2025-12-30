import { db as duckdb } from './duckdb';

export type ExportFormat = 'csv' | 'json' | 'parquet';

export interface ExportOptions {
    format: ExportFormat;
    tableName: string;
    filename?: string;
    limit?: number;
}

export interface ExportResult {
    success: boolean;
    filename: string;
    format: ExportFormat;
    rowCount: number;
    error?: string;
}

/**
 * Export a table to CSV format
 */
async function exportToCSV(tableName: string, limit?: number): Promise<Blob> {
    const query = limit
        ? `SELECT * FROM "${tableName}" LIMIT ${limit}`
        : `SELECT * FROM "${tableName}"`;

    const data = await duckdb.query(query);

    if (data.length === 0) {
        return new Blob([''], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = String(val);
                // Escape quotes and wrap in quotes if contains comma
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        )
    ];

    return new Blob([csvRows.join('\n')], { type: 'text/csv' });
}

/**
 * Export a table to JSON format
 */
async function exportToJSON(tableName: string, limit?: number): Promise<Blob> {
    const query = limit
        ? `SELECT * FROM "${tableName}" LIMIT ${limit}`
        : `SELECT * FROM "${tableName}"`;

    const data = await duckdb.query(query);

    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

/**
 * Export a table to the specified format and trigger download
 */
export async function exportTable(options: ExportOptions): Promise<ExportResult> {
    const { format, tableName, filename, limit } = options;

    try {
        let blob: Blob;
        let extension: string;
        let mimeType: string;

        switch (format) {
            case 'csv':
                blob = await exportToCSV(tableName, limit);
                extension = 'csv';
                mimeType = 'text/csv';
                break;
            case 'json':
                blob = await exportToJSON(tableName, limit);
                extension = 'json';
                mimeType = 'application/json';
                break;
            case 'parquet':
                // Parquet export requires special handling - for now export as JSON
                blob = await exportToJSON(tableName, limit);
                extension = 'json';
                mimeType = 'application/json';
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        const exportFilename = filename || `${tableName}_export.${extension}`;

        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Get row count for result
        const countResult = await duckdb.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = Number(countResult[0].count);

        return {
            success: true,
            filename: exportFilename,
            format,
            rowCount: limit ? Math.min(limit, rowCount) : rowCount
        };
    } catch (error: any) {
        return {
            success: false,
            filename: '',
            format,
            rowCount: 0,
            error: error.message || 'Export failed'
        };
    }
}

/**
 * Get available export formats
 */
export function getAvailableFormats(): { format: ExportFormat; label: string; description: string }[] {
    return [
        { format: 'csv', label: 'CSV', description: 'Comma-separated values, universal compatibility' },
        { format: 'json', label: 'JSON', description: 'JavaScript Object Notation, structured data' },
        { format: 'parquet', label: 'Parquet (as JSON)', description: 'Columnar format export (JSON fallback)' }
    ];
}

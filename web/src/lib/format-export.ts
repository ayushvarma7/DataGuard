import { db as duckdb } from './duckdb';

export type ExportFormat = 'csv' | 'json' | 'parquet' | 'yaml';

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

export interface ValidationRule {
    column: string;
    rule: string;
    params?: Record<string, any>;
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
 * Export validation rules to YAML format for CI/CD integration
 */
export function exportRulesToYAML(tableName: string, rules: ValidationRule[]): Blob {
    const yamlLines = [
        '# DataGuard Validation Rules',
        `# Generated: ${new Date().toISOString()}`,
        '',
        `table: "${tableName}"`,
        '',
        'rules:'
    ];

    for (const rule of rules) {
        yamlLines.push(`  - column: "${rule.column}"`);
        yamlLines.push(`    type: "${rule.rule}"`);
        if (rule.params) {
            yamlLines.push('    params:');
            for (const [key, value] of Object.entries(rule.params)) {
                yamlLines.push(`      ${key}: ${JSON.stringify(value)}`);
            }
        }
    }

    return new Blob([yamlLines.join('\n')], { type: 'text/yaml' });
}

/**
 * Download rules as YAML file
 */
export function downloadRulesAsYAML(tableName: string, rules: ValidationRule[]): void {
    const blob = exportRulesToYAML(tableName, rules);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_rules.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copy data to clipboard as JSON or CSV
 */
export async function copyToClipboard(data: any[], format: 'json' | 'csv' = 'json'): Promise<boolean> {
    try {
        let text: string;

        if (format === 'json') {
            text = JSON.stringify(data, null, 2);
        } else {
            if (data.length === 0) {
                text = '';
            } else {
                const headers = Object.keys(data[0]);
                const rows = [
                    headers.join('\t'),
                    ...data.map(row => headers.map(h => String(row[h] ?? '')).join('\t'))
                ];
                text = rows.join('\n');
            }
        }

        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Clipboard copy failed:', err);
        return false;
    }
}

/**
 * Copy query results to clipboard
 */
export async function copyQueryResults(tableName: string, limit: number = 100): Promise<boolean> {
    const data = await duckdb.query(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
    return copyToClipboard(data, 'csv');
}

/**
 * Generate a data quality report as HTML (for PDF printing)
 */
export async function generateQualityReportHTML(
    tableName: string,
    schema: { column_name: string; column_type: string }[],
    qualityScore: number,
    columnScores: { column: string; score: number }[]
): Promise<string> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Data Quality Report - ${tableName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        .score-box { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .score-value { font-size: 72px; font-weight: bold; }
        .score-label { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f9fafb; font-weight: 600; }
        .good { color: #10b981; }
        .warn { color: #f59e0b; }
        .bad { color: #ef4444; }
        .meta { color: #666; font-size: 12px; margin-top: 40px; }
    </style>
</head>
<body>
    <h1>Data Quality Report</h1>
    <p><strong>Table:</strong> ${tableName}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    
    <div class="score-box">
        <div class="score-value">${qualityScore}</div>
        <div class="score-label">Overall Quality Score</div>
    </div>
    
    <h2>Schema Overview</h2>
    <table>
        <tr><th>Column</th><th>Type</th></tr>
        ${schema.map(c => `<tr><td>${c.column_name}</td><td>${c.column_type}</td></tr>`).join('')}
    </table>
    
    <h2>Column Quality Scores</h2>
    <table>
        <tr><th>Column</th><th>Score</th><th>Status</th></tr>
        ${columnScores.map(c => `
            <tr>
                <td>${c.column}</td>
                <td>${c.score}/100</td>
                <td class="${c.score >= 80 ? 'good' : c.score >= 60 ? 'warn' : 'bad'}">
                    ${c.score >= 80 ? '✓ Good' : c.score >= 60 ? '⚠ Warning' : '✗ Poor'}
                </td>
            </tr>
        `).join('')}
    </table>
    
    <div class="meta">
        <p>Generated by DataGuard - Open Source Data Quality Framework</p>
    </div>
</body>
</html>`;

    return html;
}

/**
 * Open quality report in new window for PDF printing
 */
export async function openQualityReport(
    tableName: string,
    schema: { column_name: string; column_type: string }[],
    qualityScore: number,
    columnScores: { column: string; score: number }[]
): Promise<void> {
    const html = await generateQualityReportHTML(tableName, schema, qualityScore, columnScores);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

/**
 * Export a table to Parquet format using DuckDB native COPY
 */
async function exportToParquet(tableName: string, limit?: number): Promise<Blob> {
    const filename = `export_${Date.now()}.parquet`;
    const query = limit
        ? `COPY (SELECT * FROM "${tableName}" LIMIT ${limit}) TO '${filename}' (FORMAT PARQUET)`
        : `COPY (SELECT * FROM "${tableName}") TO '${filename}' (FORMAT PARQUET)`;

    await duckdb.execute(query);
    const buffer = await duckdb.copyFileToBuffer(filename);
    // Copy to regular Uint8Array to avoid SharedArrayBuffer issues with Blob
    const regularBuffer = new Uint8Array(buffer.length);
    regularBuffer.set(buffer);
    return new Blob([regularBuffer], { type: 'application/octet-stream' });
}

/**
 * Export a table to the specified format and trigger download
 */
export async function exportTable(options: ExportOptions): Promise<ExportResult> {
    const { format, tableName, filename, limit } = options;

    try {
        let blob: Blob;
        let extension: string;

        switch (format) {
            case 'csv':
                blob = await exportToCSV(tableName, limit);
                extension = 'csv';
                break;
            case 'json':
                blob = await exportToJSON(tableName, limit);
                extension = 'json';
                break;
            case 'parquet':
                blob = await exportToParquet(tableName, limit);
                extension = 'parquet';
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        const exportFilename = filename || `${tableName}_export.${extension}`;


        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

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
        { format: 'yaml', label: 'YAML', description: 'Validation rules for CI/CD integration' },
        { format: 'parquet', label: 'Parquet (JSON)', description: 'Columnar format (JSON fallback)' }
    ];
}


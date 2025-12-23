export type SupportedFormat =
  | 'csv'
  | 'parquet'
  | 'excel'
  | 'json'
  | 'jsonl'
  | 'sqlite'
  | 'sql'
  | 'tsv'
  | 'xml'
  | 'unknown';

export interface FormatDetectionResult {
  format: SupportedFormat;
  confidence: 'high' | 'medium' | 'low';
  mimeType: string;
  parser: 'duckdb' | 'sheetjs' | 'sqljs' | 'custom';
  metadata?: {
    encoding?: string;
    delimiter?: string;
    hasHeader?: boolean;
    sheets?: string[];      // For Excel
    tables?: string[];      // For SQLite/SQL
  };
}

// Magic bytes signatures
const MAGIC_BYTES = {
  parquet: [0x50, 0x41, 0x52, 0x31],           // PAR1
  sqlite: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65], // SQLite (actually "SQLite format 3\0")
  xlsx: [0x50, 0x4B, 0x03, 0x04],              // PK.. (ZIP)
  xls: [0xD0, 0xCF, 0x11, 0xE0],               // OLE compound
};

/**
 * Reads the first N bytes of a file as a Uint8Array
 */
export async function readMagicBytes(file: File, length: number): Promise<Uint8Array> {
  const blob = file.slice(0, length);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Checks if a byte array matches a magic byte signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Detects format for text files (CSV, TSV, JSON, SQL)
 */
export async function detectTextFormat(file: File): Promise<Partial<FormatDetectionResult>> {
  // Read first 4KB of the file for content peeking
  const text = await file.slice(0, 4096).text();
  const trimmed = text.trim();

  // 1. Check for JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      // If it looks like JSON, it might be JSON or JSONL
      if (trimmed.startsWith('[') || (trimmed.startsWith('{') && !trimmed.includes('\n{'))) {
        return { format: 'json', confidence: 'high', parser: 'duckdb' };
      }
      if (trimmed.startsWith('{') && trimmed.includes('\n{')) {
        return { format: 'jsonl', confidence: 'medium', parser: 'duckdb' };
      }
    } catch {
      // Not valid JSON start, fall through
    }
  }

  // 2. Check for SQL (CREATE TABLE, INSERT INTO, etc.)
  const sqlKeywords = ['CREATE TABLE', 'INSERT INTO', 'DROP TABLE', 'SELECT * FROM'];
  if (sqlKeywords.some(kw => trimmed.toUpperCase().includes(kw))) {
    return { format: 'sql', confidence: 'medium', parser: 'custom' };
  }

  // 3. Detect Delimiter (CSV vs TSV)
  const lines = trimmed.split('\n').slice(0, 10);
  if (lines.length > 0) {
    const commas = (lines[0].match(/,/g) || []).length;
    const tabs = (lines[0].match(/\t/g) || []).length;
    const semicolons = (lines[0].match(/;/g) || []).length;

    if (tabs > commas && tabs > semicolons) {
      return { 
        format: 'tsv', 
        confidence: 'high', 
        parser: 'duckdb',
        metadata: { delimiter: '\t' }
      };
    }
    
    // Default to CSV if we see commas or semicolons
    if (commas > 0 || semicolons > 0) {
      return { 
        format: 'csv', 
        confidence: 'high', 
        parser: 'duckdb',
        metadata: { delimiter: semicolons > commas ? ';' : ',' }
      };
    }
  }

  return { format: 'unknown', confidence: 'low', parser: 'duckdb' };
}

/**
 * Main entry point for detecting file format
 */
export async function detectFormat(file: File): Promise<FormatDetectionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const magicBytes = await readMagicBytes(file, 8);

  // 1. Binary Formats (High Confidence via Magic Bytes)
  if (matchesSignature(magicBytes, MAGIC_BYTES.parquet)) {
    return { format: 'parquet', confidence: 'high', mimeType: 'application/x-parquet', parser: 'duckdb' };
  }

  if (matchesSignature(magicBytes, MAGIC_BYTES.sqlite)) {
    return { format: 'sqlite', confidence: 'high', mimeType: 'application/x-sqlite3', parser: 'sqljs' };
  }

  if (matchesSignature(magicBytes, MAGIC_BYTES.xlsx)) {
    return { format: 'excel', confidence: 'high', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', parser: 'sheetjs' };
  }

  if (matchesSignature(magicBytes, MAGIC_BYTES.xls)) {
    return { format: 'excel', confidence: 'high', mimeType: 'application/vnd.ms-excel', parser: 'sheetjs' };
  }

  // 2. Text-Based Formats
  const textResult = await detectTextFormat(file);
  if (textResult.format && textResult.format !== 'unknown') {
    return {
      format: textResult.format,
      confidence: textResult.confidence || 'medium',
      mimeType: file.type || 'text/plain',
      parser: textResult.parser || 'duckdb',
      metadata: textResult.metadata
    };
  }

  // 3. Fallback to Extension
  const extensionMap: Record<string, SupportedFormat> = {
    'csv': 'csv',
    'tsv': 'tsv',
    'xlsx': 'excel',
    'xls': 'excel',
    'parquet': 'parquet',
    'pq': 'parquet',
    'json': 'json',
    'jsonl': 'jsonl',
    'sql': 'sql',
    'sqlite': 'sqlite',
    'db': 'sqlite',
    'xml': 'xml'
  };

  if (extension && extensionMap[extension]) {
    return {
      format: extensionMap[extension],
      confidence: 'medium',
      mimeType: file.type || 'application/octet-stream',
      parser: getParserForFormat(extensionMap[extension])
    };
  }

  return {
    format: 'unknown',
    confidence: 'low',
    mimeType: file.type || 'application/octet-stream',
    parser: 'duckdb'
  };
}

/**
 * Maps format to its respective parser library
 */
export function getParserForFormat(format: SupportedFormat): 'duckdb' | 'sheetjs' | 'sqljs' | 'custom' {
  switch (format) {
    case 'csv':
    case 'tsv':
    case 'parquet':
    case 'json':
    case 'jsonl':
      return 'duckdb';
    case 'excel':
      return 'sheetjs';
    case 'sqlite':
      return 'sqljs';
    case 'sql':
      return 'custom';
    default:
      return 'duckdb';
  }
}

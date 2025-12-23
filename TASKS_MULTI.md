# DataGuard — Multi-Format Support & Landing Page Upload

> Complete task breakdown for universal file format support

---

## 🎯 Goals

1. **Support ALL common data formats** — CSV, Excel, Parquet, JSON, SQL files, SQLite databases, TSV, and more
2. **Landing page upload works** — Same functionality as dashboard, seamless redirect
3. **Format auto-detection** — Identify format from extension + magic bytes
4. **Unified processing pipeline** — All formats flow through same schema/validation engine

---

## 📁 Supported Formats

| Format | Extension(s) | Library | Priority |
|--------|--------------|---------|----------|
| CSV | `.csv` | DuckDB native | ✅ P0 |
| Parquet | `.parquet`, `.pq` | DuckDB native | ✅ P0 |
| Excel | `.xlsx`, `.xls` | SheetJS (xlsx) | ✅ P0 |
| JSON | `.json`, `.jsonl`, `.ndjson` | DuckDB native | ✅ P1 |
| SQLite | `.sqlite`, `.db`, `.sqlite3` | sql.js | ✅ P1 |
| SQL Dump | `.sql` | Custom parser | ✅ P1 |
| TSV | `.tsv`, `.tab` | DuckDB (CSV with delimiter) | P2 |
| XML | `.xml` | fast-xml-parser | P3 |
| Avro | `.avro` | avro-js | P3 |
| ORC | `.orc` | Not in browser (show message) | P4 |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FILE INPUT                                   │
│  Landing Page Upload | Dashboard Upload | Drag & Drop            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FORMAT DETECTOR                                │
│  1. Check file extension                                         │
│  2. Read magic bytes (first 8 bytes)                            │
│  3. Determine parser to use                                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FORMAT PARSERS                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │  CSV    │ │  Excel  │ │  JSON   │ │ SQLite  │ │  SQL    │   │
│  │ DuckDB  │ │ SheetJS │ │ DuckDB  │ │ sql.js  │ │ Parser  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       └───────────┴───────────┴───────────┴───────────┘         │
│                              │                                   │
│                              ▼                                   │
│                   NORMALIZED TABLE DATA                          │
│                   (DuckDB in-memory table)                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXISTING DATAGUARD PIPELINE                         │
│  Schema Inference → Drift Detection → Validation → Lineage      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase M1: Core Infrastructure

### Task M1.1: Format Detection Service
**Time:** 1.5 hours
**File:** `src/lib/format-detector.ts`

Create a service that identifies file format from extension and magic bytes.

```typescript
// Types
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
  sqlite: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65], // SQLite
  xlsx: [0x50, 0x4B, 0x03, 0x04],              // PK.. (ZIP)
  xls: [0xD0, 0xCF, 0x11, 0xE0],               // OLE compound
};

// Implementation
export async function detectFormat(file: File): Promise<FormatDetectionResult> {
  // 1. Check extension first
  // 2. Read first 8 bytes
  // 3. Match against magic bytes
  // 4. For text files, peek content to detect CSV vs TSV vs JSON
  // 5. Return detection result with confidence
}

export function getParserForFormat(format: SupportedFormat): string {
  // Return which parser library to use
}
```

**Functions to implement:**
- [ ] `detectFormat(file: File)` — Main detection function
- [ ] `readMagicBytes(file: File, length: number)` — Read first N bytes
- [ ] `detectTextFormat(content: string)` — CSV vs TSV vs JSON detection
- [ ] `getParserForFormat(format)` — Map format to parser

**Acceptance Criteria:**
- Correctly identifies all supported formats
- Works with files that have wrong extensions
- Returns confidence level

---

### Task M1.2: Unified File Processor Interface
**Time:** 1 hour
**File:** `src/lib/file-processor.ts`

Create a unified interface that all format parsers implement.

```typescript
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

// Factory function
export function getProcessor(format: SupportedFormat): FileProcessor {
  switch (format) {
    case 'csv':
    case 'tsv':
      return new CSVProcessor();
    case 'parquet':
      return new ParquetProcessor();
    case 'excel':
      return new ExcelProcessor();
    case 'json':
    case 'jsonl':
      return new JSONProcessor();
    case 'sqlite':
      return new SQLiteProcessor();
    case 'sql':
      return new SQLDumpProcessor();
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

**Acceptance Criteria:**
- Clean interface that all processors implement
- Factory function returns correct processor
- Options allow customization per format

---

### Task M1.3: CSV/TSV Processor (DuckDB Native)
**Time:** 45 mins
**File:** `src/lib/processors/csv-processor.ts`

```typescript
import { FileProcessor, ProcessedTable, FileProcessorOptions } from '../file-processor';
import { duckdb } from '../duckdb';

export class CSVProcessor implements FileProcessor {
  format = 'csv' as const;

  canProcess(file: File, detection: FormatDetectionResult): boolean {
    return ['csv', 'tsv'].includes(detection.format);
  }

  async listTables(file: File): Promise<string[]> {
    // CSV has one "table" - the file itself
    return [file.name.replace(/\.[^.]+$/, '')];
  }

  async process(
    file: File, 
    options?: FileProcessorOptions
  ): Promise<ProcessedTable[]> {
    const tableName = this.sanitizeTableName(file.name);
    
    // Register file with DuckDB
    await duckdb.registerFile(file);
    
    // Detect delimiter if not specified
    const delimiter = options?.delimiter || await this.detectDelimiter(file);
    
    // Create table from CSV
    await duckdb.execute(`
      CREATE TABLE ${tableName} AS 
      SELECT * FROM read_csv_auto('${file.name}', 
        delim='${delimiter}',
        header=${options?.hasHeader ?? true}
      )
      ${options?.maxRows ? `LIMIT ${options.maxRows}` : ''}
    `);

    // Get schema and stats
    const schema = await duckdb.getSchema(tableName);
    const rowCount = await duckdb.getRowCount(tableName);
    const sampleRows = await duckdb.query(
      `SELECT * FROM ${tableName} LIMIT ${options?.sampleSize || 100}`
    );

    return [{
      name: tableName,
      columns: schema,
      rowCount,
      sampleRows,
      sourceFormat: 'csv',
      sourceFile: file.name,
      processedAt: new Date()
    }];
  }

  async preview(file: File, rows = 10): Promise<Record<string, unknown>[]> {
    // Quick preview without full processing
  }

  private async detectDelimiter(file: File): Promise<string> {
    // Read first 1KB and detect delimiter
    const text = await file.slice(0, 1024).text();
    const commas = (text.match(/,/g) || []).length;
    const tabs = (text.match(/\t/g) || []).length;
    const semicolons = (text.match(/;/g) || []).length;
    
    if (tabs > commas && tabs > semicolons) return '\t';
    if (semicolons > commas) return ';';
    return ',';
  }

  private sanitizeTableName(filename: string): string {
    return filename
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
  }
}
```

**Acceptance Criteria:**
- Loads CSV files into DuckDB
- Auto-detects delimiter (comma, tab, semicolon)
- Handles files with/without headers
- Returns proper schema

---

### Task M1.4: Parquet Processor (DuckDB Native)
**Time:** 30 mins
**File:** `src/lib/processors/parquet-processor.ts`

```typescript
export class ParquetProcessor implements FileProcessor {
  format = 'parquet' as const;

  async process(
    file: File, 
    options?: FileProcessorOptions
  ): Promise<ProcessedTable[]> {
    const tableName = this.sanitizeTableName(file.name);
    
    await duckdb.registerFile(file);
    
    await duckdb.execute(`
      CREATE TABLE ${tableName} AS 
      SELECT * FROM read_parquet('${file.name}')
      ${options?.maxRows ? `LIMIT ${options.maxRows}` : ''}
    `);

    const schema = await duckdb.getSchema(tableName);
    const rowCount = await duckdb.getRowCount(tableName);
    const sampleRows = await duckdb.query(
      `SELECT * FROM ${tableName} LIMIT ${options?.sampleSize || 100}`
    );

    return [{
      name: tableName,
      columns: schema,
      rowCount,
      sampleRows,
      sourceFormat: 'parquet',
      sourceFile: file.name,
      processedAt: new Date()
    }];
  }

  // ... other methods
}
```

**Acceptance Criteria:**
- Loads Parquet files into DuckDB
- Preserves schema types from Parquet metadata
- Handles large files efficiently

---

### Task M1.5: Excel Processor (SheetJS)
**Time:** 1.5 hours
**File:** `src/lib/processors/excel-processor.ts`

**Install:** `npm install xlsx`

```typescript
import * as XLSX from 'xlsx';
import { FileProcessor, ProcessedTable, FileProcessorOptions } from '../file-processor';
import { duckdb } from '../duckdb';

export class ExcelProcessor implements FileProcessor {
  format = 'excel' as const;

  async listTables(file: File): Promise<string[]> {
    // Return list of sheet names
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
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options?.hasHeader === false ? 1 : undefined,
        defval: null,
        raw: false // Get formatted strings
      });

      if (jsonData.length === 0) continue;

      // Create table name
      const tableName = this.sanitizeTableName(`${file.name}_${sheetName}`);
      
      // Infer types and create DuckDB table
      const columns = this.inferColumnsFromData(jsonData);
      
      // Insert data into DuckDB
      await this.loadIntoDuckDB(tableName, columns, jsonData, options?.maxRows);

      const rowCount = await duckdb.getRowCount(tableName);
      const sampleRows = await duckdb.query(
        `SELECT * FROM ${tableName} LIMIT ${options?.sampleSize || 100}`
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

  private inferColumnsFromData(data: Record<string, unknown>[]): ColumnSchema[] {
    // Sample first 100 rows to infer types
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
    
    // Check if all values are numbers
    if (values.every(v => !isNaN(Number(v)))) {
      // Check if integers or floats
      if (values.every(v => Number.isInteger(Number(v)))) {
        return 'BIGINT';
      }
      return 'DOUBLE';
    }
    
    // Check if all values are dates
    if (values.every(v => !isNaN(Date.parse(String(v))))) {
      return 'TIMESTAMP';
    }
    
    // Check if all values are booleans
    if (values.every(v => ['true', 'false', '1', '0'].includes(String(v).toLowerCase()))) {
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
    // Create table
    const columnDefs = columns
      .map(c => `"${c.name}" ${c.type}`)
      .join(', ');
    
    await duckdb.execute(`CREATE TABLE ${tableName} (${columnDefs})`);

    // Insert data in batches
    const rows = maxRows ? data.slice(0, maxRows) : data;
    const batchSize = 1000;
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const values = batch.map(row => 
        `(${columns.map(c => this.formatValue(row[c.name], c.type)).join(', ')})`
      ).join(', ');
      
      await duckdb.execute(`INSERT INTO ${tableName} VALUES ${values}`);
    }
  }

  private formatValue(value: unknown, type: string): string {
    if (value == null) return 'NULL';
    if (type === 'VARCHAR') return `'${String(value).replace(/'/g, "''")}'`;
    if (type === 'TIMESTAMP') return `'${value}'`;
    return String(value);
  }

  // ... sanitizeTableName, etc.
}
```

**Acceptance Criteria:**
- Loads .xlsx and .xls files
- Lists all sheets, allows selecting specific sheet
- Infers column types from data
- Handles merged cells gracefully
- Shows sheet selector in UI when multiple sheets

---

### Task M1.6: JSON/JSONL Processor
**Time:** 1 hour
**File:** `src/lib/processors/json-processor.ts`

```typescript
export class JSONProcessor implements FileProcessor {
  format = 'json' as const;

  async process(
    file: File, 
    options?: FileProcessorOptions
  ): Promise<ProcessedTable[]> {
    const text = await file.text();
    const tableName = this.sanitizeTableName(file.name);
    
    // Detect if it's JSON array, JSONL, or nested JSON
    const format = this.detectJSONFormat(text);
    
    if (format === 'array') {
      // Standard JSON array: [{"a": 1}, {"a": 2}]
      await duckdb.registerFile(file);
      await duckdb.execute(`
        CREATE TABLE ${tableName} AS 
        SELECT * FROM read_json_auto('${file.name}')
      `);
    } else if (format === 'jsonl') {
      // Newline-delimited JSON
      await duckdb.registerFile(file);
      await duckdb.execute(`
        CREATE TABLE ${tableName} AS 
        SELECT * FROM read_ndjson_auto('${file.name}')
      `);
    } else if (format === 'nested') {
      // Nested JSON - need to flatten or let user choose path
      const data = JSON.parse(text);
      const tables = this.flattenNestedJSON(data, tableName);
      // Create multiple tables from nested structure
      for (const [name, rows] of Object.entries(tables)) {
        await this.createTableFromArray(name, rows as Record<string, unknown>[]);
      }
    }

    // Return processed tables...
  }

  private detectJSONFormat(text: string): 'array' | 'jsonl' | 'nested' | 'single' {
    const trimmed = text.trim();
    
    // Check for JSONL (newline-separated objects)
    if (trimmed.startsWith('{') && trimmed.includes('\n{')) {
      return 'jsonl';
    }
    
    // Check for array
    if (trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return 'array';
      }
    }
    
    // Single object with nested arrays
    if (trimmed.startsWith('{')) {
      return 'nested';
    }
    
    return 'single';
  }

  private flattenNestedJSON(
    data: Record<string, unknown>, 
    prefix: string
  ): Record<string, Record<string, unknown>[]> {
    const tables: Record<string, Record<string, unknown>[]> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        tables[`${prefix}_${key}`] = value as Record<string, unknown>[];
      }
    }
    
    // If no arrays found, treat root as single-row table
    if (Object.keys(tables).length === 0) {
      tables[prefix] = [data];
    }
    
    return tables;
  }
}
```

**Acceptance Criteria:**
- Handles JSON arrays `[{}, {}]`
- Handles JSONL/NDJSON (newline-delimited)
- Handles nested JSON by flattening to multiple tables
- Shows table selector for nested JSON

---

### Task M1.7: SQLite Processor (sql.js)
**Time:** 2 hours
**File:** `src/lib/processors/sqlite-processor.ts`

**Install:** `npm install sql.js`

```typescript
import initSqlJs, { Database } from 'sql.js';
import { FileProcessor, ProcessedTable, FileProcessorOptions } from '../file-processor';
import { duckdb } from '../duckdb';

export class SQLiteProcessor implements FileProcessor {
  format = 'sqlite' as const;
  private sqljs: Awaited<ReturnType<typeof initSqlJs>> | null = null;

  private async initSqlJs(): Promise<typeof this.sqljs> {
    if (!this.sqljs) {
      this.sqljs = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
    }
    return this.sqljs;
  }

  async listTables(file: File): Promise<string[]> {
    const SQL = await this.initSqlJs();
    const buffer = await file.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));
    
    const result = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    db.close();
    
    return result[0]?.values.map(row => String(row[0])) || [];
  }

  async process(
    file: File, 
    options?: FileProcessorOptions
  ): Promise<ProcessedTable[]> {
    const SQL = await this.initSqlJs();
    const buffer = await file.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));
    
    const results: ProcessedTable[] = [];
    
    // Get tables to process
    const tables = options?.table 
      ? [options.table]
      : await this.listTables(file);

    for (const tableName of tables) {
      // Get schema from SQLite
      const schemaResult = db.exec(`PRAGMA table_info(${tableName})`);
      const columns = schemaResult[0]?.values.map(row => ({
        name: String(row[1]),
        type: this.mapSQLiteType(String(row[2])),
        nullable: row[3] === 0,
        primaryKey: row[5] === 1
      })) || [];

      // Get row count
      const countResult = db.exec(`SELECT COUNT(*) FROM ${tableName}`);
      const rowCount = Number(countResult[0]?.values[0][0] || 0);

      // Get sample data
      const sampleResult = db.exec(
        `SELECT * FROM ${tableName} LIMIT ${options?.sampleSize || 100}`
      );
      const sampleRows = this.resultToObjects(sampleResult[0], columns);

      // Load into DuckDB for further processing
      const duckTableName = `sqlite_${this.sanitizeTableName(tableName)}`;
      await this.loadIntoDuckDB(duckTableName, columns, db, tableName, options?.maxRows);

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

    db.close();
    return results;
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

  private resultToObjects(
    result: { columns: string[]; values: unknown[][] } | undefined,
    columns: { name: string }[]
  ): Record<string, unknown>[] {
    if (!result) return [];
    return result.values.map(row => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        obj[col.name] = row[i];
      });
      return obj;
    });
  }

  private async loadIntoDuckDB(
    tableName: string,
    columns: ColumnSchema[],
    sqliteDb: Database,
    sourceTable: string,
    maxRows?: number
  ): Promise<void> {
    // Create table in DuckDB
    const columnDefs = columns
      .map(c => `"${c.name}" ${c.type}`)
      .join(', ');
    
    await duckdb.execute(`CREATE TABLE ${tableName} (${columnDefs})`);

    // Stream data from SQLite to DuckDB
    const limit = maxRows ? `LIMIT ${maxRows}` : '';
    const result = sqliteDb.exec(`SELECT * FROM ${sourceTable} ${limit}`);
    
    if (result[0]) {
      const batchSize = 1000;
      const values = result[0].values;
      
      for (let i = 0; i < values.length; i += batchSize) {
        const batch = values.slice(i, i + batchSize);
        const insertValues = batch.map(row =>
          `(${row.map((v, j) => this.formatValue(v, columns[j].type)).join(', ')})`
        ).join(', ');
        
        await duckdb.execute(`INSERT INTO ${tableName} VALUES ${insertValues}`);
      }
    }
  }
}
```

**Acceptance Criteria:**
- Loads .sqlite, .db, .sqlite3 files
- Lists all tables, allows selecting specific table
- Preserves SQLite schema types
- Handles large databases by streaming
- Shows table selector in UI

---

### Task M1.8: SQL Dump Processor
**Time:** 1.5 hours
**File:** `src/lib/processors/sql-dump-processor.ts`

```typescript
export class SQLDumpProcessor implements FileProcessor {
  format = 'sql' as const;

  async listTables(file: File): Promise<string[]> {
    const text = await file.text();
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?/gi;
    const tables: string[] = [];
    
    let match;
    while ((match = createTableRegex.exec(text)) !== null) {
      tables.push(match[1]);
    }
    
    return tables;
  }

  async process(
    file: File, 
    options?: FileProcessorOptions
  ): Promise<ProcessedTable[]> {
    const text = await file.text();
    const results: ProcessedTable[] = [];
    
    // Parse SQL statements
    const statements = this.parseStatements(text);
    
    // Group by table
    const tableStatements = this.groupByTable(statements);
    
    // Process each table
    for (const [tableName, stmts] of Object.entries(tableStatements)) {
      if (options?.table && options.table !== tableName) continue;
      
      // Execute CREATE TABLE
      const createStmt = stmts.find(s => s.type === 'CREATE');
      if (createStmt) {
        await duckdb.execute(this.convertToPostgres(createStmt.sql));
      }
      
      // Execute INSERT statements
      const insertStmts = stmts.filter(s => s.type === 'INSERT');
      let insertedRows = 0;
      
      for (const insertStmt of insertStmts) {
        if (options?.maxRows && insertedRows >= options.maxRows) break;
        await duckdb.execute(this.convertToPostgres(insertStmt.sql));
        insertedRows += insertStmt.rowCount || 1;
      }
      
      // Get results
      const schema = await duckdb.getSchema(tableName);
      const rowCount = await duckdb.getRowCount(tableName);
      const sampleRows = await duckdb.query(
        `SELECT * FROM ${tableName} LIMIT ${options?.sampleSize || 100}`
      );

      results.push({
        name: tableName,
        columns: schema,
        rowCount,
        sampleRows,
        sourceFormat: 'sql',
        sourceFile: `${file.name} [${tableName}]`,
        processedAt: new Date()
      });
    }

    return results;
  }

  private parseStatements(sql: string): SQLStatement[] {
    // Split by semicolons, handling quoted strings
    // Return array of {type, table, sql, rowCount}
  }

  private convertToPostgres(sql: string): string {
    // Convert MySQL/SQLite syntax to DuckDB-compatible syntax
    return sql
      .replace(/`/g, '"')                          // Backticks to quotes
      .replace(/AUTO_INCREMENT/gi, '')             // Remove AUTO_INCREMENT
      .replace(/ENGINE\s*=\s*\w+/gi, '')          // Remove ENGINE
      .replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '') // Remove CHARSET
      .replace(/UNSIGNED/gi, '')                   // Remove UNSIGNED
      .replace(/ON UPDATE CURRENT_TIMESTAMP/gi, ''); // Remove triggers
  }
}
```

**Acceptance Criteria:**
- Parses MySQL, PostgreSQL, SQLite dump files
- Extracts CREATE TABLE and INSERT statements
- Converts syntax to DuckDB-compatible
- Handles large dump files
- Shows warning for unsupported syntax

---

## 📋 Phase M2: UI Components

### Task M2.1: Universal File Upload Component
**Time:** 2 hours
**File:** `src/components/shared/UniversalFileUpload.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Database, FileJson, FileText, Table2, Loader2, AlertCircle } from 'lucide-react';
import { detectFormat, SupportedFormat } from '@/lib/format-detector';
import { getProcessor } from '@/lib/file-processor';

interface UniversalFileUploadProps {
  onFilesProcessed: (tables: ProcessedTable[]) => void;
  onError?: (error: Error) => void;
  className?: string;
  showPreview?: boolean;
  redirectToDashboard?: boolean;  // For landing page
}

const FORMAT_ICONS: Record<SupportedFormat, typeof FileSpreadsheet> = {
  csv: FileText,
  parquet: Table2,
  excel: FileSpreadsheet,
  json: FileJson,
  jsonl: FileJson,
  sqlite: Database,
  sql: Database,
  tsv: FileText,
  xml: FileText,
  unknown: FileText,
};

const FORMAT_COLORS: Record<SupportedFormat, string> = {
  csv: 'text-green-400',
  parquet: 'text-purple-400',
  excel: 'text-emerald-400',
  json: 'text-yellow-400',
  jsonl: 'text-yellow-400',
  sqlite: 'text-blue-400',
  sql: 'text-blue-400',
  tsv: 'text-green-400',
  xml: 'text-orange-400',
  unknown: 'text-zinc-400',
};

export function UniversalFileUpload({
  onFilesProcessed,
  onError,
  className,
  showPreview = true,
  redirectToDashboard = false,
}: UniversalFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<FormatDetectionResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // For multi-table files (Excel, SQLite)
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [showTableSelector, setShowTableSelector] = useState(false);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    setError(null);
    setCurrentFile(file);
    setIsProcessing(true);
    setProgress(10);

    try {
      // Step 1: Detect format
      const detection = await detectFormat(file);
      setDetectedFormat(detection);
      setProgress(20);

      if (detection.format === 'unknown') {
        throw new Error(`Unsupported file format: ${file.name}`);
      }

      // Step 2: Get processor
      const processor = getProcessor(detection.format);
      setProgress(30);

      // Step 3: Check for multiple tables
      const tables = await processor.listTables(file);
      
      if (tables.length > 1) {
        // Show table selector for Excel/SQLite
        setAvailableTables(tables);
        setShowTableSelector(true);
        setIsProcessing(false);
        return;
      }

      // Step 4: Process file
      setProgress(50);
      const processedTables = await processor.process(file);
      setProgress(100);

      // Step 5: Callback
      onFilesProcessed(processedTables);

      if (redirectToDashboard) {
        // Store in localStorage and redirect
        localStorage.setItem('pendingTables', JSON.stringify(processedTables));
        window.location.href = '/dashboard';
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const processSelectedTables = async () => {
    if (!currentFile || selectedTables.length === 0) return;
    
    setShowTableSelector(false);
    setIsProcessing(true);
    setProgress(50);

    try {
      const processor = getProcessor(detectedFormat!.format);
      const allTables: ProcessedTable[] = [];

      for (const table of selectedTables) {
        const processed = await processor.process(currentFile, { table });
        allTables.push(...processed);
      }

      setProgress(100);
      onFilesProcessed(allTables);

      if (redirectToDashboard) {
        localStorage.setItem('pendingTables', JSON.stringify(allTables));
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={className}>
      {/* Main drop zone */}
      <motion.div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-500/10' 
            : 'border-white/10 hover:border-white/20 bg-white/5'
          }
        `}
        onClick={() => document.getElementById('file-input')?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".csv,.parquet,.pq,.xlsx,.xls,.json,.jsonl,.ndjson,.sqlite,.db,.sqlite3,.sql,.tsv"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Loader2 className="mx-auto animate-spin text-emerald-400" size={48} />
              <div>
                <p className="text-white font-medium">{currentFile?.name}</p>
                <p className="text-zinc-400 text-sm">
                  {progress < 30 && 'Detecting format...'}
                  {progress >= 30 && progress < 50 && 'Initializing processor...'}
                  {progress >= 50 && progress < 100 && 'Processing data...'}
                  {progress === 100 && 'Complete!'}
                </p>
              </div>
              <div className="w-64 mx-auto bg-white/10 rounded-full h-2">
                <motion.div
                  className="bg-emerald-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Upload className={`mx-auto ${isDragging ? 'text-emerald-400' : 'text-zinc-500'}`} size={48} />
              <div>
                <p className="text-lg text-white">Drop your data file here</p>
                <p className="text-zinc-500 text-sm">or click to browse</p>
              </div>
              
              {/* Supported formats */}
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {['CSV', 'Parquet', 'Excel', 'JSON', 'SQLite', 'SQL'].map((fmt) => (
                  <span 
                    key={fmt}
                    className="text-xs px-2 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/10"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Table selector modal for Excel/SQLite */}
      <AnimatePresence>
        {showTableSelector && (
          <TableSelectorModal
            tables={availableTables}
            selectedTables={selectedTables}
            onSelectionChange={setSelectedTables}
            onConfirm={processSelectedTables}
            onCancel={() => setShowTableSelector(false)}
            format={detectedFormat?.format || 'unknown'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Acceptance Criteria:**
- Accepts all supported file formats
- Shows format-specific icon after detection
- Progress indicator during processing
- Table selector modal for multi-table files
- Error handling with clear messages
- Works on both landing page and dashboard

---

### Task M2.2: Table Selector Modal
**Time:** 45 mins
**File:** `src/components/shared/TableSelectorModal.tsx`

```typescript
// Modal that appears when Excel/SQLite has multiple sheets/tables
// Allows user to select which ones to import
// Shows preview row count for each table
```

**Features:**
- [ ] Checkbox list of tables/sheets
- [ ] "Select All" / "Deselect All" buttons
- [ ] Preview row count per table
- [ ] Confirm/Cancel buttons

---

### Task M2.3: Format Badge Component
**Time:** 20 mins
**File:** `src/components/shared/FormatBadge.tsx`

```typescript
// Small badge showing file format with appropriate icon/color
// Used in file list, headers, etc.

export function FormatBadge({ format }: { format: SupportedFormat }) {
  const Icon = FORMAT_ICONS[format];
  const color = FORMAT_COLORS[format];
  
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 ${color}`}>
      <Icon size={12} />
      {format.toUpperCase()}
    </span>
  );
}
```

---

### Task M2.4: Update Landing Page Upload
**Time:** 1 hour
**File:** `src/app/page.tsx` (or wherever landing page is)

**Changes needed:**
- [ ] Replace existing upload component with `<UniversalFileUpload>`
- [ ] Add `redirectToDashboard={true}` prop
- [ ] Update supported formats list in UI
- [ ] Add "Your data never leaves your browser" message

```typescript
<UniversalFileUpload
  onFilesProcessed={(tables) => {
    // Store in localStorage
    localStorage.setItem('dataguard_pending', JSON.stringify(tables));
    // Redirect to dashboard
    router.push('/dashboard');
  }}
  redirectToDashboard={true}
  showPreview={true}
/>
```

---

### Task M2.5: Update Dashboard to Accept Pending Files
**Time:** 45 mins
**File:** `src/app/dashboard/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';

export default function Dashboard() {
  useEffect(() => {
    // Check for pending tables from landing page
    const pending = localStorage.getItem('dataguard_pending');
    if (pending) {
      const tables = JSON.parse(pending);
      // Add to dashboard state
      addTables(tables);
      // Clear pending
      localStorage.removeItem('dataguard_pending');
    }
  }, []);

  // ... rest of dashboard
}
```

---

### Task M2.6: Multi-Table View Component
**Time:** 1.5 hours
**File:** `src/components/app/MultiTableView.tsx`

For SQLite/SQL files with multiple tables:

```
┌─────────────────────────────────────────────────────────────┐
│  ecommerce.sqlite                                    [×]    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ users    │ │ orders   │ │ products │ │ reviews  │       │
│  │ 1,234    │ │ 45,678   │ │ 892      │ │ 12,345   │       │
│  │ rows     │ │ rows     │ │ rows     │ │ rows     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  [View Relationships] [Run Cross-Table Validation]          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Grid view of all tables in file
- [ ] Click table to see schema/data
- [ ] Show relationships between tables (if FKs detected)
- [ ] Cross-table validation support

---

## 📋 Phase M3: Advanced Features

### Task M3.1: Schema Comparison Across Formats
**Time:** 1 hour

When comparing schemas between different source formats:
- Handle type mapping differences
- Show format-aware type equivalences
- Highlight meaningful differences vs format artifacts

---

### Task M3.2: Cross-Table Referential Integrity
**Time:** 1.5 hours

For SQLite/SQL imports with multiple tables:
- Auto-detect foreign key relationships
- Run referential integrity validations
- Show orphaned records

---

### Task M3.3: Format Conversion Export
**Time:** 2 hours

Allow exporting processed data to different formats:
- Export to CSV
- Export to Parquet (if feasible in browser)
- Export to JSON
- Export to SQL INSERT statements

---

### Task M3.4: Large File Handling
**Time:** 1.5 hours

For files > 50MB:
- Show warning about browser memory
- Offer sampling option (load first N rows)
- Progress indicator with row count
- Cancel button for long operations

```typescript
if (file.size > 50 * 1024 * 1024) {
  // Show modal
  // "This file is 150MB. For best performance, we recommend:"
  // [Load First 100K Rows] [Load All (may be slow)] [Cancel]
}
```

---

## 📊 Progress Tracker

| Phase | Tasks | Status | Est. Time |
|-------|-------|--------|-----------|
| M1: Infrastructure | M1.1 - M1.8 | ⏳ | 10 hours |
| M2: UI Components | M2.1 - M2.6 | ⏳ | 7 hours |
| M3: Advanced | M3.1 - M3.4 | ⏳ | 6 hours |

**Total:** ~23 hours

---

## 🔧 Dependencies to Install

```bash
npm install xlsx sql.js
npm install -D @types/sql.js
```

**next.config.js updates for WASM:**
```javascript
module.exports = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    config.resolve.fallback = { 
      ...config.resolve.fallback, 
      fs: false, 
      path: false 
    };
    return config;
  },
};
```

---

## ✅ Acceptance Criteria Summary

The feature is complete when:

1. **All formats work:** CSV, Parquet, Excel (.xlsx/.xls), JSON/JSONL, SQLite (.sqlite/.db), SQL dumps
2. **Format auto-detection:** Identifies format from extension + magic bytes
3. **Landing page upload works:** Processes file and redirects to dashboard with data
4. **Multi-table support:** Excel sheets and SQLite tables can be selected
5. **Consistent UX:** Same schema view, validation, lineage for all formats
6. **Error handling:** Clear messages for unsupported formats, corrupt files, etc.
7. **Performance:** Files up to 100MB process within 30 seconds
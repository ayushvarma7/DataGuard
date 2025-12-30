import { db as duckdb } from './duckdb';

export interface ColumnDiff {
    column: string;
    status: 'match' | 'added' | 'removed' | 'type_changed';
    sourceType?: string;
    targetType?: string;
}

export interface SchemaComparisonResult {
    sourceTable: string;
    targetTable: string;
    isCompatible: boolean;
    differences: ColumnDiff[];
    summary: {
        matchingColumns: number;
        addedColumns: number;
        removedColumns: number;
        typeChanges: number;
    };
}

/**
 * Compare schemas between two tables loaded in DuckDB
 */
export async function compareSchemas(
    sourceTable: string,
    targetTable: string
): Promise<SchemaComparisonResult> {
    const sourceSchema = await duckdb.getSchema(sourceTable);
    const targetSchema = await duckdb.getSchema(targetTable);

    const sourceMap = new Map(
        sourceSchema.map((col: any) => [col.column_name, col.column_type])
    );
    const targetMap = new Map(
        targetSchema.map((col: any) => [col.column_name, col.column_type])
    );

    const differences: ColumnDiff[] = [];
    let matchingColumns = 0;
    let addedColumns = 0;
    let removedColumns = 0;
    let typeChanges = 0;

    // Check source columns
    for (const [name, type] of sourceMap) {
        if (!targetMap.has(name)) {
            differences.push({ column: name, status: 'removed', sourceType: type as string });
            removedColumns++;
        } else if (targetMap.get(name) !== type) {
            differences.push({
                column: name,
                status: 'type_changed',
                sourceType: type as string,
                targetType: targetMap.get(name) as string
            });
            typeChanges++;
        } else {
            differences.push({ column: name, status: 'match', sourceType: type as string });
            matchingColumns++;
        }
    }

    // Check for added columns in target
    for (const [name, type] of targetMap) {
        if (!sourceMap.has(name)) {
            differences.push({ column: name, status: 'added', targetType: type as string });
            addedColumns++;
        }
    }

    return {
        sourceTable,
        targetTable,
        isCompatible: removedColumns === 0 && typeChanges === 0,
        differences,
        summary: {
            matchingColumns,
            addedColumns,
            removedColumns,
            typeChanges
        }
    };
}

/**
 * Compare a table against multiple other tables
 */
export async function compareSchemaAgainstAll(
    sourceTable: string,
    targetTables: string[]
): Promise<SchemaComparisonResult[]> {
    const results: SchemaComparisonResult[] = [];
    for (const target of targetTables) {
        if (target !== sourceTable) {
            results.push(await compareSchemas(sourceTable, target));
        }
    }
    return results;
}

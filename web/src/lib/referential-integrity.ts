import { db as duckdb } from './duckdb';

export interface IntegrityCheckResult {
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    orphanCount: number;
    passed: boolean;
    sampleOrphans?: any[];
}

export interface PotentialRelationship {
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
}

/**
 * Check referential integrity between two columns across tables
 */
export async function checkReferentialIntegrity(
    sourceTable: string,
    sourceColumn: string,
    targetTable: string,
    targetColumn: string
): Promise<IntegrityCheckResult> {
    // Find values in source that don't exist in target
    const query = `
        SELECT DISTINCT s."${sourceColumn}" as orphan_value
        FROM "${sourceTable}" s
        LEFT JOIN "${targetTable}" t ON s."${sourceColumn}" = t."${targetColumn}"
        WHERE t."${targetColumn}" IS NULL AND s."${sourceColumn}" IS NOT NULL
        LIMIT 100
    `;

    const orphans = await duckdb.query(query);
    const orphanCount = orphans.length;

    return {
        sourceTable,
        sourceColumn,
        targetTable,
        targetColumn,
        orphanCount,
        passed: orphanCount === 0,
        sampleOrphans: orphans.slice(0, 5)
    };
}

/**
 * Detect potential foreign key relationships between tables
 */
export async function detectPotentialRelationships(
    tables: string[]
): Promise<PotentialRelationship[]> {
    const relationships: PotentialRelationship[] = [];

    for (const sourceTable of tables) {
        const sourceSchema = await duckdb.getSchema(sourceTable);

        for (const targetTable of tables) {
            if (sourceTable === targetTable) continue;

            const targetSchema = await duckdb.getSchema(targetTable);

            for (const sourceCol of sourceSchema) {
                const sourceName = sourceCol.column_name.toLowerCase();

                // Check for common FK patterns
                for (const targetCol of targetSchema) {
                    const targetName = targetCol.column_name.toLowerCase();

                    // Pattern 1: source has "table_id" and target has "id"
                    if (sourceName === `${targetTable.toLowerCase()}_id` && targetName === 'id') {
                        relationships.push({
                            sourceTable,
                            sourceColumn: sourceCol.column_name,
                            targetTable,
                            targetColumn: targetCol.column_name,
                            confidence: 'high',
                            reason: `Column name pattern: ${sourceName} -> ${targetName}`
                        });
                    }

                    // Pattern 2: matching column names with same type
                    if (sourceName === targetName &&
                        sourceCol.column_type === targetCol.column_type &&
                        (sourceName.includes('id') || sourceName.includes('key'))) {
                        relationships.push({
                            sourceTable,
                            sourceColumn: sourceCol.column_name,
                            targetTable,
                            targetColumn: targetCol.column_name,
                            confidence: 'medium',
                            reason: `Matching column names with ID pattern`
                        });
                    }
                }
            }
        }
    }

    return relationships;
}

/**
 * Run integrity checks for all detected relationships
 */
export async function checkAllRelationships(
    relationships: PotentialRelationship[]
): Promise<IntegrityCheckResult[]> {
    const results: IntegrityCheckResult[] = [];

    for (const rel of relationships) {
        const result = await checkReferentialIntegrity(
            rel.sourceTable,
            rel.sourceColumn,
            rel.targetTable,
            rel.targetColumn
        );
        results.push(result);
    }

    return results;
}

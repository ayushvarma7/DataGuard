import { db as duckdb } from './duckdb';

export interface ColumnAnalytics {
    name: string;
    type: string;
    nullCount: number;
    nullPercentage: number;
    distinctCount: number;
    distinctPercentage: number;
    histogram?: HistogramBin[];
    statistics?: NumericStatistics;
    outliers?: OutlierInfo;
    qualityScore: number;
    suggestedType?: string;
}

export interface HistogramBin {
    bin: number;
    count: number;
    range?: string;
}

export interface NumericStatistics {
    min: number;
    max: number;
    mean: number;
    median: number;
    stddev: number;
    q1: number;
    q3: number;
}

export interface OutlierInfo {
    count: number;
    lowerBound: number;
    upperBound: number;
    samples: any[];
}

export interface TableQualityScore {
    tableName: string;
    overallScore: number;
    completeness: number;
    uniqueness: number;
    consistency: number;
    columnScores: { column: string; score: number }[];
}

/**
 * Calculate data quality score for a column (0-100)
 */
function calculateColumnQualityScore(
    nullPercentage: number,
    distinctPercentage: number,
    hasOutliers: boolean
): number {
    // Completeness: 0-40 points (lower nulls = higher score)
    const completenessScore = Math.max(0, 40 - (nullPercentage * 0.4));

    // Uniqueness: 0-30 points (balanced uniqueness is good)
    const uniquenessScore = distinctPercentage > 1 ? Math.min(30, distinctPercentage * 0.3) : 30;

    // Consistency: 0-30 points (no outliers = higher score)
    const consistencyScore = hasOutliers ? 15 : 30;

    return Math.round(completenessScore + uniquenessScore + consistencyScore);
}

/**
 * Detect outliers using IQR method
 */
async function detectOutliers(
    tableName: string,
    columnName: string
): Promise<OutlierInfo | undefined> {
    try {
        const statsQuery = `
            SELECT 
                quantile_cont("${columnName}", 0.25) as q1,
                quantile_cont("${columnName}", 0.75) as q3,
                min("${columnName}") as min_val,
                max("${columnName}") as max_val
            FROM "${tableName}"
            WHERE "${columnName}" IS NOT NULL
        `;
        const stats = await duckdb.query(statsQuery);

        if (!stats[0]) return undefined;

        const q1 = Number(stats[0].q1);
        const q3 = Number(stats[0].q3);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierQuery = `
            SELECT COUNT(*) as count 
            FROM "${tableName}" 
            WHERE "${columnName}" < ${lowerBound} OR "${columnName}" > ${upperBound}
        `;
        const outliers = await duckdb.query(outlierQuery);
        const count = Number(outliers[0].count);

        if (count === 0) return undefined;

        const sampleQuery = `
            SELECT "${columnName}" as value
            FROM "${tableName}" 
            WHERE "${columnName}" < ${lowerBound} OR "${columnName}" > ${upperBound}
            LIMIT 5
        `;
        const samples = await duckdb.query(sampleQuery);

        return {
            count,
            lowerBound,
            upperBound,
            samples: samples.map(s => s.value)
        };
    } catch {
        return undefined;
    }
}

/**
 * Get histogram data for a numeric column
 */
async function getHistogram(
    tableName: string,
    columnName: string,
    bins: number = 10
): Promise<HistogramBin[] | undefined> {
    try {
        const query = `
            WITH bounds AS (
                SELECT 
                    min("${columnName}") as min_val,
                    max("${columnName}") as max_val
                FROM "${tableName}"
                WHERE "${columnName}" IS NOT NULL
            ),
            binned AS (
                SELECT 
                    CASE 
                        WHEN max_val = min_val THEN 0
                        ELSE floor(("${columnName}" - min_val) / ((max_val - min_val + 0.000001) / ${bins}))
                    END as bin
                FROM "${tableName}", bounds
                WHERE "${columnName}" IS NOT NULL
            )
            SELECT bin, count(*) as count 
            FROM binned 
            GROUP BY bin 
            ORDER BY bin
        `;
        const result = await duckdb.query(query);
        return result.map(r => ({ bin: Number(r.bin), count: Number(r.count) }));
    } catch {
        return undefined;
    }
}

/**
 * Get numeric statistics for a column
 */
async function getNumericStatistics(
    tableName: string,
    columnName: string
): Promise<NumericStatistics | undefined> {
    try {
        const query = `
            SELECT 
                min("${columnName}") as min_val,
                max("${columnName}") as max_val,
                avg("${columnName}") as mean,
                median("${columnName}") as median,
                stddev("${columnName}") as stddev,
                quantile_cont("${columnName}", 0.25) as q1,
                quantile_cont("${columnName}", 0.75) as q3
            FROM "${tableName}"
            WHERE "${columnName}" IS NOT NULL
        `;
        const result = await duckdb.query(query);

        if (!result[0]) return undefined;

        return {
            min: Number(result[0].min_val),
            max: Number(result[0].max_val),
            mean: Number(result[0].mean),
            median: Number(result[0].median),
            stddev: Number(result[0].stddev) || 0,
            q1: Number(result[0].q1),
            q3: Number(result[0].q3)
        };
    } catch {
        return undefined;
    }
}

/**
 * Suggest better column type based on data
 */
async function suggestColumnType(
    tableName: string,
    columnName: string,
    currentType: string
): Promise<string | undefined> {
    // Only suggest for VARCHAR columns
    if (!currentType.includes('VARCHAR')) return undefined;

    try {
        // Sample some values
        const query = `
            SELECT DISTINCT "${columnName}" as val 
            FROM "${tableName}" 
            WHERE "${columnName}" IS NOT NULL 
            LIMIT 100
        `;
        const samples = await duckdb.query(query);
        const values = samples.map(s => String(s.val));

        // Check for boolean pattern
        const boolPatterns = ['true', 'false', 'yes', 'no', '1', '0', 't', 'f'];
        if (values.every(v => boolPatterns.includes(v.toLowerCase()))) {
            return 'BOOLEAN';
        }

        // Check for date pattern
        const datePattern = /^\d{4}-\d{2}-\d{2}/;
        if (values.every(v => datePattern.test(v))) {
            return 'DATE';
        }

        // Check for integer pattern
        if (values.every(v => /^-?\d+$/.test(v))) {
            return 'BIGINT';
        }

        // Check for decimal pattern
        if (values.every(v => /^-?\d*\.?\d+$/.test(v))) {
            return 'DOUBLE';
        }

        return undefined;
    } catch {
        return undefined;
    }
}

/**
 * Analyze all columns in a table with full analytics
 */
export async function analyzeTable(
    tableName: string,
    schema: { column_name: string; column_type: string }[]
): Promise<ColumnAnalytics[]> {
    const results: ColumnAnalytics[] = [];

    // Get row count
    const countResult = await duckdb.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    const rowCount = Number(countResult[0].count);

    for (const col of schema) {
        const isNumeric = /INT|FLOAT|DOUBLE|DECIMAL|HUGEINT/i.test(col.column_type);

        // Basic stats
        const basicQuery = `
            SELECT 
                COUNT(*) - COUNT("${col.column_name}") as null_count,
                COUNT(DISTINCT "${col.column_name}") as distinct_count
            FROM "${tableName}"
        `;
        const basicStats = await duckdb.query(basicQuery);
        const nullCount = Number(basicStats[0].null_count);
        const distinctCount = Number(basicStats[0].distinct_count);
        const nullPercentage = rowCount > 0 ? (nullCount / rowCount) * 100 : 0;
        const distinctPercentage = rowCount > 0 ? (distinctCount / rowCount) * 100 : 0;

        let histogram: HistogramBin[] | undefined;
        let statistics: NumericStatistics | undefined;
        let outliers: OutlierInfo | undefined;

        if (isNumeric && rowCount > 0) {
            histogram = await getHistogram(tableName, col.column_name);
            statistics = await getNumericStatistics(tableName, col.column_name);
            outliers = await detectOutliers(tableName, col.column_name);
        }

        const suggestedType = await suggestColumnType(tableName, col.column_name, col.column_type);
        const qualityScore = calculateColumnQualityScore(nullPercentage, distinctPercentage, !!outliers);

        results.push({
            name: col.column_name,
            type: col.column_type,
            nullCount,
            nullPercentage,
            distinctCount,
            distinctPercentage,
            histogram,
            statistics,
            outliers,
            qualityScore,
            suggestedType
        });
    }

    return results;
}

/**
 * Calculate overall table quality score
 */
export async function calculateTableQualityScore(
    tableName: string,
    schema: { column_name: string; column_type: string }[]
): Promise<TableQualityScore> {
    const columnAnalytics = await analyzeTable(tableName, schema);

    const columnScores = columnAnalytics.map(c => ({ column: c.name, score: c.qualityScore }));
    const avgScore = columnScores.reduce((sum, c) => sum + c.score, 0) / columnScores.length;

    // Calculate component scores
    const completeness = 100 - (columnAnalytics.reduce((sum, c) => sum + c.nullPercentage, 0) / columnAnalytics.length);
    const uniqueness = columnAnalytics.reduce((sum, c) => sum + c.distinctPercentage, 0) / columnAnalytics.length;
    const consistency = columnAnalytics.filter(c => !c.outliers).length / columnAnalytics.length * 100;

    return {
        tableName,
        overallScore: Math.round(avgScore),
        completeness: Math.round(completeness),
        uniqueness: Math.min(100, Math.round(uniqueness)),
        consistency: Math.round(consistency),
        columnScores
    };
}

/**
 * Calculate correlation matrix for numeric columns
 */
export async function calculateCorrelationMatrix(
    tableName: string,
    numericColumns: string[]
): Promise<{ columns: string[]; matrix: number[][] }> {
    const n = numericColumns.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
            if (i === j) {
                matrix[i][j] = 1;
            } else {
                try {
                    const query = `
                        SELECT corr("${numericColumns[i]}", "${numericColumns[j]}") as correlation
                        FROM "${tableName}"
                        WHERE "${numericColumns[i]}" IS NOT NULL AND "${numericColumns[j]}" IS NOT NULL
                    `;
                    const result = await duckdb.query(query);
                    const corr = Number(result[0]?.correlation) || 0;
                    matrix[i][j] = corr;
                    matrix[j][i] = corr;
                } catch {
                    matrix[i][j] = 0;
                    matrix[j][i] = 0;
                }
            }
        }
    }

    return { columns: numericColumns, matrix };
}

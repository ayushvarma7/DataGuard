import * as duckdb from "@duckdb/duckdb-wasm";

class DuckDBService {
    private db: duckdb.AsyncDuckDB | null = null;
    private worker: Worker | null = null;
    private initializing: Promise<duckdb.AsyncDuckDB> | null = null;

    async init(): Promise<duckdb.AsyncDuckDB> {
        if (this.db) return this.db;
        if (this.initializing) return this.initializing;

        this.initializing = (async () => {
            try {
                const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
                    mvp: {
                        mainModule: "/duckdb/duckdb-mvp.wasm",
                        mainWorker: "/duckdb/duckdb-browser-mvp.worker.js",
                    },
                    eh: {
                        mainModule: "/duckdb/duckdb-eh.wasm",
                        mainWorker: "/duckdb/duckdb-browser-eh.worker.js",
                    },
                };

                const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

                const worker = new Worker(bundle.mainWorker!);
                const logger = new duckdb.ConsoleLogger();
                const db = new duckdb.AsyncDuckDB(logger, worker);
                await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

                this.db = db;
                this.worker = worker;
                return db;
            } catch (error) {
                this.initializing = null;
                console.error("DuckDB initialization failed:", error);
                throw error;
            }
        })();

        return this.initializing;
    }

    async getDB(): Promise<duckdb.AsyncDuckDB> {
        const db = await this.init();
        return db;
    }

    async registerFile(file: File): Promise<void> {
        const db = await this.getDB();
        await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
    }

    async execute(sql: string): Promise<void> {
        const db = await this.getDB();
        const conn = await db.connect();
        try {
            await conn.query(sql);
        } finally {
            await conn.close();
        }
    }

    async getRowCount(tableName: string): Promise<number> {
        const result = await this.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        return Number(result[0].count);
    }

    async loadFile(file: File, tableName: string): Promise<number> {
        await this.registerFile(file);

        if (file.name.endsWith(".parquet")) {
            await this.execute(`CREATE TABLE "${tableName}" AS SELECT * FROM read_parquet('${file.name}')`);
        } else {
            await this.execute(`CREATE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${file.name}')`);
        }

        return await this.getRowCount(tableName);
    }

    async query<T = any>(sql: string): Promise<T[]> {
        const db = await this.getDB();
        const conn = await db.connect();
        try {
            const result = await conn.query(sql);
            return result.toArray().map((row) => row.toJSON()) as T[];
        } finally {
            await conn.close();
        }
    }

    async getSchema(tableName: string) {
        return await this.query(`DESCRIBE "${tableName}"`);
    }

    async copyFileToBuffer(fileName: string): Promise<Uint8Array> {
        const db = await this.getDB();
        return await db.copyFileToBuffer(fileName);
    }
}

export const duckdbService = new DuckDBService();
export const db = duckdbService;

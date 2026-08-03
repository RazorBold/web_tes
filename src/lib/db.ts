import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: true,
    });
  }
  return pool;
}

export async function query<T>(sql: string, params: ReadonlyArray<unknown> = []): Promise<T[]> {
  const [rows] = await getPool().query(sql, params as unknown[]);
  return rows as T[];
}

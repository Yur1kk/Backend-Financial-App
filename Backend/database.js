const mysql2 = require('mysql2/promise');

const pool = mysql2.createPool({
  host: 'localhost',
  user: 'root',
  database: 'financial_accounting',
  password: '',
  debug: true,
});

async function connectToDatabase() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    throw error;
  }
}

async function queryDatabase(sql, params) {
  try {
    const connection = await connectToDatabase();
    const [results] = await connection.execute(sql, params);
    connection.release();
    return results;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  connectToDatabase,
  queryDatabase,
  pool,
};

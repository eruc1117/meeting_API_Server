const pool = require('../../db');

describe('PostgreSQL Pool Connection', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('should connect to the database and run a simple query', async () => {
    const res = await pool.query('SELECT NOW()');
    expect(res.rows.length).toBe(1);
    expect(res.rows[0]).toHaveProperty('now');
  });

  test('should throw error with invalid query', async () => {
    await expect(pool.query('SELECT * FROM not_a_table')).rejects.toThrow();
  });
});

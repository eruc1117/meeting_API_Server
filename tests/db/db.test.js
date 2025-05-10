const pool = require("../../db/index");

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

  const expectedTables = ['users', 'messages', 'groups', 'chat_room_members', 'schedules'];

  test.each(expectedTables)('should have table: %s', async (tableName) => {
    const result = await pool.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = $1
       ) AS exists`,
      [tableName]
    );
    expect(result.rows[0].exists).toBe(true);
  });

  test('users table should have correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users'`
    );

    const columns = result.rows.map(r => r.column_name);
    const expected = ['id', 'email', 'username', 'password_hash', 'created_at'];

    expected.forEach(col => {
      expect(columns).toContain(col);
    });
  });

  test('users table should have correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users'`
    );

    const columns = result.rows.map(r => r.column_name);
    const expected = ['id', 'email', 'username', 'password_hash', 'created_at'];

    expected.forEach(col => {
      expect(columns).toContain(col);
    });
  });

  test('messages table should have correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'messages'`
    );

    const columns = result.rows.map(r => r.column_name);
    const expected = ['id', 'chat_room_id', 'sender_id', 'content', 'sent_at'];

    expected.forEach(col => {
      expect(columns).toContain(col);
    });
  });

  test('groups table should have correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'groups'`
    );

    const columns = result.rows.map(r => r.column_name);
    const expected = ['id', 'name', 'created_at'];

    expected.forEach(col => {
      expect(columns).toContain(col);
    });
  });

  test('chat_room_members table should have correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'chat_room_members'`
    );

    const columns = result.rows.map(r => r.column_name);
    const expected = ['id', 'chat_room_id', 'user_id', 'joined_at'];

    expected.forEach(col => {
      expect(columns).toContain(col);
    });
  });

  test('schedules table should have correct columns', async () => {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'schedules'`
    );

    const columns = result.rows.map(r => r.column_name);
    const expected = ['id', 'user_id', 'title', 'description', 'start_time', 'end_time', 'created_at', 'updated_at'];

    expected.forEach(col => {
      expect(columns).toContain(col);
    });
  });

});

// migration 可逆性：最後一個 migration（users.role / is_active）down 一步再 up 一步
const path = require('path');
const { Client } = require('pg');
const { runner } = require('node-pg-migrate');

const dir = path.join(__dirname, '..', '..', 'migrations');
const migrate = (dbClient, direction, count) =>
  runner({ dbClient, dir, direction, count, migrationsTable: 'pgmigrations', log: () => {} });

describe('migrations（測試庫）', () => {
  let client;
  beforeAll(async () => {
    const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
    client = new Client({ host: DB_HOST, port: Number(DB_PORT), database: DB_NAME, user: DB_USER, password: DB_PASSWORD });
    await client.connect();
  });
  afterAll(async () => { await migrate(client, 'up', Infinity); await client.end(); });

  const usersCols = async () => (await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")).rows.map((r) => r.column_name);
  const hasRoleCheck = async () => (await client.query("SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'")).rowCount === 1;

  it('全部 migration 已套用（globalSetup 跑過 up）', async () => {
    const { rows } = await client.query('SELECT name FROM pgmigrations ORDER BY id');
    expect(rows.map((r) => r.name)).toContain('1790500000000_add-users-role');
    expect(await usersCols()).toEqual(expect.arrayContaining(['id', 'email', 'username', 'account', 'password_hash', 'role', 'is_active', 'created_at']));
    expect(await hasRoleCheck()).toBe(true);
  });

  it('role 預設 user、is_active 預設 true、role 只能 user/admin', async () => {
    const { rows } = await client.query(
      "INSERT INTO users (email, username, account, password_hash) VALUES ('mig@example.com', 'mig', 'mig_acc', 'x') RETURNING role, is_active"
    );
    expect(rows[0]).toEqual({ role: 'user', is_active: true });
    await expect(client.query("UPDATE users SET role = 'root' WHERE account = 'mig_acc'")).rejects.toThrow(/users_role_check/);
    await client.query("DELETE FROM users WHERE account = 'mig_acc'");
  });

  it('最後一個 migration down 一步後欄位消失，再 up 回來', async () => {
    await migrate(client, 'down', 1);
    let cols = await usersCols();
    expect(cols).not.toContain('role');
    expect(cols).not.toContain('is_active');
    expect(await hasRoleCheck()).toBe(false);

    await migrate(client, 'up', 1);
    cols = await usersCols();
    expect(cols).toEqual(expect.arrayContaining(['role', 'is_active']));
    expect(await hasRoleCheck()).toBe(true);
  });
});

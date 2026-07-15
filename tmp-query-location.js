const { Client } = require('pg');
(async () => {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '12345', database: 'copoun' });
  await client.connect();
  const res = await client.query("select id, slug, name_ar, name_en from locations where slug = 'abu-rummaneh'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch((err) => { console.error(err); process.exit(1); });

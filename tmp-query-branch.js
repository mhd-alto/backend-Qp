const { Client } = require('pg');
(async () => {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '12345', database: 'copoun' });
  await client.connect();
  const res = await client.query("select b.id as business_id, b.slug as business_slug, br.id as branch_id, br.slug as branch_slug, br.name from businesses b join branches br on br.business_id = b.id and br.deleted_at is null where b.slug = 'beit-al-sham-grills' order by br.created_at asc");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch((err) => { console.error(err); process.exit(1); });

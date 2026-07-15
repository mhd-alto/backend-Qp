const { Client } = require('pg');
(async () => {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '12345', database: 'copoun' });
  await client.connect();
  const res = await client.query("select c.id, c.slug, c.name_ar, c.name_en from categories c where c.slug in ('grills-and-levantine-cuisine', 'restaurants') order by c.slug");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch((err) => { console.error(err); process.exit(1); });

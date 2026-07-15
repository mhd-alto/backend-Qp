const { Client } = require('pg');
(async () => {
  const client = new Client({ host: 'localhost', port: 5432, user: 'postgres', password: '12345', database: 'copoun' });
  await client.connect();
  const res = await client.query("select u.id as user_id, u.email, bm.role, bm.business_id from users u join business_memberships bm on bm.user_id = u.id join businesses b on b.id = bm.business_id where u.email = 'samer.khateeb@couponhub-demo.sy'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch((err) => { console.error(err); process.exit(1); });

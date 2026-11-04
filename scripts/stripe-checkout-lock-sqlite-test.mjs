import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

// An isolated SQLite database tests the same atomic lock SQL semantics used by D1.
// It never reaches Cloudflare, Stripe, or customer data.
const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE workspace_data (
  id TEXT PRIMARY KEY, userId TEXT NOT NULL, dataType TEXT NOT NULL,
  data TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL,
  UNIQUE(userId, dataType)
)`);
const user = 'test-user';
const acquireInsert = db.prepare(`INSERT INTO workspace_data (id,userId,dataType,data,createdAt,updatedAt)
  VALUES (?,?,'stripe_checkout_lock',?,?,?)
  ON CONFLICT(userId,dataType) DO NOTHING`);
const acquireCas = db.prepare(`UPDATE workspace_data SET data=?, updatedAt=?
  WHERE userId=? AND dataType='stripe_checkout_lock' AND updatedAt=? AND data=?`);
const release = db.prepare(`DELETE FROM workspace_data
  WHERE userId=? AND dataType='stripe_checkout_lock' AND data=?`);
const get = db.prepare(`SELECT data, updatedAt FROM workspace_data
  WHERE userId=? AND dataType='stripe_checkout_lock' LIMIT 1`);
const token = n => JSON.stringify({plan:'premium', lockId:n});
const atA = '2026-11-05T12:00:00.000Z';
const atB = '2026-11-05T12:16:00.000Z';
const a = token('request-a'), b = token('request-b'), c = token('request-c');
assert.equal(acquireInsert.run('id-a',user,a,atA,atA).changes,1);
assert.equal(acquireInsert.run('id-b',user,b,atA,atA).changes,0,'a competing checkout cannot acquire the lock');
const stale = get.get(user);
assert.equal(acquireCas.run(b,atB,user,stale.updatedAt,stale.data).changes,1,'expired lock can be replaced atomically');
assert.equal(release.run(user,a).changes,0,'stale request cannot delete a newer lock');
assert.equal(get.get(user).data,b,'newer lock must survive stale cleanup');
assert.equal(acquireCas.run(c,atB,user,stale.updatedAt,stale.data).changes,0,'second stale compare-and-swap cannot win');
assert.equal(release.run(user,b).changes,1,'lock owner can release');
assert.equal(get.get(user),undefined);
assert.equal(acquireInsert.run('id-c',user,c,atB,atB).changes,1,'a new checkout can proceed after cleanup');
db.close();
console.log('Stripe SQLite lock CAS and ownership test PASS');

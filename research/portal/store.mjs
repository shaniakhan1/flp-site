import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash} from 'node:crypto';
export const hash=v=>createHash('sha256').update(v).digest('hex');
export function createStore(path=':memory:'){
 const db=new DatabaseSync(path);db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, secret TEXT NOT NULL, input TEXT NOT NULL, status TEXT NOT NULL, report TEXT, created INTEGER NOT NULL, expires INTEGER NOT NULL, approved INTEGER DEFAULT 0, session TEXT, paid INTEGER DEFAULT 0, onboarding TEXT);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY);`);
 db.prepare("UPDATE jobs SET status='queued' WHERE status='running'").run();
 return {db,cleanup(){db.prepare('DELETE FROM jobs WHERE expires < ?').run(Date.now());db.prepare('DELETE FROM limits WHERE expires < ?').run(Date.now());},quota(key,max,ttl){const now=Date.now();db.prepare('DELETE FROM limits WHERE key=? AND expires<?').run(key,now);const r=db.prepare('INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count < ? RETURNING count').get(key,now+ttl,max);return !!r;},
 create(input){const id=randomBytes(16).toString('hex'),secret=randomBytes(32).toString('base64url');db.prepare('INSERT INTO jobs(id,secret,input,status,created,expires) VALUES(?,?,?,\'queued\',?,?)').run(id,hash(secret),JSON.stringify(input),Date.now(),Date.now()+30*86400000);return{id,secret};},
 get(id,secret){if(typeof secret!=='string')return;return db.prepare('SELECT * FROM jobs WHERE id=? AND secret=? AND expires>?').get(id,hash(secret),Date.now());},
 next(){const row=db.prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1").get();if(row)db.prepare("UPDATE jobs SET status='running' WHERE id=?").run(row.id);return row;},
 finish(id,report,status='ready'){db.prepare('UPDATE jobs SET report=?,status=? WHERE id=?').run(JSON.stringify(report),status,id);},close(){db.close();}};
}

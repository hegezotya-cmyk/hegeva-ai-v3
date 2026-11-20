#!/usr/bin/env python3
"""Synthetic concurrent claim of the *source SQL* in two independent SQLite connections.
This is not a Cloudflare D1/Worker concurrency test and does not touch production.
"""
import pathlib
import re
import sqlite3
import tempfile
import threading
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "src/hubspot-outbox-d1.js").read_text()
SCHEMA = (ROOT / "docs/integrations/hubspot-outbox-schema-DRAFT.sql").read_text()

def claim_sql():
    start = SOURCE.index("export async function claimHubspotLeadWithProof(")
    end = SOURCE.find("export async function ", start + 1)
    body = SOURCE[start:end if end >= 0 else None]
    match = re.search(r"db\.prepare\(`([\s\S]*?)`\)", body)
    assert match, "Cannot locate exact claim source SQL"
    return match.group(1)

class ConcurrentClaim(unittest.TestCase):
    def test_only_one_worker_claims_same_event(self):
        with tempfile.TemporaryDirectory(prefix="hegeva_hubspot_synthetic_") as directory:
            path = str(pathlib.Path(directory) / "isolated.db")
            connection = sqlite3.connect(path, timeout=10)
            connection.execute("PRAGMA journal_mode=WAL")
            connection.execute("PRAGMA foreign_keys=ON")
            connection.execute('CREATE TABLE "user"(id TEXT PRIMARY KEY)')
            connection.execute('INSERT INTO "user" VALUES (?)', ("synthetic_user",))
            connection.executescript(SCHEMA)
            connection.execute("""INSERT INTO hubspot_lead_outbox
                (event_id,user_id,event_type,state,attempts,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?)""",
                ("event_concurrent", "synthetic_user", "lead_upsert", "pending", 0,
                 "2026-11-20T10:00:00.000Z", "2026-11-20T10:00:00.000Z"))
            connection.commit()
            connection.close()
            barrier = threading.Barrier(2)
            outcomes = []
            errors = []
            lock = threading.Lock()
            def worker(n):
                db = sqlite3.connect(path, timeout=10)
                try:
                    db.execute("PRAGMA busy_timeout=10000")
                    barrier.wait(timeout=5)
                    row = db.execute(claim_sql(), (
                        "event_concurrent", "2026-11-20T10:00:01.000Z",
                        "2026-11-20T10:01:00.000Z", f"lease_synthetic_worker_{n}_123456")).fetchone()
                    db.commit()
                    with lock: outcomes.append(row)
                except Exception as error:
                    with lock: errors.append(str(error))
                finally:
                    db.close()
            threads = [threading.Thread(target=worker, args=(i,)) for i in range(2)]
            for thread in threads: thread.start()
            for thread in threads: thread.join(timeout=15)
            self.assertTrue(all(not t.is_alive() for t in threads), "worker thread hung")
            self.assertEqual(errors, [], f"SQLite worker errors: {errors}")
            self.assertEqual(len(outcomes), 2)
            successes = [row for row in outcomes if row is not None]
            self.assertEqual(len(successes), 1, outcomes)
            self.assertEqual(successes[0][2], 1)
            db = sqlite3.connect(path)
            self.assertEqual(db.execute("SELECT attempts FROM hubspot_lead_outbox WHERE event_id='event_concurrent'").fetchone()[0], 1)
            db.close()

if __name__ == "__main__":
    unittest.main(verbosity=2)

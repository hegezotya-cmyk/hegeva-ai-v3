#!/usr/bin/env python3
"""Execute exact SQL embedded in src/hubspot-outbox-d1.js against in-memory SQLite.
No Cloudflare or HubSpot access; no customer records.
"""
import pathlib
import re
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "src/hubspot-outbox-d1.js").read_text()
SCHEMA = (ROOT / "docs/integrations/hubspot-outbox-schema-DRAFT.sql").read_text()

def sql_for(function_name):
    start = SOURCE.index("export async function " + function_name + "(")
    end = SOURCE.find("export async function ", start + 1)
    body = SOURCE[start:end if end != -1 else None]
    matches = re.findall(r"db\.prepare\(\x60([\s\S]*?)\x60\)", body)
    if len(matches) != 1:
        raise AssertionError(f"Expected exactly one SQL statement in {function_name}, found {len(matches)}")
    return matches[0]

class D1SourceSqlContract(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.execute('CREATE TABLE "user"(id TEXT PRIMARY KEY)')
        self.db.execute('INSERT INTO "user" VALUES (?)', ("synthetic_user",))
        self.db.executescript(SCHEMA)
        self.now = "2026-11-20T10:00:00.000Z"
        self.later = "2026-11-20T10:01:01.000Z"
        self.lease1 = "synthetic_lease_111111111"
        self.lease2 = "synthetic_lease_222222222"

    def tearDown(self):
        self.db.close()

    def enqueue(self):
        return self.db.execute(sql_for("enqueueHubspotLead"), ("event_1", "synthetic_user", self.now)).rowcount

    def claim(self, now, until, token):
        return self.db.execute(sql_for("claimHubspotLeadWithProof"), ("event_1", now, until, token)).fetchone()

    def test_source_enqueue_deduplicates(self):
        self.assertEqual(self.enqueue(), 1)
        self.assertEqual(self.enqueue(), 0)

    def test_source_claim_returns_atomic_attempts_and_fences_reclaim(self):
        self.enqueue()
        self.assertEqual(self.claim(self.now, "2026-11-20T10:01:00.000Z", self.lease1),
                         ("event_1", "lead_upsert", 1, self.lease1))
        self.assertIsNone(self.claim(self.now, "2026-11-20T10:02:00.000Z", self.lease2))
        self.assertEqual(self.claim(self.later, "2026-11-20T10:03:00.000Z", self.lease2),
                         ("event_1", "lead_upsert", 2, self.lease2))

    def test_source_finalize_rejects_stale_lease(self):
        self.enqueue()
        self.claim(self.now, "2026-11-20T10:01:00.000Z", self.lease1)
        self.claim(self.later, "2026-11-20T10:03:00.000Z", self.lease2)
        sql = sql_for("finalizeHubspotLead")
        stale = self.db.execute(sql, ("event_1", self.lease1, "delivered", None, self.later))
        self.assertEqual(stale.rowcount, 0)
        valid = self.db.execute(sql, ("event_1", self.lease2, "delivered", None, self.later))
        self.assertEqual(valid.rowcount, 1)
        self.assertEqual(self.db.execute("SELECT state FROM hubspot_lead_outbox").fetchone()[0], "delivered")

    def test_source_suppression_blocks_claim_and_finalize(self):
        self.enqueue()
        self.db.execute("INSERT INTO hubspot_lead_suppressions VALUES (?,?,?)",
                        ("synthetic_user", "opt_out", self.now))
        self.assertIsNone(self.claim(self.now, "2026-11-20T10:01:00.000Z", self.lease1))
        self.db.execute("DELETE FROM hubspot_lead_suppressions")
        self.claim(self.now, "2026-11-20T10:01:00.000Z", self.lease1)
        self.db.execute("INSERT INTO hubspot_lead_suppressions VALUES (?,?,?)",
                        ("synthetic_user", "erasure", self.now))
        self.assertEqual(self.db.execute(sql_for("finalizeHubspotLead"),
                         ("event_1", self.lease1, "delivered", None, self.now)).rowcount, 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)

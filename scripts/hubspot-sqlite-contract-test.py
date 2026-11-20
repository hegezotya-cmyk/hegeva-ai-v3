#!/usr/bin/env python3
"""Isolated SQLite contract test for the HubSpot D1 draft schema.

Run: python3 scripts/hubspot-sqlite-contract-test.py
Never connects to Cloudflare or HubSpot. Uses synthetic IDs and in-memory SQLite.
"""
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCHEMA = (ROOT / "docs/integrations/hubspot-outbox-schema-DRAFT.sql").read_text()

class HubspotOutboxSqliteContract(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.execute('CREATE TABLE "user" (id TEXT PRIMARY KEY)')
        self.db.execute('INSERT INTO "user"(id) VALUES (?)', ("synthetic_user",))
        self.db.executescript(SCHEMA)
        self.now = "2026-11-20T10:00:00.000Z"

    def tearDown(self):
        self.db.close()

    def enqueue(self, event="event_1"):
        return self.db.execute("""INSERT OR IGNORE INTO hubspot_lead_outbox
          (event_id,user_id,event_type,state,attempts,next_attempt_at,created_at,updated_at)
          SELECT ?,'synthetic_user','lead_upsert','pending',0,?,?,?
          WHERE NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions WHERE user_id='synthetic_user')""",
          (event, self.now, self.now, self.now)).rowcount

    def test_schema_applies_and_unique_event_is_idempotent(self):
        self.assertEqual(self.enqueue(), 1)
        self.assertEqual(self.enqueue(), 0)
        self.assertEqual(self.db.execute("SELECT count(*) FROM hubspot_lead_outbox").fetchone()[0], 1)

    def test_suppression_prevents_new_events(self):
        self.db.execute("INSERT INTO hubspot_lead_suppressions VALUES (?,?,?)",
                        ("synthetic_user", "opt_out", self.now))
        self.assertEqual(self.enqueue("event_2"), 0)

    def test_claim_fencing_and_stale_finalization(self):
        self.enqueue()
        claim = """UPDATE hubspot_lead_outbox SET state='leased',lease_until=?,lease_token=?,attempts=attempts+1,updated_at=?
          WHERE event_id=? AND attempts<5 AND
          ((state='pending' AND (next_attempt_at IS NULL OR next_attempt_at<=?))
          OR (state='leased' AND lease_until<=?))
          AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)"""
        first = ("2026-11-20T10:01:00.000Z", "lease_first_123456", self.now, "event_1", self.now, self.now)
        self.assertEqual(self.db.execute(claim, first).rowcount, 1)
        self.assertEqual(self.db.execute(claim, ("2026-11-20T10:02:00.000Z", "lease_second_12345", self.now, "event_1", self.now, self.now)).rowcount, 0)
        later = "2026-11-20T10:01:01.000Z"
        self.assertEqual(self.db.execute(claim, ("2026-11-20T10:03:00.000Z", "lease_second_12345", later, "event_1", later, later)).rowcount, 1)
        finalize = """UPDATE hubspot_lead_outbox SET state='delivered',lease_until=NULL,lease_token=NULL,delivered_at=?,updated_at=?
          WHERE event_id=? AND lease_token=? AND state='leased' AND lease_until>?
          AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)"""
        self.assertEqual(self.db.execute(finalize, (later, later, "event_1", "lease_first_123456", later)).rowcount, 0)
        self.assertEqual(self.db.execute(finalize, (later, later, "event_1", "lease_second_12345", later)).rowcount, 1)

    def test_atomic_returning_proof_first_claim_and_expired_reclaim(self):
        self.enqueue()
        claim = """UPDATE hubspot_lead_outbox
          SET state='leased',lease_until=?3,lease_token=?4,updated_at=?2,attempts=attempts+1
          WHERE event_id=?1 AND attempts<5 AND
            ((state='pending' AND (next_attempt_at IS NULL OR next_attempt_at<=?2))
              OR (state='leased' AND lease_until<=?2))
            AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)
          RETURNING event_id,event_type,attempts,lease_token"""
        first = self.db.execute(claim, ("event_1", self.now, "2026-11-20T10:01:00.000Z", "lease_first_123456")).fetchone()
        self.assertEqual(first, ("event_1", "lead_upsert", 1, "lease_first_123456"))
        duplicate = self.db.execute(claim, ("event_1", self.now, "2026-11-20T10:02:00.000Z", "lease_second_12345")).fetchone()
        self.assertIsNone(duplicate)
        later = "2026-11-20T10:01:01.000Z"
        recovered = self.db.execute(claim, ("event_1", later, "2026-11-20T10:03:00.000Z", "lease_second_12345")).fetchone()
        self.assertEqual(recovered, ("event_1", "lead_upsert", 2, "lease_second_12345"))

    def test_atomic_returning_suppressed_claim_is_empty(self):
        self.enqueue()
        self.db.execute("INSERT INTO hubspot_lead_suppressions VALUES (?,?,?)", ("synthetic_user", "opt_out", self.now))
        result = self.db.execute("""UPDATE hubspot_lead_outbox
          SET state='leased',lease_until=?3,lease_token=?4,updated_at=?2,attempts=attempts+1
          WHERE event_id=?1 AND attempts<5 AND state='pending'
            AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)
          RETURNING event_id,event_type,attempts,lease_token""",
          ("event_1", self.now, "2026-11-20T10:01:00.000Z", "lease_first_123456")).fetchone()
        self.assertIsNone(result)
        self.assertEqual(self.db.execute("SELECT attempts FROM hubspot_lead_outbox WHERE event_id='event_1'").fetchone()[0], 0)

    def test_suppression_prevents_finalization(self):
        self.enqueue()
        self.db.execute("UPDATE hubspot_lead_outbox SET state='leased',lease_token='lease_1234567890123456',lease_until=? WHERE event_id='event_1'", ("2026-11-20T10:05:00.000Z",))
        self.db.execute("INSERT INTO hubspot_lead_suppressions VALUES (?,?,?)", ("synthetic_user", "erasure", self.now))
        result = self.db.execute("""UPDATE hubspot_lead_outbox SET state='delivered'
          WHERE event_id='event_1' AND lease_token='lease_1234567890123456'
          AND NOT EXISTS (SELECT 1 FROM hubspot_lead_suppressions s WHERE s.user_id=hubspot_lead_outbox.user_id)""")
        self.assertEqual(result.rowcount, 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)

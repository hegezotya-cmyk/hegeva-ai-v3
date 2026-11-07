DELETE FROM staging_synthetic_fixture_effect WHERE substr(namespace,1,16) = 'staging-fixture:';
DELETE FROM staging_synthetic_fixture_lease WHERE substr(namespace,1,16) = 'staging-fixture:';
DELETE FROM stripe_terminal_effect_outbox WHERE substr(userId,1,8) = 'fixture_';
DELETE FROM staging_scheduled_test_runs WHERE scenario IN ('retry-recovery','lease-fencing');

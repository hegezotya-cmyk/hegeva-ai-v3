#!/usr/bin/env python3
"""Offline syntax and safety-gate checks for the PR #107 isolated dispatcher.

No Cloudflare token, GitHub secret, D1 access, Stripe API, or deployment.
"""
from __future__ import annotations

import ast
import re
import subprocess
from pathlib import Path

import yaml

workflow_path = Path(".github/workflows/isolated-stripe-test-worker-deploy.yml")
raw = workflow_path.read_text(encoding="utf-8")
workflow = yaml.load(raw, Loader=yaml.BaseLoader)
assert isinstance(workflow, dict)

triggers = workflow["on"]
assert set(triggers) == {"workflow_dispatch"}, "Deploy workflow must remain manual-only"
assert set(triggers["workflow_dispatch"]["inputs"]) == {
    "confirmation",
    "route_domain_preflight",
}
assert workflow["permissions"] == {"contents": "read", "pull-requests": "read"}
assert set(workflow["jobs"]) == {"preflight", "deploy"}

pre = workflow["jobs"]["preflight"]
deploy = workflow["jobs"]["deploy"]
assert "environment" not in pre
assert deploy["environment"]["name"] == "isolated-stripe-test"
assert deploy["needs"] == "preflight"

gating = pre["if"]
for marker in (
    "refs/heads/v0-rebuild",
    "hegezotya-cmyk/hegeva-ai-v3",
    "DEPLOY-PR106-ISOLATED-ONLY",
    "ZERO-ROUTES-DOMAINS-VERIFIED",
):
    assert marker in gating, f"Missing manual-dispatch gate {marker}"

assert raw.count("CLOUDFLARE_ISOLATED_WORKER_API_TOKEN") == 2
assert raw.count("wrangler deploy --config wrangler.isolated-deleted-user-webhook-test.jsonc") == 1
assert "wrangler deploy --dry-run --config wrangler.isolated-deleted-user-webhook-test.jsonc" in raw
assert "version_id" in raw and "/deployments" in raw

jobs = [(name, job) for name, job in workflow["jobs"].items()]
for job_name, job in jobs:
    for step in job["steps"]:
        command = step.get("run")
        if command is None:
            continue
        title = step.get("name", "unnamed")
        check = subprocess.run(
            ["bash", "-n"],
            input=command,
            text=True,
            capture_output=True,
            check=False,
        )
        assert check.returncode == 0, f"{job_name}/{title}: bash parse error: {check.stderr}"
        for match in re.finditer(
            r"python3 - <<'PY'\s*\n(?P<code>.*?)\nPY(?:\n|$)",
            command,
            flags=re.DOTALL,
        ):
            ast.parse(match.group("code"), filename=f"{job_name}/{title}")
        if "python3 - <<'PY'" in command:
            assert re.search(r"\nPY(?:\n|$)", command), f"Missing Python heredoc end: {title}"

pr_checker_steps = [
    step for step in deploy["steps"] if step.get("name", "").startswith("RECHECK full PR")
]
assert len(pr_checker_steps) == 1
checks = pr_checker_steps[0]["run"]
for prop, expected in (
    ("head.sha", "d2c8fc2366767c54f27e271e84873d22b9edc4a4"),
    ("head.ref", "codex/isolated-stripe-test-webhook-harness-20261113"),
    ("head.repo.full_name", "hegezotya-cmyk/hegeva-ai-v3"),
    ("base.ref", "codex/staging-deleted-user-webhook-guard-20261112"),
    ("state", "open"),
    ("draft", "true"),
    ("merged", "false"),
):
    assert f"'." + prop + "'" in checks and expected in checks, f"Missing post-approval check {prop}"
deploysteps = deploy["steps"]
ix_check = deploysteps.index(pr_checker_steps[0])
assert deploysteps[ix_check + 1]["name"].startswith("Deploy EXACTLY"), (
    "PR lifecycle recheck must be immediately before deploy"
)
guard_steps = [
    step for step in deploysteps
    if step.get("name", "").startswith("Read-only Cloudflare guard")
]
assert len(guard_steps) == 1
ix_guard = deploysteps.index(guard_steps[0])
assert ix_guard + 1 == ix_check, (
    "Worker URL/Cron/version preflight must immediately precede PR lifecycle recheck"
)
before = guard_steps[0]["run"]
for required in (
    "/subdomain", "/schedules", "/deployments",
    "enabled", "previews_enabled",
    "HEGEVA_PREVIOUS_WORKER_VERSION_ID", "GITHUB_ENV",
):
    assert required in before, f"Missing Cloudflare preflight: {required}"
assert "CLOUDFLARE_ISOLATED_WORKER_API_TOKEN" in str(guard_steps[0]["env"])
post = [step for step in deploysteps
        if step.get("name", "").startswith("Read-only post-deploy check")]
assert len(post)==1
assert "active_version!=previous" in post[0]["run"], (
    "post-deploy must prove active version changed"
)
assert "secrets." not in pre["if"]
assert all("CLOUDFLARE_ISOLATED_WORKER_API_TOKEN" not in
           str(step) for step in pre["steps"])

print("PASS: YAML parsed, all Bash/Python embedded blocks parsed, PR lifecycle "
      "gates enforced, 2 manual inputs, preflight secret-free, deploy gated; "
      "NO cloud, database or Stripe changes")

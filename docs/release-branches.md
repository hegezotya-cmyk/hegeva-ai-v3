# UI release branch

The production UI release branch is
`growth-acquisition-conversion-sprint-03-20261001`. The repository's `main`
branch contains the API/Worker source only and does not contain `v0-app`, so
UI fixes must not be cherry-picked or merged into `main` as a release step.

Changes to `v0-app` on the UI release branch run the
`HEGEVA Growth Acquisition UI Release` workflow. It installs dependencies in a
clean Linux runner, runs the Enterprise and API-proxy regressions, type-checks,
builds the Next/OpenNext artifact, and deploys only after every check passes.
The workflow requires the existing `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` repository secrets.

Production UI releases are tagged from this branch after a verified deploy.
The `ui-production-20261004-614903b` tag identifies the release that prevents
anonymous visitors from seeing Enterprise workspace controls.

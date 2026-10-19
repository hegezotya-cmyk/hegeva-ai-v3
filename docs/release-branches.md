# Production release branch

The single production branch is `v0-rebuild`. It contains the complete HEGEVA
UI and API history. Feature branches must target this branch.

Changes below `v0-app` on `v0-rebuild` run the `HEGEVA V0 UI Auto Deploy`
workflow. It validates TypeScript, Next.js, OpenNext and the X20 runtime before
deploying the UI, then smoke-tests the production domains and core routes.

The API is released only through the staged manual `release.yml` workflow.
No other branch may auto-deploy to the production UI or API Workers.

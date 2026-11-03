# Portfolio assistant backend

This backend powers the portfolio assistant and is deployed separately from the website. It includes input validation, verification, and traffic controls.

## Local checks

```sh
node --test worker.test.mjs
```

Tests use mocked services and do not send messages or use AI quota.

## Deployment

Deploy this directory with Wrangler so the backend code and its runtime configuration are applied together:

```sh
npx wrangler deploy
```

Configure required credentials securely through the hosting provider before deployment. Keep sensitive values out of frontend files and source control. Review account settings privately and verify the deployed assistant after changes.

Portfolio facts are maintained in the backend and should stay consistent with the website and résumé.

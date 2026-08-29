# Contributing Guide

Thank you for contributing to this repository. Please follow these guidelines to keep development consistent and maintainable.

## 1. Development Setup

### Prerequisites

* Node.js
* npm
* Git
* Required database/services

### Setup

```bash
npm install
```

Create a `.env` file using `.env.example` and add your local configuration.

## 2. Run Locally

```bash
npm run dev
```

For production:

```bash
npm start
```

Use the scripts defined in `package.json` if they differ.

## 3. Branch Naming

Create a separate branch for each issue or change.

```text
feature/<description>
fix/<description>
docs/<description>
refactor/<description>
test/<description>
chore/<description>
```

Example:

```text
docs/add-contributing-guide
```

Do not commit directly to `main`.

## 4. Commit Messages

Use the following format:

```text
<type>: <description>
```

Common types:

```text
feat, fix, docs, refactor, test, chore
```

Examples:

```text
feat: add user authentication
fix: resolve login validation
docs: add contributing guide
```

Keep commits small and focused.

## 5. Issues

Before creating an issue:

* Search for existing issues.
* Use a clear and descriptive title.
* Explain the problem or requirement.
* Include reproduction steps for bugs.
* Mention expected and actual behavior when applicable.

## 6. Pull Requests

Before opening a PR:

* Update your branch with the latest `main`.
* Run linting and tests.
* Review your own changes.
* Remove debugging code and unnecessary files.

PRs should include a clear description, related issue, and testing details.

## 7. Formatting & Linting

Run the project's configured checks before submitting:

```bash
npm run lint
npm run format
```

Do not introduce unrelated formatting changes.

## 8. Testing

Run all relevant tests before creating a PR:

```bash
npm test
```

New features and bug fixes should include appropriate tests. All existing tests must pass.

## 9. Code Review

Reviewers check correctness, security, code quality, error handling, performance, tests, and documentation.

Authors should address review feedback before merging.

## 10. Secrets & Environment Variables

Never commit:

* `.env` files
* API keys or passwords
* Database credentials
* Access tokens or private keys

Use `.env.example` with placeholder values only. Never include real credentials in source code, documentation, commits, or PRs.

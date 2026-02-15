# Contributing to Cove 🤝

First off, thanks for taking the time to contribute! 🎉

Cove is an ambitious project to redefine how we build software with AI. Whether you're fixing a bug, improving documentation, or proposing a new feature, your help is welcome.

## 🧭 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Pull Request Process](#-pull-request-process)
- [Style Guide](#-style-guide)

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `>= 22`
- **pnpm**: `>= 9`
- **OS**: macOS, Windows, or Linux

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cove.git
   cd cove
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development environment**
   ```bash
   pnpm dev
   ```
   This will launch the Electron app in development mode with HMR enabled.

## 💻 Development Workflow

### Branching Model

- **`main`**: The stable branch.
- **Feature Branches**: Create branches from `main` for your work.
  - Format: `feat/your-feature-name` or `fix/your-bug-fix`

### Verification Commands

Before submitting a PR, ensure your changes pass our quality checks:

| Command | Description |
| :--- | :--- |
| `pnpm lint` | Check for linting errors |
| `pnpm format:check` | Verify code formatting |
| `pnpm check` | Type-check TypeScript files |
| `pnpm test -- --run` | Run unit tests |
| `pnpm test:e2e` | Run Playwright end-to-end tests (requires build) |

> **Tip:** If `pnpm test:e2e` fails, try running `pnpm build` first to ensure the Electron binary is up to date.

## 📥 Pull Request Process

1. **Small & Focused**: Keep PRs small. If a PR does two things, split it into two.
2. **Descriptive Title**: Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (e.g., `feat: implementation agent flow`, `fix: terminal resize jitter`).
3. **Context is King**: In your PR description, explain *why* you made this change, not just *what* you changed. Attach screenshots or GIFs for UI changes.
4. **Test coverage**: Ensure new features have corresponding unit/E2E tests.

## 🎨 Style Guide

- **TypeScript**: Strict mode is on. No `any` unless absolutely necessary.
- **Components**: Functional components with hooks.
- **Styling**: We use generic CSS/Tailwind (adhere to existing patterns).
- **Architecture**: Follow the "Clean Architecture" separation in `src/main` vs `src/renderer`.

---

**Happy Coding!** 🚀

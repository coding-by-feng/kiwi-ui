# Kiwi UI Development Workflow

## Feature Implementation Flow

1. **Plan** - Use `planner` agent for features spanning 3+ files
2. **Implement** - Follow existing patterns in the codebase
3. **Review** - Use `code-reviewer` agent after writing code
4. **Commit** - Conventional commits: `feat:`, `fix:`, `refactor:`, etc.

## When to Use Agents

| Trigger | Agent |
|---------|-------|
| New page or complex feature | `planner` |
| After writing/modifying code | `code-reviewer` |
| Touching auth, tokens, API interceptors | `security-reviewer` |
| Build failure | `build-error-resolver` |

## CI/CD

- Push to `master` triggers GitHub Actions deploy ([deploy.yml](.github/workflows/deploy.yml))
- Build: `npm run build` with `VUE_APP_API_URL=https://kason.app`
- Deploy: Docker container `kiwi-ui` on VPS via nginx
- Node 16 required

## Commit Conventions

Format: `<type>: <description>`
Types: feat, fix, refactor, docs, test, chore, perf, ci

## Build Commands

- `npm run serve` - Dev server (localhost API)
- `npm run serve-prod` - Dev server (prod API)
- `npm run build` - Full production build
- `npm run build:quick` - Skip pre-build optimizations
- `npm run lint` - ESLint check

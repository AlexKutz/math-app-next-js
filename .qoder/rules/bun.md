---
trigger: always_on
---
When working with this project, always use bun as the package manager instead of npm, yarn, or pnpm.

## Package Management
- Use `bun install` to install dependencies
- Use `bun add <package>` to add new dependencies
- Use `bun add -d <package>` to add dev dependencies
- Use `bun run <script>` to run npm scripts
- Use `bunx <command>` instead of npx

## Runtime
- Use `bun run` to execute TypeScript/JavaScript files directly
- Bun has built-in support for TypeScript, no need for ts-node

## Lock File
- Always commit `bun.lockb` to version control
- Do not generate or commit `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`

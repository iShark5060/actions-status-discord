# Build and Bundle Process

## Overview

The Actions Status Discord action uses a **two-stage build process** to create a single, self-contained JavaScript file that can be executed by GitHub Actions. This process transforms TypeScript source code into a bundled ES module.

## Build Tools

### Primary Tools

- **TypeScript Compiler**: Transpiles TypeScript to JavaScript
- **esbuild**: Fast JavaScript bundler
- **Node.js**: Runtime and build environment

### Package Manager

- **pnpm**: Fast, disk-space efficient package manager
- **Workspace configuration**: Single-package workspace

## Build Script

### Package.json Configuration

```json
{
  "scripts": {
    "test": "vitest run",
    "build": "esbuild src/index.ts --bundle --platform=node --format=cjs --target=node24 --outfile=dist/index.js --minify",
    "deps": "pnpm dlx npm-check-updates --target newest -u"
  }
}
```

## Step-by-Step Build Process

### 1. TypeScript Compilation

```bash
# Implicit step: TypeScript compiler checks and transpiles
# Configuration from tsconfig.json:
# - target: ES2022
# - module: ESNext
# - outDir: lib
# - strict: true
```

### 2. esbuild Bundling

```bash
esbuild src/index.ts --bundle --platform=node --format=cjs --target=node24 --outfile=dist/index.js --minify
```

**What esbuild does**:

- Analyzes the dependency graph starting from `src/index.ts`
- Bundles all imported modules into a single file
- Includes only the actually used parts of dependencies
- Applies minification to reduce file size
- Outputs to `dist/index.js`

### 3. Output Generation

```bash
esbuild directly outputs the final bundle to `dist/index.js`
```

"

```

**Key actions**:

- Outputs directly to `dist/index.js` in CommonJS format
- No file renaming or conversion steps needed
- Compatible with GitHub Actions' Node.js runtime

## Output Structure

### Final Bundle (`dist/index.js`)

```

lib/
└── index.mjs # ~100KB minified bundle

````

**Bundle characteristics**:

- Single file with all dependencies
- CommonJS format (`--format=cjs` in esbuild)
- Minified for size efficiency
- Self-contained (no external dependencies needed)

### What's Included

- **Source code**: All TypeScript modules
- **Dependencies**:
  - `@actions/core` (GitHub Actions SDK)
  - Node.js built-ins (fs, etc.)
- **TypeScript helpers**: Runtime type checking if needed

### What's Excluded

- Development dependencies (vitest, typescript, etc.)
- Test files and payloads
- Source maps (minified production bundle)

## Verification Steps

### 1. Syntax Check

```bash
node --check dist/index.js
````

- Validates JavaScript syntax
- Ensures no runtime syntax errors
- Part of CI workflow

### 2. Runtime Test

- GitHub Actions executes the bundle directly
- No compilation needed at runtime
- Fast startup time

## Development Build Cycle

### Local Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build bundle
pnpm run build

# Verify build
node --check dist/index.js
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Run tests
  run: pnpm test

- name: Build action
  run: pnpm run build

- name: Verify action bundle
  run: node --check dist/index.js
```

## Dependency Management

### Lockfile Strategy

- `pnpm-lock.yaml`: Exact version locking
- Frozen installs in CI: `pnpm install --frozen-lockfile`
- Ensures reproducible builds

### Dependency Updates

```bash
pnpm run deps
```

- Uses `npm-check-updates` to find newer versions
- Interactive update process
- Manual review required for updates

## TypeScript Configuration

### Key tsconfig.json Settings

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "lib",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests/**/*"]
}
```

**Important notes**:

- **ES2022 target**: Modern JavaScript features
- **ESNext modules**: Native ES module support
- **Strict mode**: Maximum type safety
- **OutDir**: Separate from source directory

## Build Artifacts in Releases

### Release Process

1. GitHub release triggers workflow
2. Build process runs in CI
3. Bundle committed to release tag
4. Action.yml references `dist/index.js`

### Version Tagging

- **Always use version tags** (e.g., `@v1`)
- `dist/index.js` only exists in release tags
- `@main` references won't work (no built bundle)

## Performance Considerations

### Bundle Size

- **~100KB**: Small footprint
- **Minified**: Reduced download/parse time
- **Self-contained**: No additional npm installs needed

### Startup Time

- **JavaScript action**: Faster than Docker
- **Single file**: Quick module resolution
- **Minimal dependencies**: Less initialization overhead

## Troubleshooting Build Issues

### Common Problems

1. **Missing dependencies**: Run `pnpm install`
2. **TypeScript errors**: Check `tsconfig.json` and source files
3. **ncc issues**: Verify entry point exists
4. **ES module errors**: Check `package.json` configuration and build output

### Debug Steps

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Build without minification for debugging
esbuild src/index.ts --bundle --platform=node --format=cjs --target=node24 --outfile=dist/index.js

# Test the bundle directly
node dist/index.js
```

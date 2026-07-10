# Release Process

## Overview

The Actions Status Discord action follows a structured release process to ensure reliable, versioned releases. This document outlines the release workflow, versioning strategy, and deployment procedures.

## Release Triggers

### Automated Release Events

Releases are triggered automatically by GitHub release events:

```yaml
# .github/workflows/release.yml
on:
  release:
    types: [published, released]
```

**Trigger events**:

- `published`: When a release is published
- `released`: When a release is marked as released (additional trigger)

### Manual Releases

Manual releases can be created via:

1. GitHub UI: Repository → Releases → Draft New Release
2. GitHub CLI: `gh release create`
3. Git tags: `git tag -a v1.2.3 -m "Release v1.2.3"`

## Release Workflow

### Workflow Steps (`release.yml`)

#### 1. Checkout Repository

```yaml
- uses: actions/checkout@v7
```

#### 2. Setup pnpm and Node.js

```yaml
- uses: pnpm/action-setup@v6
- uses: actions/setup-node@v6
  with:
    node-version: 24
    cache: pnpm
```

#### 3. Install Dependencies

```yaml
- run: pnpm install --frozen-lockfile
```

#### 4. Build Action

```yaml
- run: pnpm run build
```

#### 5. Verify Bundle

```yaml
- run: node --check dist/index.js
```

#### 6. Attest Build Provenance

```yaml
- uses: actions/attest-build-provenance@v4
  with:
    subject-path: action.yml
- uses: actions/attest-build-provenance@v4
  with:
    subject-path: dist/index.js
```

## Versioning Strategy

### Semantic Versioning

The action follows semantic versioning (SemVer):

- **Major version (v1)**: Breaking changes
- **Minor version (v1.x)**: New features, backward compatible
- **Patch version (v1.x.x)**: Bug fixes, backward compatible

### Current Version

- **Latest**: v1.0.0 (as of package.json)
- **Branch**: main (development)
- **Tags**: Release versions (v1, v1.0.0, etc.)

### Tag Naming Convention

- **Major version**: `v1` (floating tag, points to latest v1.x.x)
- **Full version**: `v1.0.0` (specific release)
- **Pre-releases**: `v1.1.0-beta.1` (if needed)

## Release Artifacts

### Bundled Action

The release includes the built action bundle:

```
dist/index.js  # Compiled and bundled JavaScript action
```

### What's Included in Release

1. **Source code**: TypeScript files (`src/`)
2. **Bundled action**: `dist/index.js`
3. **Configuration files**: `action.yml`, `package.json`
4. **Documentation**: `README.md`, `LICENSE`
5. **Test files**: For verification

### What's Excluded

1. `node_modules/` (dependencies bundled in `index.mjs`)
2. Development-only files
3. `.gitignore` patterns

## Pre-Release Checklist

### Before Creating a Release

#### 1. Code Quality

- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Bundle verification passes (`node --check dist/index.js`)

#### 2. Documentation

- [ ] README.md updated with new features/changes
- [ ] Changelog updated (if maintained)
- [ ] Examples verified and working

#### 3. Dependency Management

- [ ] Dependencies updated if needed
- [ ] Security audit clean (`pnpm audit`)
- [ ] Lockfile committed (`pnpm-lock.yaml`)

#### 4. Version Bumping

- [ ] `package.json` version updated
- [ ] Git tag prepared
- [ ] Release notes drafted

### Automated Validation

The CI workflow (`test.yml`) runs on every push to main, providing pre-release validation:

- Tests execution
- Build verification
- Bundle checking

## Creating a Release

### Step 1: Prepare Changes

```bash
# Ensure working directory clean
git status

# Update version in package.json if needed
# Manual edit or use npm version

# Commit changes
git add package.json
git commit -m "Bump version to v1.1.0"
```

### Step 2: Create Git Tag

```bash
# Create annotated tag
git tag -a v1.1.0 -m "Release v1.1.0"

# Push tag to GitHub
git push origin v1.1.0
```

### Step 3: Create GitHub Release

```bash
# Using GitHub CLI
gh release create v1.1.0 \
  --title "v1.1.0" \
  --notes-file CHANGELOG.md \
  --target main
```

**Or via GitHub UI**:

1. Go to Repository → Releases
2. Click "Draft a new release"
3. Select tag version
4. Add release notes
5. Publish release

### Step 4: Monitor Release Workflow

1. Check Actions tab for release workflow
2. Verify all steps pass
3. Confirm bundle built successfully
4. Check attestations completed

## Post-Release Tasks

### 1. Update Floating Tags

```bash
# Update major version tag (v1) to point to latest
git tag -f v1
git push origin v1 --force
```

**Warning**: Force-pushing tags should be done carefully as it affects users referencing the tag.

### 2. Verify Action Usage

Test the released action in a sample workflow:

```yaml
- uses: iShark5060/actions-status-discord@v1.1.0
```

### 3. Update Documentation

- Update any version-specific documentation
- Verify all examples use correct version tags
- Update quickstart if needed

### 4. Announcement (Optional)

- Update project status in README
- Notify users of significant changes
- Update any community channels

## Rollback Procedure

### If Release Has Issues

1. **Identify the problem**: Bug, regression, performance issue
2. **Create hotfix**: Branch from previous stable version
3. **Test thoroughly**: Ensure fix resolves issue
4. **Release patch version**: Increment patch number
5. **Update floating tags**: Point major tag to stable version

### Emergency Rollback Steps

```bash
# Revert to previous version
git checkout v1.0.0

# Force update major tag
git tag -f v1
git push origin v1 --force

# Create new release from stable version if needed
```

## Version Compatibility

### Backward Compatibility

- **Major versions**: May break compatibility
- **Minor versions**: Should maintain compatibility
- **Patch versions**: Must maintain compatibility

### Deprecation Policy

1. **Announcement**: Deprecated features marked in documentation
2. **Warning period**: Features work with warnings
3. **Removal**: In next major version

Example: `job` input is deprecated in v1, will be removed in v2.

## Security Considerations

### Build Attestation

The release workflow includes SLSA build attestation:

- **Provenance**: Verifies build source and process
- **Integrity**: Ensures artifacts unchanged
- **Reproducibility**: Build process documented

### Dependency Security

- **Regular updates**: Dependabot configured for security updates
- **Vulnerability scanning**: GitHub security features
- **Lockfile integrity**: Frozen installs in CI

### Secret Management

- **No secrets in bundles**: Webhook URLs from environment/secrets
- **Minimal permissions**: Release workflow uses least privilege
- **Audit trail**: GitHub Actions provides execution logs

## Monitoring and Metrics

### Release Health Checks

1. **Workflow success rate**: Release workflow completion
2. **Bundle validity**: JavaScript syntax check passes
3. **Download counts**: Release asset downloads
4. **Usage statistics**: Action usage across repositories

### Error Tracking

- **GitHub Issues**: User-reported problems
- **Workflow failures**: CI/CD pipeline issues
- **Dependency alerts**: Security vulnerabilities

## Best Practices

### 1. Always Use Version Tags

```yaml
# GOOD: Specific version
uses: iShark5060/actions-status-discord@v1.0.0

# GOOD: Major version (floating)
uses: iShark5060/actions-status-discord@v1

# BAD: Branch reference (won't work)
uses: iShark5060/actions-status-discord@main
```

### 2. Test Before Release

- Run full test suite
- Build and verify locally
- Test in sample workflow

### 3. Maintain Changelog

Keep track of:

- New features
- Bug fixes
- Breaking changes
- Deprecations

### 4. Semantic Versioning

- **Breaking changes**: Increment major version
- **New features**: Increment minor version
- **Bug fixes**: Increment patch version

## Troubleshooting Releases

### Common Issues

#### 1. Release Workflow Fails

- **Cause**: Build failure, test failure, dependency issue
- **Solution**: Check workflow logs, fix underlying issue

#### 2. Bundle Verification Fails

- **Cause**: JavaScript syntax error in bundle
- **Solution**: Check TypeScript compilation, ncc bundling

#### 3. Action Doesn't Work After Release

- **Cause**: Bundle issues, missing files, incorrect paths
- **Solution**: Verify `action.yml` points to correct file, test locally

#### 4. Users Report Issues

- **Cause**: Breaking change, regression, documentation gap
- **Solution**: Investigate, create patch release if needed

### Debug Steps

```bash
# Simulate release build locally
pnpm install --frozen-lockfile
pnpm run build
node --check dist/index.js

# Check action.yml references
cat action.yml | grep "main:"

# Verify tag exists
git tag -l | grep v1
```

## Future Improvements

### Potential Enhancements

1. **Automated version bumping**: Based on conventional commits
2. **Release candidates**: Beta testing before stable
3. **Extended testing**: More integration tests before release
4. **Performance benchmarking**: Bundle size and execution time tracking

### Release Automation

Considerations for future:

- Automated changelog generation
- Pre-release testing workflows
- Rollback automation
- Usage analytics integration

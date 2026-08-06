# Amplify Deployment Fix

## Issue
Amplify builds were failing repeatedly with documentation-only commits and even with frontend changes.

## Root Cause
The `amplify.yml` configuration was:
1. Navigating to root directory (`cd ..`)
2. Running `npm ci` which tried to install ALL workspace dependencies (including backend dependencies like `pdf-lib`)
3. Using `npm ci` which requires exact lockfile match and can be fragile

## Solution Applied

### Change 1: Simplified Build Path
**Before:**
```yaml
preBuild:
  commands:
    - cd .. && npm ci && cd frontend
```

**After:**
```yaml
preBuild:
  commands:
    - npm install  # Run directly in frontend folder
```

### Change 2: Use `npm install` instead of `npm ci`
- `npm install` is more forgiving with lockfile mismatches
- Works better in CI/CD environments with cached node_modules
- Still installs exact versions from package-lock.json when available

### Change 3: Fixed Cache Paths
**Before:**
```yaml
cache:
  paths:
    - ../node_modules/**/*  # Wrong path
```

**After:**
```yaml
cache:
  paths:
    - node_modules/**/*  # Correct path relative to appRoot
```

## Results

✅ **Build #64: SUCCESS**
- Commit: 74c6307
- Build Time: ~3.5 minutes
- Status: All steps (BUILD, DEPLOY, VERIFY) succeeded
- Deployment URL: https://dev.dwfkamikpgffo.amplifyapp.com

## Files Modified
- `amplify.yml` - Updated build configuration
- `frontend/package.json` - Minor description update to trigger build

## Verification
```bash
# Check latest jobs
aws amplify list-jobs --app-id dwfkamikpgffo --branch-name dev --max-results 5

# Check specific job
aws amplify get-job --app-id dwfkamikpgffo --branch-name dev --job-id "0000000064"

# View deployment
open https://dev.dwfkamikpgffo.amplifyapp.com
```

## Lessons Learned

1. **Keep Amplify builds simple** - Don't navigate out of appRoot unnecessarily
2. **Avoid workspace dependencies in frontend builds** - Backend dependencies (pdf-lib, AWS SDKs, etc.) are not needed for frontend
3. **Use `npm install` over `npm ci`** in Amplify - More reliable with caching
4. **Test with minimal changes** - Small frontend changes help isolate build issues

## Future Recommendations

1. Consider splitting frontend and backend into separate repositories if monorepo complexity continues
2. Add Amplify build status badge to README
3. Set up Amplify notifications for build failures
4. Document expected build time (3-4 minutes for clean build)

---

**Status:** ✅ RESOLVED
**Date:** August 6, 2026
**Fixed By:** Kiro AI Assistant

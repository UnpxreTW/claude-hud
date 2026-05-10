# Releasing

This project ships as a Claude Code plugin. Releases should include compiled `dist/` output.

## Release Checklist

1) Update versions (all THREE manifests must declare the same version):
   - `package.json` (`version`)
   - `.claude-plugin/plugin.json` (`version`)
   - `.claude-plugin/marketplace.json` (`metadata.version`)
   - `CHANGELOG.md`

   Why all three matter: Claude Code reads `.claude-plugin/marketplace.json` to determine the latest plugin version. If only `package.json` is bumped, `/plugin` will report the stale version as "latest" and clients won't pull the new release. CI enforces three-file consistency — see `.github/workflows/ci.yml` `version-consistency` job.

2) Build:
   ```bash
   npm ci
   npm run build
   npm test
   npm run test:coverage
   ```
3) Verify plugin entrypoint:
   - `.claude-plugin/plugin.json` points to `dist/index.js`
4) Commit and tag:
   - `git tag vX.Y.Z`
5) Publish:
   - Push tag
   - Create GitHub release with notes from `CHANGELOG.md`

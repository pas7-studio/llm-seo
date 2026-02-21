# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and release.

## How to add a changeset

1. Run `pnpm changeset` or `npm run changeset`
2. Select the change type (major, minor, patch)
3. Write a brief description of the change
4. Commit the generated `.changeset/*.md` file

## Release process

1. Merge PR with changeset to `main`
2. CI automatically versions packages
3. CI publishes to npm and creates GitHub release

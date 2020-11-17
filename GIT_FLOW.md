# Madison Reed Git Flow

## Env branches

- develop (main)
- qa
- staging
- prod

The order of the env branches here is important since it sets the flow that code additions should follow.
For example, support branches should first be merged to `develop`, then `qa`, then `staging` and at last `prod`.
Something similar but opposite happens with hotfixes, for example, if a bug that needs a hotfix has reached `staging` but not `prod`, then the hotfix needs to be applied to `staging`, then it should also be applied to `qa` and `develop` but not `prod`.

## Support branches

### Development branches

Development branches should part from develop or another branch of their type.
Development branches should always be merged to develop by creating a Pull Request.

#### Branch naming

- `feat/` (new feature for the user, not a new feature for build script)
- `fix/` (bug fix for the user, not a fix to a build script)
- `docs/` (changes to the documentation)
- `style/` (formatting, missing semi colons, etc; no production code change)
- `refactor/` (refactoring production code, eg. renaming a variable)
- `test/` (adding missing tests, refactoring tests; no production code change)
- `chore/` (updating grunt tasks etc; no production code change)

### Release branches

These branches are created automatically when the release workflow is run.

The workflow does the following:

- runs a script that bumps the version of the app of the dev and qa envs
- creates a new commit with that change
- creates a PR to develop with that change

After that other workflows kick into action to merge those release PRs if they have no conflicts and create the release tag on github.

We also have configured that when something is merged to the `qa` branch, the build for iOS and Android is triggered in App Center so the release will be done for you.

You shouldn't need to create a release branch manually, always use the workflow.

**Caution:** Make sure that the backend is deployed to QA before triggering the release workflow.

#### Branch naming

- `release/`

### Hotfix branches

Hotfix branches should always part from an env branch. That is, the branch of the last env in the env flow we want to deploy the hotfix to. For example if the hotfix wants to be released to production, then the hotfix branch should start from `prod`. If the issue is on staging but not production, then it should start from `staging`.

Hotfix branches should not start from `develop` since that is just a `fix/` support branch.

When checking out a hotfix branch you should do it with the prefix `hotfix/` so the workflows know how to handle it. When the fix is applied simply create a PR to the base env branch you parted from. An action will kick in when a hotfix PR is created that will add a commit to your PR bumping the patch version of the corresponding env.

When the hotfix branch is merged, a tag will be created and subsequent PRs will be created to the other envs that also need the patch given the env-flow, those PRs will have their corresponding version bump. Those PRs will be automatically merged if possible since the fix has already been reviewed and a tag for each will also be created.

As with the releases, once a new pr is merged to one of the env branches, a deploy will be triggered in App Center.

**Caution:** Make sure that the backend is deployed to all the envs the hotfix will be deployed to as mentioned above before merging the PR of the hotfix since the backend is not deployed automatically at the same time.

#### Branch naming

- `hotfix/`

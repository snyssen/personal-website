---
title: Automated Releases Versioning and Publishing using Github Actions, Conventional Commits, Release-Please and Renovate
description: Check the tools I use for the versioning and publishing of my releases
image:
  src: "@assets/blog-attachments/hero/automated-releases-versioning-and-publishing.png"
  alt: Arrows representing a cycle, followed by the text "Automated Releases Versioning and Publishing".
pubDate: 2023-12-18
updatedDate: 2024-02-13
tags:
    - name: programming
      colorClass: bg-sky-600
    - name: devops
      colorClass: bg-emerald-600
---
As with pretty much any IT task I do, I try to automate as much of the little things I can. As such, I have recently changed how I manage the versioning and publishing of my packages, using a standard automated procedure for every project. In this blog post, I will present to you each of the components of that new methodology and how they are put together, step-by-step. If you are only interested in the full Github Action workflow, [skip to the end](#a-full-workflow).

## 1. Conventional Commits

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) offer a standardized way of structuring commit messages, so they are easier to read to both humans and, more importantly, machines. This standard structure is as follows:

```plaintext
<type>(<optional scope>)<optional !>: <description>
<optional body>
<optional footer>
```

- The `type` refers to the type of commit, such as `feat`, `fix`, `chore`, etc.
- The optional `scope` provides additional context. It can for example specify the component name on which work was done in a front-end app.
- The optional `!` indicates that the commit introduces a breaking change
- The `description` explains in a few words the actual change made by the commit
- The optional `body` allows for adding more context that cannot fit in the `description`, such as the motivation of the change, reference to an issue ID, etc.
- The optional `footer` allows for explaining breaking changes in more details.

Here are some examples of conventional commits:

```plaintext
fix(weather): rename GET endpoint to upper case
```

```plaintext
chore(deps): update dependency @types/react to v18.2.33 (#53)
Co-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>
```

```plaintext
fix!: rename container_name input to stack_name for better consistency
BREAKING CHANGES: client will have to update the input to match its new name
```

Since explaining Conventional Commits in more details is out of the scope of this article, I will leave you with a link to [the official specification](https://www.conventionalcommits.org/en/v1.0.0/), as well as a [nicely made summary](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13) that I really recommend.

## 2. Release-Please

[Release Please](https://github.com/googleapis/release-please) is a Google project that uses the aforementioned Conventional Commits to automate CHANGELOG generation and releases creation. It does so by running in a Github Action triggered on each commit to your main branch. Using the commit history, it can check the changes that were made between the latest version and the latest commit, and determine the next [semver](https://semver.org/) number based on the type of changes, mainly:

- Non breaking fixes (`fix` commits) will increment the patch version;
- Non breaking features (`feat` commits) will increment the minor version and reset the patch;
- Breaking changes (commits containing `!`) will increment the major version and reset both the minor and patch.

After determination of the next version, the pipeline creates a pull request containing a changelog. Merging that PR will automatically create a new release by tagging the merge commit with the new version and creating a GitHub release pointing to that tag as well as using the changelog as its body. The changelog file at the root of your repo will also be updated.

Release Please supports many specific [project types](https://github.com/googleapis/release-please?tab=readme-ov-file#strategy-language-types-supported), i.e. ways of doing a release, so you should use one that is appropriate for your specific project. For example, a Node.js project should use the `node` type, so releases update its `package.json` file accordingly. If unsure of the project type to use, the `simple` type is a safe bet, as it will simply update a `version.txt` and a `changelog.md` files at the root of your repo.

## 3. Your build step(s)

The build step is usually specific specific to the project, or at least the project type, and is used to create the release artifacts and publish them. For most of my projects, this means building container images. The nice thing about building the container is that the actual build logic is actually encapsulated in the `Dockerfile` instead of the actual CI pipeline, making it easier to have a standardized pipeline ("workflow" in the Github CA jargon) that is independent from the build requirements. As such, you will find my standard example [at the end of this blog post](#a-full-workflow).

## 4. (optional) Renovate

[Renovate](https://github.com/renovatebot/renovate) is an optional component but the one that really seals the deal to me. Available as a [Github app](https://github.com/apps/renovate), This bot automates the update of your dependencies by creating pull requests when there are updates, allowing you to easily keep your app up-to-date. And since it can be configured to use conventional commits too, it integrates neatly with our other release tools.

Upon activation of the Github app, it should automatically scan your repo and open pull requests with the recommended configurations based on what it detects. You can of course customize that recommended configuration based on your actual needs, but I will let you check the tool documentation to do so. You can also check [the configuration for this website](https://github.com/snyssen/personal-website/blob/main/renovate.json) for inspiration. You should mostly notice that I force the use of semantic commits using the `:semanticCommits` preset, and that I group some packages updates together by giving them a `groupName` in their respective `packageRules`.

## A full workflow

As promised, here is a fully working Github Actions workflow that you can reuse on your projects.

```yaml
name: Build & Release
on:
  push:
    branches:
      - "*"
  pull_request:
    branches:
      - main
permissions:
  contents: write
  pull-requests: write
  packages: write
env:
  # login to github registry using the default credentials associated with pipeline
  REGISTRY: ghcr.io
  REGISTRY_USERNAME: ${{ github.actor }}
  REGISTRY_PASSWORD: ${{ secrets.GITHUB_TOKEN }}
  # github.repository as <account>/<repo>
  IMAGE_NAME: ${{ github.repository }}
  # For release-please, see available types at https://github.com/google-github-actions/release-please-action/tree/v4/?tab=readme-ov-file#release-types-supported
  PROJECT_TYPE: node
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: rp
        uses: google-github-actions/release-please-action@v4
        with:
          release-type: ${{ env.PROJECT_TYPE }}
      - name: Log into registry ${{ env.REGISTRY }}
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ env.REGISTRY_USERNAME }}
          password: ${{ env.REGISTRY_PASSWORD }}
      - name: Prepare tags for Docker meta
        id: tags
        env:
          is_release: ${{ steps.rp.outputs.release_created }}
          version: v${{ steps.rp.outputs.major }}.${{ steps.rp.outputs.minor }}.${{ steps.rp.outputs.patch }}
        run: |
          tags=""
          if [[ "$is_release" = 'true' ]]; then
            tags="type=semver,pattern={{version}},value=$version
          type=semver,pattern={{major}},value=$version
          type=semver,pattern={{major}}.{{minor}},value=$version"
          else
            tags="type=ref,event=branch
          type=ref,event=pr"
          fi
          {
            echo 'tags<<EOF'
            echo "$tags"
            echo EOF
          } >> "$GITHUB_OUTPUT"
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: ${{ steps.tags.outputs.tags }}
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: APP_VERSION=${{ steps.meta.outputs.version }}

```

Let's go through what it does and how to configure it for your own use:

- The workflow runs on every commit of every branch as well as on PRs, so we can at least ensure that the project is always in a buildable state. This is of course no replacement for actual automated tests, but it is still a nice sanity check.
- There are three required "write" permissions: content and PRs for the Release Please step, and packages for pushing container images to the Github container registry. The last one can be removed if you do not use that service.
- Most configuration is kept out of the build steps and put into environment variables so it can be managed with more ease. The default values are for pushing your images the Github container registry, but you can easily adapt them to push to Docker hub for example:

```yaml
env:
  REGISTRY: docker.io
  # Do not forget to set these values inside your secrets!
  REGISTRY_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
  REGISTRY_PASSWORD: ${{ secrets.DOCKERHUB_TOKEN }}
  IMAGE_NAME: ${{ secrets.DOCKERHUB_USERNAME }}/project-name
```

- As for the actual steps, here is what they do:
  - Checkout the code so it can be updated if needed.
  - run Release Please on the project. We define the `rp` step ID so we can later check if a new release has been created.
  - Log into your registry of choice, using the environment variables defined earlier.
  - Prepare the tags for the yet-to-be-built container image. There are basically two possibilities, and different tags according to those possibilities:
    - *This is a **release** commit*, i.e. a merge commit coming from a release PR: this is the signal for a new release, so the image will be tagged with the new version (with separate tags for granularity, e.g. `1`, `1.2` and `1.2.3` for release 1.2.3) as well as the `latest` tag;
    - *This is a **standard** commit*, i.e. any commit that is not a release one: the image will be tagged with the branch name, or the PR ID in the case of a pull request event.
  - The Docker meta step uses the output of the previous step to actually generate the list of tags and the image name. It is more generally used to provide metadata of the project to the generated images, such as the project source, etc.
  - Finally, the image is built according to all of the information prepared above, and is pushed to your registry, **unless the workflow was triggered by a pull request**. I also like to enter the version as a build argument so the app can display its own version (as you will see on the footer of this website).

## Projects using this method

- [This website](https://github.com/snyssen/personal-website)
- The [Webb Launcher](https://github.com/snyssen/webb-launcher) start page
- The [compose_deploy](https://github.com/snyssen/ansible_role_compose_deploy) Ansible role
- Probably more to come :)

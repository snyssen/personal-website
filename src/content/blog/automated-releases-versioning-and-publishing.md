---
title: Automated Releases Versioning and Publishing using Github Actions, Conventional Commits, Release-Please and Renovate
description: Check the tools I use for the versioning and publishing of my releases
image:
  src: "@assets/blog-attachments/hero/automated-releases-versioning-and-publishing.png"
  alt: Image of arrows representing a cycle, followed by the text "Automated Releases Versioning and Publishing".
pubDate: 2023-12-18
updatedDate: 2023-12-20
tags:
    - name: programming
      colorClass: bg-sky-600
    - name: devops
      colorClass: bg-emerald-600
---
As with pretty much any IT task I do, I try to automate as much of the little things I can. As such, I have recently changed how I manage the versioning and publishing of my packages, using a standard automated procedure for every project. In this blog post, I will present to you each of the components of that new methodology and how they are put together, step-by-step.

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

After determination of the next version, the pipeline creates a pull request containing a changelog. Merging that PR will automatically create a new release by tagging the merge commit with the new version and creating a GitHub release pointing to that tag and using the changelog as its body. The changelog file at the root of your repo will also be updated.
You can find an example of the pipeline definition in [the repo of this site](https://github.com/snyssen/personal-website/blob/main/.github/workflows/release-please.yml).  You may notice that we are using a [Github Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT) in the release-please step. While not mandatory for the sole purpose of the release creation (since release-please uses a generated token per default), it is essential to making sure the next step gets triggered...

## 3. Build Pipeline

A build pipeline, specific to the project, is used to create the release artifacts and publish them (only container images in my projects so far). This pipeline is triggered by tags creations; in other words, it is triggered by the release creation. This is why the PAT used in the previous step was so important, as otherwise this pipeline would not get triggered, as noted by the Github Actions documentation:

> When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered by the `GITHUB_TOKEN`, with the exception of `workflow_dispatch` and `repository_dispatch`, will not create a new workflow run. This prevents you from accidentally creating recursive workflow runs. For example, if a workflow run pushes code using the repository's `GITHUB_TOKEN`, a new workflow will not run even when the repository contains a workflow configured to run when `push` events occur.
> - [Using the `GITHUB_TOKEN` in a workflow](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#using-the-github_token-in-a-workflow) at [GitHub Actions](https://docs.github.com/en/actions "GitHub Actions")/[Security guides](https://docs.github.com/en/actions/security-guides "Security guides")/[Automatic token authentication](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)

You can find [the build pipeline of this website](https://github.com/snyssen/personal-website/blob/main/.github/workflows/docker-publish.yml) as an example of a build pipeline triggered by the `tags` event. You may notice that pipeline is also triggered by other events, this is indeed to provide continuous integration during development, by ensuring the code is always in a buildable and publishable state.

## 4. (optional) Renovate

[Renovate](https://github.com/renovatebot/renovate) is an optional component but the one that really seals the deal to me. Available as a [Github app](https://github.com/apps/renovate), This bot automates the update of your dependencies by creating pull requests when there are updates, allowing you to easily keep your app up-to-date. And since it can be configured to use conventional commits too, it integrates neatly with our other release tools.

Upon activation of the Github app, it should automatically scan your repo and open pull requests with the recommended configurations based on what it detects. You can of course customize that recommended configuration based on your actual needs, but I will let you check the tool documentation to do so. You can also check [the configuration for this website](https://github.com/snyssen/personal-website/blob/main/renovate.json) for inspiration. You should mostly notice that I force the use of semantic commits using the `:semanticCommits` preset, and that I group some packages updates together by giving them a `groupName` in their respective `packageRules`.

## Caveats

The presented solution has a caveat that I have to iron out: the release artifacts are created **after** the release.  This means that we have an intermediate state where a newly created release points to non existing artefacts. This issue gets worse when you factor in that the build pipeline can (and probably will) fail, leaving the newly created release empty. For my use cases, this is currently acceptable since the artifacts are mainly for my own use. That being said, I will probably go back and update the pipelines anyway since the fix should be easy enough: build the artifact before creating the release, then retag them when the release is done. Of course this solution still leaves a window for failure if the re-tag fails, but that seems unavoidable and safe enough.

## Projects using this method

- [This website](https://github.com/snyssen/personal-website)
- The [Webb Launcher](https://github.com/snyssen/webb-launcher) start page
- The [compose_deploy](https://github.com/snyssen/ansible_role_compose_deploy) Ansible role
- Probably more to come :)

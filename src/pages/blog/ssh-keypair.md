---
title: Manage SSH keys between a Linux client and Server
description: Learn how to create an SSH key-pair a copy the public key onto a remote server for passwordless access
layout: ../../layouts/BlogPostLayout.astro
heroImage: /blog-attachments/hero/ssh-keypair.jpg
pubDate: Nov 16 2021
tags:
    - name: sys-admin
      colorClass: bg-amber-600
    - name: linux
      colorClass: bg-yellow-600
---

## How to create a new SSH key pair

First, ensure the ssh agent is running:

```sh
eval "$(ssh-agent -s)"
```

Then, run command

```sh
ssh-keygen
```

and follow the on-screen prompts. It should generate your key inside the `~/.ssh/` directory.

> A password may or may not be chosen to access the key pair. Using a password is of course more secure, but is in no way necessary.

From my experience, the ssh agent should automatically add the newly generated key to its store. But if doesn't do it, you can simply use the following command to add the key pair manually:

```sh
ssh-add ~/.ssh/<name_of_cipher>
```

## Copy SSH key pair to remote server

One the key pair has been created, simply use the following command to copy it to the remote server:

```sh
ssh-copy-id <user>@<host>
```

The above command should ask for your password one last time.

You should now be able to connect to the remote server without using passwords, like so:

```sh
ssh <user>@<host>
```

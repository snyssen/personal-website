---
title: "Developing with Vagrant - Tips & Tricks"
description: Do you want to develop Ansible playbooks and test them under Vagrant? Here are some random tips&tricks
layout: ../../layouts/BlogPostLayout.astro
pubDate: Jan 16 2023
tags:
    - name: programming
      colorClass: bg-sky-600
    - name: sys-admin
      colorClass: bg-amber-600
    - name: infra-as-code
      colorClass: bg-fuchsia-600
---

## Simplify and secure your ansible-vault interactions

These tips are also part of the [Automate first time setup](#automate-first-time-setup) trick, so you can also directly skip to that one.

### Pre-commit hook

You can set up a pre-commit hook that will prevent you from committing any unencrypted vault file. A good practice is to have all vault files under the filename `vault.yml`, that way you can make use of the following pre-commit hook script:

```bash
#! /usr/bin/bash
PROJECTDIR="{{PROJECTDIR}}"

VAULTS=$(find "${PROJECTDIR}" -type f -name "vault.yml")

for vault_file in ${VAULTS}; do
 # trunk-ignore(shellcheck/SC2016)
 if (grep -q '$ANSIBLE_VAULT;' "${vault_file}"); then
  echo "Vault in $(dirname "${vault_file}") is encrypted."
 else
  echo "Vault in $(dirname "${vault_file}") is NOT encrypted! Run 'ansible-vault encrypt ${vault_file}' and try again."
  exit 1
 fi
done
```

> NOTE: You will have to either replace manually the `{{PROJECTDIR}}` variable to point to your project path, or let the script provided at [Automate first time setup](#automate-first-time-setup) do this for you.

### Password file

Instead of having to enter your vault password every time, make use of a password file. First create the password file with your vault password in it:

```bash
echo "your_password" > .vault_pass
```

Then, add this file to your `.gitignore` to make sure it won't be committed:

```bash
echo ".vault_pass" >> .gitignore
```

And finally, add the file to your `ansible.cfg` file so it will be picked up by ansible automatically:

```cfg
[defaults]
# There may be other settings here
vault_password_file = .vault_pass
```

## Automate first time setup

I personally like to have a `setup.sh` file at the root of my projects so it can be the first thing I execute right after cloning the project onto a new machine. Here is the script I use:

```bash
#! /usr/bin/bash
SCRIPTPATH=$(readlink -f "$0")
PROJECTDIR=$(dirname "${SCRIPTPATH}")

# Set pre-commit hook
sed -e "s%{{PROJECTDIR}}%${PROJECTDIR}%g" scripts/pre-commit >.git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Install the requirements
ansible-galaxy install -r requirements.yml
vagrant plugin install vagrant-hostmanager

# Creates vault password file
read -rsp "Enter the Ansible vault password: " VAULT_PASS
echo "${VAULT_PASS}" >.vault_pass
chmod 0600 .vault_pass
echo -e "\nProject initialized!"
```

It starts by setting up a pre-commit hook that will prevent you from committing unencrypted. You will have to put the script found at [Pre-commit hook](#pre-commit-hook) under `scripts/pre-commit` for this to work.

It then install the requirements for using the project. You should thus include a standard ansible-galaxy `requirements.yml` file at the root of your project. I also often make use of the `vagrant-hostmanager` Vagrant plugin, so I install it as well.

Finally, it prompts you for a vault password and writes it into `.vault_pass`. You should have your `ansible.cfg` file pointing to that `.vault_pass` file, as described in [Password file](#password-file).

## Set user and private keys

At the top of your dev inventory file, simply add the following configuration:

```yaml
all:
  vars:
    ansible_user: "vagrant"
    ansible_ssh_private_key_file: "{{ playbook_dir }}/.vagrant/machines/{{ inventory_hostname }}/virtualbox/private_key"
```

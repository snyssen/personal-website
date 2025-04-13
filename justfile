setup: setup-pre-commit

setup-pre-commit:
  pre-commit install

alias start := dev
dev:
  npm run dev

build:
  npm run build:ci

package:
  docker build .

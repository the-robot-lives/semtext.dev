#!/usr/bin/env bash
# Sync the npl-enhanced-content subtree.
#   pull: fetch main from the-robot-lives/npl-enhanced-content into this repo (squashed)
#   push: push subtree changes back to the fork's develop branch
# Usage: scripts/sync-npl-enhanced.sh pull|push
set -euo pipefail

PREFIX="npl-enhanced-content"
REMOTE="git@github.com:the-robot-lives/npl-enhanced-content.git"
PULL_BRANCH="main"
PUSH_BRANCH="develop"

cd "$(git rev-parse --show-toplevel)"

case "${1:-}" in
  pull)
    git subtree pull --prefix="$PREFIX" "$REMOTE" "$PULL_BRANCH" --squash
    ;;
  push)
    git subtree push --prefix="$PREFIX" "$REMOTE" "$PUSH_BRANCH"
    ;;
  *)
    echo "usage: $0 pull|push" >&2
    exit 2
    ;;
esac

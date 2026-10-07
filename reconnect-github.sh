#!/usr/bin/env bash
# Reconnect and resync the Able God College project with GitHub
# One-click script: run from project root
# Repo: https://github.com/BGSoftwares/wenyasha-connect.git
# Branch: main

set -e

cd "$(dirname "$0")"

GITHUB_REMOTE="https://github.com/BGSoftwares/wenyasha-connect.git"

if ! command -v git &> /dev/null; then
    echo "Git is not installed or not on PATH. Install from https://git-scm.com/download"
    exit 1
fi

echo "Reconnecting to GitHub and resyncing main..."

# Ensure we are on main
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main
fi

# Ensure origin points to GitHub
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || true)
if [ "$ORIGIN_URL" != "$GITHUB_REMOTE" ]; then
    echo "Setting origin to GitHub remote..."
    if [ -n "$ORIGIN_URL" ]; then
        git remote set-url origin "$GITHUB_REMOTE"
    else
        git remote add origin "$GITHUB_REMOTE"
    fi
else
    echo "Origin already points to GitHub."
fi

# Fetch latest from GitHub
echo "Fetching latest state from GitHub..."
git fetch origin main

# Merge GitHub main into local main if it exists on remote
if git rev-parse --verify origin/main &>/dev/null; then
    echo "Merging origin/main into local main..."
    if ! git merge origin/main --no-edit; then
        echo "Merge conflicts detected. Resolve them manually, then run this script again."
        exit 1
    fi
fi

# Push local main to GitHub
echo "Pushing main to GitHub..."
git push -u origin main

# Verify
LOCAL_MAIN=$(git rev-parse --verify main)
GITHUB_MAIN=$(git rev-parse --verify origin/main)
if [ "$LOCAL_MAIN" = "$GITHUB_MAIN" ]; then
    echo "Success! Local main and GitHub origin/main are in sync at $LOCAL_MAIN."
else
    echo "Warning: Local and GitHub refs differ after push."
fi

echo "Done. GitHub repo: $GITHUB_REMOTE"

#!/bin/bash

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set"
  exit 1
fi

# Check if GITHUB_USER is set
if [ -z "$GITHUB_USER" ]; then
  echo "Error: GITHUB_USER environment variable is not set"
  exit 1
fi

# Set the submodule URL with the token
git submodule set-url my-web/git-submodules/components "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/lyadhgod/components.git"
git submodule set-url my-app/git-submodules/components "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/lyadhgod/components.git"

# Sync newly set URLs and initialize submodules
git submodule sync
git submodule update --init --recursive

#!/usr/bin/env bash
# Run this IN YOUR TERMINAL from the project root so the branch is created and pushed in YOUR repo.
set -e
BRANCH="fix/ide-module-resolution"
git checkout -b "$BRANCH"
git add -A
if git diff --cached --quiet; then
  echo "No changes to commit (everything already committed)."
else
  git commit -m "fix: IDE fallback types and baseUrl for module resolution (next/link, next-auth, lucide-react, JSX)"
fi
git push -u origin "$BRANCH"
echo "Done. Branch $BRANCH created and pushed."

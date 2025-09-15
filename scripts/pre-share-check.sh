#!/bin/bash

# Pre-Share Security Check Script
# Run this before sharing your repository publicly

echo "[SCAN] BYOK Pre-Share Security Check"
echo "================================"

# Check for sensitive patterns in tracked files (actual secret values, not variable names)
echo "Checking for potential API keys or secrets..."
# Look for actual API key patterns, not just variable names
secret_patterns="sk-[a-zA-Z0-9]{48}\|sk-ant-[a-zA-Z0-9]{95}\|AIza[a-zA-Z0-9]{35}\|gsk_[a-zA-Z0-9]{52}\|password.*=.*[a-zA-Z0-9]\|secret.*=.*[a-zA-Z0-9]"
if git grep -E "$secret_patterns" 2>/dev/null | grep -v ".gitignore\|env.sample\|README.md\|pre-share-check.sh"; then
    echo "[ERROR] FOUND actual secrets in tracked files!"
    echo "Review and remove any hardcoded secrets before sharing."
    exit 1
else
    echo "[OK] No actual API keys or secrets found in tracked files"
fi

# Check for .env files
echo "Checking for environment files..."
if find . -name ".env*" -not -name "*.sample" -not -name "*.example" | grep -q .; then
    echo "[ERROR] FOUND .env files that might contain secrets!"
    find . -name ".env*" -not -name "*.sample" -not -name "*.example"
    echo "Make sure these are in .gitignore and contain no real secrets."
    exit 1
else
    echo "[OK] No problematic .env files found"
fi

# Check for backup directories
echo "Checking for backup directories..."
if find . -name "*backup*" -type d | grep -q .; then
    echo "[WARN] Found backup directories:"
    find . -name "*backup*" -type d
    echo "These are ignored by .gitignore but verify they contain no secrets."
else
    echo "[OK] No backup directories found"
fi

# Check git status
echo "Checking git status..."
if git status --porcelain | grep -q .; then
    echo "[WARN] You have uncommitted changes:"
    git status --short
    echo "Consider committing or stashing these before sharing."
else
    echo "[OK] Working directory is clean"
fi

# Check for large files
echo "Checking for large files..."
large_files=$(find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./_backup*/*")
if [ -n "$large_files" ]; then
    echo "[WARN] Found large files that might not be appropriate for sharing:"
    echo "$large_files"
else
    echo "[OK] No unusually large files found"
fi

echo ""
echo "[COMPLETE] Security check complete!"
echo ""
echo "[OK] Your repository appears safe to share publicly"
echo "[INFO] Remember to:"
echo "   - Never commit real API keys"
echo "   - Users should create their own .env.local files"
echo "   - API keys are stored client-side only in browser localStorage"
echo ""
#!/bin/bash

# Aurora Systems - Firestore Rules Deployment Script
# This script deploys security rules to Firebase Console

set -e

PROJECT_ID="aurora-system-b3203"
RULES_FILE="firestore.rules"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Aurora Systems - Firestore Rules Deployment               ║"
echo "║  Project: $PROJECT_ID                                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if rules file exists
if [ ! -f "$RULES_FILE" ]; then
    echo "❌ ERROR: $RULES_FILE not found in current directory"
    exit 1
fi

echo "✓ Rules file found: $RULES_FILE"
echo ""

# Check if Firebase is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ ERROR: Firebase CLI not found"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✓ Firebase CLI found: $(firebase --version)"
echo ""

# Check Firebase authentication
echo "Checking Firebase authentication..."
if firebase auth:list &> /dev/null; then
    echo "✓ Firebase authentication active"
else
    echo "⚠️  Not authenticated with Firebase"
    echo ""
    echo "Please log in to Firebase:"
    echo ""
    firebase login --no-localhost
    echo ""
fi

# Verify project configuration
echo "Verifying Firebase project configuration..."
if ! npx firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
    echo "⚠️  Warning: Project $PROJECT_ID not found in your Firebase projects"
    echo "Make sure you have access to this project"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "DEPLOYMENT SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 What will be deployed:"
echo "  • Firestore Security Rules from: $RULES_FILE"
echo "  • Project: $PROJECT_ID"
echo ""
echo "🛡️  Rules include:"
echo "  ✓ Role-based access control (Admin/CEO/Manager)"
echo "  ✓ Blocks all unauthenticated access"
echo "  ✓ Prevents privilege escalation"
echo "  ✓ Protects sensitive financial data (/expenses)"
echo "  ✓ Immutable audit log (/transactions)"
echo ""
echo "⚠️  IMPORTANT:"
echo "  • Rules take effect IMMEDIATELY after deployment"
echo "  • All future Firestore access uses these rules"
echo "  • No downtime or data loss"
echo "  • Users will get permission errors if not following rules"
echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "DEPLOYING RULES..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Deploy only Firestore rules
npx firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ✅ DEPLOYMENT SUCCESSFUL                                  ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next steps:"
    echo "  1. Test the rules in your app"
    echo "  2. Run the security audit: node firestore-security-audit.js"
    echo "  3. Verify all roles can access their assigned data"
    echo ""
    echo "View rules in Firebase Console:"
    echo "  https://console.firebase.google.com/u/0/project/$PROJECT_ID/firestore/rules"
    echo ""
else
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ❌ DEPLOYMENT FAILED                                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Check the error messages above and try again"
    exit 1
fi

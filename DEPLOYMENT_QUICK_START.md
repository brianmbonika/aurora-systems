# Firestore Rules Deployment - Quick Start

## Prerequisites
- ✅ Firebase CLI installed (`firebase-tools` v15.30.0+)
- ✅ `firestore.rules` file in project root
- ✅ `firebase.json` configured
- ⏳ Firebase authentication needed (next step)

---

## Step 1: Authenticate with Firebase

You need to authenticate with the Google account that owns the `aurora-system-b3203` Firebase project.

### Option A: Easy Login (Recommended)
```bash
cd /Users/air/Desktop/"aurora systems"
firebase login
```

This opens your browser automatically. Sign in with your Google account and approve Firebase CLI access.

### Option B: Manual Authentication (if Option A doesn't work)
```bash
firebase login --no-localhost
```

Then:
1. Visit the URL shown
2. Sign in with your Google account
3. Copy the authorization code
4. Run: `firebase login <AUTHORIZATION_CODE>`

---

## Step 2: Deploy Rules

### Automatic (Easiest)
```bash
cd /Users/air/Desktop/"aurora systems"
./DEPLOY_RULES.sh
```

This script will:
- Verify all files are in place
- Check Firebase authentication
- Show you what will be deployed
- Ask for confirmation
- Deploy to Firebase Console
- Provide next steps

### Manual
```bash
cd /Users/air/Desktop/"aurora systems"
npx firebase deploy --only firestore:rules
```

---

## Step 3: Verify Deployment

### In Firebase Console (Easiest)
1. Go to: https://console.firebase.google.com
2. Select project: `aurora-system-b3203`
3. Click **Firestore Database** → **Rules**
4. You should see the new rules (role-based access control)

### Via CLI
```bash
npx firebase firestore:indexes
```

### Via App Testing
Open the Aurora app and verify:
- ✓ Admin can access all dashboards
- ✓ CEO can access financial dashboards
- ✓ Manager cannot access `/expenses`
- ✓ Unauthenticated users get blocked

---

## Step 4: Run Security Audit

After deployment, verify the rules are actually enforced:

```bash
# Terminal 1: Start Firestore Emulator (optional, for local testing)
firebase emulators:start --only firestore

# Terminal 2: Run the audit
node firestore-security-audit.js
```

Expected output:
```
✓ PASS: Read /users without auth (correctly blocked)
✓ PASS: Manager blocked from /config/target (correctly blocked)
✓ PASS: Manager blocked from /expenses (correctly blocked)
...
All security tests passed
```

---

## What Gets Deployed

The `firestore.rules` file includes:

### Access Control
- ✅ **Admin**: Full read/write to all collections
- ✅ **CEO**: Full access + config write
- ✅ **Manager**: Limited access (no `/expenses`, no `/config`)
- ✅ **Authenticated Users**: Read products, write own customer/inventory
- ❌ **Unauthenticated**: Blocked from everything

### Collection-Level Rules
```
/users           → Admin/CEO only
/config/*        → All read, CEO/Admin write
/products/*      → All read, Admin/CEO write
/transactions/*  → All read, immutable (no writes)
/expenses/*      → Admin/CEO only
/customers/*     → All read, creator/admin write
/inventory/*     → All read, creator/admin write
```

---

## Rollback Instructions

If something goes wrong, you can quickly revert:

```bash
# Get previous rules version (if you saved it)
# Or deploy a more permissive set temporarily
npx firebase firestore:indexes
```

For emergency access, contact Firebase support or deploy a temporary admin-only rule.

---

## Troubleshooting

### "Command not found: firebase"
```bash
npm install -g firebase-tools
```

### "Not authenticated"
```bash
firebase login
```

### "Permission denied"
Make sure your Google account has Editor or Owner role on the Firebase project.

### "Rules have syntax error"
Check the error message and compare with the template in `firestore.rules`.

### "Deployment hangs"
Press `Ctrl+C` and try again with `firebase deploy --debug`

---

## Next Steps After Deployment

1. **Push to git** - Commit the rules file and firebase.json
   ```bash
   git add firestore.rules firebase.json DEPLOY_RULES.sh
   git commit -m "Security: Deploy Firestore security rules

   - Add role-based access control
   - Protect sensitive financial data
   - Prevent unauthenticated access
   - Enforce privilege boundaries"
   ```

2. **Test with users** - Have different role users test the app

3. **Monitor in Firebase Console** - Check for permission errors

4. **Review periodically** - Schedule security reviews every quarter

---

## Support

If you need help:
1. Check Firebase Console for deployment status
2. Review error logs: `firebase deploy --debug`
3. Test locally with emulator: `firebase emulators:start --only firestore`
4. Read the audit report: `FIRESTORE_SECURITY_AUDIT_REPORT.md`


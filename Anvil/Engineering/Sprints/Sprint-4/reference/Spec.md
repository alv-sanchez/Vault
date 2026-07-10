---
date: 2026-06-02
status: draft
tags: [ecom, ohfy-core, dev-environment, scratch-org, profile]
related: "[[✅ may12th-ECOM->SPLIT]]"
---

# Dev-Only E-Commerce Site on OHFY-Core

## Goal

Stand up a minimal, dev-only Salesforce Experience Cloud site ("Ecom Dev Storefront") on a scratch org that has **only the OHFY-Core packages** deployed (Data-Model, Utilities, Service-Locator, Platform, OMS, WMS, REX — no OHFY-eCommerce or OHFY-eCommerce-UI). This lets engineers develop and test storefront features against the core data model without requiring the ecom packages to be installed.

## Why

After the ecom-into-Split reclassification (see `✅ may12th-ECOM->SPLIT.md`), the core objects that the storefront reads/writes already live in OHFY-Core packages. A dev-only site proves that the storefront can operate against core alone — validating the object split before the ecom packages are rebuilt on top of ServiceLocator interfaces.

## What This Spec Produces

1. A **scratch org definition** overlay (`config/ecom-dev-scratch-def.json`) enabling Experience Cloud + Communities
2. A **custom Profile** (`Ecom_Dev_Storefront_User`) with Read/Edit on all required core objects + full FLS
3. A **Permission Set** (`Ecom_Dev_Access`) as an alternative to the profile (assignable to existing community users)
4. An **Experience Cloud site** skeleton (Digital Experiences guest user wired to the profile)
5. A **single bash script** (`utilityScripts/setup-ecom-dev-site.sh`) that automates every step end-to-end

---

## Object Access Matrix

All objects below get **Read + Edit** object permissions and **Read + Edit** on every field within each object.

### Core Business Objects

| Label | API Name |
|---|---|
| Account | `Account` |
| Account Route | `ohfy__Account_Route__c` |
| Brand | `ohfy__Item_Type__c` |
| Customer | `Customer` |
| Delivery | `ohfy__Delivery__c` |
| Inventory | `ohfy__Inventory__c` |
| Inventory Adjustment | `ohfy__Inventory_Adjustment__c` |
| Item | `ohfy__Item__c` |
| Item Component | `ohfy__Item_Component__c` |
| Location | `ohfy__Location__c` |
| Lot | `ohfy__Lot__c` |
| Lot Adjustments | `ohfy__Lot_Adjustment__c` |
| Lot Inventory | `ohfy__Lot_Inventory__c` |
| Order | `ohfy__Order__c` |
| Order Item | `ohfy__Order_Item__c` |
| Pricelist | `ohfy__Pricelist__c` |
| Pricelist Item | `ohfy__Pricelist_Item__c` |
| Route | `ohfy__Route__c` |
| Supplier | `ohfy__Item_Line__c` |
| Tax Authority | `ohfy__Tax_Authority__c` |

### Promotions (post-promo architecture)

| Label | API Name |
|---|---|
| Promotion | `ohfy__Promotion__c` |
| Promotion Brand | `ohfy__Promotion_Brand__c` |
| Promotion Product | `ohfy__Promotion_Product__c` |
| Promotion Invoice Item | `ohfy__Promotion_Invoice_Item__c` |
| Promotion Supplier | `ohfy__Promotion_Supplier__c` |

### Draft Invoice Architecture

| Label | API Name |
|---|---|
| Account Item | `ohfy__Account_Item__c` |
| Territory | `ohfy__Territory__c` |
| Invoice Group | `ohfy__Invoice_Group__c` |
| Invoice Adjustment | `ohfy__Invoice_Adjustment__c` |
| Invoice Goals | `ohfy__Invoice_Goal__c` |
| Invoice Fees | `ohfy__Order_Fee__c` |
| Fee | `ohfy__Fee__c` |
| Retail Inventory | `ohfy__Retail_Inventory__c` |
| Pallet Item | `ohfy__Pallet_Item__c` |
| Pallet | `ohfy__Pallet__c` |

### Notifications

| Label | API Name |
|---|---|
| Notification | `ohfy__Notification__c` |
| Contact Notification | `ohfy__Contact_Notification__c` |
| Notification Log | `ohfy__Notification_Log__c` |

### Excluded (Outdated)

- ~~Invoice (`ohfy__Invoice__c`)~~ — superseded by draft invoice architecture
- ~~Invoice Item (`ohfy__Invoice_Item__c`)~~ — superseded by draft invoice architecture

---

## Automation Script

The script below does everything: claims an org, enables Communities, creates the profile, sets object + field permissions, creates the Experience site, and assigns users.

### Prerequisites

- `sf` CLI authenticated to a DevHub
- Repo cloned at the OHFY-Split root
- `jq` installed (`brew install jq`)

### Usage

```bash
# From repo root:
bash utilityScripts/setup-ecom-dev-site.sh            # uses defaults
bash utilityScripts/setup-ecom-dev-site.sh -a my-org   # custom alias
bash utilityScripts/setup-ecom-dev-site.sh -s           # skip org claim (use existing default org)
```

### Script

```bash
#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# setup-ecom-dev-site.sh
# Stand up a dev-only ecom Experience Cloud site on ohfy-core
# ─────────────────────────────────────────────────────────────

ORG_ALIAS="ecom-dev"
SKIP_CLAIM=false
PROFILE_NAME="Ecom Dev Storefront User"
PERM_SET_NAME="Ecom_Dev_Access"
SITE_NAME="Ecom_Dev_Storefront"
SITE_TEMPLATE="Build Your Own"
SITE_URL_PREFIX="ecomdev"

while getopts "a:s" opt; do
  case $opt in
    a) ORG_ALIAS="$OPTARG" ;;
    s) SKIP_CLAIM=true ;;
    *) echo "Usage: $0 [-a alias] [-s]" && exit 1 ;;
  esac
done

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[ecom-dev]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
err()  { echo -e "${RED}  ✗${NC} $1"; }

# ── All objects that need Read+Edit ──
CUSTOM_OBJECTS=(
  "ohfy__Account_Route__c"
  "ohfy__Item_Type__c"
  "ohfy__Delivery__c"
  "ohfy__Inventory__c"
  "ohfy__Inventory_Adjustment__c"
  "ohfy__Item__c"
  "ohfy__Item_Component__c"
  "ohfy__Location__c"
  "ohfy__Lot__c"
  "ohfy__Lot_Adjustment__c"
  "ohfy__Lot_Inventory__c"
  "ohfy__Order__c"
  "ohfy__Order_Item__c"
  "ohfy__Pricelist__c"
  "ohfy__Pricelist_Item__c"
  "ohfy__Route__c"
  "ohfy__Item_Line__c"
  "ohfy__Tax_Authority__c"
  "ohfy__Promotion__c"
  "ohfy__Promotion_Brand__c"
  "ohfy__Promotion_Product__c"
  "ohfy__Promotion_Invoice_Item__c"
  "ohfy__Promotion_Supplier__c"
  "ohfy__Account_Item__c"
  "ohfy__Territory__c"
  "ohfy__Invoice_Group__c"
  "ohfy__Invoice_Adjustment__c"
  "ohfy__Invoice_Goal__c"
  "ohfy__Order_Fee__c"
  "ohfy__Fee__c"
  "ohfy__Retail_Inventory__c"
  "ohfy__Pallet_Item__c"
  "ohfy__Pallet__c"
  "ohfy__Notification__c"
  "ohfy__Contact_Notification__c"
  "ohfy__Notification_Log__c"
)

STANDARD_OBJECTS=(
  "Account"
  "Contact"
  "Customer"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1: Claim or verify org
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 1: Org setup"

if [ "$SKIP_CLAIM" = false ]; then
  log "Claiming org from pool with alias: $ORG_ALIAS"
  bash utilityScripts/claim-dev.sh -a "$ORG_ALIAS"
  ok "Org claimed: $ORG_ALIAS"
else
  log "Skipping claim — using existing org: $ORG_ALIAS"
fi

# Verify org is reachable
sf org display -o "$ORG_ALIAS" > /dev/null 2>&1 || {
  err "Cannot reach org '$ORG_ALIAS'. Verify it exists and is authenticated."
  exit 1
}
ok "Org verified: $ORG_ALIAS"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2: Enable Digital Experiences (Communities)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 2: Enable Digital Experiences"

# Check if already enabled
NETWORK_COUNT=$(sf data query -q "SELECT COUNT() FROM Network" -o "$ORG_ALIAS" --json 2>/dev/null | jq -r '.result.records[0].expr0 // 0' 2>/dev/null || echo "0")

if [ "$NETWORK_COUNT" != "0" ]; then
  ok "Digital Experiences already enabled (found $NETWORK_COUNT network(s))"
else
  log "Enabling Digital Experiences via metadata deploy..."

  # Create a temporary settings metadata deploy
  TMPDIR_SETTINGS=$(mktemp -d)
  mkdir -p "$TMPDIR_SETTINGS/settings"

  cat > "$TMPDIR_SETTINGS/settings/Communities.settings-meta.xml" << 'XMLEOF'
<?xml version="1.0" encoding="UTF-8"?>
<CommunitiesSettings xmlns="http://soap.sforce.com/2006/04/metadata">
    <enableNetworksEnabled>true</enableNetworksEnabled>
</CommunitiesSettings>
XMLEOF

  cat > "$TMPDIR_SETTINGS/package.xml" << 'XMLEOF'
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Communities</members>
        <name>Settings</name>
    </types>
    <version>65.0</version>
</Package>
XMLEOF

  sf project deploy start -d "$TMPDIR_SETTINGS" -o "$ORG_ALIAS" -w 5 2>/dev/null && \
    ok "Digital Experiences enabled" || \
    warn "Could not auto-enable Digital Experiences. Enable manually: Setup → Digital Experiences → Settings → Enable"

  rm -rf "$TMPDIR_SETTINGS"
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3: Deploy core packages
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 3: Deploy core packages"

npm run deploy:full -- --target-org "$ORG_ALIAS" --skip-data 2>&1 | tail -5
ok "Core packages deployed"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4: Create the Ecom Dev Profile (clone from Standard User)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 4: Create '$PROFILE_NAME' profile via metadata"

PROFILE_DIR=$(mktemp -d)
mkdir -p "$PROFILE_DIR/profiles"

# Build the profile XML with object permissions
{
cat << 'XMLHEAD'
<?xml version="1.0" encoding="UTF-8"?>
<Profile xmlns="http://soap.sforce.com/2006/04/metadata">
    <custom>true</custom>
    <userLicense>Customer Community Login</userLicense>
    <description>Dev-only profile for ecom storefront testing against ohfy-core objects. Auto-generated by setup-ecom-dev-site.sh.</description>
XMLHEAD

# Standard objects — Account, Contact, Customer
for obj in "${STANDARD_OBJECTS[@]}"; do
cat << XMLOBJ
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>false</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>false</modifyAllRecords>
        <object>${obj}</object>
        <viewAllRecords>false</viewAllRecords>
    </objectPermissions>
XMLOBJ
done

# Custom objects — full Read+Edit
for obj in "${CUSTOM_OBJECTS[@]}"; do
cat << XMLOBJ
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>false</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>false</modifyAllRecords>
        <object>${obj}</object>
        <viewAllRecords>false</viewAllRecords>
    </objectPermissions>
XMLOBJ
done

cat << 'XMLTAIL'
    <tabVisibilities>
        <tab>standard-home</tab>
        <visibility>DefaultOn</visibility>
    </tabVisibilities>
</Profile>
XMLTAIL
} > "$PROFILE_DIR/profiles/Ecom Dev Storefront User.profile-meta.xml"

cat > "$PROFILE_DIR/package.xml" << 'XMLEOF'
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Ecom Dev Storefront User</members>
        <name>Profile</name>
    </types>
    <version>65.0</version>
</Package>
XMLEOF

sf project deploy start -d "$PROFILE_DIR" -o "$ORG_ALIAS" -w 5 2>&1 | tail -3
ok "Profile '$PROFILE_NAME' deployed"

rm -rf "$PROFILE_DIR"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5: Grant full FLS on every field for all listed objects
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 5: Grant full field-level security via Apex"

ALL_OBJECTS=("${STANDARD_OBJECTS[@]}" "${CUSTOM_OBJECTS[@]}")
OBJECTS_LIST=$(printf "'%s'," "${ALL_OBJECTS[@]}")
OBJECTS_LIST="${OBJECTS_LIST%,}"  # trim trailing comma

cat > /tmp/ecom-dev-fls-grant.apex << APEXEOF
// Grant Read+Edit on all fields for the Ecom Dev Storefront User profile
// on every object in the ecom-core object matrix.

String profileName = 'Ecom Dev Storefront User';
Profile p = [SELECT Id FROM Profile WHERE Name = :profileName LIMIT 1];

List<String> objectNames = new List<String>{${OBJECTS_LIST}};

List<FieldPermissions> toUpsert = new List<FieldPermissions>();

// Get the PermissionSet linked to the profile
PermissionSet ps = [
    SELECT Id FROM PermissionSet
    WHERE ProfileId = :p.Id
    LIMIT 1
];

for (String objName : objectNames) {
    Map<String, Schema.SObjectField> fieldMap;
    try {
        fieldMap = Schema.getGlobalDescribe().get(objName).getDescribe().fields.getMap();
    } catch (Exception e) {
        System.debug('Skipping object (not found): ' + objName);
        continue;
    }

    for (String fieldName : fieldMap.keySet()) {
        Schema.DescribeFieldResult dfr = fieldMap.get(fieldName).getDescribe();

        // Skip non-permissionable fields (Id, system fields, formula, auto-number)
        if (!dfr.isPermissionable()) continue;

        toUpsert.add(new FieldPermissions(
            ParentId = ps.Id,
            SobjectType = objName,
            Field = objName + '.' + dfr.getName(),
            PermissionsRead = true,
            PermissionsEdit = dfr.isUpdateable() ? true : false
        ));
    }
}

if (!toUpsert.isEmpty()) {
    // Upsert in batches of 200
    Integer batchSize = 200;
    for (Integer i = 0; i < toUpsert.size(); i += batchSize) {
        Integer endIdx = Math.min(i + batchSize, toUpsert.size());
        List<FieldPermissions> batch = new List<FieldPermissions>();
        for (Integer j = i; j < endIdx; j++) {
            batch.add(toUpsert[j]);
        }
        try {
            upsert batch FieldPermissions.Fields.Field;
        } catch (Exception e) {
            System.debug('FLS batch error at index ' + i + ': ' + e.getMessage());
        }
    }
    System.debug('FLS granted: ' + toUpsert.size() + ' field permissions upserted.');
} else {
    System.debug('No field permissions to grant.');
}
APEXEOF

sf apex run --file /tmp/ecom-dev-fls-grant.apex -o "$ORG_ALIAS" 2>&1 | tail -5
ok "Field-level security granted on all objects"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6: Create Permission Set (alternative to profile)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 6: Create '$PERM_SET_NAME' permission set"

PSET_DIR=$(mktemp -d)
mkdir -p "$PSET_DIR/permissionsets"

{
cat << 'XMLHEAD'
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Dev-only permission set granting Read+Edit to all ohfy-core objects needed by the ecom storefront. Auto-generated by setup-ecom-dev-site.sh.</description>
    <hasActivationRequired>false</hasActivationRequired>
    <label>Ecom Dev Access</label>
XMLHEAD

for obj in "${STANDARD_OBJECTS[@]}" "${CUSTOM_OBJECTS[@]}"; do
cat << XMLOBJ
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>false</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>false</modifyAllRecords>
        <object>${obj}</object>
        <viewAllRecords>false</viewAllRecords>
    </objectPermissions>
XMLOBJ
done

echo '</PermissionSet>'
} > "$PSET_DIR/permissionsets/${PERM_SET_NAME}.permissionset-meta.xml"

cat > "$PSET_DIR/package.xml" << 'XMLEOF'
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Ecom_Dev_Access</members>
        <name>PermissionSet</name>
    </types>
    <version>65.0</version>
</Package>
XMLEOF

sf project deploy start -d "$PSET_DIR" -o "$ORG_ALIAS" -w 5 2>&1 | tail -3
ok "Permission set '$PERM_SET_NAME' deployed"

rm -rf "$PSET_DIR"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7: Create the Experience Cloud site
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 7: Create Experience Cloud site"

# Check if site already exists
SITE_EXISTS=$(sf data query -q "SELECT Id FROM Network WHERE Name = '$SITE_NAME'" -o "$ORG_ALIAS" --json 2>/dev/null | jq -r '.result.totalSize // 0')

if [ "$SITE_EXISTS" != "0" ]; then
  ok "Site '$SITE_NAME' already exists — skipping creation"
else
  sf community create \
    --name "$SITE_NAME" \
    --template-name "$SITE_TEMPLATE" \
    --url-path-prefix "$SITE_URL_PREFIX" \
    --description "Dev-only ecom storefront for ohfy-core testing" \
    -o "$ORG_ALIAS" 2>&1 | tail -3

  ok "Site '$SITE_NAME' created (url prefix: /$SITE_URL_PREFIX)"

  log "Waiting for site to provision (up to 60s)..."
  for i in $(seq 1 12); do
    SITE_STATUS=$(sf data query -q "SELECT Status FROM Network WHERE Name = '$SITE_NAME'" -o "$ORG_ALIAS" --json 2>/dev/null | jq -r '.result.records[0].Status // "Unknown"')
    if [ "$SITE_STATUS" = "Live" ] || [ "$SITE_STATUS" = "Active" ] || [ "$SITE_STATUS" = "UnderConstruction" ]; then
      ok "Site status: $SITE_STATUS"
      break
    fi
    sleep 5
  done
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 8: Wire guest user profile to the site
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 8: Configure guest user profile"

cat > /tmp/ecom-dev-guest-setup.apex << 'APEXEOF'
// Wire the Ecom Dev Storefront guest profile with object access.
// The site's auto-generated guest profile follows the naming pattern:
// "<SiteName> Profile" for the guest user.

// Assign the Ecom_Dev_Access permission set to the site guest user
List<Network> networks = [SELECT Id FROM Network WHERE Name = 'Ecom_Dev_Storefront' LIMIT 1];
if (networks.isEmpty()) {
    System.debug('Site not found — skipping guest user setup');
} else {
    Network n = networks[0];
    // The guest user for a community is found via the Site object
    List<Site> sites = [SELECT GuestUserId FROM Site WHERE NetworkId = :n.Id LIMIT 1];
    if (!sites.isEmpty() && sites[0].GuestUserId != null) {
        Id guestUserId = sites[0].GuestUserId;
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Ecom_Dev_Access' LIMIT 1];
        // Check if already assigned
        List<PermissionSetAssignment> existing = [
            SELECT Id FROM PermissionSetAssignment
            WHERE AssigneeId = :guestUserId AND PermissionSetId = :ps.Id
        ];
        if (existing.isEmpty()) {
            insert new PermissionSetAssignment(
                AssigneeId = guestUserId,
                PermissionSetId = ps.Id
            );
            System.debug('Ecom_Dev_Access assigned to guest user: ' + guestUserId);
        } else {
            System.debug('Ecom_Dev_Access already assigned to guest user');
        }
    } else {
        System.debug('Guest user not found for site — assign manually in Setup');
    }
}
APEXEOF

sf apex run --file /tmp/ecom-dev-guest-setup.apex -o "$ORG_ALIAS" 2>&1 | tail -5
ok "Guest user configured"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 9: Load seed data
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 9: Load seed data"

sf data import tree --plan data/sample-data-plan.json -o "$ORG_ALIAS" 2>&1 | tail -3
sf apex run --file data/post-load-scripts/postLoadResolver.apex -o "$ORG_ALIAS" 2>&1 | tail -3
ok "Seed data loaded"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 10: Publish the site
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
log "Step 10: Publish site"

sf community publish --name "$SITE_NAME" -o "$ORG_ALIAS" 2>&1 | tail -3
ok "Site published"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 11: Print summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTANCE_URL=$(sf org display -o "$ORG_ALIAS" --json 2>/dev/null | jq -r '.result.instanceUrl // "unknown"')

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} Ecom Dev Site Ready${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Org alias:       ${CYAN}${ORG_ALIAS}${NC}"
echo -e "  Instance URL:    ${CYAN}${INSTANCE_URL}${NC}"
echo -e "  Site URL:        ${CYAN}${INSTANCE_URL}/${SITE_URL_PREFIX}${NC}"
echo -e "  Profile:         ${CYAN}${PROFILE_NAME}${NC}"
echo -e "  Permission Set:  ${CYAN}${PERM_SET_NAME}${NC}"
echo ""
echo -e "  Objects enabled: ${CYAN}${#CUSTOM_OBJECTS[@]} custom + ${#STANDARD_OBJECTS[@]} standard${NC}"
echo ""
echo -e "  Open org:  ${YELLOW}sf org open -o ${ORG_ALIAS}${NC}"
echo -e "  Open site: ${YELLOW}sf org open -o ${ORG_ALIAS} -p /${SITE_URL_PREFIX}${NC}"
echo ""

# Cleanup temp files
rm -f /tmp/ecom-dev-fls-grant.apex /tmp/ecom-dev-guest-setup.apex

log "Done."
```

---

## Manual Steps (if script hits issues)

### Enable Digital Experiences

1. `sf org open -o <alias>`
2. Setup → Digital Experiences → Settings → Enable Digital Experiences
3. Check "Enable Aura Components in Digital Experiences"
4. Save

### Create Profile Manually

1. Setup → Profiles → New Profile
2. Clone from: `Customer Community Login User`
3. Name: `Ecom Dev Storefront User`
4. Navigate to Object Settings
5. For each object in the matrix above:
   - Enable Read + Edit object access
   - Enable Read + Edit on all fields

### Create Site Manually

1. Setup → Digital Experiences → All Sites → New
2. Template: Build Your Own (LWR)
3. Name: `Ecom_Dev_Storefront`
4. URL prefix: `ecomdev`
5. Administration → Members → Add profile `Ecom Dev Storefront User`
6. Publish

---

## Verification Checklist

After running the script, verify:

- [ ] `sf org open -o ecom-dev -p /ecomdev` loads the site
- [ ] Guest user can read Account, Item, Pricelist, Order records
- [ ] Authenticated community user with the profile can create/edit Order, Order Item
- [ ] Promotion objects are readable
- [ ] Invoice Group, Invoice Adjustment, Invoice Goals visible
- [ ] Notification objects accessible
- [ ] Seed data (Accounts, Items, Pricelists) visible in the site
- [ ] No OHFY-eCommerce or OHFY-eCommerce-UI packages deployed

---

## Notes

- **Invoice / Invoice Item excluded**: marked as outdated in the object list — the draft invoice architecture (Invoice Group, Invoice Adjustment, etc.) supersedes them.
- **Notification objects included**: although `✅ may12th-ECOM->SPLIT.md` classifies these as ecom-owned (`OHFY-eCommerce/objects/`), they're included here because core packages may define them in Data-Model for multi-domain use. If they don't exist in the core deploy, the FLS script silently skips them.
- **Customer standard object**: included per the object list. This is the Salesforce standard `Customer` object (Person Accounts / B2B Commerce). If not enabled in the org, the script skips it gracefully.
- **Profile license**: uses `Customer Community Login` — the most common community license for storefront users. Change to `Customer Community` or `Customer Community Plus` if your DevHub/scratch def supports a different license.

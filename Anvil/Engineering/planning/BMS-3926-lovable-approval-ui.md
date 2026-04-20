# Gulf Registration Approval Queue — Lovable Spec

> **Context**: This is a prompt/spec for Lovable to build an internal-facing approval dashboard for territory sales reps to review, approve, or reject retailer registration applications. This is the "Option B" custom approval UI for BMS-3926. The output will be used as a visual reference — the final implementation will be either a Salesforce LWC or an internal tool.

---

## About This Project

When a Gulf retailer registers through the self-service portal, their application goes into a "Pending Approval" state. A territory sales rep needs to review the application and approve or reject it before the retailer gets portal access.

This UI is the **sales rep's tool** — not the retailer's. The sales rep sees a queue of pending registrations, drills into one, reviews the details, and takes action. Think of it like an internal admin panel for processing applications.

**Users of this UI**: Territory sales reps, regional managers, onboarding team members. These are internal Gulf employees, not retailers.

**Terminology**:
- **Account-Internal** = the business record that already exists in the system (the retailer's store/location)
- **Account-Contact** = the contact record the retailer created during registration (the person who wants portal access)

---

## Design System

Use a **clean admin/dashboard style** — this is an internal tool, not a consumer-facing site:

- **Primary color**: `#0A6FFD` (blue — actions, links, active states)
- **Success/Approve**: `#16a34a` (green)
- **Danger/Reject**: `#dc2626` (red)
- **Warning/Pending**: `#f59e0b` (amber)
- **Background**: `#f9fafb` (very light gray)
- **Cards/Panels**: White, `shadow-sm`, `rounded-lg`
- **Tables**: Clean with `divide-y divide-gray-200`, hover rows `hover:bg-gray-50`
- **Typography**: System font, `text-sm` as default body size (admin-dense), `font-medium` for labels
- **Badges**: Rounded pills (`rounded-full px-2.5 py-0.5 text-xs font-medium`)
  - Pending: `bg-amber-100 text-amber-800`
  - Approved: `bg-green-100 text-green-800`
  - Rejected: `bg-red-100 text-red-800`

---

## Page Layout

Two-panel layout on desktop, stacked on mobile:

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Registration Approvals"          [user avatar] │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   Queue List         │   Detail Panel                   │
│   (left sidebar)     │   (main content)                 │
│                      │                                  │
│   - Filters          │   - Application summary          │
│   - Registration     │   - Business details             │
│   - cards            │   - Contact details              │
│                      │   - Action buttons               │
│                      │                                  │
├──────────────────────┴──────────────────────────────���───┤
│  Footer: stats bar                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Header

Full-width bar at the top:

- Left: **"Registration Approvals"** (`text-xl font-bold`)
- Center/right: Summary stats as inline badges:
  - "12 Pending" (amber badge)
  - "47 Approved" (green badge) 
  - "3 Rejected" (red badge)
- Far right: User avatar circle + name ("Joey Martinez") + role ("Territory Rep — FL South")

---

## Left Panel — Queue List

Width: `w-80` on desktop (320px). Full-width on mobile (detail panel stacks below).

### Filters Bar (top of left panel)

- **Search input**: `rounded-lg` text input with search icon, placeholder "Search by business or contact name..."
- **Status filter**: Segmented control / tab bar with three options:
  - **Pending** (default, selected) — shows count badge
  - **Approved**
  - **Rejected**
  - **All**
- **Sort dropdown**: "Newest first" (default), "Oldest first", "Business name A-Z"

### Registration Cards

Scrollable list of cards, one per registration. Each card (`bg-white rounded-lg p-4 border border-gray-200 cursor-pointer`):

```
┌──────────────────────────────────��
│ Gulf Express Mart            🟡  │  <- status dot (amber=pending)
│ Miami, FL 33101                  │
│                                  │
│ Maria Santos                     │  <- Account-Contact name
│ maria@gulfexpress.com            │
│                                  │
│ Submitted: Apr 18, 2026          │  <- gray, text-xs
│ ⏱ 2 days ago                     │  <- time since submission
└──────────────────────────────────┘
```

- **Selected card**: `border-blue-500 bg-blue-50 shadow-md` — the detail panel shows this registration
- **Hover**: `border-gray-300 shadow-sm`
- **Status dot**: Top right corner — amber (pending), green (approved), red (rejected)
- **Overdue indicator**: If pending > 2 business days, show a small red `!` badge next to the time: "⏱ 4 days ago !" — signals the SLA is breached

### Empty States

- **No pending**: Illustration (clipboard with checkmark) + "All caught up! No pending registrations."
- **No results from search**: "No registrations match your search."

---

## Right Panel — Detail View

Takes remaining width on desktop. Shows the selected registration's full details.

### When nothing is selected

Centered placeholder:
- Clipboard icon (gray, large)
- "Select a registration to review"
- `text-gray-400`

### When a registration is selected

#### Top Section — Status + Actions Bar

Horizontal bar at the top of the detail panel:

```
┌─────────────────────────────────────────────────────────┐
│ Gulf Express Mart          [Pending ●]     [Approve] [Reject] │
└─────────────────────────────────────────────────────────┘
```

- Business name (`text-lg font-bold`)
- Status badge (pill style)
- **Approve button**: Green background (`bg-green-600 text-white rounded-lg px-4 py-2 font-medium`), checkmark icon
- **Reject button**: Red outline (`border-2 border-red-600 text-red-600 rounded-lg px-4 py-2 font-medium`), X icon
- Buttons only show when status is "Pending"

#### Section 1 — Business Information (Account-Internal)

Card with header "Business Information" and a subtle divider:

| Label | Value |
|---|---|
| Business Name | Gulf Express Mart |
| City, State, ZIP | Miami, FL 33101 |
| Account Owner | Joey Martinez |
| License Number | LIC-2847 (or "—" if none) |
| Account Status | Active *(this is the Account-Internal's existing status, not the registration status)* |

Style: Two-column grid of label-value pairs. Labels in `text-xs font-medium text-gray-500 uppercase tracking-wider`. Values in `text-sm text-gray-900`.

#### Section 2 — Applicant Details (Account-Contact)

Card with header "Applicant Details":

| Label | Value |
|---|---|
| Full Name | Maria Santos |
| Email | maria@gulfexpress.com |
| Phone | (305) 555-1234 |
| Job Title | Store Manager (or "—") |
| SMS Opt-In | Yes / No (green check or gray dash) |

#### Section 3 — Registration Metadata

Card with header "Registration Info":

| Label | Value |
|---|---|
| Submitted | April 18, 2026 at 2:34 PM |
| Time Pending | 2 days |
| Territory | FL South |
| Source | E-Commerce Portal |

If pending > 2 business days, show "Time Pending" in red with a warning icon: "4 days (exceeds 2-day SLA)"

#### Section 4 — Existing Contacts (Duplicate Check)

Card with header "Other Contacts at This Business":

If the Account-Internal already has other Contacts, show them in a small table:

| Name | Email | Role | Portal Access |
|---|---|---|---|
| Roberto Santos | roberto@gulfexpress.com | Owner | Active |
| Ana Garcia | ana@gulfexpress.com | Buyer | Active |

If no other contacts: "No other contacts on this account."

This helps the sales rep spot potential issues — e.g., the same person registering twice, or a third contact from a small store that should only have two.

Style: Compact table, `text-xs`, gray header row.

---

## Approve Flow

When the sales rep clicks **Approve**:

### Step 1 — Confirmation Modal

A centered modal (`max-w-md`) overlays the page with a backdrop blur:

```
┌────────────────────────────────────────┐
│        ✅ Approve Registration          │
│                                        │
│  You're approving portal access for:   │
│                                        │
│  Maria Santos                          │
│  Gulf Express Mart — Miami, FL         │
│                                        │
│  This will:                            │
│  • Create a portal login for Maria     │
│  • Send a welcome email with password  │
│    setup link                          │
│  • Grant access to place orders        │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Note to applicant (optional)     │  │
│  │                                  │  │
│  │ [text area]                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│        [Cancel]  [Confirm Approval]    │
│                                        │
└────────────────────────────────────────┘
```

- Green checkmark icon at the top
- Summary of who's being approved
- Bullet list of what happens (so the rep knows the consequences)
- Optional text area for a note (sent in the welcome email or logged)
- **Cancel**: Gray outline button
- **Confirm Approval**: Green solid button

### Step 2 — Success State

After confirming, the modal briefly shows:
- Green checkmark animation
- "Approved! Maria Santos will receive a welcome email shortly."
- Auto-closes after 2 seconds, card moves to "Approved" in the queue

---

## Reject Flow

When the sales rep clicks **Reject**:

### Step 1 — Rejection Modal

```
┌────────────────────────────────────────┐
│        ❌ Reject Registration           │
│                                        │
│  You're rejecting the registration     │
│  from:                                 │
│                                        │
│  Maria Santos                          │
│  Gulf Express Mart — Miami, FL         │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Reason for rejection *           │  │
│  │                                  │  │
│  │ [dropdown]                       │  │
│  │ • Duplicate contact              │  │
│  │ • Not authorized for this account│  │
│  │ • Account not eligible           │  │
│  │ • Out of territory               │  │
│  │ • Other                          │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Additional details (optional)    │  │
│  │                                  │  │
│  │ [text area]                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│        [Cancel]  [Confirm Rejection]   │
│                                        │
└────────────────────────────────────────┘
```

- Red X icon at the top
- **Required**: Rejection reason dropdown (forces the rep to categorize)
- **Optional**: Free-text details
- **Cancel**: Gray outline
- **Confirm Rejection**: Red solid button — disabled until a reason is selected

### Step 2 — Success State

- "Rejected. Maria Santos will be notified."
- Auto-closes, card moves to "Rejected" in the queue

---

## Already-Actioned States

When viewing an approved or rejected registration in the detail panel:

- The Approve/Reject buttons are **replaced** by a status banner:
  - Approved: Green banner — "Approved by Joey Martinez on Apr 20, 2026" + note if provided
  - Rejected: Red banner — "Rejected by Joey Martinez on Apr 20, 2026 — Reason: Duplicate contact" + details if provided
- All detail sections remain visible (read-only review)

---

## Responsive Behavior

**Desktop (>1024px)**: Side-by-side panels as shown
**Tablet (768-1024px)**: Queue collapses to a narrower sidebar (business name + status only, no email/date). Detail panel takes more space.
**Mobile (<768px)**: 
- Queue list is full-width
- Tapping a card navigates to a full-screen detail view
- Back arrow at top returns to the queue
- Approve/Reject buttons are sticky at the bottom of the screen

---

## Mock Data

Use these sample registrations so the prototype is interactive:

**Pending:**
1. Maria Santos — Gulf Express Mart, Miami FL 33101 — Submitted Apr 18, 2026
2. James Chen — Bay Breeze Liquors, Pensacola FL 32501 — Submitted Apr 19, 2026
3. Tyrone Washington — Sunshine Corner Store, Tampa FL 33602 — Submitted Apr 20, 2026
4. Patricia Alvarez — La Bodega Market, Orlando FL 32801 — Submitted Apr 14, 2026 *(overdue — 6 days)*

**Approved:**
5. Robert Kim — Coastal Gas & Go, Mobile AL 36602 — Approved Apr 17, 2026 by Joey Martinez
6. Sarah Thompson — Thompson's Fine Wines, Jacksonville FL 32202 — Approved Apr 16, 2026 by Emily Davis

**Rejected:**
7. David Brown — Dave's Place, Atlanta GA 30301 — Rejected Apr 15, 2026 by Joey Martinez — Reason: Out of territory

**Existing contacts for Gulf Express Mart** (for the duplicate check section):
- Roberto Santos — roberto@gulfexpress.com — Owner — Active
- Ana Garcia — ana@gulfexpress.com — Buyer — Active

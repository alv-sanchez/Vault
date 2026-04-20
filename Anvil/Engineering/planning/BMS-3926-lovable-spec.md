# Gulf Retailer Registration Flow — Lovable Spec

> **Context**: This is a prompt/spec for Lovable to build a multi-step registration UI for a beverage distributor's retailer portal. The output will be used as a visual reference and prototype — the final implementation will be a Salesforce LWC component using Tailwind CSS.

---

## About This Project

Gulf is a beverage distributor serving retailers (convenience stores, liquor stores, restaurants, gas stations) across Florida and Alabama. Retailers register themselves through a self-service portal by **finding their existing business** in the system, then providing their personal details to create a portal account.

The business (Account) already exists in the system — loaded by sales reps or data migration. The retailer's job is to **match themselves to their business**, provide their contact info, and submit for approval. A territory sales rep reviews and approves before the retailer can log in and place orders.

The flow: **Find your business -> Enter your details -> Payment (placeholder) -> Review -> Submit -> Wait for approval**

**Terminology** (used throughout this spec and the planning doc):
- **Account-Internal** = the business record that already exists in the system (created by sales reps / data migration). The retailer searches for and selects this.
- **Account-Contact** = the contact record created under Account-Internal during registration. This is what the registration flow actually creates.

---

## Design System

Match the following visual language throughout:

- **Primary color**: `#0A6FFD` (blue — buttons, step indicators, headers, links)
- **Background**: `#f3f4f6` (light gray page background)
- **Cards**: White (`#ffffff`), `shadow-xl`, `rounded-2xl`
- **Step headers**: Full-width blue banner (`#0A6FFD`) with white text at the top of each card
- **Inputs**: `rounded-xl`, light gray background (`bg-gray-50`), transition to white on focus, blue border on focus (`border-blue-500`), subtle shadow on focus
- **Error states**: Red border (`border-red-300`), red background (`bg-red-50`), red helper text with inline error icon
- **Buttons**: Full-width, `rounded-xl`, blue background, white text, bold, shadow, subtle scale-up on hover (`hover:scale-105`). Disabled state: gray with `opacity-50`
- **Loading states**: Three pulsing dots (gray circles with staggered animation delays)
- **Typography**: System font stack, `font-bold` for headings, `font-semibold` for labels, `text-sm` for helper text
- **Layout**: `max-w-2xl` centered container, responsive with `sm:` breakpoints
- **Success indicators**: Green circle with checkmark icon

---

## Page Structure

```
[Logo - centered, 80x80]
[Title: "Register Your Business"]
[Subtitle: "Join the Gulf retailer network"]

[Step Indicator: 1 — 2 — 3 — 4 — 5]

[Main Card - white, rounded, shadow]
  [Blue header banner with step title + subtitle]
  [Form content for current step]
```

---

## Step Indicator

A horizontal stepper showing all 5 steps. Each step is a numbered circle (`w-8 h-8 rounded-full`) connected by horizontal lines.

- **Completed/active steps**: Blue background (`#0A6FFD`), white text
- **Future steps**: Gray background (`bg-gray-200`), gray text
- **Connecting lines**: Blue when the next step is reached, gray otherwise

Step labels (visible on desktop, hidden on mobile):
1. Find Business
2. Your Details
3. Payment
4. Review
5. Confirmation

---

## Step 1: Find Your Business

**Header banner**: "Find Your Business" / "Search for your business to get started"

**Fields:**

| Field | Type | Required | Validation | Placeholder |
|---|---|---|---|---|
| Business Name | text | Yes | Min 3 characters | "Enter your business name" |
| ZIP Code | text | Yes | Non-empty | "Enter ZIP code" |
| State License Number | text | No | — | "e.g., LIC-5678" |

**License tooltip**: Show an info icon next to State License Number label with tooltip: "If your business does not sell alcohol, you may leave this blank."

**Layout**: Business Name full width. ZIP Code full width. State License Number full width.

**Search button**: Full-width blue button with a search icon: "Search for Business". Disabled until Business Name (3+ chars) and ZIP Code are filled.

**Loading state**: When searching, button changes to gray with pulsing dots: "Searching..."

**Search Results**: Appear below the search form after a search completes.

- Section heading: "Select Your Business"
- Each result is a selectable card (`border-2 border-gray-200 rounded-xl p-4 cursor-pointer`):
  - Radio-style circle indicator on the left (empty circle when unselected, blue filled dot when selected)
  - Business name in bold (`font-semibold text-gray-900`)
  - City, State below in gray (`text-sm text-gray-500`)
  - On hover: `shadow-md border-blue-500 bg-blue-50`
  - On select: same hover style but persisted
- Only one business can be selected at a time (clicking a selected one deselects it)

**No Results state**: If search returns empty, show centered in the results area:
- Large search icon in gray
- "No businesses found" in `text-lg font-medium text-gray-500`
- "Try adjusting your search criteria" in `text-gray-400`

**Continue button**: Appears below search results after a business is selected. Full-width blue: "Use This Business" with a right arrow icon. Disabled until a business is selected.

---

## Step 2: Your Details

**Header banner**: "Your Details" / "Tell us about yourself"

**Selected business banner** at the top of the form area:
- Blue-50 background (`bg-blue-50 border-blue-200 rounded-xl p-4`)
- Left side: Blue circle icon (building icon) + business name (bold) + city/state (gray, smaller)
- Right side: "Change" link in blue (`font-semibold text-blue-600 hover:underline`) — goes back to Step 1

**Fields:**

| Field | Type | Required | Validation | Placeholder |
|---|---|---|---|---|
| First Name | text | Yes | Non-empty | "First name" |
| Last Name | text | Yes | Non-empty | "Last name" |
| Email Address | email | Yes | Valid email format | "you@company.com" |
| Phone Number | tel | Yes | US 10-digit with formatting | "(555) 123-4567" |
| Job Title | text | No | — | "e.g., Store Manager" |

**Layout**: First Name + Last Name side by side on desktop, stacked on mobile. Email full width. Phone full width with a `+1` prefix badge on the left (gray background `bg-gray-100`, `rounded-l-xl`, border, `text-gray-600 font-semibold`). Job Title full width with "(optional)" hint in gray next to the label.

**Phone formatting**: As the user types, auto-format to `(XXX) XXX-XXXX`. Only allow digits. Max 10 digits. Validate:
- Must be exactly 10 digits
- Area code (first digit) cannot start with 0 or 1
- Exchange code (4th digit) cannot start with 0 or 1
- Show specific error messages for each violation

**SMS Opt-In**: After a valid 10-digit phone is entered, reveal a checkbox below the phone field with smooth transition:

> [ ] By checking this box, you agree to receive SMS messages related to your orders. Message frequency may vary. Message and data rates may apply. Reply STOP to opt out.

Style: `text-xs text-gray-500 leading-relaxed`, checkbox is `h-4 w-4`.

**Email validation**: On blur, validate format. Show inline error with icon: "Please enter a valid email address".

**Field validation on blur**: Each required field validates on blur (not just on submit). Show red border + error message immediately.

**Button**: "Continue" with right arrow icon — disabled until First Name, Last Name, Email (valid), and Phone (valid 10 digits) are filled and have no errors.

---

## Step 3: Payment Method (Placeholder)

**Header banner**: "Payment Information" / "How would you like to pay for orders?"

**Notice banner** at the top of the form:

> [Info icon] Payment processing is being configured. You can complete registration now and set up payment later.

Style: `bg-amber-50 border border-amber-200 rounded-xl p-4`, amber info icon, `text-sm text-amber-800 font-medium`.

**Three selectable cards** (visual only — selection is cosmetic, nothing is saved):

Each card is a bordered box (`border-2 border-gray-200 rounded-xl p-6 cursor-pointer`) with hover and select states matching the business search results pattern:
- Icon on the left (in a colored circle)
- Title (bold) and short description on the right
- Radio-style indicator on the far right

Cards:
1. **ACH / Bank Transfer** — "Pay directly from your bank account" (bank/building icon)
2. **Credit Card** — "Visa, Mastercard, American Express" (credit card icon)
3. **Check** — "Pay by check on delivery" (document/receipt icon)

On select: blue border, light blue background. Only one selectable at a time.

**No validation required on this step.**

**Button**: "Continue to Review" — always enabled (no selection required).

**Back link**: "Back" text button (blue, left arrow) at the top left to return to Step 2.

---

## Step 4: Review & Submit

**Header banner**: "Review Your Application" / "Please verify everything looks correct"

**Display all collected information in read-only summary sections**, each in a card (`bg-gray-50 rounded-xl p-5 mb-4`):

**Section 1 — Your Business**
- Business name (bold), city/state, ZIP code
- License number if provided
- "Edit" link (pencil icon + blue text) aligned right — goes back to Step 1

**Section 2 — Your Details**
- Full name, email, phone (formatted as `(XXX) XXX-XXXX`), job title (or "—" if empty)
- SMS Opt-In: "Yes" or "No"
- Edit link — goes back to Step 2

**Section 3 — Payment Method**
- Selected method name, or "To be configured" in gray italic
- Edit link — goes back to Step 3

**Terms checkbox** at the bottom (outside the summary cards):

> [ ] I confirm that the information provided is accurate and I agree to the [Terms of Service](#) and [Privacy Policy](#).

Style: same pattern as SMS opt-in — `text-xs text-gray-500`. Links in blue with underline.

**Button**: "Submit Application" — uses green background (`#16a34a`) instead of blue, white text, with a send/paper-plane icon. Disabled until terms checkbox is checked.

**Loading state**: Pulsing dots, text: "Submitting your application..."

**Back link**: "Back" at top left — goes to Step 3.

---

## Step 5: Confirmation (Post-Submit)

**Header banner**: "Application Submitted" / "We're reviewing your registration"

**Content** (centered, no form):

- Large green circle (`w-16 h-16 bg-green-100 rounded-full`) with white checkmark icon inside
- **Heading**: "Thank you for registering!" (`text-2xl font-bold text-gray-900`)
- **Body**: "Your application has been submitted for review. Our team will review your information and reach out within 2 business days." (`text-gray-600, max-w-md mx-auto`)

**"What happens next" card** (`bg-blue-50 border-blue-200 rounded-xl p-6 max-w-sm mx-auto`):

Numbered list with clean spacing:
1. Our territory sales rep will review your application
2. You'll receive an email once your account is approved
3. Set your password using the link in that email
4. Log in and start placing orders

Style: `text-sm text-blue-800`, numbers in `font-bold`.

**Email notice** below the card (`bg-blue-50 border-blue-200 rounded-xl p-4 max-w-sm mx-auto mt-4`):
- Email icon + "You'll receive a confirmation email shortly at **you@company.com**"
- The email address is bold.

**Button**: "Go to Login" (blue, with a login/arrow icon) — centered, not full-width (`inline-flex`).

---

## Global Behavior

**Navigation**:
- Each step has a "Back" link (except Step 1)
- Users can click completed steps in the step indicator to jump back
- Users cannot click forward to steps they haven't reached
- "Change" link on the business banner (Step 2) goes all the way back to Step 1

**Error banner**:
- Full-width red banner (`bg-red-50 border-red-200 rounded-xl`) with red X circle icon
- Shows above the main card when a server/system error occurs
- Text in `text-sm text-red-700`

**Responsive**:
- `max-w-2xl` centered on desktop
- Full-width with `px-4` padding on mobile
- Side-by-side fields (name fields) stack vertically below `sm:` breakpoint
- Step labels hidden on mobile (numbers only)

**Animations**:
- Inputs: smooth transition on focus (shadow, border color, background) — `transition-all duration-200`
- Buttons: subtle scale-up on hover (`transform hover:scale-105 transition-all duration-200`)
- Step transitions: no page reload, content swaps in-place
- Loading: pulsing dots with staggered delays (0s, 0.2s, 0.4s)
- SMS opt-in checkbox: smooth reveal after phone validates

**Mock data for prototype**:
Use these sample search results so the prototype is interactive:
- "Gulf Express Mart" — Miami, FL
- "Gulf Corner Store #412" — Tampa, FL
- "Sunshine Convenience LLC" — Orlando, FL
- "Bay Breeze Liquors" — Pensacola, FL

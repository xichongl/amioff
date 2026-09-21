# Amioff implementation plan

## Product definition

Amioff is a private, mobile-first availability planner for groups of 5–20 friends. Users sign in, join one invite-only group, enter or import their availability, discover overlapping dates, filter for particular friends, and save promising dates to a shared shortlist.

The first release assumes one group membership per account. The data model should leave room for multi-group support later.

## Agreed product behavior

- Google sign-in and email magic-link authentication.
- Any authenticated user can create one group.
- The group creator is its owner.
- A reusable invitation link admits authenticated users immediately.
- The owner can disable or regenerate the invitation link.
- Empty dates are treated as unavailable.
- Availability can be full-day or partial: morning, afternoon, and/or evening.
- Selecting a date opens an availability editor with explicit full-day, partial-day, and unavailable choices.
- Choosing partial availability reveals morning, afternoon, and evening period options.
- The visible planning window runs from today through the corresponding date three months later.
- Confirmed imported availability is retained for up to one year.
- Full and partial availability counts are displayed separately.
- Members can filter to particular friends and see dates and periods shared by everyone selected.
- Best dates rank by full availability count, then partial availability count, then earliest date.
- A weekends-only filter is available.
- Members can create a shared shortlist of promising dates with a short title or note.
- Authentication messages are the only emails; the app sends no group notifications.
- The group timezone is Eastern Time, stored as `America/New_York`.
- The app is installable on mobile and remains fully usable in desktop browsers.

## Technical architecture

- React, TypeScript, and Vite.
- Cloudflare Pages hosting connected to GitHub.
- Supabase Postgres, Auth, and row-level security.
- Google OAuth and email magic-link authentication.
- An installable progressive web app shell.
- Browser-only schedule parsing and OCR. Raw source files never leave the user's device.
- Only confirmed normalized availability is persisted.

## Primary screens

1. Landing and authentication.
2. Onboarding to create a group or accept an invitation.
3. Group calendar with aggregate counts and friend filters.
4. My availability with fast date editing and import access.
5. Ranked best dates.
6. Import wizard with mapping, preview, conflict resolution, and confirmation.
7. Shared shortlist.
8. Group settings and membership controls.

## Data model

### profiles

- User ID.
- Display name.
- Created and updated timestamps.

### groups

- Group ID and name.
- Owner ID.
- IANA timezone (`America/New_York`).
- Hashed reusable invitation token and enabled state.
- Created and updated timestamps.

### group_members

- Group and user IDs.
- Owner or member role.
- Joined timestamp.

### availability

- Group and user IDs.
- Calendar date.
- Full or partial state.
- Morning, afternoon, and evening flags.
- Manual or imported source.
- Optional import-batch ID.

Unavailable dates do not require database rows. Calendar dates are stored as `date` values rather than timestamps so timezone conversions cannot move a selection onto another day.

### import_batches

- Group and user IDs.
- Source type.
- Optional original filename, but never raw contents.
- Imported timestamp.

### shortlist_items

- Group ID and calendar date.
- Title and optional note.
- Creator ID.
- Created and updated timestamps.

## Authorization rules

- Only group members can read the roster and availability.
- Members can create and modify only their own availability.
- All members can create shortlist entries.
- Only an entry's creator or the owner can modify or remove it.
- Only the owner can remove members or manage the invitation link.
- Joining requires authentication.
- Invitation tokens are random and stored as hashes.
- Regenerating the invitation immediately invalidates the previous token.
- Removing a member deletes their group availability, import metadata, and shortlist entries while preserving their login account.

## Import workflow

All importers share the same guarded workflow:

1. Read the source file locally.
2. Ask whether entries are availability, work shifts, or recognized schedule codes such as `OFF`, `VAC`, `PTO`, or `POST`.
3. Extract candidate dates and time periods.
4. Present an editable calendar preview.
5. Highlight conflicts with existing entries.
6. Let the user preserve or replace conflicting values.
7. Save only confirmed normalized availability.

### Calendar files

Parse `.ics` files in the browser. All-day entries can map to full availability, and timed entries can map to the morning, afternoon, and evening labels. Work-shift mode inverts occupied periods into available periods.

### CSV and Excel files

Provide a column-mapping experience for row-based files and a code-mapping experience for schedule grids.

### PDF and screenshot files

Attempt embedded PDF text extraction first, then locally render and OCR PDFs or screenshots when needed. OCR is best-effort and can never bypass the confirmation screen. Desktop use is recommended for large visual files.

### AMiON exports

Use the general `.ics` path first. Add format-specific adapters for other AMiON exports after testing against anonymized samples.

## Delivery milestones

1. Foundation: application scaffold, visual tokens, responsive shell, checks, PWA metadata, and Cloudflare configuration.
2. Authentication and groups: Google and magic-link access, onboarding, invitations, membership, and row-level security.
3. Availability entry: rolling window, explicit date editor, periods, and retained future data.
4. Overlap discovery: counts, friend intersections, shared periods, ranking, and weekend filter.
5. Shortlist and installable PWA experience.
6. Structured imports: `.ics`, CSV, and Excel.
7. Visual imports: PDF, screenshots, local OCR, and AMiON-specific handling.
8. Launch hardening: accessibility, responsive QA, security verification, browser testing, and production deployment.

All four import categories must pass acceptance testing before the initial public release.

## Testing priorities

- Month-end, year-end, leap-day, and daylight-saving boundaries.
- The exact rolling three-month window.
- Full-versus-partial ranking and tie-breaking.
- Common-period intersections.
- Calendar events spanning midnight.
- Re-import conflicts and duplicate events.
- Unauthorized cross-group access.
- Disabled and regenerated invitation links.
- Member removal and cascading group-data deletion.
- Keyboard, screen-reader, and mobile tap-target behavior.
- OCR failures, low-confidence results, and cancellation.
- Current Chrome, Safari, Firefox, and mobile Safari.

## Known risks

- AMiON exports vary and need anonymized examples before specialized parsing can be considered reliable.
- Browser OCR is deliberately best-effort and may be slow on mobile devices.
- Anyone with the reusable link can join after authenticating; the owner relies on link rotation and member removal for recovery.
- The Amioff name resembles an existing product in the same professional domain and should be reassessed before a broader commercial release.

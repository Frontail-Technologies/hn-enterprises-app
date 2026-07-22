# HN Enterprises Mobile App Implementation Plan

## Summary
Build the mobile app as a supervisor-first field application, not a copy of the admin dashboard. The app should help supervisors complete daily work quickly: attendance, assigned customer work, survey updates, LMC/pipe updates, evidence capture, commissioning/billing remarks, and DPR submission.

The `app-references/` images are used only for visual style: clean white surfaces, orange primary actions, compact cards, bottom navigation, sticky submit buttons, simple forms, thumbnails, and clear status badges. Features and workflows should follow the HN dashboard/customer workspace data model.

## Design Direction
- Use HN orange/blue branding from the logo with warm off-white app background and white cards.
- Keep screens compact and task-focused: one primary action per screen where possible.
- Use bottom tab navigation for main supervisor areas.
- Use sticky bottom action buttons for long forms and submit flows.
- Use cards for meaningful grouped information only, not every small field.
- Use `Label: Value` rows for read-only details.
- Use photo/document thumbnails with preview, replace, remove, and caption patterns.
- Keep location capture obvious wherever required.

## Recommended App Structure
- `src/app`: Expo Router routes and route groups.
- `src/components/ui`: generic reusable primitives only.
- `src/components/shared`: app-level reusable building blocks like headers, status chips, photo pickers, location rows.
- `src/features`: feature modules for attendance, tasks, customers, evidence, DPR, sync.
- `src/services`: API/mock service layer, later replaceable with backend calls.
- `src/store`: local session/offline queue state if needed.
- `src/types`: shared data contracts aligned with dashboard customer/project models.
- `src/utils`: formatters, validation helpers, status mapping, route helpers.

## Phase 1 - Mobile Foundation
Goal: make the app shell production-ready before adding workflows.

- Finalize Expo Router layout with auth stack and protected app stack.
- Add bottom tabs:
  - Home
  - Work
  - Customers
  - Attendance
  - More
- Add reusable UI:
  - `AppHeader`
  - `StatusBadge`
  - `InfoRow`
  - `SectionCard`
  - `ActionTile`
  - `PhotoGrid`
  - `StickyFooter`
  - `LocationCaptureCard`
  - `EmptyState`
- Add mock service layer using customer/work data shaped like the web dashboard.
- Add auth placeholder:
  - login
  - logout
  - current supervisor profile
- Add shared app states:
  - loading
  - empty
  - offline
  - error

Acceptance:
- App opens with HN styling.
- Bottom tabs work.
- Mock supervisor session is available.
- Reusable components cover common screen needs.

## Phase 2 - Attendance
Goal: make mobile attendance the source of captured field location.

- Screens:
  - Attendance month view
  - Today attendance detail
  - Check-in / Check-out flow
  - Attendance history
- Actions:
  - Check In
  - Check Out
  - Mark Leave / Half Day if permitted
- Capture and store:
  - status
  - check-in/check-out time
  - latitude/longitude
  - accuracy
  - resolved address
  - captured timestamp
  - remarks
- Location is mandatory for mobile attendance actions.
- Admin web can later edit status/time/remarks but should not overwrite captured mobile location.

Acceptance:
- Save is disabled until location is captured.
- Existing attendance records display status color, time, and location.
- Supervisor can view month history.

## Phase 3 - Supervisor Home + Work Queue
Goal: show supervisors what they must do today.

- Home screen:
  - greeting
  - attendance status
  - today's assigned work count
  - pending evidence count
  - DPR pending status
  - quick actions
- Work queue screen:
  - list assigned work by customer/site/task
  - filters by site, task type, status
  - task cards with customer, BP/TR, site, current task, priority, due date
- Task types:
  - Survey
  - GI Measurements
  - LMC Pipeline
  - Testing / Purging
  - Meter & Commissioning
  - Billing Remarks
  - Evidence Upload
  - DPR

Acceptance:
- Supervisor sees only assigned work.
- Tapping a task opens the relevant customer section.
- Work queue supports search/filter without feeling like an admin table.

## Phase 4 - Customer Workspace
Goal: make customer the single mobile workspace for field operations.

- Customer list:
  - search by name, BP/TR, mobile, site
  - filter by site/status/task
- Customer detail sections:
  - Customer Details
  - Survey
  - GI Measurements
  - Isolation & Fittings
  - LMC Pipeline
  - MDPE Fittings
  - Meter & Commissioning
  - Billing & Remarks
  - Images / Documents
- Use compact section navigation, not heavy nested pages.
- Customer details are mostly read-only for supervisors unless specific fields are editable.
- Keep all operational updates tied to the same customer record used by the web app.

Acceptance:
- Customer detail shows all key technical sections.
- No duplicate survey/LMC/evidence data exists inside mobile.
- Empty fields show `-`.

## Phase 5 - Survey Workflow
Goal: let supervisors complete customer-owned survey updates.

- Survey section fields:
  - Survey ID
  - Survey Date
  - Assigned Surveyor
  - GPS / Location
  - Workable Status
  - Initial Measurements
  - Obstacles / Remarks
  - Site Photos
  - Approval Status
  - Revision History
- Actions:
  - Save Draft
  - Submit
  - Resubmit
- Use card choice controls for workable status:
  - Workable
  - Partially Workable
  - Not Workable

Acceptance:
- Survey is shown as part of customer, not a separate duplicated module.
- Photos can be added with captions.
- Revision history is visible.

## Phase 6 - LMC / Pipe Workflow
Goal: support the client's master-sheet-style pipe data in mobile.

- LMC section shows compact pipe records:
  - 20 mm
  - 32 mm
  - 63 mm
  - 90 mm
  - 125 mm
  - Other
- Each pipe record stores:
  - Length
  - Laying Date
  - Testing Date
  - Purging Date
  - Laying Status
  - Testing Status
  - Purging Status
  - Joint / Fitting Details
  - Remarks
  - Evidence
- Pipe edit screen should be one field per row on mobile.
- Overall LMC status is derived from pipe records.

Acceptance:
- Pipe updates are easy to complete one pipe at a time.
- Evidence attaches directly to the selected pipe record.
- No horizontal scrolling is required.

## Phase 7 - Evidence Capture + Documents
Goal: create one reusable capture/upload experience for all field modules.

- Shared evidence capture supports:
  - camera
  - gallery picker
  - preview
  - replace/remove
  - caption
  - upload status
  - captured location/time metadata
- Used by:
  - survey photos
  - LMC pipe evidence
  - meter photo
  - commissioning evidence
  - payment/document proof
  - DPR photos

Acceptance:
- Same evidence UI is reused across features.
- Images show thumbnails before submit.
- Failed uploads can be retried.

## Phase 8 - Meter, Commissioning, Billing Remarks
Goal: allow supervisor to update field-level completion data without full accounting complexity.

- Meter & Commissioning:
  - meter number
  - meter type
  - regulator number
  - regulator pressure
  - installation date
  - commissioning date
  - conversion date
  - meter reading
  - non-conversion remarks
- Billing & Remarks:
  - payment status read-only or limited edit
  - initial amount read-only or limited edit
  - JMR done
  - GI bill done
  - GC bill done
  - conversion bill done
  - remarks

Acceptance:
- Supervisor only edits allowed operational fields.
- Billing-heavy actions remain in admin web unless explicitly enabled.

## Phase 9 - DPR
Goal: let supervisors submit daily progress with photos.

- DPR screens:
  - Today's DPR
  - Add activity progress
  - DPR history
- Fields:
  - date
  - project/site
  - activity
  - planned quantity
  - completed quantity
  - delay reason
  - supervisor remarks
  - photos
- DPR can be drafted and submitted.

Acceptance:
- DPR is quick to complete from mobile.
- Delays require reason.
- Photos can be attached.

## Phase 10 - Offline Sync + Production Readiness
Goal: make field usage reliable on weak network.

- Add local offline queue for:
  - attendance actions
  - evidence uploads
  - customer technical updates
  - DPR submissions
- Add sync status:
  - pending
  - syncing
  - synced
  - failed
- Add conflict rule for v1:
  - latest submitted update wins, admin review can correct conflicts later.
- Add basic QA:
  - route smoke tests
  - TypeScript checks
  - lint
  - manual Android test

Acceptance:
- App clearly shows unsynced items.
- Failed uploads can retry.
- No user action silently disappears.

## Suggested First Build Sprint
1. Build Phase 1 foundation screens and reusable components.
2. Build Attendance end-to-end with mocked data.
3. Build Home + Work Queue with mocked assigned tasks.
4. Build Customer detail read-only sections.
5. Add LMC pipe edit flow and reusable evidence picker.

This gives the client a usable field-app prototype quickly while keeping the structure ready for the full customer workspace.

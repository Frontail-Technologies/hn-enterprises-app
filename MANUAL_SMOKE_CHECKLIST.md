# Manual Smoke Checklist

Automated tests (`npm test`) cover the pure logic behind these flows -
cache-sync behavior, hydration guards, mapping tables, query-key contracts.
They do not exercise the actual UI on a device/simulator. This checklist is
for a human to run through on a real build before a release, or after a
change that touches one of these areas.

Check a box only after actually performing that step and observing the
described result - do not check a box from reading the code.

## Authentication

- [ ] Logged-out cold start: force-quit the app while logged out, relaunch -
      lands on the login screen, no flash of any authenticated content.
- [ ] Login: valid credentials sign in and land on Home.
- [ ] Logout: from Profile or More, logout returns to the login screen and a
      subsequent cold start stays logged out.
- [ ] Protected deep route: while logged out, open a deep link to a
      protected route (e.g. a notification tap, or manually navigating to
      `/profile`, `/activity`, `/notifications`, `/complaints`) - redirects to
      login instead of showing the screen.

## Attendance

- [ ] Check in: capture succeeds, Home's attendance card and the Attendance
      tab both immediately show "Checked In" with the captured time/location.
- [ ] History immediately after: open Attendance History right after
      checking in - today's cell reflects the check-in without needing a
      manual pull-to-refresh.
- [ ] Day detail: open today's day detail - check-in time/location match
      what was just captured.
- [ ] Check out: capture succeeds, Home/Attendance/History/Day-detail all
      reflect "Checked Out" consistently.

## DPR

- [ ] Edit existing record: open a DPR that already has server data - fields
      populate correctly, no blank flash before the real values appear.
- [ ] Trigger refetch/reconnect: while editing (with unsaved changes), background
      the app and return (or toggle airplane mode off/on) to trigger a
      refetch.
- [ ] Unsaved changes remain: after that refetch, confirm the fields you
      edited are still showing your edits, not reset to the server values.
- [ ] Save/reopen: submit, navigate away, reopen the same DPR - shows the
      saved values.

## Expenses

- [ ] Overview: totals, category breakdown, and recent expenses render
      correctly for the current filters.
- [ ] All Expenses: table loads, scrolls, and matches Overview's totals for
      the same filters.
- [ ] Filters: date range and column filters actually narrow both tabs'
      results.
- [ ] Edit/create: create a new expense and edit an existing one - both save
      and are reflected in the list without a manual refresh.

## Work

- [ ] List: Work Queue loads, summary tiles (In Progress / Sent Back /
      Evidence) match the visible records.
- [ ] Detail: opening a record shows the correct stage/status/history.
- [ ] Sent-back update: a record with status "Sent Back" shows the notice
      banner and the update screen's submit button reads "Resubmit Update".
- [ ] Resubmit: submitting an update from a Sent Back record clears the
      Sent Back state and the Work Queue reflects the new status.

## Home

- [ ] Stats: Work Stats section shows real numbers, "View more" opens the
      full Stats tab with matching data.
- [ ] Complaints: open complaints section lists actual open complaints,
      tapping one opens its detail sheet.
- [ ] Activity partial-error behavior: with one of the activity feed's
      backing endpoints failing (or simulate by toggling network briefly
      during load), confirm the feed still shows what it *could* load (e.g.
      today's check-in) plus the "Some activity may be missing right now."
      note, rather than the whole section going blank or erroring out.

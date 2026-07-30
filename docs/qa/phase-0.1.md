# CatStar Phase 0.1 QA

**Status:** Current manual acceptance checklist  
Last updated: 2026-07-29

## Scope

This checklist verifies the local-first H5 memorial companion flow:

- cat passport creation
- local data retention
- Phaser room scene
- mailbox delivery
- final-letter farewell
- re-registration

## Setup

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/` on desktop and at 320, 375, 414, and 768 px
browser viewport widths.

Run the automated browser and bundle checks:

```bash
npm run test:e2e
npm run build
npm run check:bundle
```

These checks are release-blocking for the internal prototype. Saved runtime
screenshots remain art evidence and do not replace responsive, interaction, or
accessibility checks.

## Checklist

### Onboarding

- Open a fresh browser profile or clear `localStorage`.
- Confirm the onboarding form appears.
- Fill cat name, family address name, one of the six coat presets, companion
  temperament, favorite snack, and optionally passed date.
- Submit the form.
- Confirm the main page shows the created passport.
- Refresh the page.
- Confirm the passport is still present.

### Cat Scene

- Confirm the center scene is a pixel room, not a static illustration.
- Confirm the cat moves between grounded environment targets.
- Confirm the scripted window-bench routine walks to the takeoff point, jumps
  onto the perch, rests, and returns to the floor without floating.
- Confirm the food-bowl routine uses the eating animation.
- Confirm cat-bed and blanket routines use awake resting rather than deep sleep.
- Use the development routes `?catstarRoutine=floorGroom`,
  `?catstarRoutine=floorStretch`, and `?catstarRoutine=floorSleep`; confirm
  grooming, stretching, and deep sleep each use their dedicated sheet.
- Use `?catstarRoutine=approachUser`; confirm the cat approaches once, briefly
  acknowledges the foreground, and resumes without an alert or demand.
- Click or tap the cat.
- Confirm the cat always reacts visibly in place without a vertical jump.
- Repeat the touch several times; confirm a short companion whisper appears
  only occasionally rather than after every touch.
- Confirm touching during deep sleep produces a small visible response and
  usually does not wake the cat.
- Register at least one light and one dark coat preset; confirm both load the
  same action timing and remain readable in the room.
- Confirm farewell-completed passports show stardust particles around the scene.

### Cat Scene Performance

- Run the scene on a representative mid-range phone for 60 seconds.
- Confirm the scene becomes interactive within 3 seconds after entering the
  main page.
- Confirm companion motion remains at or above 30 FPS for most of the run.
- Confirm there is no crash, sustained freeze, or failed touch interaction.
- Confirm the cat's silhouette, face direction, and current action remain
  readable at mobile width without camera zoom.
- Confirm the touch target is forgiving without making the cat appear larger
  than its believable room scale.
- Keep Phaser unless one or more of these checks repeatedly fails; a single
  transient failure is not sufficient evidence for an engine migration.

### Mailbox Delivery

- After creating a passport, open the mailbox.
- Confirm letter 1 is delivered immediately.
- Confirm the mailbox entrance shows only an unread count.
- Open letter 1.
- Confirm it marks as read when opened.
- In development mode, use `第2天 8点后`.
- Confirm letter 2 appears.
- Use `第3天 8点后`.
- Confirm letter 3 appears.
- Use `最终信投递日`.
- Confirm all delivered letters appear.

### Final Letter

- On final-letter delivery day, leave at least one ordinary letter unread.
- Confirm final letter appears as waiting and cannot be opened.
- Read every ordinary letter.
- Reopen the mailbox.
- Confirm final letter can now be opened.
- Open final letter.
- Confirm final farewell choice appears only after opening the final letter.
- Select `谢谢你陪我走到这里`.
- Confirm the mailbox becomes `信箱封存`.
- Confirm previous letters remain readable.

### Re-registration

- Click `重新登记`.
- Cancel once and confirm data remains.
- Click `重新登记` again and confirm.
- Confirm the app returns to onboarding.
- Refresh the page.
- Confirm the old passport does not return.

## Non-goals For Phase 0.1

- No account login.
- No cloud sync.
- No AI-generated letters.
- No chat behavior.
- No payments, ads, rankings, levels, or virtual currency.

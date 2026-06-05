# CatStar Phase 0.1 QA

Last updated: 2026-06-05

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

Open `http://127.0.0.1:5173/` on desktop and mobile-width browser viewports.

## Checklist

### Onboarding

- Open a fresh browser profile or clear `localStorage`.
- Confirm the onboarding form appears.
- Fill cat name, family address name, coat color, personality, favorite snack, and passed date.
- Submit the form.
- Confirm the main page shows the created passport.
- Refresh the page.
- Confirm the passport is still present.

### Cat Scene

- Confirm the center scene is a pixel room, not a static illustration.
- Confirm the cat moves horizontally on its own.
- Confirm the cat lands on the floor or cushion instead of floating through the scene.
- Click or tap the cat.
- Confirm the cat jumps or reacts and a short companion message appears.
- Confirm farewell-completed passports show stardust particles around the scene.

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
- Confirm the mailbox becomes `星河封存`.
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

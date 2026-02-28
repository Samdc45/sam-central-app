# Sam Central - Siri & Shortcuts Integration Guide

## What You Can Say to Siri

| Phrase | Action |
|--------|--------|
| "Hey Siri, Sam Central Status" | Reads system health + email count |
| "Hey Siri, Sam Central Emails" | Opens dashboard to email panel |
| "Hey Siri, Sam Central Briefing" | Morning briefing + opens dashboard |
| "Hey Siri, Open Sam Central" | Opens the dashboard window |

---

## Step 1: Start the App

```bash
cd sam-central-app
bash setup.sh    # first time only
npm start
```

The **SC** icon appears in your menu bar top-right.

---

## Step 2: Create Shortcuts (5 min setup)

Open **Shortcuts.app** on Mac or iPhone:

### Shortcut: Sam Central Status
1. New Shortcut (+)
2. Add Action: **Open URLs**
3. URL: `samcentral://status`
4. Name: `Sam Central Status`
5. Right-click > **Add to Siri** > say "Sam Central Status"

### Shortcut: Sam Central Emails  
1. New Shortcut (+)
2. Add Action: **Open URLs**
3. URL: `samcentral://emails`
4. Name: `Sam Central Emails`
5. Add to Siri > "Sam Central Emails"

### Shortcut: Morning Briefing
1. New Shortcut (+)
2. Add Action: **Open URLs**
3. URL: `samcentral://briefing`
4. Name: `Sam Central Briefing`
5. Add Automation: Daily at 8:00 AM

---

## Calendar Integration

The menu bar has direct links to:
- Google Calendar (opens in browser)
- Course bookings can auto-create events via Railway webhook

To enable automatic calendar events on Gumroad sales:
1. Go to Railway dashboard > Variables
2. Add: `GOOGLE_CALENDAR_ID=civilbesafe@gmail.com`
3. The webhook will create a calendar event for each new student

---

## Menu Bar Features

- **SC [N]** - Shows unread email count in menu bar
- Click icon - Opens dashboard window
- Right-click - Full menu with all quick links
- Notifications at 8am daily (morning briefing)
- Notification on every new email

---

## iPhone PWA

1. Open Safari on iPhone
2. Go to: `https://nzci-flexi-webhook-production.up.railway.app/dashboard`
3. Enter password: `SamCentral2026`
4. Tap **Share** > **Add to Home Screen**
5. Name: "Sam Central"

Same shortcuts work on iPhone via the Shortcuts app!

# Study metrics (Great Question era)

Great Question records video/voice but can't track URLs or events, so the
prototype reports its own telemetry via `js/metrics.js`. Every record carries:

| field | meaning |
|---|---|
| `event` | what happened (the existing event map + `ui_click` breadcrumbs) |
| `task` / `state` | which task URL the participant is on |
| `pid` | participant id (`?pid=` from the task link, else generated + persisted) |
| `session_id` | one per task page load |
| `t_ms` | ms since the task page loaded → **time per task** |
| `task_started` / `task_success {via}` | task timing + **success and mechanism** |

Click paths per task = the ordered event stream for one `pid` + `task`.

## Option A — Amplitude (recommended)

Uses the existing **Hot Dog** sandbox project (id 593359) in the Descript org —
no new project needed. Events go via the HTTP V2 API; no SDK is loaded.

1. Amplitude → Settings → Projects → **Hot Dog** → copy the **API Key**.
2. Paste it into `js/metrics.js` → `STUDY_METRICS_CONFIG.amplitudeApiKey`.
3. Push to main (deploys to GitHub Pages).

Participants appear as users `nui-p-xxxxxx`. Analyze with Event Segmentation /
Funnels / User Lookup, filtering `event_properties.task`. Etiquette: our event
names don't collide with the app telemetry already in Hot Dog, but mention it
in #analytics if the team actively QAs dashboards there.

## Option B — Google Sheet collector (no third party)

1. sheets.new → Extensions → Apps Script, paste:

```js
function doPost(e) {
  const r = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([
    r.ts, r.pid, r.task, r.state, r.event, r.t_ms, r.via || '', r.target || ''
  ]);
  return ContentService.createTextOutput('ok');
}
```

2. Deploy → New deployment → **Web app** → Execute as *Me*, access
   *Anyone* → copy the web app URL.
3. Paste it into `js/metrics.js` → `STUDY_METRICS_CONFIG.endpoint`.

Rows arrive in real time; one pivot per task gives success rate, mechanism
split, and median `t_ms`.

## Great Question setup

Use the same task URLs as before, adding the participant template variable so
sessions stitch to recordings:

```
https://heyjovo.github.io/nui-prototype/?state=post-upload&task=3&pid={{participant.id}}
```

If GQ can't template ids into links, omit `pid` — a generated id persists in
the participant's browser across all tasks, and you can match it to the
recording by timestamp.

With neither transport configured, events still buffer in
`localStorage.study_metrics_log` (last 500) and log to the console — enough
for moderated sessions where you hold the recording.

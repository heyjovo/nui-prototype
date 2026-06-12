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

## Setup — Google Sheet collector (chosen for this study)

Fully private: data goes only to a Sheet you own. ~3 minutes:

1. [sheets.new](https://sheets.new) → name it (e.g. "NUI study R1") →
   Extensions → **Apps Script** → replace the contents with:

```js
const COLUMNS = ['ts', 'pid', 'task', 'state', 'event', 't_ms', 'via', 'target', 'session_id'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000); // serialize concurrent participants
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    const r = JSON.parse(e.postData.contents);
    sheet.appendRow(COLUMNS.map(c => r[c] !== undefined ? r[c] : ''));
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}
```

2. **Deploy → New deployment → Web app** — *Execute as: Me*,
   *Who has access: Anyone* — authorize, copy the web app URL
   (`https://script.google.com/macros/s/…/exec`).
3. Paste it into `js/metrics.js` → `STUDY_METRICS_CONFIG.endpoint` and push
   to main (deploys to GitHub Pages).
4. Smoke test: open `https://heyjovo.github.io/nui-prototype/?state=empty&task=2`,
   click around — rows should appear in the Sheet within a few seconds
   (`task_started` first).

### Analyzing

- **Success + mechanism**: filter `event = task_success`; `via` is the
  mechanism, `t_ms` is the time to success.
- **Time on task** for non-completers: last row's `t_ms` per `pid` + `task`.
- **Click path**: filter to one `pid` + `task`, sort by `t_ms`, read down
  the `event`/`target` columns.
- A pivot on `task` × `via` gives the mechanism split per task.

### Great Question links

Add the participant template variable so sessions stitch to recordings:

```
https://heyjovo.github.io/nui-prototype/?state=post-upload&task=3&pid={{participant.id}}
```

If GQ can't template ids into links, omit `pid` — a generated id persists in
the participant's browser across all tasks; match it to the recording by
timestamp.

## Alternative — Amplitude (not used for this study)

`STUDY_METRICS_CONFIG.amplitudeApiKey` sends the same records to an Amplitude
project via the HTTP V2 API (no SDK). Events are namespaced (`nui_*` types,
`nui-*` user ids, `source: "nui-prototype"`), so they're filterable — but
they do share the destination project's event list, which is why this study
uses the Sheet instead. Setup: paste the project API key
(Settings → Projects → … → API Key) and push.

## No transport configured

Events still log to the console and buffer in
`localStorage.study_metrics_log` (last 500) — enough for moderated sessions
where you hold the recording.

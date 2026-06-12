// Study metrics — transport-agnostic event recorder for unmoderated tests.
// Great Question can't validate or track URLs natively, so the prototype
// reports its own telemetry: who (participant), where (task/state), what
// (event), when (ms since task start), and how tasks were completed.
//
// Transports (enable either or both in STUDY_METRICS_CONFIG):
//   amplitudeApiKey — sends to Amplitude via the HTTP V2 API (no SDK needed).
//                     Use the "Hot Dog" sandbox project's API key
//                     (Amplitude → Settings → Projects → Hot Dog → API Key).
//   endpoint        — POSTs the same records as JSON to any collector URL
//                     (e.g. a Google Apps Script web app writing to a Sheet —
//                     see docs/STUDY-METRICS.md).
// With neither set, events still log to the console and buffer in
// localStorage (study_metrics_log) for manual export.
(() => {
  'use strict';

  window.STUDY_METRICS_CONFIG = window.STUDY_METRICS_CONFIG || {
    amplitudeApiKey: '',
    endpoint: 'https://script.google.com/a/macros/descript.com/s/AKfycbxPvt1UgZD3q_9r2Dsop9baZXnMNcs2CrDxzKv7EGJhcZ6LFIw1L07ZghUsMWuLx8lt/exec'
  };

  const params = new URLSearchParams(window.location.search);
  const task = parseInt(params.get('task'), 10) || 0;
  const state = params.get('state') || 'default';

  // Participant id: ?pid= from the Great Question task link wins; otherwise
  // one is generated and persisted so all tasks in a browser share an id.
  function rand() { return Math.random().toString(36).slice(2, 8); }
  let pid = params.get('pid') || '';
  if (!pid) {
    try {
      pid = localStorage.getItem('study_pid') || ('p-' + rand());
      localStorage.setItem('study_pid', pid);
    } catch (_) { pid = 'p-' + rand(); }
  }

  const sessionId = Date.now();            // one per task page load
  const taskStart = performance.now();

  function record(event, props) {
    return Object.assign({
      event: event,
      task: task,
      state: state,
      pid: pid,
      session_id: sessionId,
      t_ms: Math.round(performance.now() - taskStart),
      ts: new Date().toISOString()
    }, props || {});
  }

  function sendAmplitude(rec) {
    const key = window.STUDY_METRICS_CONFIG.amplitudeApiKey;
    if (!key) return;
    // Everything is namespaced so study data can never blend into whatever
    // else lives in the destination project: nui_* event types, nui- user
    // ids, and a source property for one-click filtering/exclusion.
    fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        api_key: key,
        events: [{
          user_id: 'nui-' + rec.pid,
          device_id: rec.pid,
          session_id: rec.session_id,
          event_type: 'nui_' + rec.event,
          time: Date.now(),
          event_properties: Object.assign({ source: 'nui-prototype' }, rec)
        }]
      })
    }).catch(() => {});
  }

  function sendEndpoint(rec) {
    const url = window.STUDY_METRICS_CONFIG.endpoint;
    if (!url) return;
    // text/plain avoids a CORS preflight (Apps Script reads the raw body)
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      keepalive: true,
      mode: 'no-cors',
      body: JSON.stringify(rec)
    }).catch(() => {});
  }

  function buffer(rec) {
    try {
      const log = JSON.parse(localStorage.getItem('study_metrics_log') || '[]');
      log.push(rec);
      localStorage.setItem('study_metrics_log', JSON.stringify(log.slice(-500)));
    } catch (_) {}
  }

  function track(event, props) {
    const rec = record(event, props);
    buffer(rec);
    sendAmplitude(rec);
    sendEndpoint(rec);
  }

  // Generic click breadcrumbs fill the gaps between instrumented events so
  // full click paths are reconstructable per task. Labels come from the
  // nearest meaningful control; throttled to one per 150ms.
  let lastClick = 0;
  document.addEventListener('click', e => {
    const now = performance.now();
    if (now - lastClick < 150) return;
    lastClick = now;
    const el = e.target.closest('[data-tooltip], a, button, [role="button"]');
    if (!el) return;
    const label = el.dataset.tooltip || el.id ||
      (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48) ||
      el.className.toString().split(' ')[0];
    if (label) track('ui_click', { target: label });
  }, true);

  window.StudyMetrics = { track: track, pid: pid };

  if (task) track('task_started');
})();

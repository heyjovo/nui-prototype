(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Sprig SDK init — replace PLACEHOLDER_APP_ID before running the study
  // ---------------------------------------------------------------------------
  (function (l, e) {
    if (window.Sprig) return;
    window.Sprig = function () { S._queue.push(arguments); };
    var S = window.Sprig;
    S.appId = 'PLACEHOLDER_APP_ID';
    S._queue = [];
    var t = l.createElement('script');
    t.async = 1; t.src = e;
    var f = l.getElementsByTagName('script')[0];
    f ? f.parentNode.insertBefore(t, f) : l.head.appendChild(t);
  })(document, 'https://cdn.sprig.com/shim.js');

  // ---------------------------------------------------------------------------
  // Track helper — logs in dev, sends to Sprig in all envs once SDK loads
  // ---------------------------------------------------------------------------
  function track(event) {
    const isDev = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    if (isDev) console.log('[Sprig track]', event);
    if (window.Sprig) window.Sprig('track', event);
  }

  // ---------------------------------------------------------------------------
  // Task routing — read ?task=N, expose globally, apply initial state
  // ---------------------------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const task = parseInt(params.get('task'), 10) || 0;
  window.PROTOTYPE_TASK = task;
  if (task) document.documentElement.dataset.task = task;

  // Per-task Underlord submit event names
  const UNDERLORD_EVENTS = {
    2: 'underlord_attachment_submitted',
    3: 'underlord_script_submitted',
    4: 'underlord_stock_submitted',
    5: 'underlord_lowerthirds_submitted',
    6: 'underlord_visual_submitted',
    7: 'underlord_timeline_submitted',
    9: 'underlord_clips_submitted',
  };

  function getUnderlordEvent() {
    return UNDERLORD_EVENTS[task] || 'underlord_submitted';
  }

  // Initial state overrides per task
  // (Most tasks start from default state — only deviate when a panel must be
  //  pre-open for the task scenario to make sense.)
  function applyInitialState() {
    // Currently all tasks start from default editor state.
    // Add task-specific overrides here as the prototype matures, e.g.:
    //   if (task === 7) openTimeline();
  }

  // ---------------------------------------------------------------------------
  // Event wiring
  // ---------------------------------------------------------------------------
  function wireEvents() {

    // -- Left sidebar nav items -----------------------------------------------
    document.querySelectorAll('[data-left-panel]').forEach(el => {
      el.addEventListener('click', () => {
        const panel = el.dataset.leftPanel;
        track('editor_panel_opened');
        if (panel === 'stock')   track('stock_entrypoint_opened');
        if (panel === 'project') track('project_pane_opened');
      });
    });

    // -- Right sidebar panel dropdown options ---------------------------------
    document.querySelectorAll('.sidebar-panel-option').forEach(opt => {
      opt.addEventListener('click', () => track('editor_menu_opened'));
    });

    // -- Script panel open ----------------------------------------------------
    document.getElementById('toggle-script-open')?.addEventListener('click', () => {
      track('script_opened');
    });

    // -- Timeline open --------------------------------------------------------
    document.getElementById('toggle-timeline')?.addEventListener('click', () => {
      // Only fire when we're about to open (not close)
      const wrapper = document.querySelector('.timeline-wrapper');
      if (wrapper && wrapper.classList.contains('is-hidden')) track('timeline_opened');
    });

    // -- Header buttons -------------------------------------------------------
    document.getElementById('composition-menu-btn')?.addEventListener('click', () => {
      track('composition_menu_opened');
    });

    document.getElementById('project-menu-btn')?.addEventListener('click', () => {
      track('editor_menu_opened');
    });

    document.getElementById('open-export-panel')?.addEventListener('click', () => {
      track('editor_menu_opened');
    });

    // -- Canvas toolbar: direct upload ----------------------------------------
    document.getElementById('toolbar-upload-btn')?.addEventListener('click', () => {
      track('upload_direct_clicked');
    });

    // -- Underlord: attachment trigger (paperclip) ----------------------------
    document.querySelectorAll('.toolbar-attachment-btn').forEach(btn => {
      if (btn.querySelector('.icon.paperclip')) {
        btn.addEventListener('click', () => track('underlord_attachment_triggered'));
      }
    });

    // -- Underlord: submit (collapsed tab 2 send button) ----------------------
    document.getElementById('toolbar-send-collapsed')?.addEventListener('click', () => {
      track(getUnderlordEvent());
    });

    // -- Underlord: submit (expanded view send button) ------------------------
    document.querySelector('.toolbar-send-expanded')?.addEventListener('click', () => {
      track(getUnderlordEvent());
    });

  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  function init() {
    applyInitialState();
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

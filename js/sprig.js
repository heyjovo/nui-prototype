(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Sprig SDK init — Descript workspace environment IDs.
  // Localhost uses the Development environment so testing never pollutes
  // Production data; the deployed prototype automatically uses Production.
  // ---------------------------------------------------------------------------
  var SPRIG_ENV_IDS = { development: 'gVnqA56rA', production: '2xc7AkouG6' };
  var IS_DEV_HOST = ['localhost', '127.0.0.1', ''].indexOf(window.location.hostname) !== -1;

  // The study moved from Sprig to Great Question; metrics.js is the active
  // transport. The Sprig SDK only loads when explicitly requested (?sprig=1).
  if (new URLSearchParams(window.location.search).get('sprig') === '1') {
    (function (l, e, a, p) {
      if (window.Sprig) return;
      window.Sprig = function () { S._queue.push(arguments); };
      var S = window.Sprig;
      S.appId = a;
      S._queue = [];
      window.UserLeap = S;
      a = l.createElement('script');
      a.async = 1;
      a.src = e + '?id=' + S.appId;
      p = l.getElementsByTagName('script')[0];
      p ? p.parentNode.insertBefore(a, p) : l.head.appendChild(a);
    })(document, 'https://cdn.sprig.com/shim.js',
       IS_DEV_HOST ? SPRIG_ENV_IDS.development : SPRIG_ENV_IDS.production);
  }

  // ---------------------------------------------------------------------------
  // Track helper — logs in dev, sends to Sprig in all envs once SDK loads.
  // When a task-ending event fires for the current ?task=N, surface a
  // "task complete" toast so participants know to return to the survey tab.
  // ---------------------------------------------------------------------------
  const TASK_END_EVENTS = {
    2: ['upload_direct_submitted', 'underlord_attachment_submitted'],
    3: ['script_filler_words_selected', 'script_edit_clarity_selected',
        'script_ignore_text_selected', 'underlord_script_submitted'],
    4: ['stock_entrypoint_opened', 'underlord_stock_submitted'],
    5: ['layout_speaker_selected', 'elements_text_layer_placed',
        'underlord_lowerthirds_submitted'],
    6: ['text_style_toolbar_clicked', 'text_style_properties_clicked',
        'text_quick_edits_opened', 'underlord_visual_submitted'],
    7: ['timeline_music_repositioned', 'underlord_timeline_submitted'],
    8: ['ai_studio_sound_applied', 'studio_sound_toolbar_clicked'],
    9: ['clip_creation_entrypoint_export', 'clip_creation_entrypoint_skill_template',
        'clip_creation_entrypoint_quick_actions', 'underlord_clips_submitted'],
    10: ['project_pane_opened', 'clip_opened_in_tab', 'composition_menu_opened',
         'underlord_clip_card_clicked', 'activity_clips_notification_clicked']
  };
  let taskCompleteShown = false;

  function showTaskCompleteToast() {
    if (taskCompleteShown) return;
    taskCompleteShown = true;
    let toast = document.getElementById('task-complete-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'task-complete-toast';
      toast.className = 'task-complete-toast';
      toast.innerHTML = '<span class="task-complete-check">✓</span>' +
        '<span>Task complete — return to the survey tab to continue</span>';
      document.body.appendChild(toast);
    }
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 6000);
  }

  let taskSuccessSent = false;

  function track(event) {
    const isDev = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
    if (isDev) console.log('[Sprig track]', event);
    if (window.Sprig) window.Sprig('track', event);
    window.StudyMetrics?.track(event);
    const ends = TASK_END_EVENTS[task];
    if (ends && ends.indexOf(event) !== -1) {
      // One success record per task attempt, stamped with the mechanism
      if (!taskSuccessSent) {
        taskSuccessSent = true;
        window.StudyMetrics?.track('task_success', { via: event });
      }
      showTaskCompleteToast();
    }
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

    // -- Stock sidebar tab clicks (task 4 completion signals) -----------------
    document.querySelectorAll('[data-stock-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.stockTab;
        if (tab === 'images') track('stock_images_tab_clicked');
        if (tab === 'music')  track('stock_music_tab_clicked');
        if (tab === 'sounds') track('stock_sounds_tab_clicked');
        if (tab === 'video')  track('stock_video_tab_clicked');
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

    // -- Underlord: submit (selection toolbar slim input + sidebar) -----------
    ['sel-underlord-send'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => track(getUnderlordEvent()));
    });
    document.querySelector('.ul-send-btn')?.addEventListener('click', () => {
      track(getUnderlordEvent());
    });

    // -- Task 2: empty state upload + attachment flows ------------------------
    document.getElementById('empty-upload-btn')?.addEventListener('click', () => {
      track('upload_direct_clicked');
    });
    document.addEventListener('study-upload-complete', () => {
      track('upload_direct_submitted');
    });
    document.addEventListener('study-underlord-submit', e => {
      track(e.detail?.hadAttachment ? 'underlord_attachment_submitted' : getUnderlordEvent());
    });

    // -- Task 3: script tools -------------------------------------------------
    document.getElementById('find-item-filler')?.addEventListener('click', () => {
      track('script_filler_words_selected');
    });
    document.querySelector('.find-menu-item[data-find-mode="correct"]')?.addEventListener('click', () => {
      track('script_edit_clarity_selected');
    });
    document.querySelectorAll('#sel-ignore-menu .sel-ignore-item').forEach(item => {
      item.addEventListener('click', () => track('script_ignore_text_selected'));
    });
    document.getElementById('sel-ignore-btn')?.addEventListener('click', () => {
      track('script_ignore_text_selected');
    });

    // -- Task 5: layouts ------------------------------------------------------
    document.querySelectorAll('.bk-layout-card, .toolbar-layout-btn, #qe-layout-row, [data-panel="inspector"] .si-layout-select').forEach(el => {
      el.addEventListener('click', () => track('layout_pack_opened'));
    });
    document.getElementById('lp-card-speaker')?.addEventListener('click', () => {
      track('layout_speaker_selected');
    });
    document.querySelectorAll('.elem-text-tile').forEach(tile => {
      tile.addEventListener('click', () => track('elements_text_layer_placed'));
    });

    // -- Task 6: text layers + styles -----------------------------------------
    document.addEventListener('click', e => {
      if (e.target.closest('.canvas-text-layer')) track('canvas_layer_selected');
    });
    document.getElementById('toggle-properties')?.addEventListener('click', () => {
      track('properties_panel_opened');
    });
    document.addEventListener('study-textstyle-click', () => {
      track('text_style_toolbar_clicked');
    });
    document.addEventListener('study-text-quickedits-open', () => {
      track('text_quick_edits_opened');
    });
    document.querySelectorAll('[data-panel="inspector"] .si-state[data-state="text"] .si-text-style, [data-panel="inspector"] .si-state[data-state="text"] .si-font-select').forEach(el => {
      el.addEventListener('click', () => track('text_style_properties_clicked'));
    });

    // -- Task 7: music repositioned -------------------------------------------
    (() => {
      const clip = document.getElementById('music-clip-draggable');
      if (!clip) return;
      let startX = 0;
      clip.addEventListener('mousedown', e => { startX = e.clientX; });
      document.addEventListener('mouseup', e => {
        if (startX && Math.abs(e.clientX - startX) > 8 &&
            !document.querySelector('.timeline-wrapper')?.classList.contains('is-hidden')) {
          track('timeline_music_repositioned');
        }
        startX = 0;
      });
    })();

    // -- Task 8: A-roll selection + Studio Sound ------------------------------
    document.addEventListener('click', e => {
      if (e.target.classList?.contains('canvas-scene-a-roll')) track('aroll_canvas_selected');
      if (e.target.closest('.script-layer-wrapper')) track('aroll_timeline_selected');
    });
    document.getElementById('effects-item-studio-sound')?.addEventListener('click', () => {
      track('ai_studio_sound_applied');
    });
    document.getElementById('toolbar-script-studio-sound')?.addEventListener('click', () => {
      track('studio_sound_toolbar_clicked');
    });

    // -- Task 9: clip creation entry points ------------------------------------
    document.querySelectorAll('.export-tool-row').forEach(rowEl => {
      if (rowEl.textContent.includes('Create clips')) {
        rowEl.addEventListener('click', () => track('clip_creation_entrypoint_export'));
      }
    });
    document.querySelectorAll('.skill-card').forEach(card => {
      if (card.textContent.includes('clip')) {
        card.addEventListener('click', () => track('clip_creation_entrypoint_skill_template'));
      }
    });
    document.querySelectorAll('.qa-item').forEach(item => {
      if (item.textContent.includes('AI Tools')) {
        item.addEventListener('click', () => track('clip_creation_entrypoint_quick_actions'));
      }
      // Skill list inside the Underlord pop-up (mirrors the sidebar skill cards)
      if (item.textContent.includes('clip')) {
        item.addEventListener('click', () => track('clip_creation_entrypoint_skill_template'));
      }
    });

    // -- Task 10: clips in project pane ---------------------------------------
    document.querySelectorAll('.proj-clip-row').forEach(rowEl => {
      rowEl.addEventListener('click', () => track('clip_opened_in_tab'));
    });

    // -- Task 10: Underlord clips card + activity notification ----------------
    // (delegated — the Underlord card is injected by states.js after init)
    document.addEventListener('click', e => {
      if (e.target.closest('.ul-clips-card')) {
        e.preventDefault();
        track('underlord_clip_card_clicked');
      }
      if (e.target.closest('.activity-card')) {
        track('activity_clips_notification_clicked');
      }
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

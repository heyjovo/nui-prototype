// User-study state routing — load a study scenario with ?state=<name>
// States: empty, post-upload, rough-cut, image-added, post-layout,
//         studio-sound, clipping, post-clipping
(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');
  window.PROTOTYPE_STATE = state || 'default';
  if (state) document.body.dataset.state = state;

  const CLIP_THUMBS = ['scene-01', 'scene-02', 'scene-04', 'scene-06', 'scene-08']
    .map(n => `<a href="#" title="Open clip"><img src="images/${n}.jpg" alt=""></a>`)
    .join('');

  const UL_MESSAGES = {
    'post-upload':
      '<p><strong>AI for Product Marketing.mov</strong> is uploaded and transcribed.</p>' +
      '<p>Where do you want to start editing &mdash; cleaning up the script, tightening pacing, or adding scenes?</p>',
    'rough-cut':
      '<p>Your rough cut is ready &mdash; I removed filler words, tightened long pauses, and split the video into scenes with an intro and an outro.</p>' +
      '<p>Want me to keep going on visuals?</p>',
    'image-added':
      '<p>I added a stock image behind your intro slide.</p>' +
      '<p>Next up: want me to style the speaker introduction in scene 2?</p>',
    'post-layout':
      '<p>I applied the <strong>Speaker</strong> layout to scene 2 with Neda’s name and title.</p>' +
      '<p>You can tweak the text styles right on the canvas.</p>',
    'clipping':
      '<p>I applied <strong>Studio Sound</strong> across the project &mdash; background noise is gone and voices sound crisp.</p>' +
      '<p>Ready to create social clips?</p>',
    'post-clipping':
      '<p>I created <strong>5 clips</strong> from the strongest moments:</p>' +
      `<div class="ul-msg-clips">${CLIP_THUMBS}</div>` +
      '<p>Open any clip to review, or tell me which platforms to optimize for.</p>'
  };

  const CONFIG = {
    'empty':         { empty: true },
    'post-upload':   { ul: 'post-upload' },
    'rough-cut':     { scenes: true, ul: 'rough-cut' },
    'image-added':   { scenes: true, introImage: true, ul: 'image-added' },
    'post-layout':   { scenes: true, introImage: true, speakers: true, startScene2: true, ul: 'post-layout' },
    'studio-sound':  { scenes: true, introImage: true, speakers: true, ul: 'post-layout' },
    'clipping':      { scenes: true, introImage: true, speakers: true, ul: 'clipping' },
    'post-clipping': { scenes: true, introImage: true, speakers: true, ul: 'post-clipping' }
  };

  function setUnderlordThread(html) {
    const thread = document.getElementById('ul-thread');
    if (!thread || !html) return;
    thread.innerHTML =
      '<div class="ul-msg">' +
      '<div class="ul-msg-avatar"><div class="icon robot"></div></div>' +
      `<div class="ul-msg-body">${html}</div>` +
      '</div>';
    document.body.classList.add('has-ul-thread');
  }

  function runUploadToast() {
    const toast = document.getElementById('upload-toast');
    const bar = document.getElementById('upload-toast-progress');
    if (!toast || !bar) return;
    toast.classList.remove('is-hidden');
    bar.style.transition = '';
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = '100%'; }));
    setTimeout(() => {
      toast.classList.add('is-hidden');
      bar.style.transition = 'none';
      bar.style.width = '0%';
      document.dispatchEvent(new CustomEvent('study-upload-complete'));
    }, 4400);
  }
  window._runUploadToast = runUploadToast;

  function initEmptyState() {
    // Document-style titles
    document.querySelectorAll('.project-button .button-label').forEach(l => {
      l.textContent = 'Untitled Composition';
    });
    const scriptHeading = document.querySelector('.script-scroll-area h1');
    if (scriptHeading) scriptHeading.textContent = 'Untitled Composition';
    document.querySelector('.script-content')?.style.setProperty('display', 'none');

    const overlay = document.getElementById('file-picker-overlay');
    const attachment = document.getElementById('empty-attachment');
    let pickerSource = null; // 'upload' | 'chat'

    function openPicker(src) {
      pickerSource = src;
      overlay?.classList.remove('is-hidden');
    }
    function closePicker() {
      overlay?.classList.add('is-hidden');
    }

    document.getElementById('empty-upload-btn')?.addEventListener('click', e => {
      e.preventDefault();
      openPicker('upload');
    });
    document.getElementById('empty-attach-btn')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openPicker('chat');
    });
    document.getElementById('file-picker-cancel')?.addEventListener('click', e => {
      e.preventDefault();
      closePicker();
    });
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) closePicker();
    });

    // Picking the file: from Upload → uploading toast; from chat → attachment chip
    document.getElementById('file-picker-file')?.addEventListener('click', e => {
      e.preventDefault();
      closePicker();
      if (pickerSource === 'chat') {
        if (attachment) attachment.style.display = '';
        document.getElementById('empty-underlord-input')?.focus();
      } else {
        runUploadToast();
      }
    });

    document.getElementById('empty-attachment-remove')?.addEventListener('click', e => {
      e.preventDefault();
      if (attachment) attachment.style.display = 'none';
    });

    document.getElementById('empty-record-btn')?.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('[data-left-panel="record"]')?.click();
    });
    document.getElementById('empty-write-btn')?.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('toggle-script-open')?.click();
    });

    // Send to Underlord (with or without attachment) ends the task
    document.getElementById('empty-underlord-send')?.addEventListener('click', e => {
      e.preventDefault();
      const input = document.getElementById('empty-underlord-input');
      const hadAttachment = attachment && attachment.style.display !== 'none';
      if (input) input.textContent = '';
      if (attachment) attachment.style.display = 'none';
      document.dispatchEvent(new CustomEvent('study-underlord-submit', { detail: { hadAttachment } }));
      runUploadToast();
    });
  }

  function apply() {
    const cfg = CONFIG[state];
    if (!cfg) return;

    if (cfg.scenes) document.body.classList.add('has-state-scenes');
    if (cfg.speakers) document.body.classList.add('has-speaker-layers');
    if (cfg.introImage) document.getElementById('intro-scene-bg')?.classList.add('has-image');
    if (cfg.ul) setUnderlordThread(UL_MESSAGES[cfg.ul]);
    if (cfg.empty) initEmptyState();
    if (cfg.scriptOpen) document.getElementById('toggle-script-open')?.click();
    if (cfg.startScene2) {
      document.querySelector('.canvas-scene-thumbnail[data-w-tab="Tab 2"]')?.click();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();

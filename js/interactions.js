(() => {
  'use strict';

  // --- Resizable Panels ---
  function initResizablePanels() {
    const scriptWrapper = document.querySelector('.script-wrapper');
    const sidebarPane = document.querySelector('.sidebar-pane');
    const playbackTimelineWrapper = document.querySelector('.playback-timeline-wrapper');

    if (scriptWrapper) {
      createResizeHandle(scriptWrapper, 'horizontal', {
        edge: 'right',
        min: 475,
        max: 800,
        property: 'width'
      });
    }

    if (sidebarPane) {
      createResizeHandle(sidebarPane, 'horizontal', {
        edge: 'left',
        min: 280,
        max: 500,
        property: 'width',
        invert: true
      });
    }

    if (playbackTimelineWrapper) {
      createResizeHandle(playbackTimelineWrapper, 'vertical', {
        edge: 'top',
        min: 40,
        max: 500,
        property: 'height',
        invert: true
      });
    }
  }

  function createResizeHandle(panel, direction, opts) {
    const handle = document.createElement('div');
    handle.className = `resize-handle resize-handle--${direction}`;
    handle.dataset.edge = opts.edge;

    if (opts.edge === 'right') panel.appendChild(handle);
    else if (opts.edge === 'left') panel.prepend(handle);
    else if (opts.edge === 'top') panel.prepend(handle);

    let startPos = 0;
    let startSize = 0;

    function onPointerDown(e) {
      e.preventDefault();
      startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      startSize = direction === 'horizontal' ? panel.offsetWidth : panel.offsetHeight;
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      handle.classList.add('is-active');
    }

    function onPointerMove(e) {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = opts.invert ? startPos - currentPos : currentPos - startPos;
      const newSize = Math.min(opts.max, Math.max(opts.min, startSize + delta));
      panel.style[opts.property] = `${newSize}px`;
    }

    function onPointerUp() {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      handle.classList.remove('is-active');
    }

    handle.addEventListener('pointerdown', onPointerDown);
  }

  // --- Timeline Playhead Scrubbing ---
  function initPlayheadScrubbing() {
    const playheadWrapper = document.querySelector('.playhead-wrapper');
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    const timeStrip = document.querySelector('.time-strip');

    if (!playheadWrapper || !timelineWrapper) return;

    let isDragging = false;

    function setPlayheadPosition(clientX) {
      const rect = timelineWrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      playheadWrapper.style.left = `${percent}%`;
    }

    playheadWrapper.addEventListener('pointerdown', e => {
      e.preventDefault();
      isDragging = true;
      playheadWrapper.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
    });

    playheadWrapper.addEventListener('pointermove', e => {
      if (!isDragging) return;
      setPlayheadPosition(e.clientX);
    });

    playheadWrapper.addEventListener('pointerup', e => {
      isDragging = false;
      playheadWrapper.releasePointerCapture(e.pointerId);
      document.body.style.userSelect = '';
    });

    if (timeStrip) {
      timeStrip.addEventListener('click', e => {
        setPlayheadPosition(e.clientX);
      });
    }
  }

  // --- Scrubber Bar (Playback) ---
  function initScrubber() {
    const scrubberTrack = document.querySelector('.scrubber-track');
    const playbackProgress = document.querySelector('.playback-progress');

    if (!scrubberTrack || !playbackProgress) return;

    scrubberTrack.addEventListener('click', e => {
      const rect = scrubberTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      playbackProgress.style.width = `${percent}%`;
    });

    let isDragging = false;
    const playhead = document.querySelector('.playback-playhead');
    if (!playhead) return;

    playhead.addEventListener('pointerdown', e => {
      e.preventDefault();
      isDragging = true;
      playhead.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
    });

    playhead.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const rect = scrubberTrack.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      playbackProgress.style.width = `${percent}%`;
    });

    playhead.addEventListener('pointerup', e => {
      isDragging = false;
      playhead.releasePointerCapture(e.pointerId);
      document.body.style.userSelect = '';
    });
  }

  // --- Canvas Layer Selection ---
  function initCanvasSelection() {
    const canvasScenes = document.querySelectorAll('.canvas-scene-thumbnail');
    canvasScenes.forEach(thumb => {
      thumb.addEventListener('click', () => {
        canvasScenes.forEach(t => t.classList.remove('is-selected'));
        thumb.classList.add('is-selected');
      });
    });
  }

  // --- Init ---
  function init() {
    initResizablePanels();
    initPlayheadScrubbing();
    initScrubber();
    initCanvasSelection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

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
      initTimelineResize(playbackTimelineWrapper);
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

  // --- Timeline Resize with Snapping ---
  const TIMELINE_DEFAULT_HEIGHT = 260;
  const TIMELINE_CLOSED_HEIGHT = 40;
  const TIMELINE_SNAP_OPEN_THRESHOLD = 32;
  const TIMELINE_SNAP_CLOSE_DISTANCE = 80;
  const TIMELINE_MAX_HEIGHT = 500;

  function isTimelineOpen() {
    const tw = document.querySelector('.timeline-wrapper');
    return tw && !tw.classList.contains('is-hidden');
  }

  function setTimelineOpen(wrapper, open) {
    const timelineWrapper = wrapper.querySelector('.timeline-wrapper') ||
      document.querySelector('.timeline-wrapper');
    const toggleBtn = document.getElementById('toggle-timeline');

    if (open) {
      if (timelineWrapper) timelineWrapper.classList.remove('is-hidden');
      wrapper.style.height = `${TIMELINE_DEFAULT_HEIGHT}px`;
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('.icon');
        const label = toggleBtn.querySelector('div:not(.icon)');
        if (icon) { icon.classList.remove('bottom-panel-open'); icon.classList.add('bottom-panel-close'); }
        if (label) label.textContent = 'Hide timeline';
      }
    } else {
      if (timelineWrapper) timelineWrapper.classList.add('is-hidden');
      wrapper.style.height = `${TIMELINE_CLOSED_HEIGHT}px`;
      if (toggleBtn) {
        const icon = toggleBtn.querySelector('.icon');
        const label = toggleBtn.querySelector('div:not(.icon)');
        if (icon) { icon.classList.remove('bottom-panel-close'); icon.classList.add('bottom-panel-open'); }
        if (label) label.textContent = 'Show timeline';
      }
    }
  }

  function initTimelineResize(wrapper) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle resize-handle--vertical';
    handle.dataset.edge = 'top';
    wrapper.prepend(handle);

    let startY = 0;
    let startHeight = 0;
    let wasClosed = false;

    function onPointerDown(e) {
      e.preventDefault();
      startY = e.clientY;
      startHeight = wrapper.offsetHeight;
      wasClosed = !isTimelineOpen();
      wrapper.classList.add('is-dragging');
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      handle.classList.add('is-active');
    }

    function onPointerMove(e) {
      const delta = startY - e.clientY;
      if (wasClosed) {
        const pullDistance = delta;
        const newHeight = Math.min(TIMELINE_MAX_HEIGHT, Math.max(TIMELINE_CLOSED_HEIGHT, startHeight + pullDistance));
        wrapper.style.height = `${newHeight}px`;
      } else {
        const newHeight = Math.min(TIMELINE_MAX_HEIGHT, Math.max(TIMELINE_CLOSED_HEIGHT, startHeight + delta));
        wrapper.style.height = `${newHeight}px`;
      }
    }

    function onPointerUp(e) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      handle.classList.remove('is-active');
      wrapper.classList.remove('is-dragging');

      const finalHeight = wrapper.offsetHeight;

      if (wasClosed) {
        const pullDistance = finalHeight - TIMELINE_CLOSED_HEIGHT;
        if (pullDistance >= TIMELINE_SNAP_OPEN_THRESHOLD && pullDistance < 120) {
          setTimelineOpen(wrapper, true);
        } else if (pullDistance >= 120) {
          // Dragged past default — keep at dragged height, just show timeline
          const timelineWrapper = wrapper.querySelector('.timeline-wrapper') ||
            document.querySelector('.timeline-wrapper');
          const toggleBtn = document.getElementById('toggle-timeline');
          if (timelineWrapper) timelineWrapper.classList.remove('is-hidden');
          if (toggleBtn) {
            const icon = toggleBtn.querySelector('.icon');
            const label = toggleBtn.querySelector('div:not(.icon)');
            if (icon) { icon.classList.remove('bottom-panel-open'); icon.classList.add('bottom-panel-close'); }
            if (label) label.textContent = 'Hide timeline';
          }
        } else {
          setTimelineOpen(wrapper, false);
        }
      } else {
        if (finalHeight < 80) {
          setTimelineOpen(wrapper, false);
        }
      }
    }

    handle.addEventListener('pointerdown', onPointerDown);

    // Wire up the toggle button to use shared state
    const toggleBtn = document.getElementById('toggle-timeline');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', e => {
        e.preventDefault();
        setTimelineOpen(wrapper, !isTimelineOpen());
      });
    }
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

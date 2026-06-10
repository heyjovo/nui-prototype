(() => {
  'use strict';

  // Shared state populated by initToggles, consumed by initTabs and initTooltips
  const _toolbar = {};

  // --- Tab System ---
  function initTabs() {
    document.querySelectorAll('.w-tabs').forEach(tabGroup => {
      const links = tabGroup.querySelectorAll('.w-tab-link');
      const panes = tabGroup.querySelectorAll('.w-tab-pane');
      const isCanvasToolbar = tabGroup.closest('.canvas-toolbar') !== null;

      function doSwitch(link, i) {
        links.forEach(l => l.classList.remove('w--current'));
        panes.forEach(p => p.classList.remove('w--tab-active'));
        link.classList.add('w--current');
        if (panes[i]) panes[i].classList.add('w--tab-active');
      }

      links.forEach((link, i) => {
        link.addEventListener('click', e => {
          e.preventDefault();

          // From expanded toolbar: animate collapse, then optionally switch tabs
          if (isCanvasToolbar && _toolbar.el?.classList.contains('is-expanded')) {
            _toolbar.collapse?.();
            if (link.getAttribute('data-w-tab') !== 'Tab 2') {
              // Switch to Tab 1 after collapse animation finishes (~300ms)
              setTimeout(() => doSwitch(link, i), 320);
            }
            // If clicking Tab 2 chip while expanded, just collapse (already on Tab 2)
            return;
          }

          doSwitch(link, i);
        });
      });
    });

    document.querySelectorAll('.script-tabs').forEach(tabGroup => {
      const tabs = tabGroup.querySelectorAll('.script-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', e => {
          e.preventDefault();
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
    });
  }

  // --- Slider/Carousel ---
  function initSliders() {
    document.querySelectorAll('.w-slider').forEach(slider => {
      const mask = slider.querySelector('.w-slider-mask');
      const slides = slider.querySelectorAll('.w-slide');
      const prevBtn = slider.querySelector('.w-slider-arrow-left');
      const nextBtn = slider.querySelector('.w-slider-arrow-right');
      const nav = slider.querySelector('.w-slider-nav');

      if (!mask || slides.length === 0) return;

      let currentIndex = 0;
      const slideWidth = slides[0].offsetWidth;
      const gap = parseInt(getComputedStyle(mask).columnGap) || 0;

      function buildDots() {
        if (!nav) return;
        nav.innerHTML = '';
        slides.forEach((_, i) => {
          const dot = document.createElement('div');
          dot.classList.add('w-slider-dot');
          if (i === 0) dot.classList.add('w-active');
          dot.addEventListener('click', () => goTo(i));
          nav.appendChild(dot);
        });
      }

      function goTo(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;
        mask.scrollTo({ left: currentIndex * (slideWidth + gap), behavior: 'smooth' });
        if (nav) {
          nav.querySelectorAll('.w-slider-dot').forEach((dot, i) => {
            dot.classList.toggle('w-active', i === currentIndex);
          });
        }
      }

      if (prevBtn) prevBtn.addEventListener('click', e => { e.preventDefault(); goTo(currentIndex - 1); });
      if (nextBtn) nextBtn.addEventListener('click', e => { e.preventDefault(); goTo(currentIndex + 1); });

      buildDots();
    });
  }

  // --- Panel Toggles ---
  function initToggles() {
    const scriptWrapper = document.querySelector('.script-wrapper');
    const sidebarPane = document.querySelector('.sidebar-pane');
    const canvasToolbar = document.querySelector('.canvas-toolbar');

    const toggleScriptOpen = document.getElementById('toggle-script-open');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const dividerScript = document.getElementById('divider-script');
    const canvasButtonsLeft = document.querySelector('.canvas-buttons-left');
    const canvasButtonsRight = document.querySelector('.canvas-buttons-right');

    [toggleScriptOpen, toggleSidebar, dividerScript].forEach(el => {
      if (el) el.classList.add('is-panel-toggle');
    });

    function syncConditionalButtons() {
      const scriptOpen = scriptWrapper && !scriptWrapper.classList.contains('is-collapsed');
      const sidebarOpen = sidebarPane && !sidebarPane.classList.contains('is-collapsed');

      document.body.classList.toggle('script-open', scriptOpen);
      document.body.classList.toggle('script-closed', !scriptOpen);

      if (toggleScriptOpen) toggleScriptOpen.classList.toggle('is-hidden-smooth', scriptOpen);
      if (dividerScript) dividerScript.classList.toggle('is-hidden-smooth', scriptOpen);
      // toggleSidebar always stays visible — used to switch between open panels

      if (canvasButtonsLeft) canvasButtonsLeft.classList.toggle('has-hidden-toggle', scriptOpen);
      if (canvasButtonsRight) canvasButtonsRight.classList.toggle('has-hidden-toggle', sidebarOpen);
    }

    function togglePanel(el) {
      if (!el) return;
      if (!el.classList.contains('is-collapsed')) {
        const currentWidth = el.offsetWidth;
        el.dataset.prevWidth = el.style.width || '';
        el.style.width = '';
        el.style.setProperty('--content-width', `${currentWidth}px`);
      } else {
        if (el.dataset.prevWidth) el.style.width = el.dataset.prevWidth;
        el.style.removeProperty('--content-width');
      }
      el.classList.toggle('is-collapsed');
      syncConditionalButtons();
    }

    // --- Script layout toggles (stack / hide canvas) ---
    const canvasStage = document.querySelector('.canvas-stage');
    const toggleStack = document.getElementById('toggle-script-stacked');
    const toggleHideCanvas = document.getElementById('toggle-canvas-hidden');

    function withNoTransition(fn) {
      if (!canvasStage) return fn();
      canvasStage.classList.add('no-transition');
      fn();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        canvasStage.classList.remove('no-transition');
      }));
    }

    if (toggleStack) {
      toggleStack.addEventListener('click', e => {
        e.preventDefault();
        withNoTransition(() => {
          const active = canvasStage.classList.toggle('is-stacked');
          toggleStack.classList.toggle('is-active', active);
        });
      });
    }

    if (toggleHideCanvas) {
      toggleHideCanvas.addEventListener('click', e => {
        e.preventDefault();
        const hiding = !canvasStage.classList.contains('is-canvas-hidden');
        // Stack + Hide coexist; just toggle canvas visibility
        canvasStage.classList.toggle('is-canvas-hidden', hiding);
        toggleHideCanvas.classList.toggle('is-active', hiding);
      });
    }

    document.getElementById('toggle-script-closed')?.addEventListener('click', e => {
      e.preventDefault();
      // If canvas is hidden, restore it before collapsing
      if (canvasStage && canvasStage.classList.contains('is-canvas-hidden')) {
        canvasStage.classList.remove('is-canvas-hidden');
        if (toggleHideCanvas) toggleHideCanvas.classList.remove('is-active');
      }
      withNoTransition(() => togglePanel(scriptWrapper));
    });

    document.getElementById('toggle-script-open')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(scriptWrapper);
    });

    // --- Sidebar panel dropdown ---
    const sidebarMenu = document.getElementById('sidebar-panel-menu');

    function openSidebarPanel(panelKey) {
      if (!sidebarPane || !panelKey) return;
      // Show the selected panel, hide others
      sidebarPane.dataset.activePanel = panelKey;
      sidebarPane.querySelectorAll('.sidebar-panel').forEach(p => {
        p.style.display = p.dataset.panel === panelKey ? '' : 'none';
      });
      // Open the sidebar if collapsed
      if (sidebarPane.classList.contains('is-collapsed')) togglePanel(sidebarPane);
    }

    function toggleSidebarMenu(e) {
      e.preventDefault();
      e.stopPropagation();
      if (!sidebarMenu) return;
      const isOpen = !sidebarMenu.classList.contains('is-hidden');
      if (isOpen) {
        sidebarMenu.classList.add('is-hidden');
        return;
      }
      // Position below the toggle button
      const rect = document.getElementById('toggle-sidebar').getBoundingClientRect();
      sidebarMenu.style.top = (rect.bottom + 6) + 'px';
      sidebarMenu.style.right = (window.innerWidth - rect.right) + 'px';
      sidebarMenu.classList.remove('is-hidden');
    }

    document.getElementById('toggle-sidebar')?.addEventListener('click', toggleSidebarMenu);

    sidebarMenu?.querySelectorAll('.sidebar-panel-option').forEach(opt => {
      opt.addEventListener('click', e => {
        e.preventDefault();
        sidebarMenu.classList.add('is-hidden');
        openSidebarPanel(opt.dataset.panel);
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
      if (sidebarMenu && !sidebarMenu.classList.contains('is-hidden')) {
        if (!e.target.closest('#sidebar-panel-menu') && !e.target.closest('#toggle-sidebar')) {
          sidebarMenu.classList.add('is-hidden');
        }
      }
    });

    document.getElementById('toggle-sidebar-closed')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(sidebarPane);
    });

    document.querySelectorAll('.sidebar-close-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (sidebarPane && !sidebarPane.classList.contains('is-collapsed')) togglePanel(sidebarPane);
      });
    });

    function toggleSidebarPanel(panelKey) {
      const isOpen = sidebarPane && !sidebarPane.classList.contains('is-collapsed');
      const isCurrentPanel = sidebarPane?.dataset.activePanel === panelKey;
      if (isOpen && isCurrentPanel) {
        togglePanel(sidebarPane);
      } else {
        openSidebarPanel(panelKey);
      }
    }

    document.getElementById('toggle-properties')?.addEventListener('click', e => {
      e.preventDefault();
      toggleSidebarPanel('inspector');
    });

    document.getElementById('open-export-panel')?.addEventListener('click', e => {
      e.preventDefault();
      toggleSidebarPanel('export');
    });

    document.getElementById('toggle-toolbar-collapsed')?.addEventListener('click', e => {
      e.preventDefault();
      const toolbarGroup = e.currentTarget.closest('.canvas-toolbar-group.collapsible');
      if (toolbarGroup) toolbarGroup.classList.toggle('is-collapsed');
    });

    // --- Toolbar Expand/Collapse (Underlord Tab 2) ---
    function expandToolbar() {
      if (!canvasToolbar) return;
      const currentWidth = canvasToolbar.offsetWidth;
      canvasToolbar.style.width = currentWidth + 'px';
      canvasToolbar.offsetHeight; // force reflow
      canvasToolbar.classList.add('is-expanded');
    }

    function collapseToolbar() {
      if (!canvasToolbar) return;
      canvasToolbar.classList.add('is-collapsing');
      canvasToolbar.classList.remove('is-expanded');
      const onDone = (e) => {
        if (e.propertyName !== 'height') return;
        canvasToolbar.style.width = '';
        canvasToolbar.classList.remove('is-collapsing');
        canvasToolbar.removeEventListener('transitionend', onDone);
      };
      canvasToolbar.addEventListener('transitionend', onDone);
    }

    // Expose collapse + element so initTabs can orchestrate collapse-then-switch
    _toolbar.el = canvasToolbar;
    _toolbar.collapse = collapseToolbar;

    document.getElementById('toolbar-expand')?.addEventListener('click', e => {
      e.preventDefault();
      expandToolbar();
    });

    document.getElementById('toolbar-collapse')?.addEventListener('click', e => {
      e.preventDefault();
      collapseToolbar();
    });

    // Clicking the inactive direct-editing chip in the expanded header collapses
    // and switches back to Tab 1
    document.querySelector('.toolbar-expanded-tab-inactive')?.addEventListener('click', e => {
      e.preventDefault();
      collapseToolbar();
      setTimeout(() => {
        document.querySelectorAll('.canvas-toolbar-tab').forEach((t, idx) =>
          t.classList.toggle('w--current', idx === 0));
        document.querySelectorAll('.canvas-toolbar .w-tab-pane').forEach((p, idx) =>
          p.classList.toggle('w--tab-active', idx === 0));
      }, 320);
    });

    // Expose toggleSidebarPanel globally for script toolbar + canvas toolbar
    window._toggleSidebarPanel = toggleSidebarPanel;

    // "Open in sidebar" buttons — toggle Underlord chat panel
    document.querySelectorAll('.toolbar-open-sidebar-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (canvasToolbar.classList.contains('is-expanded')) collapseToolbar();
        toggleSidebarPanel('underlord');
      });
    });

    syncConditionalButtons();

    document.addEventListener('panelstatechange', syncConditionalButtons);
  }

  // --- Scene List Scroll ---
  function initSceneListScroll() {
    const viewport = document.querySelector('.scene-list-viewport');
    if (!viewport) return;

    const upArrow = document.querySelector('.scene-list-arrow.up');
    const downArrow = document.querySelector('.scene-list-arrow.down');
    const thumbnails = viewport.querySelectorAll('.canvas-scene-thumbnail');
    if (!thumbnails.length) return;

    function getStepSize() {
      const first = thumbnails[0];
      const gap = parseFloat(getComputedStyle(viewport).gap) || 4;
      return first.offsetHeight + gap;
    }

    function updateArrows() {
      const atTop = viewport.scrollTop <= 0;
      const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;

      if (upArrow) upArrow.classList.toggle('is-hidden', atTop);
      if (downArrow) downArrow.classList.toggle('is-hidden', atBottom);
    }

    if (upArrow) {
      upArrow.addEventListener('click', e => {
        e.preventDefault();
        viewport.scrollBy({ top: -getStepSize(), behavior: 'smooth' });
      });
    }

    if (downArrow) {
      downArrow.addEventListener('click', e => {
        e.preventDefault();
        viewport.scrollBy({ top: getStepSize(), behavior: 'smooth' });
      });
    }

    viewport.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    updateArrows();
  }

  // --- Left Sidebar Panels ---
  function initLeftSidebar() {
    const pane = document.querySelector('.left-sidebar-pane');
    if (!pane) return;

    function openLeftPanel(key) {
      const isOpen = !pane.classList.contains('is-collapsed');
      const isCurrent = pane.dataset.activePanel === key;

      if (isOpen && isCurrent) {
        pane.style.width = '';
        pane.classList.add('is-collapsed');
        pane.dataset.activePanel = '';
        document.querySelectorAll('[data-left-panel]').forEach(el => el.classList.remove('left-panel-active'));
        return;
      }

      pane.dataset.activePanel = key;
      pane.querySelectorAll('.sidebar-panel').forEach(p => {
        p.style.display = p.dataset.panel === key ? '' : 'none';
      });
      pane.classList.remove('is-collapsed');

      document.querySelectorAll('[data-left-panel]').forEach(el => {
        el.classList.toggle('left-panel-active', el.dataset.leftPanel === key);
      });
    }

    document.querySelectorAll('[data-left-panel]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openLeftPanel(item.dataset.leftPanel);
      });
    });

    document.querySelectorAll('.left-sidebar-close-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        pane.style.width = '';
        pane.classList.add('is-collapsed');
        pane.dataset.activePanel = '';
        document.querySelectorAll('[data-left-panel]').forEach(el => el.classList.remove('left-panel-active'));
      });
    });
  }

  // --- Script Toolbar ---
  function initScriptToolbar() {
    const wrapper    = document.getElementById('script-toolbar-new');
    if (!wrapper) return;

    const directTab      = document.getElementById('script-tab-direct');
    const underlordTab   = document.getElementById('script-tab-underlord');
    const modeDropdown   = document.getElementById('script-mode-dropdown');
    const modeIcon       = document.getElementById('script-mode-icon');
    const toolPanes      = document.getElementById('script-tool-panes');
    const underlordBar   = document.getElementById('script-underlord-bar');
    const expandBtn      = document.getElementById('script-underlord-expand');
    const inputWrapper   = document.getElementById('script-underlord-input-wrapper');
    const inlineInput    = document.getElementById('script-underlord-inline');
    const expandedArea   = document.getElementById('script-underlord-expanded');
    let underlordIsExpanded = false;

    let underlordActive = false;
    let baseMode = 'edit';       // the real mode, excluding text-selected
    let isTextSelected = false;

    function setMode(mode, iconClass) {
      // Track the base mode (not text-selected, which is transient)
      if (mode !== 'text-selected') baseMode = mode;
      // Update mode icon
      if (modeIcon && iconClass) {
        modeIcon.className = `icon ${iconClass}`;
      }
      // Update dropdown active item
      document.querySelectorAll('.script-mode-item').forEach(item =>
        item.classList.toggle('is-active', item.dataset.mode === mode));
      // Show the right tool pane
      document.querySelectorAll('.script-tool-pane').forEach(pane =>
        pane.style.display = pane.dataset.mode === mode ? '' : 'none');
      // Close dropdown
      modeDropdown?.classList.add('is-hidden');
    }

    // Show text-selected toolbar when text is selected inside the script area
    const scriptArea = document.querySelector('.script-scroll-area');
    function syncTextSelection() {
      if (underlordActive) return;
      const sel = window.getSelection();
      const hasText = !!sel && sel.toString().trim().length > 0;
      const inScript = hasText && !!scriptArea && scriptArea.contains(sel.anchorNode);
      if (inScript === isTextSelected) return;
      isTextSelected = inScript;
      const targetMode = inScript ? 'text-selected' : baseMode;
      document.querySelectorAll('.script-tool-pane').forEach(p =>
        p.style.display = p.dataset.mode === targetMode ? '' : 'none');
    }
    document.addEventListener('selectionchange', syncTextSelection);

    function showDirectTab() {
      underlordActive = false;
      directTab?.classList.add('is-active');
      underlordTab?.classList.remove('is-active');
      if (toolPanes) toolPanes.style.display = '';
      if (underlordBar) underlordBar.style.display = 'none';
      // Collapse expanded input if open
      underlordIsExpanded = false;
      if (expandedArea) expandedArea.style.display = 'none';
      if (inputWrapper) inputWrapper.style.display = '';
    }

    function showUnderlordTab() {
      underlordActive = true;
      underlordTab?.classList.add('is-active');
      directTab?.classList.remove('is-active');
      if (toolPanes) toolPanes.style.display = 'none';
      if (underlordBar) underlordBar.style.display = '';
      modeDropdown?.classList.add('is-hidden');
      // Init placeholder class for inline input
      if (inlineInput) {
        inlineInput.classList.toggle('is-empty', !inlineInput.textContent.trim());
      }
    }

    // Left chip: toggle dropdown (if already on direct tab) or switch to direct tab
    directTab?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (underlordActive) {
        showDirectTab();
        setTimeout(syncOverflowDivider, 0);
        return;
      }
      const open = !modeDropdown?.classList.contains('is-hidden');
      modeDropdown?.classList.toggle('is-hidden', open);
    });

    // Right chip: switch to Underlord tab
    underlordTab?.addEventListener('click', e => {
      e.preventDefault();
      showUnderlordTab();
      setTimeout(syncOverflowDivider, 0);
    });

    // Mode dropdown item selection
    document.querySelectorAll('.script-mode-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        setMode(item.dataset.mode, item.dataset.icon);
        if (underlordActive) showDirectTab();
        else modeDropdown?.classList.add('is-hidden');
        setTimeout(syncOverflowDivider, 0);
      });
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
      if (!modeDropdown?.classList.contains('is-hidden') &&
          !directTab?.contains(e.target) &&
          !modeDropdown?.contains(e.target)) {
        modeDropdown?.classList.add('is-hidden');
      }
    });

    // Expand/collapse: toggle input wrapper vs floating expanded area
    expandBtn?.addEventListener('click', e => {
      e.preventDefault();
      underlordIsExpanded = !underlordIsExpanded;
      if (inputWrapper) inputWrapper.style.display = underlordIsExpanded ? 'none' : '';
      if (expandedArea) expandedArea.style.display = underlordIsExpanded ? '' : 'none';
      if (underlordIsExpanded) {
        expandedArea?.querySelector('.toolbar-input-editable')?.focus();
      }
    });

    // Maintain is-empty class on the inline input for placeholder
    inlineInput?.addEventListener('input', () => {
      inlineInput.classList.toggle('is-empty', !inlineInput.textContent.trim());
    });

    // Overflow divider: show between scrollable tools and fixed right actions
    const overflowDivider = document.querySelector('.script-overflow-divider');
    function syncOverflowDivider() {
      if (!overflowDivider) return;
      // Underlord mode: always show divider to separate bar from Stack/Hide/Collapse
      // Direct editing: show only when tools overflow the available width
      const visible = underlordActive ||
        (!underlordActive && !!toolPanes && toolPanes.scrollWidth > toolPanes.clientWidth + 1);
      overflowDivider.style.display = visible ? '' : 'none';
    }
    toolPanes?.addEventListener('scroll', syncOverflowDivider);
    window.addEventListener('resize', syncOverflowDivider);
    setTimeout(syncOverflowDivider, 200);

    // Open in sidebar buttons inside the script toolbar
    document.querySelectorAll('.script-open-sidebar-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        window._toggleSidebarPanel?.('underlord');
      });
    });
  }

  // Expose _toggleSidebarPanel so script toolbar can use it
  // (populated in initToggles, safe to call after DOM ready)

  // --- Cursor Menu ---
  function initCursorMenu() {
    const menu = document.getElementById('cursor-menu');
    if (!menu) return;

    const toggle = menu.querySelector('.cursor-menu-toggle');
    const timelineWrapper = document.querySelector('.timeline-wrapper');

    function isTimelineOpen() {
      return timelineWrapper && !timelineWrapper.classList.contains('is-hidden');
    }

    function open() {
      menu.classList.toggle('has-timeline', isTimelineOpen());
      menu.classList.add('is-expanded');
    }

    function close() {
      menu.classList.remove('is-expanded');
    }

    toggle?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.contains('is-expanded') ? close() : open();
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (menu.classList.contains('is-expanded') && !menu.contains(e.target)) {
        close();
      }
    });

    // Sync timeline tools if timeline is toggled while menu is open
    document.getElementById('toggle-timeline')?.addEventListener('click', () => {
      if (menu.classList.contains('is-expanded')) {
        // Timeline state flips after this click; check on next tick
        setTimeout(() => menu.classList.toggle('has-timeline', isTimelineOpen()), 0);
      }
    });
  }

  // --- Floating Tooltips (position:fixed, escapes overflow:hidden ancestors) ---
  function initTooltips() {
    const tip = document.createElement('div');
    tip.id = 'tooltip-floating';
    document.body.appendChild(tip);

    let current = null;

    document.addEventListener('mouseover', e => {
      const host = e.target.closest('[data-tooltip]');
      if (!host || host === current) return;
      current = host;

      tip.textContent = host.dataset.tooltip;
      const r = host.getBoundingClientRect();
      tip.style.left = Math.round(r.left + r.width / 2) + 'px';
      tip.style.top  = Math.round(r.top - 6) + 'px';
      tip.classList.add('is-visible');
    });

    document.addEventListener('mouseout', e => {
      const host = e.target.closest('[data-tooltip]');
      if (!host) return;
      if (!host.contains(e.relatedTarget)) {
        current = null;
        tip.classList.remove('is-visible');
      }
    });
  }

  // --- Elements sidebar: text layer creation, drag-to-canvas, edit, delete ---
  function initElementsSidebar() {
    let editingLayer = null;

    function getActiveWrapper() {
      return document.querySelector('.canvas-scene-wrapper.w--tab-active');
    }

    function selectLayer(layer) {
      document.querySelectorAll('.canvas-text-layer').forEach(l => l.classList.remove('is-selected'));
      if (layer) layer.classList.add('is-selected');
    }

    function startEditing(layer) {
      editingLayer = layer;
      layer.dataset.editing = '';
      const content = layer.querySelector('.canvas-text-content');
      content.contentEditable = 'true';
      content.style.pointerEvents = 'auto';
      content.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(content);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    function stopEditing(layer) {
      const content = layer.querySelector('.canvas-text-content');
      content.contentEditable = 'false';
      content.style.pointerEvents = '';
      // Restore default text if emptied
      if (!content.textContent.trim()) {
        content.textContent = layer.dataset.type === 'title' ? 'Title'
          : layer.dataset.type === 'subtitle' ? 'Subtitle' : 'Text';
      }
      delete layer.dataset.editing;
      editingLayer = null;
    }

    function makeDraggable(layer) {
      let dragging = false, startX, startY, startLeft, startTop;

      layer.addEventListener('mousedown', e => {
        if (layer.dataset.editing !== undefined) return; // let browser handle text cursor
        e.preventDefault();
        e.stopPropagation();
        selectLayer(layer);

        // Resolve transform-based centering to px on first drag
        if (layer.style.transform) {
          const container = layer.parentElement;
          const cRect = container.getBoundingClientRect();
          const lRect = layer.getBoundingClientRect();
          layer.style.left = (lRect.left - cRect.left) + 'px';
          layer.style.top  = (lRect.top  - cRect.top)  + 'px';
          layer.style.transform = '';
        }

        dragging = true;
        startX    = e.clientX;
        startY    = e.clientY;
        startLeft = parseFloat(layer.style.left) || 0;
        startTop  = parseFloat(layer.style.top)  || 0;

        function onMove(e) {
          if (!dragging) return;
          const container = layer.parentElement;
          const cRect = container.getBoundingClientRect();
          const lRect = layer.getBoundingClientRect();
          let newLeft = startLeft + (e.clientX - startX);
          let newTop  = startTop  + (e.clientY - startY);
          newLeft = Math.max(0, Math.min(cRect.width  - lRect.width,  newLeft));
          newTop  = Math.max(0, Math.min(cRect.height - lRect.height, newTop));
          layer.style.left = newLeft + 'px';
          layer.style.top  = newTop  + 'px';
        }
        function onUp() {
          dragging = false;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      layer.addEventListener('click', e => {
        e.stopPropagation();
        selectLayer(layer);
      });

      layer.addEventListener('dblclick', e => {
        e.stopPropagation();
        selectLayer(layer);
        startEditing(layer);
      });

      const content = layer.querySelector('.canvas-text-content');
      content.addEventListener('blur', () => {
        if (editingLayer === layer) stopEditing(layer);
      });
      content.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); stopEditing(layer); layer.focus(); }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stopEditing(layer); }
      });
    }

    function addTextLayer(type, dropX, dropY) {
      const wrapper = getActiveWrapper();
      if (!wrapper) return;

      const layer = document.createElement('div');
      layer.className = 'canvas-text-layer';
      layer.dataset.type = type;

      const content = document.createElement('span');
      content.className = 'canvas-text-content';
      content.textContent = type === 'title' ? 'Title' : type === 'subtitle' ? 'Subtitle' : 'Text';
      layer.appendChild(content);

      if (dropX !== undefined) {
        // Position centered on drop point; measure after insert
        layer.style.left = '0px';
        layer.style.top  = '0px';
        wrapper.appendChild(layer);
        const cRect = wrapper.getBoundingClientRect();
        const lRect = layer.getBoundingClientRect();
        const left = dropX - cRect.left - lRect.width  / 2;
        const top  = dropY - cRect.top  - lRect.height / 2;
        layer.style.left = Math.max(0, Math.min(cRect.width  - lRect.width,  left)) + 'px';
        layer.style.top  = Math.max(0, Math.min(cRect.height - lRect.height, top))  + 'px';
      } else {
        layer.style.left = '50%';
        layer.style.top  = '50%';
        layer.style.transform = 'translate(-50%, -50%)';
        wrapper.appendChild(layer);
      }

      selectLayer(layer);
      makeDraggable(layer);
      return layer;
    }

    // Ghost drag from tile to canvas
    function initTileDrag(btn) {
      let ghost = null;
      let dragActive = false;

      btn.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        const startX = e.clientX, startY = e.clientY;
        let moved = false;
        dragActive = false;

        const onMove = e => {
          if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
            moved = true;
            dragActive = true;
            ghost = document.createElement('div');
            ghost.className = 'elem-tile-ghost';
            const type = btn.dataset.textType;
            const label = document.createElement('span');
            label.className = 'canvas-text-content';
            label.textContent = type === 'title' ? 'Title' : type === 'subtitle' ? 'Subtitle' : 'Text';
            ghost.appendChild(label);
            document.body.appendChild(ghost);
          }
          if (ghost) {
            ghost.style.left = (e.clientX + 14) + 'px';
            ghost.style.top  = (e.clientY + 14) + 'px';
          }
        };

        const onUp = e => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          if (ghost) { ghost.remove(); ghost = null; }

          if (dragActive) {
            const wrapper = getActiveWrapper();
            if (wrapper) {
              const r = wrapper.getBoundingClientRect();
              if (e.clientX >= r.left && e.clientX <= r.right &&
                  e.clientY >= r.top  && e.clientY <= r.bottom) {
                addTextLayer(btn.dataset.textType, e.clientX, e.clientY);
              }
            }
          }
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });

      btn.addEventListener('click', () => {
        if (dragActive) return; // handled on mouseup
        addTextLayer(btn.dataset.textType);
      });
    }

    // Delete/Backspace removes the selected layer
    document.addEventListener('keydown', e => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' ||
          active.isContentEditable)) return;
      const selected = document.querySelector('.canvas-text-layer.is-selected');
      if (selected) { e.preventDefault(); selected.remove(); }
    });

    // Deselect + stop editing on canvas background click
    document.querySelector('.canvas-stage')?.addEventListener('click', e => {
      if (!e.target.closest('.canvas-text-layer')) {
        if (editingLayer) stopEditing(editingLayer);
        selectLayer(null);
      }
    });

    document.querySelectorAll('.elem-text-tile').forEach(initTileDrag);
  }

  // --- Stock sidebar tabs ---
  function initRecordModeDialog() {
    const trigger = document.getElementById('rec-mode-btn');
    const dialog = document.getElementById('rec-mode-dialog');
    if (!trigger || !dialog) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      if (!dialog.classList.contains('is-hidden')) {
        dialog.classList.add('is-hidden');
        return;
      }
      const panel = document.querySelector('[data-panel="record"]');
      const rect = panel.getBoundingClientRect();
      dialog.style.top = (rect.top + 56) + 'px';
      dialog.style.left = (rect.right + 8) + 'px';
      dialog.classList.remove('is-hidden');
    });

    document.addEventListener('click', e => {
      if (!dialog.classList.contains('is-hidden') &&
          !dialog.contains(e.target) && !trigger.contains(e.target)) {
        dialog.classList.add('is-hidden');
      }
    });

    dialog.querySelectorAll('.rec-mode-option').forEach(opt => {
      opt.addEventListener('click', e => e.preventDefault());
    });
  }

  function initLayoutPackDialog() {
    const trigger = document.querySelector('.bk-layout-card');
    const dialog = document.getElementById('layout-pack-dialog');
    if (!trigger || !dialog) return;

    trigger.addEventListener('click', e => {
      e.preventDefault();
      if (!dialog.classList.contains('is-hidden')) {
        dialog.classList.add('is-hidden');
        return;
      }
      const panel = document.querySelector('[data-panel="brand-kit"]');
      const rect = panel.getBoundingClientRect();
      dialog.style.top = rect.top + 'px';
      dialog.style.left = (rect.right + 8) + 'px';
      dialog.classList.remove('is-hidden');
    });

    document.addEventListener('click', e => {
      if (!dialog.classList.contains('is-hidden') &&
          !dialog.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
        dialog.classList.add('is-hidden');
      }
    });

    dialog.querySelectorAll('.lp-card').forEach(card => {
      card.addEventListener('click', e => e.preventDefault());
    });
  }

  function initMediaTabs() {
    const panel = document.querySelector('[data-panel="media"]');
    if (!panel) return;
    panel.querySelectorAll('[data-media-tab]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const tab = btn.dataset.mediaTab;
        panel.querySelectorAll('[data-media-tab]').forEach(b => b.classList.toggle('active', b.dataset.mediaTab === tab));
        panel.querySelectorAll('[data-media-content]').forEach(c => { c.style.display = c.dataset.mediaContent === tab ? '' : 'none'; });
      });
    });
  }

  function initStockTabs() {
    document.querySelectorAll('[data-stock-tab]').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); });
    });
  }

  function initUnderlordPanel() {
    const menu = document.getElementById('ul-header-menu');
    const sidebarPane = document.querySelector('.sidebar-pane');
    if (!menu || !sidebarPane) return;

    function openSidebarPanel(key) {
      sidebarPane.dataset.activePanel = key;
      sidebarPane.querySelectorAll('.sidebar-panel').forEach(p => {
        p.style.display = p.dataset.panel === key ? '' : 'none';
      });
      if (sidebarPane.classList.contains('is-collapsed')) {
        sidebarPane.classList.remove('is-collapsed');
      }
    }

    function openMenu(trigger) {
      if (!menu.classList.contains('is-hidden')) {
        menu.classList.add('is-hidden');
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const paneRect = sidebarPane.getBoundingClientRect();
      menu.style.top = (rect.bottom + 6) + 'px';
      menu.style.left = '';
      menu.style.right = (window.innerWidth - paneRect.right) + 'px';
      menu.classList.remove('is-hidden');
    }

    // Both header triggers open the same menu
    ['ul-header-trigger', 'st-header-trigger'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openMenu(e.currentTarget);
      });
    });

    // Menu item clicks
    menu.querySelectorAll('[data-open-panel]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        menu.classList.add('is-hidden');
        openSidebarPanel(item.dataset.openPanel);
      });
    });

    // "Start with a skill template" button
    document.getElementById('ul-skill-template-btn')?.addEventListener('click', e => {
      e.preventDefault();
      openSidebarPanel('skill-templates');
    });

    // Close menu on outside click
    document.addEventListener('click', e => {
      if (!menu.classList.contains('is-hidden') &&
          !menu.contains(e.target) &&
          !e.target.closest('#ul-header-trigger') &&
          !e.target.closest('#st-header-trigger')) {
        menu.classList.add('is-hidden');
      }
    });
  }

  // --- Generic dropdown dialog helper ---
  function initDropdownDialog(btnId, dialogId, alignRight) {
    const btn = document.getElementById(btnId);
    const dialog = document.getElementById(dialogId);
    if (!btn || !dialog) return;

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!dialog.classList.contains('is-hidden')) {
        dialog.classList.add('is-hidden');
        return;
      }
      // Close all other dialogs
      document.querySelectorAll('.app-menu-dialog').forEach(d => {
        if (d !== dialog) d.classList.add('is-hidden');
      });
      const rect = btn.getBoundingClientRect();
      dialog.style.top = (rect.bottom + 6) + 'px';
      if (alignRight) {
        dialog.style.left = 'auto';
        dialog.style.right = (window.innerWidth - rect.right) + 'px';
      } else {
        dialog.style.right = 'auto';
        dialog.style.left = rect.left + 'px';
      }
      dialog.classList.remove('is-hidden');
    });

    dialog.querySelectorAll('.app-menu-item').forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); });
    });

    document.addEventListener('click', e => {
      if (!dialog.classList.contains('is-hidden')) {
        if (!e.target.closest('#' + dialogId) && !e.target.closest('#' + btnId)) {
          dialog.classList.add('is-hidden');
        }
      }
    });
  }

  // --- App Menu Dialog ---
  function initAppMenu() {
    initDropdownDialog('app-menu-btn', 'app-menu-dialog', true);
    initDropdownDialog('project-menu-btn', 'project-menu-dialog', false);
  }

  // --- Music clip drag ---
  function initMusicDrag() {
    const clip = document.getElementById('music-clip-draggable');
    if (!clip) return;

    let dragging = false, startX = 0, startLeft = 0, maxLeft = 0;

    clip.style.cursor = 'grab';

    clip.addEventListener('mousedown', e => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startLeft = clip.offsetLeft;
      maxLeft = startLeft;
      clip.style.marginLeft = startLeft + 'px';
      clip.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const delta = e.clientX - startX;
      const newLeft = Math.max(0, Math.min(maxLeft, startLeft + delta));
      clip.style.marginLeft = newLeft + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      clip.style.cursor = 'grab';
      document.body.style.userSelect = '';
    });
  }

  // --- Init ---
  function init() {
    initTabs();
    initSliders();
    initToggles();
    initSceneListScroll();
    initLeftSidebar();
    initScriptToolbar();
    initCursorMenu();
    initTooltips();
    initAppMenu();
    initElementsSidebar();
    initRecordModeDialog();
    initLayoutPackDialog();
    initMediaTabs();
    initStockTabs();
    initUnderlordPanel();
    initMusicDrag();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

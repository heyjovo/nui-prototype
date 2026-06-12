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

    // Split button: the icon mirrors whichever panel is active (Underlord default)
    const PANEL_ICONS = {
      underlord: 'robot',
      inspector: 'gear',
      'skill-templates': 'magic',
      comments: 'add-comment',
      export: 'upload'
    };
    function updateSidebarToggleIcon() {
      const iconEl = document.getElementById('sidebar-toggle-icon');
      if (!iconEl) return;
      const active = sidebarPane?.dataset.activePanel || 'underlord';
      iconEl.className = 'icon ' + (PANEL_ICONS[active] || 'robot');
    }

    function openSidebarPanel(panelKey) {
      if (!sidebarPane || !panelKey) return;
      // Show the selected panel, hide others
      sidebarPane.dataset.activePanel = panelKey;
      sidebarPane.querySelectorAll('.sidebar-panel').forEach(p => {
        p.style.display = p.dataset.panel === panelKey ? '' : 'none';
      });
      updateSidebarToggleIcon();
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

    // Split button icon half: open the active panel (or collapse the sidebar)
    document.getElementById('toggle-sidebar-open')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      sidebarMenu?.classList.add('is-hidden');
      if (sidebarPane && !sidebarPane.classList.contains('is-collapsed')) {
        togglePanel(sidebarPane);
      } else {
        openSidebarPanel(sidebarPane?.dataset.activePanel || 'underlord');
      }
    });
    updateSidebarToggleIcon();

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

    // --- Canvas toolbar: expandable panels (Underlord agent, Quick actions) ---
    // The toolbar is anchored bottom-center, so pinning the current width and
    // transitioning width/height makes panels grow naturally from the bottom center.
    let toolbarCollapsedWidth = 0;
    let activeToolbarPanel = null;

    function expandToolbarPanel(cls, focusSel) {
      if (!canvasToolbar || activeToolbarPanel === cls) return;
      if (activeToolbarPanel) {
        // Switching panels while already expanded — just swap views
        canvasToolbar.classList.remove(activeToolbarPanel);
      } else {
        toolbarCollapsedWidth = canvasToolbar.offsetWidth;
        canvasToolbar.style.width = toolbarCollapsedWidth + 'px';
        canvasToolbar.offsetHeight; // force reflow so width animates
        canvasToolbar.style.width = '480px';
      }
      canvasToolbar.classList.add(cls);
      activeToolbarPanel = cls;
      if (focusSel) setTimeout(() => canvasToolbar.querySelector(focusSel)?.focus(), 260);
    }

    function collapseToolbarPanel() {
      if (!canvasToolbar || !activeToolbarPanel) return;
      canvasToolbar.classList.remove(activeToolbarPanel);
      activeToolbarPanel = null;
      canvasToolbar.style.width = toolbarCollapsedWidth + 'px';
      const onDone = (e) => {
        if (e.propertyName !== 'width') return;
        canvasToolbar.style.width = '';
        canvasToolbar.removeEventListener('transitionend', onDone);
      };
      canvasToolbar.addEventListener('transitionend', onDone);
      // Reset quick-actions search state for next open
      const qaInput = document.getElementById('qa-input');
      if (qaInput) qaInput.value = '';
      document.querySelector('.toolbar-qa-view')?.classList.remove('is-filtering');
    }

    _toolbar.el = canvasToolbar;
    _toolbar.collapse = collapseToolbarPanel;

    document.getElementById('toolbar-underlord-btn')?.addEventListener('click', e => {
      e.preventDefault();
      expandToolbarPanel('is-agent-expanded', '.agent-input-editable');
    });

    document.getElementById('toolbar-quick-actions-btn')?.addEventListener('click', e => {
      e.preventDefault();
      expandToolbarPanel('is-qa-expanded', '#qa-input');
    });

    // Skill templates: nested panel reached from the agent header;
    // back arrow returns to the Underlord view
    document.getElementById('toolbar-agent-skills-btn')?.addEventListener('click', e => {
      e.preventDefault();
      expandToolbarPanel('is-st-expanded', '#st-input');
    });

    document.getElementById('toolbar-st-back')?.addEventListener('click', e => {
      e.preventDefault();
      expandToolbarPanel('is-agent-expanded', '.agent-input-editable');
    });

    ['toolbar-agent-collapse', 'toolbar-qa-collapse', 'toolbar-st-collapse'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        e.preventDefault();
        collapseToolbarPanel();
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') collapseToolbarPanel();
    });

    // Enter submits in every Underlord input (participants type + Enter far
    // more often than they find the send arrow). Routes to the surface's own
    // send button so UI side effects and study tracking both fire.
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.shiftKey) return;
      const t = e.target;
      let sendBtn = null;
      if (t.id === 'ul-sidebar-input') {
        sendBtn = document.getElementById('toolbar-send-collapsed');
      } else if (t.id === 'sel-underlord-input') {
        sendBtn = document.getElementById('sel-underlord-send');
      } else if (t.id === 'empty-underlord-input') {
        sendBtn = document.getElementById('empty-underlord-send');
      } else if (t.classList && t.classList.contains('agent-input-editable')) {
        sendBtn = t.closest('.canvas-toolbar')?.querySelector('.toolbar-send-expanded');
      }
      if (sendBtn) {
        e.preventDefault();
        sendBtn.click();
      }
    });

    // Collapse on outside click (the expanding click itself lands inside)
    document.addEventListener('click', e => {
      if (activeToolbarPanel && canvasToolbar && !canvasToolbar.contains(e.target)) {
        collapseToolbarPanel();
      }
    });

    // Quick actions: fake search filtering — any query swaps to the results menu
    const qaInput = document.getElementById('qa-input');
    const qaView = document.querySelector('.toolbar-qa-view');
    qaInput?.addEventListener('input', () => {
      const q = qaInput.value.trim();
      qaView?.classList.toggle('is-filtering', q.length > 0);
      const qEl = document.getElementById('qa-query');
      if (qEl) qEl.textContent = q;
    });

    // Expose toggleSidebarPanel globally for script toolbar + canvas toolbar
    window._toggleSidebarPanel = toggleSidebarPanel;

    // "Open in sidebar" buttons — collapse the toolbar panel, open Underlord chat
    document.querySelectorAll('.toolbar-open-sidebar-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        collapseToolbarPanel();
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
    const modeLabel      = document.getElementById('script-mode-label');
    const toolPanes      = document.getElementById('script-tool-panes');
    const underlordBar   = document.getElementById('script-underlord-bar');
    const expandBtn      = document.getElementById('script-underlord-expand');
    const inputWrapper   = document.getElementById('script-underlord-input-wrapper');
    const inlineInput    = document.getElementById('script-underlord-inline');
    const expandedArea   = document.getElementById('script-underlord-expanded');
    let underlordIsExpanded = false;

    let underlordActive = false;
    let baseMode = 'edit';

    function setMode(mode, iconClass, label) {
      baseMode = mode;
      // Update mode icon + label on the dropdown trigger
      if (modeIcon && iconClass) {
        modeIcon.className = `icon ${iconClass}`;
      }
      if (modeLabel && label) {
        modeLabel.textContent = label;
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

    // Selecting text in the script no longer swaps the toolbar —
    // it stays on whatever mode is currently selected.

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
        const label = item.querySelector('span')?.textContent || '';
        setMode(item.dataset.mode, item.dataset.icon, label);
        if (underlordActive) showDirectTab();
        else modeDropdown?.classList.add('is-hidden');
        setTimeout(syncOverflowDivider, 0);
      });
    });

    // Overflow menu (vertical ⋮) — holds "Hide canvas" checklist item
    const overflowBtn  = document.getElementById('script-overflow-btn');
    const overflowMenu = document.getElementById('script-overflow-menu');
    overflowBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      overflowMenu?.classList.toggle('is-hidden');
    });
    document.addEventListener('click', e => {
      if (overflowMenu && !overflowMenu.classList.contains('is-hidden') &&
          !e.target.closest('#script-overflow-menu') &&
          !e.target.closest('#script-overflow-btn')) {
        overflowMenu.classList.add('is-hidden');
      }
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
    const canvasToolbar = document.querySelector('.canvas-toolbar');

    function isTimelineOpen() {
      return timelineWrapper && !timelineWrapper.classList.contains('is-hidden');
    }

    // Cap the expanded menu so it never grows closer than 8px to the left
    // edge of the canvas toolbar (whose width is variable); extra tools
    // scroll horizontally inside .cursor-tools-scroll.
    function syncMaxWidth() {
      if (!menu.classList.contains('is-expanded') || !canvasToolbar) return;
      const toolbarLeft = canvasToolbar.getBoundingClientRect().left;
      const menuLeft = menu.getBoundingClientRect().left;
      const limit = Math.floor(toolbarLeft - 8 - menuLeft);
      if (limit > 0) menu.style.maxWidth = limit + 'px';
    }

    function open() {
      menu.classList.toggle('has-timeline', isTimelineOpen());
      menu.classList.add('is-expanded');
      syncMaxWidth();
    }

    function close() {
      menu.classList.remove('is-expanded');
      menu.style.maxWidth = '';
    }

    window.addEventListener('resize', syncMaxWidth);
    document.addEventListener('panelstatechange', syncMaxWidth);
    const stage = document.querySelector('.canvas-stage');
    if (stage && 'ResizeObserver' in window) {
      new ResizeObserver(syncMaxWidth).observe(stage);
    }

    toggle?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.contains('is-expanded') ? close() : open();
    });

    // Tool selection: clicking a tool while expanded makes it active and
    // collapses the menu; clicking the active tool while collapsed expands.
    menu.querySelectorAll('.cursor-tool').forEach(tool => {
      tool.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!menu.classList.contains('is-expanded')) {
          open();
          return;
        }
        menu.querySelectorAll('.cursor-tool').forEach(t => t.classList.remove('is-active'));
        tool.classList.add('is-active');
        close();
      });
    });

    // Close on outside click — but stay open when the click is opening or
    // closing a surface (script, timeline, canvas, sidebars), so the menu
    // can live-update its tool sections.
    const SURFACE_TOGGLES = [
      '#toggle-timeline', '#toggle-script-open', '#toggle-script-closed',
      '#toggle-script-stacked', '#toggle-canvas-hidden', '#script-overflow-btn',
      '#script-overflow-menu', '#toggle-sidebar', '#sidebar-panel-menu',
      '#toggle-sidebar-closed', '#toggle-properties', '#open-export-panel',
      '[data-left-panel]', '.left-sidebar-close-btn', '.sidebar-close-btn'
    ].join(', ');
    document.addEventListener('click', e => {
      if (!menu.classList.contains('is-expanded') || menu.contains(e.target)) return;
      if (e.target.closest(SURFACE_TOGGLES)) return;
      close();
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
      const selected = document.querySelector('.canvas-text-layer.is-selected:not(.speaker-layer)');
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

  // --- Selected text toolbar (floats above first line of selection) ---
  function initSelectionToolbar() {
    const tb = document.getElementById('selection-toolbar');
    if (!tb) return;

    const canvasToolbar = document.querySelector('.canvas-toolbar');
    const scriptArea = document.querySelector('.script-scroll-area');
    const ignoreBtn = document.getElementById('sel-ignore-btn');
    const ignoreMenu = document.getElementById('sel-ignore-menu');
    const ulInput = document.getElementById('sel-underlord-input');

    const FADE_MS = 110; // matches the 100ms opacity/transform transitions
    let visible = false;
    let mainWidth = 0;
    let pendingShow = null;
    let savedRange = null;

    // Keep toolbar/menu clicks from collapsing the text selection.
    // The input is focused manually so the document selection stays painted
    // (inactive) while the user types in the Underlord field.
    tb.addEventListener('mousedown', e => {
      e.preventDefault();
      if (e.target.closest('#sel-underlord-input')) ulInput?.focus();
    });
    ignoreMenu?.addEventListener('mousedown', e => e.preventDefault());

    function selectionRect() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
      if (!sel.toString().trim()) return null;
      if (!scriptArea || !scriptArea.contains(sel.anchorNode)) return null;
      const rects = sel.getRangeAt(0).getClientRects();
      return rects.length ? rects[0] : null;
    }

    // Centered above the first line of the selection, clamped to the viewport
    function place(rect) {
      const w = tb.offsetWidth;
      const h = tb.offsetHeight;
      let left = rect.left + rect.width / 2 - w / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      tb.style.left = Math.round(left) + 'px';
      tb.style.top = Math.round(Math.max(8, rect.top - h - 8)) + 'px';
    }

    function placeWithoutAnim(rect) {
      tb.classList.add('no-anim');
      place(rect);
      tb.offsetHeight; // flush so the un-animated move applies
      tb.classList.remove('no-anim');
    }

    function show(rect) {
      if (visible) { place(rect); return; }
      visible = true;
      // 1. canvas toolbar fades up and out…
      canvasToolbar?.classList.add('is-hidden-for-selection');
      clearTimeout(pendingShow);
      // 2. …then the selection toolbar fades up and in
      pendingShow = setTimeout(() => {
        placeWithoutAnim(rect);
        tb.classList.add('is-visible');
        // Re-place once layout settles (e.g. a panel was still animating)
        setTimeout(() => {
          if (!visible || tb.classList.contains('is-underlord')) return;
          const fresh = selectionRect();
          if (fresh) placeWithoutAnim(fresh);
        }, 280);
      }, FADE_MS);
    }

    function hide() {
      if (!visible) return;
      visible = false;
      clearTimeout(pendingShow);
      // 1. selection toolbar fades out…
      tb.classList.remove('is-visible');
      exitUnderlord(true);
      ignoreMenu?.classList.add('is-hidden');
      // 2. …then the canvas toolbar fades back in
      setTimeout(() => {
        if (!visible) canvasToolbar?.classList.remove('is-hidden-for-selection');
      }, FADE_MS);
    }

    let selDebounce;
    document.addEventListener('selectionchange', () => {
      // In Underlord mode the toolbar persists until back/send,
      // even though focusing the input collapses the doc selection
      if (tb.classList.contains('is-underlord')) return;
      clearTimeout(selDebounce);
      selDebounce = setTimeout(() => {
        if (tb.classList.contains('is-underlord')) return;
        const rect = selectionRect();
        if (rect) show(rect); else hide();
      }, 120);
    });

    // Track the selection while the script scrolls
    scriptArea?.addEventListener('scroll', () => {
      if (!visible || tb.classList.contains('is-underlord')) return;
      const rect = selectionRect();
      if (rect) placeWithoutAnim(rect);
    });

    // --- Underlord sub-view: slim input replaces the toolbar content ---
    function enterUnderlord() {
      if (tb.classList.contains('is-underlord')) return;
      // Snapshot the selection so it can be restored if anything collapses it,
      // and keep it visually painted while focus is in the input
      const sel = window.getSelection();
      savedRange = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      if (savedRange && window.Highlight && CSS.highlights) {
        CSS.highlights.set('sel-underlord', new Highlight(savedRange));
      }
      mainWidth = tb.offsetWidth;
      const center = tb.offsetLeft + mainWidth / 2;
      tb.style.width = mainWidth + 'px';
      tb.offsetHeight;
      tb.classList.add('is-underlord');
      const targetW = 480;
      let left = center - targetW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - targetW - 8));
      tb.style.width = targetW + 'px';
      tb.style.left = Math.round(left) + 'px';
      setTimeout(() => ulInput?.focus(), 210);
    }

    function exitUnderlord(immediate) {
      if (ulInput) ulInput.value = '';
      if (window.CSS?.highlights) CSS.highlights.delete('sel-underlord');
      if (!tb.classList.contains('is-underlord')) {
        if (immediate) tb.style.width = '';
        return;
      }
      const center = tb.offsetLeft + tb.offsetWidth / 2;
      tb.classList.remove('is-underlord');
      if (immediate) { tb.style.width = ''; return; }
      tb.style.width = mainWidth + 'px';
      tb.style.left = Math.round(center - mainWidth / 2) + 'px';
      setTimeout(() => { tb.style.width = ''; }, 220);
    }

    document.getElementById('sel-underlord-btn')?.addEventListener('click', e => {
      e.preventDefault();
      enterUnderlord();
    });

    // Dismiss while still in the underlord view: fade out first, swap views
    // after — avoids a glimpse of the text-editing toolbar on close.
    function dismissSlim() {
      visible = false;
      savedRange = null;
      clearTimeout(pendingShow);
      tb.classList.remove('is-visible');
      ignoreMenu?.classList.add('is-hidden');
      setTimeout(() => {
        exitUnderlord(true);
        if (!visible) canvasToolbar?.classList.remove('is-hidden-for-selection');
      }, FADE_MS);
      document.dispatchEvent(new CustomEvent('slim-underlord-closed'));
    }

    // Slim Underlord input anchored to an arbitrary rect (e.g. scene actions).
    // Skips the canvas-toolbar hand-off — the toolbar stays visible.
    // opts.over: sit in line with the anchor (right-aligned) instead of above it.
    window._openSlimUnderlord = function (anchorRect, opts) {
      visible = true;
      clearTimeout(pendingShow);
      tb.classList.add('no-anim');
      if (opts && opts.over) {
        const w = tb.offsetWidth;
        tb.style.left = Math.round(Math.max(8, anchorRect.right - w)) + 'px';
        tb.style.top = Math.round(anchorRect.top + (anchorRect.height - tb.offsetHeight) / 2) + 'px';
        tb.offsetHeight;
        tb.classList.remove('no-anim');
        tb.classList.add('is-visible');
        enterUnderlord();
        // keep the bar right-anchored to the trigger as it grows to 480
        const left = Math.max(8, Math.min(anchorRect.right - 480, window.innerWidth - 480 - 8));
        tb.style.left = Math.round(left) + 'px';
      } else {
        place(anchorRect);
        tb.offsetHeight;
        tb.classList.remove('no-anim');
        tb.classList.add('is-visible');
        enterUnderlord();
      }
    };
    window._closeSlimUnderlord = function () {
      if (tb.classList.contains('is-underlord')) dismissSlim();
    };
    window._isSlimUnderlordOpen = function () {
      return visible && tb.classList.contains('is-underlord');
    };

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && tb.classList.contains('is-underlord')) {
        window.getSelection()?.removeAllRanges();
        dismissSlim();
      }
    });

    // Clicking outside the underlord bar closes it
    document.addEventListener('click', e => {
      if (!tb.classList.contains('is-underlord') || !visible) return;
      if (tb.contains(e.target)) return;
      if (e.target.closest('#sel-underlord-btn, #scene-underlord-btn')) return;
      dismissSlim();
    });

    document.getElementById('sel-underlord-back')?.addEventListener('click', e => {
      e.preventDefault();
      // Restore the selection if it was collapsed while typing
      if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      if (selectionRect()) {
        // Text flow: return to the main selection toolbar
        exitUnderlord();
        document.dispatchEvent(new CustomEvent('slim-underlord-closed'));
      } else {
        // Scene flow (no selection): fade out in place
        dismissSlim();
      }
    });

    document.getElementById('sel-underlord-send')?.addEventListener('click', e => {
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      dismissSlim();
    });

    // --- Ignore dropdown ---
    ignoreBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!ignoreMenu) return;
      if (!ignoreMenu.classList.contains('is-hidden')) {
        ignoreMenu.classList.add('is-hidden');
        return;
      }
      const r = ignoreBtn.getBoundingClientRect();
      ignoreMenu.style.top = (r.bottom + 6) + 'px';
      ignoreMenu.style.left = r.left + 'px';
      ignoreMenu.classList.remove('is-hidden');
    });

    document.addEventListener('click', e => {
      if (ignoreMenu && !ignoreMenu.classList.contains('is-hidden') &&
          !e.target.closest('#sel-ignore-menu') &&
          !e.target.closest('#sel-ignore-btn')) {
        ignoreMenu.classList.add('is-hidden');
      }
    });

    ignoreMenu?.querySelectorAll('.sel-ignore-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        ignoreMenu.classList.add('is-hidden');
      });
    });
  }

  // --- Find dialog (combined search field + mode menu) ---
  function initFindDialog() {
    const dialog = document.getElementById('find-dialog');
    if (!dialog) return;

    const input = document.getElementById('find-input');
    const triggers = document.querySelectorAll('.script-tool-pane .slim-select[data-tooltip="Find"]');

    function close() {
      dialog.classList.add('is-hidden');
    }

    function openBelow(btn) {
      const rect = btn.getBoundingClientRect();
      dialog.classList.remove('is-hidden');
      const width = dialog.offsetWidth;
      const left = Math.min(rect.left, window.innerWidth - width - 8);
      dialog.style.top = (rect.bottom + 6) + 'px';
      dialog.style.left = Math.max(8, left) + 'px';
      input?.focus();
    }

    triggers.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (dialog.classList.contains('is-hidden')) openBelow(btn);
        else close();
      });
    });

    // Mode selection: move the checkmark
    dialog.querySelectorAll('.find-menu-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        dialog.querySelectorAll('.find-menu-item').forEach(i => i.classList.remove('is-checked'));
        item.classList.add('is-checked');
        input?.focus();
      });
    });

    document.getElementById('find-dialog-close')?.addEventListener('click', e => {
      e.preventDefault();
      close();
    });

    document.addEventListener('click', e => {
      if (dialog.classList.contains('is-hidden')) return;
      if (dialog.contains(e.target)) return;
      if (e.target.closest('.script-tool-pane .slim-select[data-tooltip="Find"]')) return;
      close();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !dialog.classList.contains('is-hidden')) close();
    });
  }

  // --- Scene actions: chips above the scene frame + quick edits dialog ---
  function initSceneActions() {
    const row = document.getElementById('scene-actions');
    const outline = document.getElementById('scene-selection-outline');
    const canvas = document.querySelector('.canvas');
    const selectBtn = document.getElementById('scene-select-btn');
    const selectLabel = document.getElementById('scene-select-label');
    if (!row || !canvas) return;

    let selection = null; // null | 'scene' | 'script' | 'text'
    let selectedTextEl = null;

    // The a-roll uses object-fit:contain — compute the visible frame rect
    // (canvas-relative) so the row hugs the rendered image, not the wrapper.
    function frameRect() {
      const c = canvas.getBoundingClientRect();
      const img = document.querySelector('.canvas-scene-wrapper.w--tab-active .canvas-scene-a-roll');
      if (img && img.naturalWidth) {
        const r = img.getBoundingClientRect();
        const scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        return {
          left: r.left - c.left + (r.width - w) / 2,
          top: r.top - c.top + (r.height - h) / 2,
          width: w,
          height: h
        };
      }
      // Title scenes render a letterboxed 16:9 div instead of an image
      const bg = document.querySelector('.canvas-scene-wrapper.w--tab-active .scene-black-bg');
      if (!bg) return null;
      const r = bg.getBoundingClientRect();
      return { left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height };
    }

    function targetRect() {
      if (selection === 'text' && selectedTextEl) {
        const r = selectedTextEl.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();
        return { left: r.left - c.left, top: r.top - c.top, width: r.width, height: r.height };
      }
      return frameRect();
    }

    function sync() {
      const rect = targetRect();
      if (!rect) return;
      // Layer selections anchor the buttons inside the bounding box (top right);
      // scene mode keeps the row above the frame.
      const inside = row.classList.contains('is-layer-mode') && rect.height >= 72;
      const layerMode = row.classList.contains('is-layer-mode');
      row.style.left = Math.round(rect.left + (inside ? 8 : 0)) + 'px';
      row.style.width = Math.round(rect.width - (inside ? 16 : 0)) + 'px';
      row.style.top = Math.round(inside ? rect.top + 8
        : layerMode ? Math.max(4, rect.top - 24 - 6)
        : Math.max(4, rect.top - 24 - 8)) + 'px';
      outline.style.left = Math.round(rect.left - 3) + 'px';
      outline.style.top = Math.round(rect.top - 3) + 'px';
      outline.style.width = Math.round(rect.width + 6) + 'px';
      outline.style.height = Math.round(rect.height + 6) + 'px';
    }

    window.addEventListener('resize', sync);
    window.addEventListener('load', sync);
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(canvas);

    // Track scene switches: update the label, clear selection, re-anchor
    document.querySelectorAll('.canvas-scene-thumbnail').forEach((thumb, i) => {
      thumb.addEventListener('click', () => {
        if (selectLabel) selectLabel.textContent = 'Scene ' + (i + 1);
        setSelected(false);
        setTimeout(sync, 0);
      });
    });
    sync();

    // --- Selection: the scene itself, or a layer within it (pink outline) ---
    const canvasToolbar = document.querySelector('.canvas-toolbar');
    function setInspectorState(kind) {
      document.querySelectorAll('[data-panel="inspector"] .si-state').forEach(el => {
        el.style.display = el.dataset.state === (kind || 'scene') ? '' : 'none';
      });
    }

    function applySelection(kind, el) {
      selection = kind;
      selectedTextEl = kind === 'text' ? (el || selectedTextEl) : null;
      document.querySelectorAll('.canvas-text-layer').forEach(l =>
        l.classList.toggle('is-selected', kind === 'text' && l === selectedTextEl));
      selectBtn?.classList.toggle('is-selected', kind === 'scene');
      outline?.classList.toggle('is-hidden', !kind);
      canvasToolbar?.classList.toggle('is-scene-selected', kind === 'scene');
      canvasToolbar?.classList.toggle('is-script-selected', kind === 'script');
      canvasToolbar?.classList.toggle('is-text-selected', kind === 'text');
      if (kind !== 'text') canvasToolbar?.classList.remove('is-textstyle');
      // Layer selection shows only the icon buttons — no scene label
      row.classList.toggle('is-layer-mode', kind === 'script' || kind === 'text');
      row.classList.toggle('layer-no-qe', kind === 'script');
      setInspectorState(kind === 'script' ? 'script' : kind === 'text' ? 'text' : 'scene');
      syncPin();
      // Always re-anchor: after a deselect the row must move back above the
      // frame, not linger at the in-layer position from the last selection
      sync();
    }
    window._applyCanvasSelection = applySelection;
    function setSelected(v) { applySelection(v ? 'scene' : null); }
    selectBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      applySelection(selection === 'scene' ? null : 'scene');
    });
    // Clicking the a-roll selects the script layer; canvas background deselects
    canvas.addEventListener('click', e => {
      if (e.target.closest('#scene-actions')) return;
      const textLayer = e.target.closest('.canvas-text-layer');
      if (textLayer) {
        applySelection('text', textLayer);
        return;
      }
      if (e.target.classList && e.target.classList.contains('canvas-scene-a-roll')) {
        applySelection('script');
        return;
      }
      applySelection(null);
    });
    // The script layer is also selectable from the timeline
    document.querySelector('.script-layer-wrapper')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      applySelection('script');
    });

    // --- Pin the row while a tool is open or something is selected ---
    let slimOpenFromScene = false;
    function syncPin() {
      const qeOpen = qeDialog && !qeDialog.classList.contains('is-hidden');
      row.classList.toggle('is-pinned', !!qeOpen || slimOpenFromScene || !!selection);
    }
    document.addEventListener('slim-underlord-closed', () => {
      slimOpenFromScene = false;
      syncPin();
    });

    // --- Underlord: slim input in line with the trigger, canvas toolbar stays put ---
    const sceneUnderlordBtn = document.getElementById('scene-underlord-btn');
    sceneUnderlordBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      closeQuickEdits(); // never both open
      slimOpenFromScene = true;
      syncPin();
      window._openSlimUnderlord?.(sceneUnderlordBtn.getBoundingClientRect(), { over: true });
    });

    // --- Quick edits dialog ---
    const qeDialog = document.getElementById('quick-edits-dialog');
    const qeBtn = document.getElementById('scene-quick-edits-btn');
    const lpDialog = document.getElementById('layout-pack-dialog');

    function closeQuickEdits() {
      qeDialog?.classList.add('is-hidden');
      lpDialog?.classList.add('is-hidden');
      syncPin();
    }

    qeBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!qeDialog) return;
      if (!qeDialog.classList.contains('is-hidden')) { closeQuickEdits(); return; }
      window._closeSlimUnderlord?.(); // never both open
      // Text layers get their own quick edits (source + type controls)
      const isText = selection === 'text';
      qeDialog.classList.toggle('is-text-mode', isText);
      const qeTitle = qeDialog.querySelector('.qe-title');
      if (qeTitle) qeTitle.textContent = isText ? 'Text layer' : 'Quick edits';
      if (isText) document.dispatchEvent(new CustomEvent('study-text-quickedits-open'));
      qeDialog.classList.remove('is-hidden');
      const r = qeBtn.getBoundingClientRect();
      const w = qeDialog.offsetWidth;
      qeDialog.style.top = (r.bottom + 6) + 'px';
      // Scene mode hangs off the chip's right edge; text mode hangs off its
      // left so the dialog stays beside the layer instead of covering it
      const left = isText ? r.left : r.right - w;
      qeDialog.style.left = Math.max(8, Math.min(left, window.innerWidth - w - 8)) + 'px';
      syncPin();
    });

    document.getElementById('qe-collapse-btn')?.addEventListener('click', e => {
      e.preventDefault();
      closeQuickEdits();
    });

    document.getElementById('qe-inspector-btn')?.addEventListener('click', e => {
      e.preventDefault();
      closeQuickEdits();
      window._toggleSidebarPanel?.('inspector');
    });

    // Scene layout row opens the Brand kit layout pack menu alongside
    document.getElementById('qe-layout-row')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!lpDialog || !qeDialog) return;
      if (!lpDialog.classList.contains('is-hidden')) { lpDialog.classList.add('is-hidden'); return; }
      lpDialog.classList.remove('is-hidden');
      const qr = qeDialog.getBoundingClientRect();
      const lw = lpDialog.offsetWidth;
      const lh = lpDialog.offsetHeight;
      let left = qr.left - lw - 8;
      if (left < 8) left = Math.min(qr.right + 8, window.innerWidth - lw - 8);
      lpDialog.style.left = Math.round(left) + 'px';
      lpDialog.style.top = Math.round(Math.max(8, Math.min(qr.top, window.innerHeight - lh - 8))) + 'px';
    });

    document.addEventListener('click', e => {
      if (qeDialog && !qeDialog.classList.contains('is-hidden') &&
          !e.target.closest('#quick-edits-dialog') &&
          !e.target.closest('#scene-quick-edits-btn') &&
          !e.target.closest('#layout-pack-dialog')) {
        closeQuickEdits();
      }
    });

    // --- Layers dropdown (canvas Layers button) ---
    const layersBtn = document.getElementById('toggle-layers-menu');
    const layersMenu = document.getElementById('layers-menu');

    layersBtn?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (!layersMenu) return;
      if (!layersMenu.classList.contains('is-hidden')) {
        layersMenu.classList.add('is-hidden');
        return;
      }
      const r = layersBtn.getBoundingClientRect();
      layersMenu.style.top = (r.bottom + 6) + 'px';
      layersMenu.style.left = r.left + 'px';
      layersMenu.classList.remove('is-hidden');
    });

    document.addEventListener('click', e => {
      if (layersMenu && !layersMenu.classList.contains('is-hidden') &&
          !e.target.closest('#layers-menu') &&
          !e.target.closest('#toggle-layers-menu')) {
        layersMenu.classList.add('is-hidden');
      }
    });

    // Script layer: selects the script video layer on the canvas
    document.getElementById('layers-item-script')?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      layersMenu?.classList.add('is-hidden');
      applySelection('script');
    });

    // Other layers (music) are inert
    layersMenu?.querySelectorAll('.si-layer-row:not(#layers-item-script)').forEach(item => {
      item.addEventListener('click', e => e.preventDefault());
    });

    // --- Text layers: selectable from timeline rows + layers menus ---
    function speakerLayer(key) {
      return document.querySelector(`.speaker-layer[data-text-layer="${key}"]`);
    }
    document.querySelectorAll('.timeline-text-layers .timeline-layer').forEach((tl, i) => {
      tl.addEventListener('click', e => {
        e.stopPropagation();
        const el = speakerLayer(i === 0 ? 'name' : 'title');
        if (el && document.body.classList.contains('has-speaker-layers')) {
          applySelection('text', el);
        }
      });
    });
    document.querySelectorAll('#layers-menu [data-text-layer], [data-panel="inspector"] [data-text-layer]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        layersMenu?.classList.add('is-hidden');
        const el = speakerLayer(item.dataset.textLayer);
        if (el) applySelection('text', el);
      });
    });

    // --- Text style nested toolbar (smooth swap within the toolbar) ---
    document.getElementById('toolbar-text-style-btn')?.addEventListener('click', e => {
      e.preventDefault();
      canvasToolbar?.classList.add('is-textstyle');
    });
    document.getElementById('toolbar-textstyle-back')?.addEventListener('click', e => {
      e.preventDefault();
      canvasToolbar?.classList.remove('is-textstyle');
    });
    // Style actions just close the nested toolbar (study task ends here)
    document.querySelectorAll('.textstyle-action').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('study-textstyle-click'));
      });
    });

    // --- Effects menu (script toolbar "Effects" + inspector audio effects +) ---
    const effectsMenu = document.getElementById('effects-menu');
    function openEffectsMenu(anchor) {
      if (!effectsMenu) return;
      if (!effectsMenu.classList.contains('is-hidden')) {
        effectsMenu.classList.add('is-hidden');
        return;
      }
      const r = anchor.getBoundingClientRect();
      const h = 4 + 4 * 28; // approx menu height
      effectsMenu.classList.remove('is-hidden');
      const mh = effectsMenu.offsetHeight || h;
      const top = r.top - mh - 6 >= 8 ? r.top - mh - 6 : r.bottom + 6;
      effectsMenu.style.top = Math.round(top) + 'px';
      effectsMenu.style.left = Math.round(Math.max(8, Math.min(r.left, window.innerWidth - effectsMenu.offsetWidth - 8))) + 'px';
    }
    document.querySelectorAll('.toolbar-effects-btn, .si-effects-add').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openEffectsMenu(btn);
      });
    });
    document.addEventListener('click', e => {
      if (effectsMenu && !effectsMenu.classList.contains('is-hidden') &&
          !e.target.closest('#effects-menu') &&
          !e.target.closest('.toolbar-effects-btn') &&
          !e.target.closest('.si-effects-add')) {
        effectsMenu.classList.add('is-hidden');
      }
    });
    effectsMenu?.querySelectorAll('.sel-ignore-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        effectsMenu.classList.add('is-hidden');
      });
    });

    // --- Layout entry points all open the layout pack dialog ---
    document.querySelectorAll('.toolbar-layout-btn, [data-panel="inspector"] .si-layout-select').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!lpDialog) return;
        if (!lpDialog.classList.contains('is-hidden')) { lpDialog.classList.add('is-hidden'); return; }
        lpDialog.classList.remove('is-hidden');
        const r = btn.getBoundingClientRect();
        const lw = lpDialog.offsetWidth;
        const lh = lpDialog.offsetHeight;
        let left = Math.max(8, Math.min(r.left, window.innerWidth - lw - 8));
        let top = r.top - lh - 6 >= 8 ? r.top - lh - 6 : Math.min(r.bottom + 6, window.innerHeight - lh - 8);
        lpDialog.style.left = Math.round(left) + 'px';
        lpDialog.style.top = Math.round(Math.max(8, top)) + 'px';
      });
    });
  }

  // --- Captions panel: style card selection ---
  function initCaptionStyles() {
    const cards = document.querySelectorAll('.caption-style-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
      });
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
    initDropdownDialog('composition-menu-btn', 'composition-menu-dialog', false);
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
    initFindDialog();
    initSelectionToolbar();
    initSceneActions();
    initCaptionStyles();
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

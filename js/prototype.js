(() => {
  'use strict';

  // --- Tab System ---
  function initTabs() {
    document.querySelectorAll('.w-tabs').forEach(tabGroup => {
      const links = tabGroup.querySelectorAll('.w-tab-link');
      const panes = tabGroup.querySelectorAll('.w-tab-pane');
      const isCanvasToolbar = tabGroup.closest('.canvas-toolbar') !== null;

      links.forEach((link, i) => {
        link.addEventListener('click', e => {
          e.preventDefault();
          links.forEach(l => l.classList.remove('w--current'));
          panes.forEach(p => p.classList.remove('w--tab-active'));
          link.classList.add('w--current');
          if (panes[i]) panes[i].classList.add('w--tab-active');

          if (isCanvasToolbar && link.getAttribute('data-w-tab') !== 'Tab 2') {
            const toolbar = tabGroup.closest('.canvas-toolbar');
            if (toolbar && toolbar.classList.contains('is-expanded')) {
              toolbar.classList.remove('is-expanded');
              toolbar.style.width = '';
            }
          }
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

    document.getElementById('toolbar-expand')?.addEventListener('click', e => {
      e.preventDefault();
      expandToolbar();
    });

    // Clicking the collapsed fake-input also expands the toolbar
    document.getElementById('toolbar-fake-input')?.addEventListener('click', e => {
      if (!canvasToolbar.classList.contains('is-expanded')) {
        e.preventDefault();
        expandToolbar();
      }
    });

    document.getElementById('toolbar-collapse')?.addEventListener('click', e => {
      e.preventDefault();
      collapseToolbar();
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

  // --- Init ---
  function init() {
    initTabs();
    initSliders();
    initToggles();
    initSceneListScroll();
    initLeftSidebar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

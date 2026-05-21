(() => {
  'use strict';

  // --- Tab System ---
  function initTabs() {
    document.querySelectorAll('.w-tabs').forEach(tabGroup => {
      const links = tabGroup.querySelectorAll('.w-tab-link');
      const panes = tabGroup.querySelectorAll('.w-tab-pane');

      links.forEach((link, i) => {
        link.addEventListener('click', e => {
          e.preventDefault();
          links.forEach(l => l.classList.remove('w--current'));
          panes.forEach(p => p.classList.remove('w--tab-active'));
          link.classList.add('w--current');
          if (panes[i]) panes[i].classList.add('w--tab-active');
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

      if (toggleScriptOpen) toggleScriptOpen.classList.toggle('is-hidden-smooth', scriptOpen);
      if (dividerScript) dividerScript.classList.toggle('is-hidden-smooth', scriptOpen);
      if (toggleSidebar) toggleSidebar.classList.toggle('is-hidden-smooth', sidebarOpen);

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

    document.getElementById('toggle-script-closed')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(scriptWrapper);
    });

    document.getElementById('toggle-script-open')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(scriptWrapper);
    });

    document.getElementById('toggle-sidebar')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(sidebarPane);
    });

    document.getElementById('toggle-sidebar-closed')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(sidebarPane);
    });

    document.getElementById('toggle-properties')?.addEventListener('click', e => {
      e.preventDefault();
      togglePanel(sidebarPane);
    });

    document.getElementById('toggle-toolbar-collapsed')?.addEventListener('click', e => {
      e.preventDefault();
      const toolbarGroup = e.currentTarget.closest('.canvas-toolbar-group.collapsible');
      if (toolbarGroup) toolbarGroup.classList.toggle('is-collapsed');
    });

    syncConditionalButtons();

    document.addEventListener('panelstatechange', syncConditionalButtons);
  }

  // --- Init ---
  function init() {
    initTabs();
    initSliders();
    initToggles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

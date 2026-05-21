(() => {
  'use strict';

  // --- Time Strip Segment Component ---
  class TimeStripSegment extends HTMLElement {
    connectedCallback() {
      const label = this.getAttribute('label') || '';
      let html = '';
      for (let i = 0; i < 18; i++) {
        html += '<div class="time-strip-tic"></div>';
      }
      html += `<div class="time-strip-tic large"><div class="time-strip-tic-label">${label}</div></div>`;
      html += '<div class="time-strip-tic spacer"></div>';
      this.className = 'time-strip-segment';
      this.innerHTML = html;
    }
  }

  // --- Scene Thumbnail Component ---
  class SceneThumbnail extends HTMLElement {
    connectedCallback() {
      const src = this.getAttribute('src') || '';
      const srcset = this.getAttribute('data-srcset') || '';
      const label = this.getAttribute('label') || '';
      const tab = this.getAttribute('tab') || '';
      const active = this.hasAttribute('active');

      this.className = `canvas-scene-thumbnail w-inline-block w-tab-link${active ? ' w--current' : ''}`;
      this.setAttribute('data-w-tab', tab);
      this.innerHTML = `
        <div class="canvas-scene-thumbnail-label">${label}</div>
        <img src="${src}" loading="lazy" sizes="(max-width: 479px) 87vw, (max-width: 767px) 92vw, (max-width: 991px) 94vw, (max-width: 2061px) 97vw, 2000px" srcset="${srcset}" alt="" class="canvas-thumbnail-image">
      `;
    }
  }

  // --- Scene Pane Component ---
  class ScenePane extends HTMLElement {
    connectedCallback() {
      const src = this.getAttribute('src') || '';
      const srcset = this.getAttribute('data-srcset') || '';
      const tab = this.getAttribute('tab') || '';
      const active = this.hasAttribute('active');

      this.className = `canvas-scene-wrapper w-tab-pane${active ? ' w--tab-active' : ''}`;
      this.setAttribute('data-w-tab', tab);
      this.innerHTML = `<img sizes="100vw" srcset="${srcset}" alt="" src="${src}" loading="lazy" class="canvas-scene-a-roll">`;
    }
  }

  // --- Icon Button Component ---
  class IconButton extends HTMLElement {
    connectedCallback() {
      const icon = this.getAttribute('icon') || '';
      const variant = this.getAttribute('variant') || '';
      const id = this.getAttribute('button-id') || '';

      const classes = ['icon-button', ...variant.split(' ').filter(Boolean)];
      this.className = classes.join(' ');
      this.setAttribute('href', '#');
      if (id) this.id = id;

      const tag = this.hasAttribute('static') ? 'div' : 'a';
      if (tag === 'a') {
        this.classList.add('w-inline-block');
      }

      this.innerHTML = `<div class="icon ${icon}"></div>`;
    }
  }

  // --- Timeline Layer Component ---
  class TimelineLayer extends HTMLElement {
    connectedCallback() {
      const type = this.getAttribute('type') || '';
      const icon = this.getAttribute('icon') || '';
      const label = this.getAttribute('label') || '';
      const nodeId = this.getAttribute('node-id') || '';

      this.className = `timeline-layer ${type}`;
      if (nodeId) this.id = nodeId;

      this.innerHTML = `
        <div class="layer-title ${type}">
          <div class="icon ${icon}"></div>
          <div>${label}</div>
        </div>
        <div class="timeline-layer-stroke ${type}"></div>
        <div class="timeline-layer-fill ${type}"></div>
      `;
    }
  }

  // --- Register Components ---
  customElements.define('time-strip-segment', TimeStripSegment);
  customElements.define('scene-thumbnail', SceneThumbnail);
  customElements.define('scene-pane', ScenePane);
  customElements.define('icon-btn', IconButton);
  customElements.define('timeline-layer-el', TimelineLayer);
})();

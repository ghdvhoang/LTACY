(function defineBootstrap(root) {
  'use strict';

  function start() {
    const document = root.document;
    const app = document?.getElementById('app');
    if (!app) return null;
    const storage = root.localStorage;
    const store = root.YC.store.create({ storage });
    const bus = root.YC.commands.create(store);
    const toastRoot = document.getElementById('toast-root');
    let toastTimer = null;

    function toast(message, kind = 'info') {
      if (!toastRoot) return;
      root.clearTimeout(toastTimer);
      toastRoot.innerHTML = `<div class="toast toast-${kind}" role="status"><span>${kind === 'error' ? '!' : '✓'}</span><p>${root.YC.utils.escapeHtml(message)}</p><button type="button" aria-label="Đóng" data-action="dismiss-toast">×</button></div>`;
      toastTimer = root.setTimeout(() => { toastRoot.innerHTML = ''; }, 4200);
    }

    function path() {
      const hash = String(root.location.hash || '').replace(/^#/, '');
      return root.YC.router.normalize(hash || '/');
    }

    function actor() {
      const actorId = storage.getItem(root.YC.actions.ACTOR_KEY);
      return store.getState().users.find((item) => item.id === actorId) || null;
    }

    function context() {
      const state = store.getState();
      const currentActor = actor();
      const selectedLearner = storage.getItem(root.YC.actions.LEARNER_KEY);
      return {
        state,
        actor: currentActor,
        learnerId: selectedLearner || currentActor?.linkedLearnerIds?.[0] || state.demo.canonicalLearnerId,
        path: path(),
      };
    }

    function render() {
      const currentPath = path();
      app.innerHTML = root.YC.router.frame(currentPath, context());
      document.title = currentPath.startsWith('/app/') ? 'Yen Center · Workspace Demo' : 'Yen Center · Learning Journey Demo';
      document.body.classList.toggle('is-app', currentPath.startsWith('/app/'));
    }

    const controller = root.YC.actions.create({ store, bus, storage, location: root.location, onChange: render, onToast: toast });

    function payloadFrom(element) {
      if (!element.dataset.payload) return {};
      try { return JSON.parse(decodeURIComponent(element.dataset.payload)); } catch (_error) { return {}; }
    }

    function hide(selector) {
      const element = document.querySelector(selector);
      if (element) element.hidden = true;
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;
      const action = trigger.dataset.action;
      if (action === 'dismiss-toast') { toastRoot.innerHTML = ''; return; }
      if (action === 'toggle-sidebar') { document.body.classList.toggle('sidebar-collapsed'); return; }
      if (action === 'toggle-mobile-nav') { document.body.classList.toggle('mobile-nav-open'); return; }
      if (action === 'open-role-switcher') { const element = document.querySelector('[data-role-switcher]'); if (element) element.hidden = false; return; }
      if (action === 'close-role-switcher') { hide('[data-role-switcher]'); return; }
      if (action === 'show-notifications') { const element = document.querySelector('[data-notification-drawer]'); if (element) element.hidden = false; return; }
      if (action === 'close-notifications') { hide('[data-notification-drawer]'); return; }
      const data = { ...payloadFrom(trigger), actorId: trigger.dataset.actorId, learnerId: trigger.dataset.learnerId };
      trigger.disabled = true;
      const result = controller.execute(action, data);
      if (result?.ok === false) toast(result.message, 'error');
    });

    root.addEventListener('hashchange', () => {
      document.body.classList.remove('mobile-nav-open');
      if (root.scrollTo) root.scrollTo({ top: 0, behavior: 'instant' });
      render();
    });

    if (!root.location.hash) root.location.hash = '#/';
    render();
    return Object.freeze({ store, bus, controller, render });
  }

  root.YC.define('bootstrap', Object.freeze({ start }));
  if (root.document) start();
})(globalThis);

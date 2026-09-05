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
    let quizTimer = null;
    let videoTimer = null;

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
      const currentPath = path();
      const attendanceSessionId = /^\/app\/teacher\/sessions\/([^/]+)\/attendance$/.exec(currentPath)?.[1];
      return {
        state,
        actor: currentActor,
        learnerId: selectedLearner || currentActor?.linkedLearnerIds?.[0] || state.demo.canonicalLearnerId,
        attendanceDraft: attendanceSessionId ? controller.getAttendanceDraft(attendanceSessionId) : {},
        path: currentPath,
      };
    }

    function render() {
      const currentPath = path();
      app.innerHTML = root.YC.router.frame(currentPath, context());
      document.title = currentPath.startsWith('/app/') ? 'Yen Center · Khu vực làm việc' : 'Yen Center · Hành trình học tập';
      document.body.classList.toggle('is-app', currentPath.startsWith('/app/'));
      root.clearInterval(quizTimer);
      const timer = document.querySelector('[data-quiz-timer]');
      if (timer) {
        let remaining = Number(timer.dataset.seconds || 900);
        quizTimer = root.setInterval(() => {
          remaining = Math.max(0, remaining - 1);
          const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
          const seconds = String(remaining % 60).padStart(2, '0');
          if (timer.isConnected) timer.textContent = `${minutes}:${seconds}`;
          if (!remaining) root.clearInterval(quizTimer);
        }, 1000);
      }
    }

    function download(name, content) {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }

    function legacyCopy(value) {
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try { document.execCommand('copy'); } catch (_error) { /* Trình duyệt không hỗ trợ. */ }
      field.remove();
    }

    function copy(value) {
      if (root.navigator?.clipboard?.writeText) {
        root.navigator.clipboard.writeText(value).catch(() => legacyCopy(value));
        return;
      }
      legacyCopy(value);
    }

    const controller = root.YC.actions.create({ store, bus, storage, location: root.location, onChange: render, onToast: toast, onDownload: download, onPrint: () => root.print(), onCopy: copy });

    function payloadFrom(element) {
      if (!element.dataset.payload) return {};
      try { return JSON.parse(decodeURIComponent(element.dataset.payload)); } catch (_error) { return {}; }
    }

    function hide(selector) {
      const element = document.querySelector(selector);
      if (element) element.setAttribute('hidden', '');
    }

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-action]');
      if (!trigger) return;
      const action = trigger.dataset.action;
      if (action === 'dismiss-toast') { toastRoot.innerHTML = ''; return; }
      if (action === 'toggle-sidebar') { document.body.classList.toggle('sidebar-collapsed'); return; }
      if (action === 'toggle-mobile-nav') { document.body.classList.toggle('mobile-nav-open'); return; }
      if (action === 'open-role-switcher') { const element = document.querySelector('[data-role-switcher]'); if (element) element.removeAttribute('hidden'); return; }
      if (action === 'close-role-switcher') { hide('[data-role-switcher]'); return; }
      if (action === 'show-notifications') { const element = document.querySelector('[data-notification-drawer]'); if (element) element.removeAttribute('hidden'); return; }
      if (action === 'close-notifications') { hide('[data-notification-drawer]'); return; }
      if (action === 'open-add-student') { document.querySelector('[data-add-student-dialog]')?.showModal(); return; }
      if (action === 'close-add-student') { document.querySelector('[data-add-student-dialog]')?.close(); return; }
      if (action === 'fill-demo-quiz') { document.querySelectorAll('[data-demo-answer]').forEach((input) => { input.checked = true; }); toast('Đã điền bộ đáp án demo 8/10.', 'info'); return; }
      if (action === 'toggle-video') {
        if (videoTimer) { root.clearInterval(videoTimer); videoTimer = null; return; }
        const assignmentId = trigger.dataset.assignmentId;
        videoTimer = root.setInterval(() => {
          const assignment = store.getState().remedialAssignments.find((item) => item.id === assignmentId);
          if (!assignment || assignment.videoProgress >= 100) { root.clearInterval(videoTimer); videoTimer = null; return; }
          controller.execute('video-progress', { assignmentId, progress: Math.min(100, Number(assignment.videoProgress || 0) + 5), silent: true });
        }, 500);
        return;
      }
      const data = { ...payloadFrom(trigger), actorId: trigger.dataset.actorId, learnerId: trigger.dataset.learnerId, sessionId: trigger.dataset.sessionId, assignmentId: trigger.dataset.assignmentId, documentId: trigger.dataset.documentId, status: trigger.dataset.status, progress: trigger.dataset.progress };
      if (action === 'revoke-remedial-link') {
        if (root.confirm && !root.confirm('Thu hồi liên kết học bù này? Học viên sẽ không thể mở liên kết hiện tại.')) return;
        data.reason = 'Giáo viên xác nhận thu hồi từ màn quản lý.';
      }
      if (action === 'extend-remedial-deadline' && root.prompt) {
        const days = root.prompt('Gia hạn thêm bao nhiêu ngày? (1–30)', '3');
        if (days === null) return;
        const reason = root.prompt('Lý do gia hạn', 'Học viên cần thêm thời gian hoàn thành');
        if (reason === null) return;
        data.days = days;
        data.reason = reason;
      }
      trigger.disabled = true;
      const result = controller.execute(action, data);
      if (result?.ok === false) toast(result.message, 'error');
      if (trigger.isConnected) trigger.disabled = false;
    });

    document.addEventListener('submit', (event) => {
      const form = event.target.closest('form[data-form]');
      if (!form) return;
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const values = new FormData(form);
      let action = '';
      let data = {};
      if (form.dataset.form === 'login') { action = 'credential-login'; data = { identifier: values.get('identifier'), secret: values.get('secret') }; }
      if (form.dataset.form === 'forgot') { action = 'request-otp'; data = { identifier: values.get('identifier') }; }
      if (form.dataset.form === 'otp') { action = 'verify-otp'; data = { otp: values.get('otp') }; }
      if (form.dataset.form === 'quiz') { action = 'submit-quiz'; data = { assignmentId: form.dataset.assignmentId, answers: Array.from(form.querySelectorAll('.question-card'), (_card, index) => { const selected = form.querySelector(`input[name="answer-${index}"]:checked`); return selected ? Number(selected.value) : null; }) }; }
      if (form.dataset.form === 'public-lead') { action = 'submit-public-lead'; data = { type: form.dataset.type, name: values.get('name'), studentName: values.get('studentName'), organization: values.get('organization'), phone: values.get('phone'), email: values.get('email'), message: values.get('message') }; }
      if (form.dataset.form === 'add-student') { action = 'add-learner'; data = { code: values.get('code'), name: values.get('name'), phone: values.get('phone'), classId: values.get('classId') }; }
      if (form.dataset.form === 'settings') { action = 'update-settings'; data = { minimumVideoProgress: values.get('minimumVideoProgress'), defaultPassingScore: values.get('defaultPassingScore'), remedialDeadlineDays: values.get('remedialDeadlineDays') }; }
      if (!action) return;
      const result = controller.execute(action, data);
      if (result?.ok === false) toast(result.message, 'error');
    });

    document.addEventListener('change', (event) => {
      const trigger = event.target.closest('[data-action="lead-status"]');
      if (!trigger) return;
      const result = controller.execute('lead-status', { leadId: trigger.dataset.leadId, status: trigger.value });
      if (result?.ok === false) toast(result.message, 'error');
    });

    document.addEventListener('input', (event) => {
      const field = event.target.closest('.topbar-search input');
      if (!field) return;
      const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const query = normalize(field.value).trim();
      document.querySelectorAll('#main-content tbody tr, #main-content .queue-card, #main-content .candidate-card, #main-content .learning-list > article, #main-content .lesson-plan, #main-content .lesson-row, #main-content .task-list > a').forEach((item) => {
        item.hidden = Boolean(query) && !normalize(item.textContent).includes(query);
      });
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

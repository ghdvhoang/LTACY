(function defineActions(root) {
  'use strict';

  const ACTOR_KEY = 'yc.demo.actorId';
  const LEARNER_KEY = 'yc.demo.learnerId';

  function create({ store, bus, storage, location, onChange = () => {}, onToast = () => {} }) {
    function state() {
      return store.getState();
    }

    function persistActor(actorId) {
      if (storage) storage.setItem(ACTOR_KEY, actorId);
    }

    function runCommands(commands) {
      const completed = [];
      for (const item of commands) {
        const result = bus.dispatch(item.name, item.payload, item.actorId);
        if (!result.ok) {
          onToast(result.message, 'error');
          onChange();
          return { ...result, completed };
        }
        completed.push({ name: item.name, result });
      }
      return { ok: true, completed };
    }

    function runCanonicalNext({ navigate = true } = {}) {
      const step = root.YC.demoGuide.nextStep(state());
      if (!step.commands.length) {
        onToast('Hành trình canonical đã hoàn tất.', 'success');
        onChange();
        return { ok: true, done: true, message: 'Hành trình canonical đã hoàn tất.' };
      }
      const result = runCommands(step.commands);
      if (!result.ok) return result;
      persistActor(step.actorId);
      if (navigate && location && !String(location.hash || '').includes('/demo-guide')) location.hash = `#${step.route}`;
      onToast(`${step.label}: đã lưu evidence.`, 'success');
      onChange();
      return { ok: true, message: `${step.label}: đã lưu evidence.`, step, completed: result.completed };
    }

    function runCanonicalAll() {
      const completed = [];
      for (let index = 0; index < 32; index += 1) {
        const step = root.YC.demoGuide.nextStep(state());
        if (!step.commands.length) {
          onToast('Hành trình canonical đã hoàn tất từ lead đến renewal.', 'success');
          onChange();
          return { ok: true, done: true, completed, message: 'Hành trình canonical đã hoàn tất từ lead đến renewal.' };
        }
        const result = runCommands(step.commands);
        if (!result.ok) return result;
        completed.push(...result.completed);
        persistActor(step.actorId);
      }
      const result = { ok: false, code: 'DEMO_LOOP_GUARD', message: 'Demo dừng vì vượt quá số bước an toàn.' };
      onToast(result.message, 'error');
      return result;
    }

    function execute(action, data = {}) {
      if (action === 'canonical-next') return runCanonicalNext({ navigate: true });
      if (action === 'canonical-run-all') return runCanonicalAll();
      if (action === 'login') {
        const actor = state().users.find((item) => item.id === data.actorId);
        if (!actor) return { ok: false, code: 'ACTOR_NOT_FOUND', message: 'Không tìm thấy vai trò demo.' };
        persistActor(actor.id);
        if (location) location.hash = `#${root.YC.selectors.roleHome(actor.role)}`;
        onToast(`Đang mở workspace ${root.YC.router.ROLE_LABELS[actor.role] || actor.role}.`, 'success');
        onChange();
        return { ok: true, actorId: actor.id };
      }
      if (action === 'reset-demo') {
        store.reset();
        if (storage) storage.removeItem(LEARNER_KEY);
        onToast('Đã reset toàn bộ dữ liệu demo.', 'success');
        onChange();
        return { ok: true };
      }
      if (action === 'select-learner') {
        if (storage) storage.setItem(LEARNER_KEY, data.learnerId);
        onChange();
        return { ok: true };
      }
      if (action === 'complete-video') {
        const result = bus.dispatch('UPDATE_VIDEO_PROGRESS', { assignmentId: data.assignmentId, progress: 100 }, 'student-login-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'submit-demo-quiz') {
        const result = bus.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: data.assignmentId, answers: [1, 1, 0, 1, 1, 1, 1, 1, 0, 2] }, 'student-login-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'acknowledge-progress') {
        const result = bus.dispatch('ACKNOWLEDGE_PARENT_PROGRESS', { learnerId: data.learnerId }, 'parent-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'submit-demo-contact') {
        onToast('Đã mô phỏng gửi yêu cầu. Không có dữ liệu nào rời trình duyệt.', 'success');
        return { ok: true, mocked: true };
      }
      return { ok: false, code: 'UNKNOWN_UI_ACTION', message: `UI action không tồn tại: ${action}` };
    }

    return Object.freeze({ execute, runCanonicalAll, runCanonicalNext });
  }

  root.YC.define('actions', Object.freeze({ ACTOR_KEY, LEARNER_KEY, create }));
})(globalThis);

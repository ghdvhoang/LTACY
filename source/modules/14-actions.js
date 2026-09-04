(function defineActions(root) {
  'use strict';

  const ACTOR_KEY = 'yc.demo.actorId';
  const LEARNER_KEY = 'yc.demo.learnerId';

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  }

  function auditCsv(state) {
    const headers = ['occurredAt', 'actorId', 'action', 'resourceType', 'resourceId', 'detail'];
    return `\uFEFF${headers.map(csvCell).join(',')}\r\n${state.auditLogs.map((row) => headers.map((key) => csvCell(row[key])).join(',')).join('\r\n')}`;
  }

  function create({ store, bus, storage, location, onChange = () => {}, onToast = () => {}, onDownload = () => {}, onPrint = () => {} }) {
    const checkpointCache = new Map();

    function state() {
      return store.getState();
    }

    function persistActor(actorId) {
      if (storage) storage.setItem(ACTOR_KEY, actorId);
    }

    function loginActor(actor, { chooseProfile = false } = {}) {
      persistActor(actor.id);
      const needsProfile = chooseProfile && actor.role === 'PARENT' && (actor.linkedLearnerIds || []).length > 1;
      if (location) location.hash = needsProfile ? '#/select-profile' : `#${root.YC.selectors.roleHome(actor.role)}`;
      onToast(`Đã đăng nhập tài khoản ${root.YC.router.ROLE_LABELS[actor.role] || actor.role}.`, 'success');
      onChange();
      return { ok: true, actorId: actor.id, needsProfile };
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

    function loadCheckpoint(checkpoint) {
      const allowed = new Set(['LEAD', 'PLACEMENT', 'PAID', 'ENROLLED', 'TEACHER_ASSIGNED', 'SESSION_DELIVERED', 'REMEDIAL_ASSIGNED', 'REMEDIAL_COMPLETED', 'MODERATED', 'PROGRESS_PUBLISHED', 'PARENT_REVIEWED', 'RENEWED']);
      if (!allowed.has(checkpoint)) return { ok: false, code: 'CHECKPOINT_NOT_FOUND', message: 'Checkpoint demo không hợp lệ.' };
      if (checkpointCache.has(checkpoint)) {
        store.replace(checkpointCache.get(checkpoint));
        const cachedNext = root.YC.demoGuide.nextStep(state());
        persistActor(cachedNext.actorId);
        onToast(`Đã tải checkpoint ${checkpoint}.`, 'success');
        onChange();
        return { ok: true, checkpoint, cached: true };
      }
      store.reset();
      for (let index = 0; index < 32 && root.YC.selectors.journey(state()).status !== checkpoint; index += 1) {
        const step = root.YC.demoGuide.nextStep(state());
        if (!step.commands.length) break;
        const result = runCommands(step.commands);
        if (!result.ok) return result;
      }
      if (root.YC.selectors.journey(state()).status !== checkpoint) return { ok: false, code: 'CHECKPOINT_UNREACHABLE', message: 'Không thể tạo checkpoint từ seed hiện tại.' };
      checkpointCache.set(checkpoint, root.YC.utils.clone(state()));
      const next = root.YC.demoGuide.nextStep(state());
      persistActor(next.actorId);
      onToast(`Đã tải checkpoint ${checkpoint}.`, 'success');
      onChange();
      return { ok: true, checkpoint };
    }

    function execute(action, data = {}) {
      if (action === 'canonical-next') return runCanonicalNext({ navigate: true });
      if (action === 'canonical-run-all') return runCanonicalAll();
      if (action === 'load-checkpoint') return loadCheckpoint(data.checkpoint);
      if (action === 'login') {
        const actor = state().users.find((item) => item.id === data.actorId);
        if (!actor) return { ok: false, code: 'ACTOR_NOT_FOUND', message: 'Không tìm thấy vai trò demo.' };
        return loginActor(actor);
      }
      if (action === 'credential-login') {
        const identifier = String(data.identifier || '').trim().toLowerCase();
        const actor = state().users.find((item) => (item.identifiers || []).some((value) => String(value).toLowerCase() === identifier) && item.secret === String(data.secret || ''));
        if (!actor || actor.status !== 'ACTIVE') return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không đúng.' };
        return loginActor(actor, { chooseProfile: true });
      }
      if (action === 'logout') {
        if (storage) { storage.removeItem(ACTOR_KEY); storage.removeItem(LEARNER_KEY); }
        if (location) location.hash = '#/login';
        onToast('Đã đăng xuất khỏi phiên demo.', 'success');
        onChange();
        return { ok: true };
      }
      if (action === 'request-otp') {
        if (storage) storage.setItem('yc.demo.otp', '123456');
        if (location) location.hash = '#/verify-otp';
        onToast('Đã tạo mã xác thực mô phỏng 123456.', 'success');
        onChange();
        return { ok: true, mocked: true };
      }
      if (action === 'verify-otp') {
        const expected = storage?.getItem('yc.demo.otp') || '123456';
        if (String(data.otp || '') !== expected) return { ok: false, code: 'INVALID_OTP', message: 'Mã xác thực không đúng.' };
        if (location) location.hash = '#/login';
        onToast('Xác thực thành công. Bạn có thể đăng nhập lại.', 'success');
        onChange();
        return { ok: true };
      }
      if (action === 'select-login-profile') {
        const currentActorId = storage?.getItem(ACTOR_KEY);
        const currentActor = state().users.find((item) => item.id === currentActorId);
        if (!currentActor || !(currentActor.linkedLearnerIds || []).includes(data.learnerId)) return { ok: false, code: 'PROFILE_FORBIDDEN', message: 'Hồ sơ không thuộc tài khoản này.' };
        if (storage) storage.setItem(LEARNER_KEY, data.learnerId);
        if (location) location.hash = `#${root.YC.selectors.roleHome(currentActor.role)}`;
        onChange();
        return { ok: true };
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
      if (action === 'export-csv') {
        if (data.type !== 'audit') return { ok: false, code: 'EXPORT_NOT_FOUND', message: 'Chưa có export phù hợp.' };
        onDownload('yen-center-audit.csv', auditCsv(state()));
        onToast('Đã tạo CSV audit theo scope demo.', 'success');
        return { ok: true };
      }
      if (action === 'print-view') {
        onPrint();
        return { ok: true };
      }
      return { ok: false, code: 'UNKNOWN_UI_ACTION', message: `UI action không tồn tại: ${action}` };
    }

    return Object.freeze({ execute, loadCheckpoint, runCanonicalAll, runCanonicalNext });
  }

  root.YC.define('actions', Object.freeze({ ACTOR_KEY, LEARNER_KEY, auditCsv, create }));
})(globalThis);

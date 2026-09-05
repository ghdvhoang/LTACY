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

  function csv(headers, rows) {
    return `\uFEFF${headers.map(csvCell).join(',')}\r\n${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  }

  function exportDataset(state, type) {
    if (type === 'audit') return { name: 'yen-center-audit.csv', content: auditCsv(state) };
    if (type === 'students') return { name: 'yen-center-hoc-vien.csv', content: csv(['Mã', 'Họ tên', 'Lớp', 'Mục tiêu', 'Trạng thái'], state.learners.map((learner) => [learner.code, learner.name, state.classes.find((item) => item.id === learner.classId)?.name || '', learner.goal, learner.status])) };
    if (type === 'contacts') return { name: 'yen-center-lien-he.csv', content: csv(['Mã', 'Loại', 'Tên', 'Tổ chức/Học viên', 'Điện thoại', 'Email', 'Nhu cầu', 'Trạng thái'], state.leads.map((lead) => [lead.code, lead.type, lead.name, lead.organization || lead.studentName || '', lead.phone, lead.email, lead.message || lead.goal, lead.status])) };
    if (type === 'remedial') return { name: 'yen-center-hoc-bu.csv', content: csv(['Học viên', 'Bài học', 'Hạn', 'Video %', 'Điểm', 'Trạng thái'], state.remedialAssignments.map((item) => [state.learners.find((learner) => learner.id === item.learnerId)?.name || '', state.lessonTemplates.find((lesson) => lesson.id === item.lessonTemplateId)?.title || '', item.dueAt, item.videoProgress, item.highestScore ?? '', item.status])) };
    if (type === 'sessions') return { name: 'yen-center-buoi-hoc.csv', content: csv(['Buổi', 'Lớp', 'Bài học', 'Có mặt', 'Vắng', 'Đã giao bù'], state.sessions.map((session) => [session.startsAt, state.classes.find((item) => item.id === session.classId)?.name || '', state.lessonTemplates.find((item) => item.id === session.lessonTemplateId)?.title || '', state.attendanceRecords.filter((item) => item.sessionId === session.id && item.status === 'PRESENT').length, state.attendanceRecords.filter((item) => item.sessionId === session.id && item.status === 'ABSENT').length, state.remedialAssignments.filter((item) => item.sessionId === session.id).length])) };
    return null;
  }

  function create({ store, bus, storage, location, onChange = () => {}, onToast = () => {}, onDownload = () => {}, onPrint = () => {}, onCopy = () => {} }) {
    const attendanceDrafts = new Map();

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

    function getAttendanceDraft(sessionId) {
      return { ...(attendanceDrafts.get(sessionId) || {}) };
    }

    function execute(action, data = {}) {
      if (action === 'login') {
        const actor = state().users.find((item) => item.id === data.actorId);
        if (!actor) return { ok: false, code: 'ACTOR_NOT_FOUND', message: 'Không tìm thấy vai trò demo.' };
        return loginActor(actor);
      }
      if (action === 'register-visitor') {
        const result = bus.dispatch('REGISTER_VISITOR', data, 'public-1');
        if (!result.ok) {
          onToast(result.message, 'error');
          return result;
        }
        const visitor = state().users.find((item) => item.id === result.actorId);
        return { ...loginActor(visitor), message: result.message };
      }
      if (action === 'credential-login') {
        const identifier = String(data.identifier || '').trim().toLowerCase();
        const actor = state().users.find((item) => (item.identifiers || []).some((value) => String(value).toLowerCase() === identifier) && item.secret === String(data.secret || ''));
        if (!actor || actor.status !== 'ACTIVE') return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không đúng.' };
        return loginActor(actor, { chooseProfile: true });
      }
      if (action === 'logout') {
        const currentActor = state().users.find((item) => item.id === storage?.getItem(ACTOR_KEY));
        if (storage) { storage.removeItem(ACTOR_KEY); storage.removeItem(LEARNER_KEY); }
        if (location) location.hash = currentActor?.role === 'VISITOR' ? '#/' : '#/login';
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
      if (action === 'video-progress') {
        const result = bus.dispatch('UPDATE_VIDEO_PROGRESS', { assignmentId: data.assignmentId, progress: data.progress }, 'student-login-1');
        if (!data.silent) onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'create-content-draft') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('CREATE_CONTENT_DRAFT', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'request-course') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'admin-1';
        const result = bus.dispatch('REQUEST_CREATE_COURSE', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'request-class') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'admin-1';
        const result = bus.dispatch('REQUEST_CREATE_CLASS', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'request-session') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'admin-1';
        const result = bus.dispatch('REQUEST_CREATE_SESSION', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'mark-session-ready') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('MARK_SESSION_READY', { sessionId: data.sessionId, adaptations: ['Đã đối chiếu mục tiêu, học liệu và lưu ý học viên từ bàn điều khiển.'] }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'start-session') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('START_SESSION', { sessionId: data.sessionId }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'complete-session') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const session = state().sessions.find((item) => item.id === data.sessionId);
        const taughtItemIds = state().learningItems.filter((item) => item.lessonTemplateId === session?.lessonTemplateId).map((item) => item.id);
        const result = bus.dispatch('COMPLETE_SESSION', { sessionId: data.sessionId, taughtItemIds, deferredItemIds: [], note: 'Đã hoàn tất nội dung theo giáo án.' }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'confirm-make-up-booking') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'service-1';
        const result = bus.dispatch('CONFIRM_MAKE_UP_BOOKING', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'cancel-make-up-booking') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'service-1';
        const result = bus.dispatch('CANCEL_MAKE_UP_BOOKING', { bookingId: data.bookingId, reason: data.reason }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'set-attendance') {
        if (!['PRESENT', 'ABSENT', 'LATE'].includes(data.status)) return { ok: false, code: 'INVALID_ATTENDANCE_STATUS', message: 'Trạng thái điểm danh không hợp lệ.' };
        const draft = getAttendanceDraft(data.sessionId);
        draft[data.learnerId] = data.status;
        attendanceDrafts.set(data.sessionId, draft);
        onChange();
        return { ok: true };
      }
      if (action === 'attendance-all-present') {
        const session = state().sessions.find((item) => item.id === data.sessionId);
        if (!session) return { ok: false, code: 'SESSION_NOT_FOUND', message: 'Không tìm thấy buổi học.' };
        const learnerIds = state().enrollments.filter((item) => item.classId === session.classId && item.status === 'ACTIVE').map((item) => item.learnerId);
        attendanceDrafts.set(session.id, Object.fromEntries(learnerIds.map((learnerId) => [learnerId, 'PRESENT'])));
        onChange();
        return { ok: true };
      }
      if (action === 'reset-attendance-draft') {
        attendanceDrafts.delete(data.sessionId);
        onChange();
        return { ok: true };
      }
      if (action === 'save-attendance') {
        const session = state().sessions.find((item) => item.id === data.sessionId);
        if (!session) return { ok: false, code: 'SESSION_NOT_FOUND', message: 'Không tìm thấy buổi học.' };
        const learnerIds = state().enrollments.filter((item) => item.classId === session.classId && item.status === 'ACTIVE').map((item) => item.learnerId);
        const draft = getAttendanceDraft(session.id);
        const records = learnerIds.map((learnerId) => ({ learnerId, status: draft[learnerId] || state().attendanceRecords.find((item) => item.sessionId === session.id && item.learnerId === learnerId)?.status || 'PRESENT' }));
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('FINALIZE_ATTENDANCE', { sessionId: session.id, records }, actorId);
        if (result.ok) attendanceDrafts.delete(session.id);
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
      if (action === 'submit-quiz') {
        if (!Array.isArray(data.answers) || data.answers.some((answer) => answer === null || answer === undefined || answer === '')) return { ok: false, code: 'INCOMPLETE_ATTEMPT', message: 'Cần trả lời đầy đủ trước khi nộp bài.' };
        const result = bus.dispatch('SUBMIT_AUTO_ASSESSMENT', { assignmentId: data.assignmentId, answers: data.answers }, 'student-login-1');
        if (result.ok && location) location.hash = '#/app/student/results';
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'copy-remedial-link') {
        const assignment = state().remedialAssignments.find((item) => item.id === data.assignmentId);
        if (!assignment) return { ok: false, code: 'REMEDIAL_NOT_FOUND', message: 'Không tìm thấy bài học bù.' };
        if (assignment.accessStatus === 'REVOKED') return { ok: false, code: 'LINK_REVOKED', message: 'Liên kết đã bị thu hồi. Hãy tạo lại trước khi sao chép.' };
        const href = `${location?.origin || ''}${location?.pathname || ''}#/app/student/remedial/${assignment.id}?token=${assignment.accessToken}`;
        onCopy(href);
        onToast('Đã sao chép liên kết bài học bù.', 'success');
        return { ok: true, href };
      }
      if (action === 'regenerate-remedial-link') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('REGENERATE_REMEDIAL_LINK', { assignmentId: data.assignmentId }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'revoke-remedial-link') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('REVOKE_REMEDIAL_LINK', { assignmentId: data.assignmentId, reason: data.reason || 'Giáo viên thu hồi liên kết từ màn quản lý.' }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'extend-remedial-deadline') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'teacher-1';
        const result = bus.dispatch('EXTEND_REMEDIAL_DEADLINE', { assignmentId: data.assignmentId, days: Number(data.days || 3), reason: data.reason || 'Giáo viên gia hạn từ màn quản lý.' }, actorId);
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
      if (action === 'submit-public-lead') {
        const currentActor = state().users.find((item) => item.id === storage?.getItem(ACTOR_KEY));
        const actorId = currentActor?.role === 'VISITOR' ? currentActor.id : 'public-1';
        const result = bus.dispatch('CREATE_PUBLIC_LEAD', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'toggle-program-interest') {
        const actorId = storage?.getItem(ACTOR_KEY);
        const result = bus.dispatch('TOGGLE_PROGRAM_INTEREST', { programId: data.programId }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'register-public-event') {
        const actorId = storage?.getItem(ACTOR_KEY);
        const result = bus.dispatch('REGISTER_PUBLIC_EVENT', { eventId: data.eventId }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'add-learner') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'admin-1';
        const result = bus.dispatch('CREATE_LEARNER', data, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'lead-status') {
        const actorId = storage?.getItem(ACTOR_KEY) || 'admin-1';
        const result = bus.dispatch('UPDATE_LEAD_STATUS', { leadId: data.leadId, status: data.status }, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'mark-notifications-read') {
        const actorId = storage?.getItem(ACTOR_KEY);
        const result = bus.dispatch('MARK_NOTIFICATIONS_READ', {}, actorId);
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'mock-sync') {
        const result = bus.dispatch('RUN_MOCK_SYNC', {}, storage?.getItem(ACTOR_KEY) || 'admin-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'update-settings') {
        const result = bus.dispatch('UPDATE_SETTINGS', data, storage?.getItem(ACTOR_KEY) || 'admin-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'set-role-permission') {
        const result = bus.dispatch('SET_ROLE_PERMISSION', data, storage?.getItem(ACTOR_KEY) || 'admin-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'set-user-permission') {
        const result = bus.dispatch('SET_USER_PERMISSION_OVERRIDE', data, storage?.getItem(ACTOR_KEY) || 'admin-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'revoke-user-permission') {
        const result = bus.dispatch('REVOKE_USER_PERMISSION_OVERRIDE', data, storage?.getItem(ACTOR_KEY) || 'admin-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'submit-change-request') {
        const result = bus.dispatch('SUBMIT_CHANGE_REQUEST', data, storage?.getItem(ACTOR_KEY));
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'review-change-request') {
        const result = bus.dispatch('REVIEW_CHANGE_REQUEST', data, storage?.getItem(ACTOR_KEY) || 'admin-1');
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'withdraw-change-request') {
        const result = bus.dispatch('WITHDRAW_CHANGE_REQUEST', data, storage?.getItem(ACTOR_KEY));
        onToast(result.message, result.ok ? 'success' : 'error');
        onChange();
        return result;
      }
      if (action === 'export-csv') {
        const output = exportDataset(state(), data.type);
        if (!output) return { ok: false, code: 'EXPORT_NOT_FOUND', message: 'Chưa có dữ liệu xuất phù hợp.' };
        onDownload(output.name, output.content);
        onToast('Đã tạo tệp CSV trong trình duyệt.', 'success');
        return { ok: true };
      }
      if (action === 'download-demo-document') {
        const item = state().publicContent.documents.find((document) => document.id === data.documentId);
        if (!item) return { ok: false, code: 'DOCUMENT_NOT_FOUND', message: 'Không tìm thấy tài liệu.' };
        onDownload(`tai-lieu-${item.id}.csv`, csv(['Thuộc tính', 'Giá trị'], [['Tên tài liệu', item.title], ['Đối tượng', item.audience], ['Loại', item.type], ['Ghi chú', 'Bản tải mô phỏng trong bản giao diện']]));
        onToast('Đã tạo bản tải mô phỏng.', 'success');
        return { ok: true };
      }
      if (action === 'print-view') {
        onPrint();
        return { ok: true };
      }
      return { ok: false, code: 'UNKNOWN_UI_ACTION', message: `UI action không tồn tại: ${action}` };
    }

    return Object.freeze({ execute, getAttendanceDraft });
  }

  root.YC.define('actions', Object.freeze({ ACTOR_KEY, LEARNER_KEY, auditCsv, create, exportDataset }));
})(globalThis);

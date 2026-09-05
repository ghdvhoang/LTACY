(function defineDemoGuide(root) {
  'use strict';

  const { badge, button, icon, link, progress } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  const STEPS = Object.freeze([
    { key: 'LEAD', label: 'Tư vấn nhu cầu', role: 'ADMISSIONS', route: '/app/admissions/leads/lead-canonical', evidence: 'Tư vấn và đặt lịch' },
    { key: 'PLACEMENT', label: 'Đầu vào đa kỹ năng', role: 'ACADEMIC_MANAGER', route: '/app/admissions/placement', evidence: 'Điểm 6 kỹ năng và đề xuất' },
    { key: 'PAID', label: 'Gói học và thanh toán mô phỏng', role: 'FINANCE', route: '/app/finance/dashboard', evidence: 'Gói học, hóa đơn và sổ mô phỏng' },
    { key: 'ENROLLED', label: 'Xếp lớp phù hợp', role: 'STUDENT_SERVICE', route: '/app/service/allocation', evidence: 'Ghi danh đang hoạt động' },
    { key: 'TEACHER_ASSIGNED', label: 'Điều kiện giáo viên', role: 'ACADEMIC_MANAGER', route: '/app/academic/assignments', evidence: 'Điều kiện bắt buộc và khối lượng' },
    { key: 'SESSION_DELIVERED', label: 'Chuẩn bị và giảng dạy', role: 'TEACHER', route: '/app/teacher/sessions/session-canonical', evidence: 'Kế hoạch, nội dung đã dạy và phần thiếu' },
    { key: 'REMEDIAL_ASSIGNED', label: 'Điểm danh và học bù', role: 'TEACHER', route: '/app/teacher/sessions/session-canonical', evidence: 'Điểm danh đã chốt và một nhiệm vụ' },
    { key: 'REMEDIAL_COMPLETED', label: 'Học tập và vòng lặp bài tập', role: 'STUDENT', route: '/app/student/course', evidence: 'Video, bài kiểm tra và bài nộp lại' },
    { key: 'MODERATED', label: 'Chấm cuối khóa và kiểm duyệt', role: 'ACADEMIC_MANAGER', route: '/app/academic/moderation', evidence: 'Thang điểm và phê duyệt của người duyệt' },
    { key: 'PROGRESS_PUBLISHED', label: 'Tiến bộ và lên lớp', role: 'ACADEMIC_MANAGER', route: '/app/academic/progress-reviews', evidence: 'Bản chụp báo cáo và quyết định' },
    { key: 'PARENT_REVIEWED', label: 'Phụ huynh xem báo cáo', role: 'PARENT', route: '/app/parent/progress', evidence: 'Xác nhận theo chính sách hiển thị' },
    { key: 'RENEWED', label: 'Gia hạn cấp độ tiếp theo', role: 'ADMISSIONS', route: '/app/admissions/renewals', evidence: 'Đã chấp nhận gói A2.2' },
  ]);

  const CHECKPOINTS = Object.freeze([
    ['LEAD', 'Khách hàng'], ['PLACEMENT', 'Đầu vào'], ['PAID', 'Đã trả'], ['ENROLLED', 'Đã xếp lớp'],
    ['TEACHER_ASSIGNED', 'Giáo viên'], ['SESSION_DELIVERED', 'Buổi học'], ['REMEDIAL_ASSIGNED', 'Học bù'],
    ['REMEDIAL_COMPLETED', 'Học tập'], ['MODERATED', 'Kiểm duyệt'], ['PROGRESS_PUBLISHED', 'Tiến bộ'],
    ['PARENT_REVIEWED', 'Phụ huynh'], ['RENEWED', 'Gia hạn'],
  ]);

  function command(name, payload, actorId) {
    return { name, payload, actorId };
  }

  function nextStep(state) {
    const learnerId = state.demo.canonicalLearnerId;
    const lead = state.leads.find((item) => item.id === (state.demo.canonicalLeadId || 'lead-canonical'));
    const placement = state.placementResults.find((item) => item.leadId === lead.id);
    const offer = state.offers.find((item) => item.leadId === lead.id);
    const invoice = state.invoices.find((item) => item.leadId === lead.id);
    const payment = state.payments.find((item) => item.leadId === lead.id && item.status === 'PAID');
    const enrollment = state.enrollments.find((item) => item.learnerId === learnerId && item.status === 'ACTIVE');
    const assignment = state.teacherAssignments.find((item) => item.classId === 'class-6a' && ['PROPOSED', 'ACTIVE'].includes(item.status));
    const session = state.sessions.find((item) => item.id === 'session-canonical');
    const remedial = state.remedialAssignments.find((item) => item.learnerId === learnerId);
    const homework = state.homeworkAssignments.find((item) => item.learnerId === learnerId);
    const attempt = state.attempts.find((item) => item.assessmentId === 'assessment-final-canonical' && item.learnerId === learnerId);
    const moderation = state.moderationCases.find((item) => item.attemptId === attempt?.id);
    const report = state.progressReports.find((item) => item.learnerId === learnerId && item.status === 'PUBLISHED');
    const promotion = state.promotionDecisions.find((item) => item.learnerId === learnerId && item.status === 'FINAL');
    const parentViewed = state.domainEvents.some((item) => item.type === 'PARENT_PROGRESS_VIEWED' && item.learnerId === learnerId);
    const renewal = state.renewals.find((item) => item.learnerId === learnerId);

    if (lead.status === 'NEW') return { ...STEPS[0], actorId: 'admissions-1', action: 'Liên hệ và đặt kiểm tra đầu vào', commands: [
      command('CONTACT_LEAD', { leadId: lead.id, note: 'Mục tiêu giao tiếp A2, lịch tối Thứ 3 & 5.' }, 'admissions-1'),
      command('BOOK_PLACEMENT', { leadId: lead.id, startsAt: '2026-09-05T02:00:00.000Z', mode: 'OFFLINE' }, 'admissions-1'),
    ] };
    if (lead.status === 'CONTACTED') return { ...STEPS[0], actorId: 'admissions-1', action: 'Đặt lịch kiểm tra đầu vào', commands: [command('BOOK_PLACEMENT', { leadId: lead.id, startsAt: '2026-09-05T02:00:00.000Z', mode: 'OFFLINE' }, 'admissions-1')] };
    if (!placement) return { ...STEPS[1], actorId: 'academic-1', action: 'Ghi và công bố kết quả đầu vào', commands: [
      command('RECORD_PLACEMENT', { leadId: lead.id, frameworkLevel: 'A2', centerLevelId: 'level-a2-1', skills: { listening: 74, reading: 78, spokenInteraction: 69, spokenProduction: 66, writing: 72, language: 75 }, recommendation: 'Tiếng Anh nền tảng 6 · A2.1' }, 'academic-1'),
      command('RELEASE_PLACEMENT', { leadId: lead.id }, 'academic-1'),
    ] };
    if (placement.status === 'REVIEWED') return { ...STEPS[1], actorId: 'academic-1', action: 'Công bố kết quả đầu vào', commands: [command('RELEASE_PLACEMENT', { leadId: lead.id }, 'academic-1')] };
    if (!payment) {
      const commands = [];
      if (!offer) commands.push(command('CREATE_OFFER', { leadId: lead.id, packageId: 'package-a2-1', discount: 300000 }, 'admissions-1'));
      if (!offer || offer.status === 'DRAFT') commands.push(command('SEND_OFFER', { leadId: lead.id }, 'admissions-1'));
      if (!offer || ['DRAFT', 'SENT'].includes(offer.status)) commands.push(command('ACCEPT_OFFER', { leadId: lead.id }, 'admissions-1'));
      if (!invoice) commands.push(command('ISSUE_INVOICE', { leadId: lead.id }, 'finance-1'));
      if (!invoice || invoice.status === 'ISSUED') commands.push(command('RECORD_MOCK_PAYMENT', { leadId: lead.id, reference: 'MOCK-CANONICAL' }, 'finance-1'));
      return { ...STEPS[2], actorId: 'finance-1', action: 'Hoàn tất gói học và thanh toán mô phỏng', commands };
    }
    if (!enrollment) return { ...STEPS[3], actorId: 'service-1', action: 'Xếp vào Tiếng Anh nền tảng 6A', commands: [command('ALLOCATE_CLASS', { leadId: lead.id, classId: 'class-6a' }, 'service-1')] };
    if (!assignment) return { ...STEPS[4], actorId: 'academic-1', action: 'Match & gán Hoàng Yến', commands: [
      command('PROPOSE_TEACHER_ASSIGNMENT', { teacherId: 'teacher-1', classId: 'class-6a', workloadMinutes: 720 }, 'academic-1'),
      command('ACCEPT_TEACHER_ASSIGNMENT', { classId: 'class-6a' }, 'teacher-1'),
    ] };
    if (assignment.status === 'PROPOSED') return { ...STEPS[4], actorId: 'teacher-1', action: 'Giáo viên nhận lớp', commands: [command('ACCEPT_TEACHER_ASSIGNMENT', { classId: 'class-6a' }, 'teacher-1')] };
    if (!state.deliveryRecords.some((item) => item.sessionId === session.id)) {
      const commands = [];
      if (session.status === 'CONFIRMED') commands.push(command('MARK_SESSION_READY', { sessionId: session.id, adaptations: ['Thêm visual timeline cho past simple'] }, 'teacher-1'));
      if (['CONFIRMED', 'READY'].includes(session.status)) commands.push(command('START_SESSION', { sessionId: session.id }, 'teacher-1'));
      commands.push(command('COMPLETE_SESSION', { sessionId: session.id, taughtItemIds: ['item-past-simple-video', 'item-speaking-pairs'], deferredItemIds: ['item-pronunciation'], note: 'Pronunciation chuyển sang guided practice.' }, 'teacher-1'));
      return { ...STEPS[5], actorId: 'teacher-1', action: 'Chuẩn bị và hoàn tất buổi học', commands };
    }
    if (!remedial) return { ...STEPS[6], actorId: 'teacher-1', action: 'Chốt vắng và tạo học bù', commands: [command('FINALIZE_ATTENDANCE', { sessionId: session.id, records: [{ learnerId, status: 'ABSENT', reasonCode: 'SICK' }] }, 'teacher-1')] };
    if (remedial.status !== 'COMPLETED') {
      const commands = [];
      if (Number(remedial.videoProgress || 0) < 100) commands.push(command('UPDATE_VIDEO_PROGRESS', { assignmentId: remedial.id, progress: 100 }, 'student-login-1'));
      commands.push(command('SUBMIT_AUTO_ASSESSMENT', { assignmentId: remedial.id, answers: [1, 1, 0, 1, 1, 1, 1, 1, 0, 2] }, 'student-login-1'));
      return { ...STEPS[7], actorId: 'student-login-1', action: 'Hoàn thành video và bài kiểm tra 8/10', commands };
    }
    if (!homework) return { ...STEPS[7], actorId: 'teacher-1', action: 'Giao bài tập theo buổi học', route: '/app/teacher/grading', commands: [command('ASSIGN_HOMEWORK', { classId: 'class-6a', learnerId, title: 'Kể bằng âm thanh: cuối tuần trước' }, 'teacher-1')] };
    if (homework.status === 'ASSIGNED') return { ...STEPS[7], actorId: 'student-login-1', action: 'Học viên nộp bài lần 1', route: '/app/student/dashboard', commands: [command('SUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo.webm' }, 'student-login-1')] };
    if (homework.status === 'SUBMITTED') return { ...STEPS[7], actorId: 'teacher-1', action: 'Phản hồi và yêu cầu sửa', route: '/app/teacher/grading', commands: [
      command('GRADE_HOMEWORK', { homeworkId: homework.id, score: 58, feedback: 'Cần dùng thì quá khứ nhất quán.' }, 'teacher-1'),
      command('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1'),
      command('REQUEST_REVISION', { homeworkId: homework.id, nextAction: 'Thu lại đoạn 2' }, 'teacher-1'),
    ] };
    if (homework.status === 'FEEDBACK_READY') return { ...STEPS[7], actorId: 'teacher-1', action: 'Công bố phản hồi bài tập', route: '/app/teacher/grading', commands: [command('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1')] };
    if (homework.status === 'REVISION_REQUIRED') return { ...STEPS[7], actorId: 'student-login-1', action: 'Học viên nộp lại bài lần 2', route: '/app/student/dashboard', commands: [command('RESUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo-v2.webm' }, 'student-login-1')] };
    if (homework.status === 'RESUBMITTED') return { ...STEPS[7], actorId: 'teacher-1', action: 'Chấm lại và chấp nhận bài tập', route: '/app/teacher/grading', commands: [
      command('GRADE_HOMEWORK', { homeworkId: homework.id, score: 86, feedback: 'Thì quá khứ rõ và chính xác.' }, 'teacher-1'),
      command('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1'),
      command('ACCEPT_HOMEWORK', { homeworkId: homework.id }, 'teacher-1'),
    ] };
    if (homework.status === 'RELEASED') {
      const submission = state.homeworkSubmissions.find((item) => item.id === homework.currentSubmissionId);
      const next = Number(submission?.version || 1) > 1 ? 'ACCEPT_HOMEWORK' : 'REQUEST_REVISION';
      const payload = next === 'ACCEPT_HOMEWORK' ? { homeworkId: homework.id } : { homeworkId: homework.id, nextAction: 'Thu lại đoạn 2' };
      return { ...STEPS[7], actorId: 'teacher-1', action: next === 'ACCEPT_HOMEWORK' ? 'Chấp nhận bài tập' : 'Yêu cầu sửa bài', route: '/app/teacher/grading', commands: [command(next, payload, 'teacher-1')] };
    }
    if (!attempt) return { ...STEPS[8], actorId: 'academic-1', action: 'Chấm, kiểm duyệt và công bố cuối khóa', commands: [
      command('SUBMIT_MANUAL_GRADE', { assessmentId: 'assessment-final-canonical', learnerId, skills: { listening: 76, reading: 78, spokenInteraction: 62, spokenProduction: 61, writing: 72, language: 74 }, feedback: 'Đủ bằng chứng; kỹ năng nói sát ngưỡng.' }, 'teacher-1'),
    ], continueAfterResult: 'moderation' };
    if (!moderation) return { ...STEPS[8], actorId: 'academic-1', action: 'Mở kiểm duyệt', commands: [command('START_MODERATION', { attemptId: attempt.id }, 'academic-1')] };
    if (moderation.status !== 'APPROVED') return { ...STEPS[8], actorId: 'academic-1', action: 'Phê duyệt kiểm duyệt', commands: [command('APPROVE_MODERATION', { attemptId: attempt.id, note: 'Thang điểm và mẫu nói nhất quán.' }, 'academic-1')] };
    if (attempt.status !== 'RELEASED') return { ...STEPS[8], actorId: 'academic-1', action: 'Công bố kết quả cuối khóa', commands: [command('RELEASE_RESULT', { attemptId: attempt.id }, 'academic-1')] };
    if (!report) return { ...STEPS[9], actorId: 'academic-1', action: 'Công bố báo cáo tiến bộ', commands: [command('PUBLISH_PROGRESS_REPORT', { learnerId, narrative: 'Đã đạt chuẩn đầu ra A2.1.', nextActions: ['Tăng độ trôi chảy khi nói ở A2.2'] }, 'academic-1')] };
    if (!promotion) return { ...STEPS[9], actorId: 'academic-1', action: 'Chốt lên lớp có bằng chứng', commands: [command('DECIDE_PROMOTION', { learnerId, decision: 'PROMOTE', nextCourseVersionId: 'course-v7', overrideReason: 'Demo tăng tốc: buổi vắng đã hoàn tất bằng bài học bù có bằng chứng.', overrideEvidence: [remedial.id] }, 'academic-1')] };
    if (!parentViewed) return { ...STEPS[10], actorId: 'parent-1', action: 'Phụ huynh xem & xác nhận', commands: [command('ACKNOWLEDGE_PARENT_PROGRESS', { learnerId }, 'parent-1')] };
    if (!renewal) return { ...STEPS[11], actorId: 'admissions-1', action: 'Tạo gia hạn A2.2', commands: [command('CREATE_RENEWAL', { learnerId, packageId: 'package-a2-2' }, 'admissions-1')] };
    if (renewal.status !== 'ACCEPTED') return { ...STEPS[11], actorId: 'admissions-1', action: 'Chấp nhận gia hạn', commands: [command('ACCEPT_RENEWAL', { learnerId }, 'admissions-1')] };
    return { key: 'DONE', label: 'Hành trình đã hoàn tất', role: 'ADMISSIONS', route: '/app/admissions/renewals', actorId: 'admissions-1', action: 'Đã hoàn tất', commands: [] };
  }

  function render(ctx) {
    const journey = root.YC.selectors.journey(ctx.state);
    const next = nextStep(ctx.state);
    const learner = ctx.state.learners.find((item) => item.id === ctx.state.demo.canonicalLearnerId);
    const sessionReady = ctx.state.deliveryRecords.some((item) => item.sessionId === 'session-canonical');
    const assignment = ctx.state.remedialAssignments.find((item) => item.learnerId === learner.id);
    const completed = assignment?.status === 'COMPLETED';
    const roleLabel = (role) => root.YC.router?.ROLE_LABELS?.[role] || role.replaceAll('_', ' ');
    const coreSteps = [
      { number: 1, title: 'Giáo viên điểm danh', body: 'Đánh dấu Nguyễn Minh Anh vắng và lưu để tự động tạo bài học bù.', done: Boolean(assignment), action: sessionReady ? link('Mở màn hình điểm danh', '/app/teacher/sessions/session-canonical/attendance', { kind: 'primary' }) : button('Bắt đầu demo chính', 'prepare-core-demo', { icon: 'arrow' }) },
      { number: 2, title: 'Học viên hoàn thành bài', body: 'Đăng nhập HS6A001, xem video, làm 10 câu hỏi và xem kết quả.', done: completed, action: `<button class="btn btn-primary" type="button" data-action="login" data-actor-id="student-login-1">Vào tài khoản Học viên</button>` },
      { number: 3, title: 'Quản trị viên kiểm tra', body: 'Xem học bù, báo cáo, thông báo và nhật ký trên cùng dữ liệu.', done: completed && ctx.state.auditLogs.length > 1, action: `<button class="btn btn-secondary" type="button" data-action="login" data-actor-id="admin-1">Vào tài khoản Quản trị viên</button>` },
    ];
    return `<main id="main-content" class="demo-guide-page"><section class="demo-hero"><div class="container"><div><p class="eyebrow on-dark">Demo frontend dễ kiểm tra</p><h1>Một học viên, ba bước, không phải nhớ nhiều tài khoản.</h1><p>Luồng chính dùng Nguyễn Minh Anh xuyên suốt từ Giáo viên đến Học viên và Quản trị viên. Dữ liệu không bị tách theo tên người được giao.</p><div class="hero-actions">${sessionReady ? link('Tiếp tục điểm danh', '/app/teacher/sessions/session-canonical/attendance', { kind: 'primary' }) : button('Bắt đầu demo chính', 'prepare-core-demo', { icon: 'arrow' })}${button('Đặt lại demo', 'reset-demo', { kind: 'secondary' })}</div></div><aside><span class="journey-count">${coreSteps.filter((item) => item.done).length}<small>/ 3</small></span><div><small>Tiến độ luồng chính</small><strong>${completed ? 'Học viên đã hoàn thành' : assignment ? 'Học viên đã nhận bài' : sessionReady ? 'Sẵn sàng điểm danh' : 'Chưa bắt đầu'}</strong><span>Hồ sơ · HS6A001</span></div></aside></div></section>
      <section class="container demo-progress-section">${progress(Math.round(coreSteps.filter((item) => item.done).length / 3 * 100), 'Luồng demo chính')}<div class="core-journey-grid">${coreSteps.map((step) => `<article class="core-journey-step ${step.done ? 'done' : ''}"><span class="step-marker">${step.done ? icon('check') : step.number}</span><p class="eyebrow">Bước ${step.number}</p><h2>${step.title}</h2><p>${step.body}</p>${step.action}</article>`).join('')}</div>
      <details class="advanced-journey"><summary><span><small>Phần nâng cao</small><strong>Luồng đầy đủ từ tư vấn đến tái ghi danh</strong></span>${icon('arrow')}</summary><div class="advanced-journey-body"><div class="between"><div><p class="eyebrow">12 mốc nghiệp vụ</p><h2>Hành trình nâng cao</h2><p>Dành cho lúc cần kiểm tra Tuyển sinh, Tài chính, Học thuật, Dịch vụ học viên và Phụ huynh.</p></div><div class="inline">${next.commands.length ? button(next.action, 'canonical-next', { icon: 'arrow' }) : link('Xem kết quả', next.route, { kind: 'primary' })}${button('Chạy tự động đến cuối', 'canonical-run-all', { kind: 'secondary' })}</div></div>
      <div class="checkpoint-bar"><strong>Tải trạng thái mẫu</strong><div class="checkpoint-actions">${CHECKPOINTS.map(([key, label]) => button(label, 'load-checkpoint', { kind: !journey.complete && key === journey.status ? 'primary' : 'secondary', small: true, payload: { checkpoint: key } })).join('')}</div></div>
      <div class="journey-rail compact">${STEPS.map((step, index) => { const done = journey.complete || index < journey.index; const active = !done && step.key === journey.status; return `<article class="journey-step ${done ? 'done' : ''} ${active ? 'active' : ''}"><div class="step-marker">${done ? icon('check') : index + 1}</div><div><p>${escapeHtml(roleLabel(step.role))}</p><h2>${escapeHtml(step.label)}</h2><span>${escapeHtml(step.evidence)}</span></div><div>${done ? badge('COMPLETED') : active ? badge('IN_PROGRESS') : badge('DRAFT', 'Chưa đến')}<a href="#${escapeHtml(step.route)}">Mở khu vực ${icon('arrow')}</a></div></article>`; }).join('')}</div></div></details></section></main>`;
  }

  root.YC.define('demoGuide', Object.freeze({ CHECKPOINTS, STEPS, nextStep, render }));
})(globalThis);

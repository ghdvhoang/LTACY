(function defineDemoGuide(root) {
  'use strict';

  const { badge, button, icon, link, progress } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  const STEPS = Object.freeze([
    { key: 'LEAD', label: 'Tư vấn nhu cầu', role: 'ADMISSIONS', route: '/app/admissions/leads/lead-canonical', evidence: 'Consultation + booking' },
    { key: 'PLACEMENT', label: 'Placement đa kỹ năng', role: 'ACADEMIC_MANAGER', route: '/app/admissions/placement', evidence: '6 skill scores + recommendation' },
    { key: 'PAID', label: 'Offer & mock payment', role: 'FINANCE', route: '/app/finance/dashboard', evidence: 'Offer + invoice + mock ledger' },
    { key: 'ENROLLED', label: 'Xếp lớp phù hợp', role: 'STUDENT_SERVICE', route: '/app/service/allocation', evidence: 'Active enrollment' },
    { key: 'TEACHER_ASSIGNED', label: 'Teacher eligibility', role: 'ACADEMIC_MANAGER', route: '/app/academic/assignments', evidence: 'Hard gates + workload' },
    { key: 'SESSION_DELIVERED', label: 'Chuẩn bị & delivery', role: 'TEACHER', route: '/app/teacher/sessions/session-canonical', evidence: 'Plan vs taught + gap' },
    { key: 'REMEDIAL_ASSIGNED', label: 'Attendance & remedial', role: 'TEACHER', route: '/app/teacher/sessions/session-canonical', evidence: 'Final attendance + one assignment' },
    { key: 'REMEDIAL_COMPLETED', label: 'Learning & homework loop', role: 'STUDENT', route: '/app/student/course', evidence: 'Video + quiz + revised homework' },
    { key: 'MODERATED', label: 'Final grading & moderation', role: 'ACADEMIC_MANAGER', route: '/app/academic/moderation', evidence: 'Rubric + reviewer approval' },
    { key: 'PROGRESS_PUBLISHED', label: 'Progress & promotion', role: 'ACADEMIC_MANAGER', route: '/app/academic/progress-reviews', evidence: 'Report snapshot + decision' },
    { key: 'PARENT_REVIEWED', label: 'Parent review', role: 'PARENT', route: '/app/parent/progress', evidence: 'Visibility-filtered acknowledgement' },
    { key: 'RENEWED', label: 'Next-level renewal', role: 'ADMISSIONS', route: '/app/admissions/renewals', evidence: 'A2.2 offer accepted' },
  ]);

  const CHECKPOINTS = Object.freeze([
    ['LEAD', 'Lead'], ['PLACEMENT', 'Placement'], ['PAID', 'Paid'], ['ENROLLED', 'Enrolled'],
    ['TEACHER_ASSIGNED', 'Teacher'], ['SESSION_DELIVERED', 'Session'], ['REMEDIAL_ASSIGNED', 'Remedial'],
    ['REMEDIAL_COMPLETED', 'Learning'], ['MODERATED', 'Moderated'], ['PROGRESS_PUBLISHED', 'Progress'],
    ['PARENT_REVIEWED', 'Parent'], ['RENEWED', 'Renewed'],
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

    if (lead.status === 'NEW') return { ...STEPS[0], actorId: 'admissions-1', action: 'Liên hệ & đặt placement', commands: [
      command('CONTACT_LEAD', { leadId: lead.id, note: 'Mục tiêu giao tiếp A2, lịch tối Thứ 3 & 5.' }, 'admissions-1'),
      command('BOOK_PLACEMENT', { leadId: lead.id, startsAt: '2026-09-05T02:00:00.000Z', mode: 'OFFLINE' }, 'admissions-1'),
    ] };
    if (lead.status === 'CONTACTED') return { ...STEPS[0], actorId: 'admissions-1', action: 'Đặt lịch placement', commands: [command('BOOK_PLACEMENT', { leadId: lead.id, startsAt: '2026-09-05T02:00:00.000Z', mode: 'OFFLINE' }, 'admissions-1')] };
    if (!placement) return { ...STEPS[1], actorId: 'academic-1', action: 'Ghi & release placement', commands: [
      command('RECORD_PLACEMENT', { leadId: lead.id, frameworkLevel: 'A2', centerLevelId: 'level-a2-1', skills: { listening: 74, reading: 78, spokenInteraction: 69, spokenProduction: 66, writing: 72, language: 75 }, recommendation: 'English Foundation 6 · A2.1' }, 'academic-1'),
      command('RELEASE_PLACEMENT', { leadId: lead.id }, 'academic-1'),
    ] };
    if (placement.status === 'REVIEWED') return { ...STEPS[1], actorId: 'academic-1', action: 'Release placement', commands: [command('RELEASE_PLACEMENT', { leadId: lead.id }, 'academic-1')] };
    if (!payment) {
      const commands = [];
      if (!offer) commands.push(command('CREATE_OFFER', { leadId: lead.id, packageId: 'package-a2-1', discount: 300000 }, 'admissions-1'));
      if (!offer || offer.status === 'DRAFT') commands.push(command('SEND_OFFER', { leadId: lead.id }, 'admissions-1'));
      if (!offer || ['DRAFT', 'SENT'].includes(offer.status)) commands.push(command('ACCEPT_OFFER', { leadId: lead.id }, 'admissions-1'));
      if (!invoice) commands.push(command('ISSUE_INVOICE', { leadId: lead.id }, 'finance-1'));
      if (!invoice || invoice.status === 'ISSUED') commands.push(command('RECORD_MOCK_PAYMENT', { leadId: lead.id, reference: 'MOCK-CANONICAL' }, 'finance-1'));
      return { ...STEPS[2], actorId: 'finance-1', action: 'Hoàn tất offer & payment mock', commands };
    }
    if (!enrollment) return { ...STEPS[3], actorId: 'service-1', action: 'Xếp vào English Foundation 6A', commands: [command('ALLOCATE_CLASS', { leadId: lead.id, classId: 'class-6a' }, 'service-1')] };
    if (!assignment) return { ...STEPS[4], actorId: 'academic-1', action: 'Match & gán Hoàng Yến', commands: [
      command('PROPOSE_TEACHER_ASSIGNMENT', { teacherId: 'teacher-1', classId: 'class-6a', workloadMinutes: 720 }, 'academic-1'),
      command('ACCEPT_TEACHER_ASSIGNMENT', { classId: 'class-6a' }, 'teacher-1'),
    ] };
    if (assignment.status === 'PROPOSED') return { ...STEPS[4], actorId: 'teacher-1', action: 'Teacher nhận lớp', commands: [command('ACCEPT_TEACHER_ASSIGNMENT', { classId: 'class-6a' }, 'teacher-1')] };
    if (!state.deliveryRecords.some((item) => item.sessionId === session.id)) {
      const commands = [];
      if (session.status === 'CONFIRMED') commands.push(command('MARK_SESSION_READY', { sessionId: session.id, adaptations: ['Thêm visual timeline cho past simple'] }, 'teacher-1'));
      if (['CONFIRMED', 'READY'].includes(session.status)) commands.push(command('START_SESSION', { sessionId: session.id }, 'teacher-1'));
      commands.push(command('COMPLETE_SESSION', { sessionId: session.id, taughtItemIds: ['item-past-simple-video', 'item-speaking-pairs'], deferredItemIds: ['item-pronunciation'], note: 'Pronunciation chuyển sang guided practice.' }, 'teacher-1'));
      return { ...STEPS[5], actorId: 'teacher-1', action: 'Chuẩn bị & hoàn tất session', commands };
    }
    if (!remedial) return { ...STEPS[6], actorId: 'teacher-1', action: 'Finalize vắng & tạo học bù', commands: [command('FINALIZE_ATTENDANCE', { sessionId: session.id, records: [{ learnerId, status: 'ABSENT', reasonCode: 'SICK' }] }, 'teacher-1')] };
    if (remedial.status !== 'COMPLETED') {
      const commands = [];
      if (Number(remedial.videoProgress || 0) < 100) commands.push(command('UPDATE_VIDEO_PROGRESS', { assignmentId: remedial.id, progress: 100 }, 'student-login-1'));
      commands.push(command('SUBMIT_AUTO_ASSESSMENT', { assignmentId: remedial.id, answers: [1, 1, 0, 1, 1, 1, 1, 1, 0, 2] }, 'student-login-1'));
      return { ...STEPS[7], actorId: 'student-login-1', action: 'Hoàn thành video & quiz 8/10', commands };
    }
    if (!homework) return { ...STEPS[7], actorId: 'teacher-1', action: 'Giao homework theo session', route: '/app/teacher/grading', commands: [command('ASSIGN_HOMEWORK', { classId: 'class-6a', learnerId, title: 'Audio story: last weekend' }, 'teacher-1')] };
    if (homework.status === 'ASSIGNED') return { ...STEPS[7], actorId: 'student-login-1', action: 'Learner nộp homework v1', route: '/app/student/dashboard', commands: [command('SUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo.webm' }, 'student-login-1')] };
    if (homework.status === 'SUBMITTED') return { ...STEPS[7], actorId: 'teacher-1', action: 'Feedback & yêu cầu revision', route: '/app/teacher/grading', commands: [
      command('GRADE_HOMEWORK', { homeworkId: homework.id, score: 58, feedback: 'Cần dùng past tense nhất quán.' }, 'teacher-1'),
      command('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1'),
      command('REQUEST_REVISION', { homeworkId: homework.id, nextAction: 'Thu lại đoạn 2' }, 'teacher-1'),
    ] };
    if (homework.status === 'FEEDBACK_READY') return { ...STEPS[7], actorId: 'teacher-1', action: 'Release homework feedback', route: '/app/teacher/grading', commands: [command('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1')] };
    if (homework.status === 'REVISION_REQUIRED') return { ...STEPS[7], actorId: 'student-login-1', action: 'Learner nộp lại homework v2', route: '/app/student/dashboard', commands: [command('RESUBMIT_HOMEWORK', { homeworkId: homework.id, evidence: 'audio-demo-v2.webm' }, 'student-login-1')] };
    if (homework.status === 'RESUBMITTED') return { ...STEPS[7], actorId: 'teacher-1', action: 'Chấm lại & accept homework', route: '/app/teacher/grading', commands: [
      command('GRADE_HOMEWORK', { homeworkId: homework.id, score: 86, feedback: 'Past tense rõ và chính xác.' }, 'teacher-1'),
      command('RELEASE_HOMEWORK_FEEDBACK', { homeworkId: homework.id }, 'teacher-1'),
      command('ACCEPT_HOMEWORK', { homeworkId: homework.id }, 'teacher-1'),
    ] };
    if (homework.status === 'RELEASED') {
      const submission = state.homeworkSubmissions.find((item) => item.id === homework.currentSubmissionId);
      const next = Number(submission?.version || 1) > 1 ? 'ACCEPT_HOMEWORK' : 'REQUEST_REVISION';
      const payload = next === 'ACCEPT_HOMEWORK' ? { homeworkId: homework.id } : { homeworkId: homework.id, nextAction: 'Thu lại đoạn 2' };
      return { ...STEPS[7], actorId: 'teacher-1', action: next === 'ACCEPT_HOMEWORK' ? 'Accept homework' : 'Yêu cầu revision', route: '/app/teacher/grading', commands: [command(next, payload, 'teacher-1')] };
    }
    if (!attempt) return { ...STEPS[8], actorId: 'academic-1', action: 'Grade, moderate & release final', commands: [
      command('SUBMIT_MANUAL_GRADE', { assessmentId: 'assessment-final-canonical', learnerId, skills: { listening: 76, reading: 78, spokenInteraction: 62, spokenProduction: 61, writing: 72, language: 74 }, feedback: 'Đủ evidence; speaking sát ngưỡng.' }, 'teacher-1'),
    ], continueAfterResult: 'moderation' };
    if (!moderation) return { ...STEPS[8], actorId: 'academic-1', action: 'Mở moderation', commands: [command('START_MODERATION', { attemptId: attempt.id }, 'academic-1')] };
    if (moderation.status !== 'APPROVED') return { ...STEPS[8], actorId: 'academic-1', action: 'Approve moderation', commands: [command('APPROVE_MODERATION', { attemptId: attempt.id, note: 'Rubric và speaking sample nhất quán.' }, 'academic-1')] };
    if (attempt.status !== 'RELEASED') return { ...STEPS[8], actorId: 'academic-1', action: 'Release final result', commands: [command('RELEASE_RESULT', { attemptId: attempt.id }, 'academic-1')] };
    if (!report) return { ...STEPS[9], actorId: 'academic-1', action: 'Publish progress report', commands: [command('PUBLISH_PROGRESS_REPORT', { learnerId, narrative: 'Đã đạt chuẩn đầu ra A2.1.', nextActions: ['Tăng speaking fluency ở A2.2'] }, 'academic-1')] };
    if (!promotion) return { ...STEPS[9], actorId: 'academic-1', action: 'Chốt promotion có evidence', commands: [command('DECIDE_PROMOTION', { learnerId, decision: 'PROMOTE', nextCourseVersionId: 'course-v7', overrideReason: 'Demo tăng tốc: absence đã hoàn tất bằng remedial có evidence.', overrideEvidence: [remedial.id] }, 'academic-1')] };
    if (!parentViewed) return { ...STEPS[10], actorId: 'parent-1', action: 'Phụ huynh xem & xác nhận', commands: [command('ACKNOWLEDGE_PARENT_PROGRESS', { learnerId }, 'parent-1')] };
    if (!renewal) return { ...STEPS[11], actorId: 'admissions-1', action: 'Tạo renewal A2.2', commands: [command('CREATE_RENEWAL', { learnerId, packageId: 'package-a2-2' }, 'admissions-1')] };
    if (renewal.status !== 'ACCEPTED') return { ...STEPS[11], actorId: 'admissions-1', action: 'Chấp nhận renewal', commands: [command('ACCEPT_RENEWAL', { learnerId }, 'admissions-1')] };
    return { key: 'DONE', label: 'Hành trình đã hoàn tất', role: 'ADMISSIONS', route: '/app/admissions/renewals', actorId: 'admissions-1', action: 'Đã hoàn tất', commands: [] };
  }

  function render(ctx) {
    const journey = root.YC.selectors.journey(ctx.state);
    const next = nextStep(ctx.state);
    const learner = ctx.state.learners.find((item) => item.id === ctx.state.demo.canonicalLearnerId);
    const events = ctx.state.domainEvents.filter((item) => item.learnerId === learner.id).slice(0, 8);
    return `<main id="main-content" class="demo-guide-page"><section class="demo-hero"><div class="container"><div><p class="eyebrow on-dark">Full-journey frontend demo</p><h1>Theo dấu Nguyễn Minh Anh từ lead đến renewal.</h1><p>Một state, nhiều workspace, mỗi quyết định có evidence, event và audit. Các tích hợp ngoài đều là mock.</p><div class="hero-actions">${next.commands.length ? button(next.action, 'canonical-next', { icon: 'arrow' }) : link('Xem kết quả renewal', next.route, { kind: 'primary' })}${button('Chạy tự động đến cuối', 'canonical-run-all', { kind: 'secondary' })}${button('Reset demo', 'reset-demo', { kind: 'ghost' })}</div></div><aside><span class="journey-count">${Math.min(journey.index + (journey.complete ? 0 : 1), journey.total)}<small>/ ${journey.total}</small></span><div><small>${journey.complete ? 'Journey status' : 'Current milestone'}</small><strong>${escapeHtml(next.label)}</strong><span>Owner · ${escapeHtml(next.role.replaceAll('_', ' '))}</span></div></aside></div></section>
      <section class="container demo-progress-section">${progress(journey.complete ? 100 : Math.round(journey.index / journey.total * 100), 'Toàn hành trình')}<section class="checkpoint-bar" aria-label="Demo checkpoints"><div><p class="eyebrow">Jump to evidence</p><strong>Tải một checkpoint có trạng thái nhất quán</strong></div><div class="checkpoint-actions">${CHECKPOINTS.map(([key, label]) => button(label, 'load-checkpoint', { kind: !journey.complete && key === journey.status ? 'primary' : 'secondary', small: true, payload: { checkpoint: key } })).join('')}</div></section><div class="demo-layout"><div class="journey-rail">${STEPS.map((step, index) => { const done = journey.complete || index < journey.index; const active = !done && step.key === journey.status; return `<article class="journey-step ${done ? 'done' : ''} ${active ? 'active' : ''}"><div class="step-marker">${done ? icon('check') : index + 1}</div><div><p>${escapeHtml(step.role.replaceAll('_', ' '))}</p><h2>${escapeHtml(step.label)}</h2><span>${escapeHtml(step.evidence)}</span></div><div>${done ? badge('COMPLETED') : active ? badge('IN_PROGRESS') : badge('DRAFT', 'Chưa đến')}<a href="#${escapeHtml(step.route)}">Mở workspace ${icon('arrow')}</a></div></article>`; }).join('')}</div>
      <aside class="demo-aside"><section class="panel sticky-panel"><p class="eyebrow">Next valid action</p><h2>${escapeHtml(next.action)}</h2><p>Hệ thống sẽ dùng đúng actor <strong>${escapeHtml(next.role.replaceAll('_', ' '))}</strong> và chạy qua command validation.</p>${next.commands.length ? button(next.action, 'canonical-next', { icon: 'arrow' }) : link('Xem kết quả', next.route, { kind: 'primary' })}<small>Mỗi command tự ghi event/audit phù hợp.</small></section>
      <section class="panel"><div class="panel-heading"><div><h2>Evidence mới nhất</h2><p>Domain event của canonical learner</p></div></div>${events.length ? events.map((event) => `<div class="event-row"><span>${icon('check')}</span><div><strong>${escapeHtml(event.summary)}</strong><small>${formatDate(event.occurredAt)} · ${escapeHtml(event.type)}</small></div></div>`).join('') : '<p class="muted">Bắt đầu bước đầu tiên để tạo event.</p>'}</section></aside></div></section></main>`;
  }

  root.YC.define('demoGuide', Object.freeze({ CHECKPOINTS, STEPS, nextStep, render }));
})(globalThis);

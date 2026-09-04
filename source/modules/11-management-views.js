(function defineManagementViews(root) {
  'use strict';

  const { badge, button, icon, link, metric, money, pageHeader, person, progress, section, table } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  function canonicalAction(label = 'Chạy academic step') {
    return button(label, 'canonical-next', { icon: 'arrow' });
  }

  function academicDashboard(ctx) {
    const moderation = ctx.state.moderationCases.filter((item) => item.status !== 'APPROVED').length;
    const classesWithoutTeacher = ctx.state.classes.filter((cohort) => !ctx.state.teacherAssignments.some((item) => item.classId === cohort.id && ['PROPOSED', 'ACTIVE'].includes(item.status))).length;
    return `<div class="workspace-page">${pageHeader('Academic Management', 'Academic evidence trước quyết định', 'Curriculum, teacher eligibility, moderation và promotion dùng cùng ruleset.', canonicalAction())}
      <div class="metric-grid four">${metric('Lớp chưa có teacher', classesWithoutTeacher, 'Cần eligibility matching', 'people')}${metric('Moderation mở', moderation, 'Final / borderline', 'shield')}${metric('Progress chờ publish', ctx.state.skillResults.length && !ctx.state.progressReports.length ? 1 : 0, 'Đủ 6 skill evidence', 'trend')}${metric('Course versions', ctx.state.courseVersions.filter((item) => item.status === 'PUBLISHED').length, 'Published & immutable', 'book')}</div>
      <div class="content-grid main-aside">${section('Decision queue', `<div class="decision-list"><a href="#/app/academic/assignments"><span class="decision-icon blue">${icon('people')}</span><span><strong>Teacher assignment</strong><small>Eligibility hard gates + ranking signals</small></span><b>${classesWithoutTeacher}</b></a><a href="#/app/academic/moderation"><span class="decision-icon violet">${icon('shield')}</span><span><strong>Moderation</strong><small>Rubric, variance và evidence note</small></span><b>${moderation}</b></a><a href="#/app/academic/progress-reviews"><span class="decision-icon green">${icon('trend')}</span><span><strong>Progress & promotion</strong><small>6 skills + attendance + next action</small></span><b>${ctx.state.progressReports.length}</b></a></div>`)}
      ${section('Policy snapshot', `<dl class="detail-list"><div><dt>Attendance minimum</dt><dd>75%</dd></div><div><dt>Final score</dt><dd>≥ 70</dd></div><div><dt>Mỗi skill</dt><dd>≥ 60</dd></div><div><dt>Override</dt><dd>Reason + evidence + audit</dd></div></dl><a class="text-link" href="#/app/academic/curriculum">Mở curriculum ${icon('arrow')}</a>`)}</div></div>`;
  }

  function curriculum(ctx) {
    const rows = ctx.state.courseVersions.map((version) => {
      const course = ctx.state.courses.find((item) => item.id === version.courseId);
      const level = ctx.state.levels.find((item) => item.id === course?.levelId);
      return { ...version, course, level };
    });
    return `<div class="workspace-page">${pageHeader('Academic · Product design', 'Curriculum & versions', 'Class luôn tham chiếu một published snapshot; version đã publish là immutable.')}
      <div class="curriculum-tree"><span>Product line</span>${icon('arrow')}<span>Program</span>${icon('arrow')}<span>Level</span>${icon('arrow')}<span>Course</span>${icon('arrow')}<strong>Course version</strong>${icon('arrow')}<span>Unit · Lesson · Item</span></div>
      ${section('Version registry', table([{ label: 'Course version', render: (row) => `<strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.course?.code || '')} · v${row.version}</small>` }, { label: 'Level', render: (row) => escapeHtml(row.level?.code || '') }, { label: 'Hours', render: (row) => `${row.totalHours}h` }, { label: 'Completion rule', render: (row) => `Attendance ${row.completionRule.attendanceMinimum}% · Final ${row.completionRule.finalScoreMinimum} · Skill ${row.completionRule.skillMinimum}` }, { label: 'Lifecycle', render: (row) => `${badge(row.status)}${row.immutable ? '<small>Immutable</small>' : ''}` }], rows))}
      ${section('Published lesson structure', ctx.state.units.map((unit) => { const lessons = ctx.state.lessonTemplates.filter((item) => item.unitId === unit.id); return `<details class="course-module"><summary><span><small>UNIT ${unit.order}</small><strong>${escapeHtml(unit.title)}</strong></span><span>${lessons.length} lessons ${icon('arrow')}</span></summary><div>${lessons.map((lesson) => `<div class="curriculum-lesson"><div><strong>${escapeHtml(lesson.title)}</strong><small>${lesson.durationMinutes} phút · version ${lesson.version}</small></div>${badge(lesson.status)}</div>`).join('')}</div></details>`; }).join(''))}</div>`;
  }

  function teachers(ctx) {
    const rows = ctx.state.teacherProfiles.map((profile) => {
      const user = ctx.state.users.find((item) => item.id === profile.userId);
      const qualification = ctx.state.qualifications.find((item) => item.teacherProfileId === profile.id);
      const workload = root.YC.selectors.teacherWorkload(ctx.state, user.id);
      return { ...profile, user, qualification, workload };
    });
    return `<div class="workspace-page">${pageHeader('Academic · Faculty', 'Teacher directory', 'Qualification, scope, capabilities và workload được kiểm tra trước assignment.')}${section('Teacher profiles', table([{ label: 'Giáo viên', render: (row) => person(row.user, row.teacherCode) }, { label: 'Qualification', render: (row) => `<strong>${escapeHtml(row.qualification?.type || '—')}</strong><small>Hạn ${formatDate(row.qualification?.expiresAt)}</small>` }, { label: 'Levels', render: (row) => escapeHtml(row.levels.join(', ')) }, { label: 'Modes', render: (row) => escapeHtml(row.modes.join(', ')) }, { label: 'Workload', render: (row) => `${Math.round(row.workload.totalMinutes / 60)} / ${Math.round(row.workload.limitMinutes / 60)}h` }, { label: 'Status', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function assignments(ctx) {
    const candidates = ctx.state.teacherProfiles.map((profile) => ({ profile, user: ctx.state.users.find((item) => item.id === profile.userId), evidence: root.YC.selectors.teacherEligibility(ctx.state, profile.userId, 'class-6a') })).sort((a, b) => Number(b.evidence.eligible) - Number(a.evidence.eligible));
    const active = ctx.state.teacherAssignments.map((item) => ({ ...item, user: ctx.state.users.find((user) => user.id === ctx.state.teacherProfiles.find((profile) => profile.id === item.teacherProfileId)?.userId), cohort: ctx.state.classes.find((cohort) => cohort.id === item.classId) }));
    return `<div class="workspace-page">${pageHeader('Academic · Staffing', 'Teacher assignment', 'Hard gates loại ứng viên không phù hợp; ranking signals hỗ trợ quyết định.', canonicalAction('Gán teacher canonical'))}
      <div class="content-grid main-aside">${section('Candidate ranking · English Foundation 6A', candidates.map((item) => `<article class="candidate-card ${item.evidence.eligible ? '' : 'muted-card'}"><div>${person(item.user, item.profile.teacherCode)}</div><div class="gate-row">${item.evidence.hardGates.map((gate) => `<span class="${gate.passed ? 'pass' : 'fail'}" title="${escapeHtml(gate.label)}">${gate.passed ? '✓' : '×'} ${escapeHtml(gate.key.replaceAll('_', ' '))}</span>`).join('')}</div><div><strong>${item.evidence.rankingSignals.reduce((sum, signal) => sum + signal.score, 0)} pts</strong>${badge(item.evidence.eligible ? 'ACTIVE' : 'REJECTED', item.evidence.eligible ? 'Eligible' : 'Not eligible')}</div></article>`).join(''), { subtitle: 'Hard gate ≠ ranking score' })}
      ${section('Assignments', active.length ? active.map((item) => `<div class="queue-card"><div><strong>${escapeHtml(item.cohort?.name || '')}</strong><small>${escapeHtml(item.user?.name || '')}</small></div>${badge(item.status)}</div>`).join('') : '<p class="muted">Chưa có assignment cho lớp canonical.</p>')}</div></div>`;
  }

  function moderation(ctx) {
    const rows = ctx.state.moderationCases.map((item) => {
      const attempt = ctx.state.attempts.find((entry) => entry.id === item.attemptId);
      const grading = ctx.state.gradingRecords.find((entry) => entry.attemptId === item.attemptId);
      return { ...item, attempt, grading, learner: ctx.state.learners.find((entry) => entry.id === item.learnerId) };
    });
    return `<div class="workspace-page">${pageHeader('Academic · Quality gate', 'Assessment moderation', 'Final hoặc borderline result phải có independent review trước release.', canonicalAction('Xử lý moderation canonical'))}
      ${section('Moderation queue', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.learner?.name || '')}</strong><small>${escapeHtml(row.attempt?.assessmentId || '')}</small>` }, { label: 'Điểm', render: (row) => `<strong>${row.attempt?.score ?? '—'}/100</strong>` }, { label: 'Variance', render: (row) => row.variance ?? '—' }, { label: 'Evidence note', render: (row) => escapeHtml(row.note || row.grading?.feedback || 'Chờ reviewer note') }, { label: 'Reviewer', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.reviewerId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Không có moderation case', emptyBody: 'Manual grade final sẽ tạo queue sau khi teacher submit.' }))}</div>`;
  }

  function progressReviews(ctx) {
    const learner = ctx.state.learners.find((item) => item.id === ctx.state.demo.canonicalLearnerId);
    const profile = root.YC.selectors.skillProfile(ctx.state, learner.id);
    const report = ctx.state.progressReports.find((item) => item.learnerId === learner.id && item.status === 'PUBLISHED');
    const promotion = ctx.state.promotionDecisions.find((item) => item.learnerId === learner.id);
    return `<div class="workspace-page">${pageHeader('Academic · Outcomes', 'Progress review & promotion', 'Attendance, homework và sáu skill evidence được snapshot trước quyết định.', canonicalAction('Publish report & promotion'))}
      <div class="profile-strip"><div>${person({ name: learner.name }, learner.code)}</div><div><small>Report</small>${badge(report?.status || 'DRAFT')}</div><div><small>Promotion</small>${promotion ? badge(promotion.status, promotion.decision) : badge('DRAFT', 'Chưa quyết định')}</div><div><small>Next course</small><strong>${escapeHtml(ctx.state.courseVersions.find((item) => item.id === promotion?.nextCourseVersionId)?.title || '—')}</strong></div></div>
      <div class="content-grid main-aside">${section('Six-skill evidence', `<div class="skill-grid compact">${profile.map((item) => `<article><span>${escapeHtml(item.skill.replaceAll('_', ' '))}</span><strong>${item.score ?? '—'}</strong>${progress(item.score || 0)}<small>${item.evidenceId ? 'Released' : 'Missing evidence'}</small></article>`).join('')}</div>`)}
      ${section('Decision rule', `<dl class="detail-list"><div><dt>Attendance</dt><dd>${report?.snapshot.attendanceRate ?? '—'} / 75%</dd></div><div><dt>Homework</dt><dd>${report?.snapshot.homeworkCompletion ?? '—'}%</dd></div><div><dt>Overall</dt><dd>${promotion?.evidence.overall ?? '—'} / 70</dd></div><div><dt>Override</dt><dd>${escapeHtml(promotion?.overrideReason || 'Không')}</dd></div></dl>${promotion?.overrideEvidence?.length ? `<p class="evidence-note">Evidence IDs: ${escapeHtml(promotion.overrideEvidence.join(', '))}</p>` : ''}`)}</div></div>`;
  }

  function managerDashboard(ctx) {
    const active = ctx.state.enrollments.filter((item) => item.status === 'ACTIVE').length;
    const capacity = ctx.state.classes.reduce((sum, item) => sum + item.capacity, 0);
    const mockRevenue = ctx.state.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `<div class="workspace-page">${pageHeader('Center Management', 'Operating health at a glance', 'Capacity, quality, retention và mock commerce được drill-down về evidence.')}
      <div class="metric-grid four">${metric('Active learners', active, `${ctx.state.branches.length} chi nhánh`, 'people')}${metric('Seat utilization', `${Math.round(active / capacity * 100)}%`, `${active}/${capacity} chỗ`, 'grid')}${metric('Open risk cases', [...ctx.state.serviceCases, ...ctx.state.interventionCases].filter((item) => item.status === 'OPEN').length, 'Có owner và follow-up', 'shield')}${metric('Mock revenue', money(mockRevenue), 'Demo ledger only', 'wallet')}</div>
      <div class="content-grid main-aside">${section('Branch performance', ctx.state.branches.map((branch, index) => { const cohorts = ctx.state.classes.filter((item) => item.branchId === branch.id); const seats = cohorts.reduce((sum, item) => sum + item.capacity, 0); const used = ctx.state.enrollments.filter((item) => item.status === 'ACTIVE' && cohorts.some((cohort) => cohort.id === item.classId)).length; return `<div class="branch-row"><div><strong>${escapeHtml(branch.name)}</strong><small>${cohorts.length} classes · ${used} active learners</small></div>${progress(seats ? Math.round(used / seats * 100) : 0, 'Utilization')}<b>${index === 0 ? 'Stable' : 'Watch'}</b></div>`; }).join(''), { action: link('Capacity', '/app/manager/capacity', { small: true }) })}
      ${section('Management signals', `<div class="insight-list"><div><span class="signal warning">!</span><p><strong>Weekend class full</strong><small>Class-full cần alternative allocation.</small></p></div><div><span class="signal success">✓</span><p><strong>Progress traceable</strong><small>Released result → report → promotion → renewal.</small></p></div><div><span class="signal info">i</span><p><strong>Finance is mocked</strong><small>Không dùng để báo cáo doanh thu thật.</small></p></div></div>`)}</div></div>`;
  }

  function capacity(ctx) {
    const rows = ctx.state.classes.map((cohort) => { const active = ctx.state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length; return { ...cohort, active, utilization: Math.round(active / cohort.capacity * 100) }; });
    return `<div class="workspace-page">${pageHeader('Management · Operations', 'Capacity', 'Seat utilization theo branch, class và schedule—not vanity totals.')}${section('Class capacity', table([{ label: 'Lớp', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(ctx.state.branches.find((item) => item.id === row.branchId)?.name || '')}</small>` }, { label: 'Lịch', key: 'scheduleLabel' }, { label: 'Học viên', render: (row) => `${row.active}/${row.capacity}` }, { label: 'Utilization', render: (row) => progress(row.utilization) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function managerQuality(ctx) {
    return `<div class="workspace-page">${pageHeader('Management · Academic', 'Quality signals', 'Cân bằng delivery, feedback, progress, continuity và observation.')}
      <div class="quality-grid">${[['Delivery completeness', 91], ['Feedback turnaround', 84], ['Learner progress', 79], ['Class continuity', 94], ['Teacher observation', 82], ['Parent satisfaction', 88]].map(([label, value]) => `<article><div><span>${label}</span><strong>${value}%</strong></div>${progress(value)}<small>Demo aggregate · drill-down có evidence</small></article>`).join('')}</div></div>`;
  }

  function retention(ctx) {
    const promotions = ctx.state.promotionDecisions;
    const renewals = ctx.state.renewals;
    return `<div class="workspace-page">${pageHeader('Management · Growth', 'Retention & renewal', 'Renewal bắt đầu từ outcome và next goal, không chỉ từ ngày hết hạn.')}
      <div class="metric-grid three">${metric('Promotion final', promotions.filter((item) => item.status === 'FINAL').length, 'Academic decision', 'trend')}${metric('Renewal offered', renewals.filter((item) => item.status === 'OFFERED').length, 'Next-level package', 'wallet')}${metric('Renewal accepted', renewals.filter((item) => item.status === 'ACCEPTED').length, 'Canonical outcome', 'check')}</div>
      ${section('Renewal evidence', table([{ label: 'Học viên', render: (row) => escapeHtml(ctx.state.learners.find((item) => item.id === row.learnerId)?.name || '') }, { label: 'Outcome', key: 'outcome' }, { label: 'Next goal', key: 'nextGoal' }, { label: 'Next course', render: (row) => escapeHtml(ctx.state.courseVersions.find((item) => item.id === row.nextCourseVersionId)?.title || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], renewals))}</div>`;
  }

  function adminDashboard(ctx) {
    return `<div class="workspace-page">${pageHeader('Admin console', 'System control & traceability', 'Một tổ chức Yen Center, nhiều branch, role scope và demo integrations.')}
      <div class="metric-grid four">${metric('Active users', ctx.state.users.filter((item) => item.status === 'ACTIVE').length, '10 role types', 'people')}${metric('Domain events', ctx.state.domainEvents.length, 'Workflow handoffs', 'trend')}${metric('Audit records', ctx.state.auditLogs.length, 'High-impact trace', 'shield')}${metric('Demo integrations', 4, 'Tất cả đang MOCK', 'grid')}</div>
      <div class="content-grid two">${section('System boundaries', '<ul class="check-list"><li>✓ One organization, multi-branch</li><li>✓ Browser localStorage only</li><li>✓ Frontend RBAC demonstration</li><li>✓ Payment, messaging, auth are mock</li></ul>')}${section('Data health', `<dl class="detail-list"><div><dt>State version</dt><dd>${escapeHtml(ctx.state.version)}</dd></div><div><dt>Seeded at</dt><dd>${formatDate(ctx.state.seededAt)}</dd></div><div><dt>Migration notice</dt><dd>${escapeHtml(ctx.state.demo.migrationNotice || 'None')}</dd></div><div><dt>Canonical learner</dt><dd>${escapeHtml(ctx.state.demo.canonicalLearnerId)}</dd></div></dl>`)}</div></div>`;
  }

  function access(ctx) {
    const rows = ctx.state.users.map((user) => ({ ...user, scopes: ctx.state.roleScopes.filter((item) => item.userId === user.id) }));
    return `<div class="workspace-page">${pageHeader('Admin · Access', 'Roles & scopes', 'Quyền được minh họa theo role, branch, class, assignment và effective dates.')}${section('Access register', table([{ label: 'Người dùng', render: (row) => person(row, row.id) }, { label: 'Role', render: (row) => badge('ACTIVE', row.role.replaceAll('_', ' ')) }, { label: 'Branch scope', render: (row) => escapeHtml(row.scopes.flatMap((item) => item.branchIds || []).join(', ') || 'Derived') }, { label: 'Linked learners', render: (row) => escapeHtml((row.linkedLearnerIds || []).join(', ') || '—') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}<div class="notice-panel panel"><b>Frontend demonstration only</b><p>Client-side scope không thay thế server-side authorization trong sản phẩm thật.</p></div></div>`;
  }

  function auditLogs(ctx) {
    return `<div class="workspace-page">${pageHeader('Admin · Governance', 'Audit logs', 'Ai làm gì, trên resource nào, với lý do hoặc evidence nào.')}${section('Audit trail', table([{ label: 'Thời gian', render: (row) => formatDate(row.occurredAt) }, { label: 'Actor', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.actorId)?.name || row.actorId) }, { label: 'Action', render: (row) => `<code>${escapeHtml(row.action)}</code>` }, { label: 'Resource', render: (row) => `${escapeHtml(row.resourceType)}<small>${escapeHtml(row.resourceId)}</small>` }, { label: 'Detail', key: 'detail' }], ctx.state.auditLogs))}</div>`;
  }

  function events(ctx) {
    return `<div class="workspace-page">${pageHeader('Admin · Workflow', 'Domain events', 'Event nối các owner và workspace; không giả lập message provider thật.')}${section('Event stream', table([{ label: 'Thời gian', render: (row) => formatDate(row.occurredAt) }, { label: 'Event', render: (row) => `<code>${escapeHtml(row.type)}</code>` }, { label: 'Summary', key: 'summary' }, { label: 'Resource', render: (row) => `${escapeHtml(row.resourceType)} · ${escapeHtml(row.resourceId)}` }, { label: 'Actor', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.actorId)?.name || row.actorId) }], ctx.state.domainEvents))}</div>`;
  }

  function integrations() {
    const rows = [['Payment gateway', 'DEMO_LEDGER', 'MOCKED', 'Không gọi provider'], ['Email / SMS / Zalo', 'OUTBOUND_PREVIEW', 'MOCKED', 'Chỉ lưu message record'], ['Video learning', 'LOCAL_PROGRESS', 'MOCKED', 'Progress trong localStorage'], ['Identity provider', 'ROLE_PICKER', 'MOCKED', 'Quick access demo']];
    return `<div class="workspace-page">${pageHeader('Admin · Platform', 'Integrations', 'Provider boundaries được gắn nhãn rõ để demo không bị hiểu nhầm là production.')}${section('Connector registry', table([{ label: 'Capability', render: (row) => `<strong>${escapeHtml(row[0])}</strong>` }, { label: 'Adapter', render: (row) => `<code>${escapeHtml(row[1])}</code>` }, { label: 'Mode', render: (row) => badge(row[2]) }, { label: 'Boundary', render: (row) => escapeHtml(row[3]) }], rows))}</div>`;
  }

  function settings(ctx) {
    const settings = ctx.state.settings;
    return `<div class="workspace-page">${pageHeader('Admin · Configuration', 'Demo settings', 'Rules hiển thị là input cho command validation và selector evidence.')}
      <div class="settings-grid">${Object.entries(settings).map(([key, value]) => `<article><label>${escapeHtml(key.replaceAll(/([A-Z])/g, ' $1'))}</label><strong>${escapeHtml(String(value))}</strong><small>Seeded configuration · resettable</small></article>`).join('')}</div>${section('Reset controls', `<p>Reset đưa toàn bộ state về checkpoint ban đầu và xóa các thao tác demo trong localStorage.</p>${button('Reset toàn bộ demo', 'reset-demo', { kind: 'secondary' })}`, { className: 'danger-zone' })}</div>`;
  }

  function render(path, ctx) {
    const routes = {
      '/app/academic/dashboard': academicDashboard,
      '/app/academic/curriculum': curriculum,
      '/app/academic/teachers': teachers,
      '/app/academic/assignments': assignments,
      '/app/academic/moderation': moderation,
      '/app/academic/progress-reviews': progressReviews,
      '/app/manager/dashboard': managerDashboard,
      '/app/manager/capacity': capacity,
      '/app/manager/quality': managerQuality,
      '/app/manager/retention': retention,
      '/app/admin/dashboard': adminDashboard,
      '/app/admin/access': access,
      '/app/admin/audit-logs': auditLogs,
      '/app/admin/events': events,
      '/app/admin/integrations': integrations,
      '/app/admin/settings': settings,
    };
    return routes[path] ? routes[path](ctx) : '';
  }

  root.YC.define('managementViews', Object.freeze({ render }));
})(globalThis);

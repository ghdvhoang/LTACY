(function defineOperationsViews(root) {
  'use strict';

  const { badge, button, empty, icon, link, metric, money, pageHeader, person, progress, section, table } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  function canonicalAction(label = 'Chạy bước canonical') {
    return button(label, 'canonical-next', { icon: 'arrow' });
  }

  function admissionsDashboard(ctx) {
    const metrics = root.YC.selectors.metrics(ctx.state, 'ADMISSIONS');
    const recent = ctx.state.leads.slice(0, 5);
    return `<div class="workspace-page">${pageHeader('Admissions workspace', 'Từ nhu cầu đến offer phù hợp', 'Ưu tiên lead theo next action thay vì chỉ theo trạng thái.', canonicalAction('Xử lý next action'))}
      <div class="metric-grid four">${metric('Lead mới', metrics.newLeads, 'Cần liên hệ trong ngày', 'people')}${metric('Chờ placement', ctx.state.leads.filter((item) => ['CONTACTED', 'PLACEMENT_BOOKED'].includes(item.status)).length, 'Booking và result review', 'calendar')}${metric('Offer mở', ctx.state.offers.filter((item) => !['ACCEPTED', 'EXPIRED'].includes(item.status)).length, 'Draft hoặc đã gửi', 'wallet')}${metric('Renewal đến hạn', metrics.renewalDue, 'Dựa trên promotion', 'trend')}</div>
      <div class="content-grid main-aside">${section('Lead cần xử lý', table([{ label: 'Học viên / phụ huynh', render: (row) => `<a class="table-link" href="#/app/admissions/leads/${row.id}"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.parentName || row.channel)}</small></a>` }, { label: 'Mục tiêu', key: 'goal' }, { label: 'Chi nhánh', render: (row) => escapeHtml(ctx.state.branches.find((item) => item.id === row.branchId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Next action', render: (row) => row.status === 'NEW' ? 'Liên hệ' : row.status === 'PLACED' ? 'Tạo offer' : 'Theo dõi' }], recent), { action: link('Xem tất cả', '/app/admissions/leads', { small: true }) })}
      ${section('Funnel hôm nay', `<div class="funnel">${[['Lead', ctx.state.leads.length, 100], ['Placement', ctx.state.placementResults.length, 68], ['Offer', ctx.state.offers.length, 44], ['Won', ctx.state.leads.filter((item) => item.status === 'WON').length, 24]].map(([label, value, width]) => `<div><span>${label}</span><i style="width:${width}%"></i><b>${value}</b></div>`).join('')}</div><div class="insight-note">${icon('spark')}<p><strong>Evidence tip</strong><br>Placement phải được Academic release trước khi tạo offer.</p></div>`)}</div></div>`;
  }

  function admissionsLeads(ctx) {
    return `<div class="workspace-page">${pageHeader('Admissions · CRM', 'Lead & consultation', 'Owner, nguồn, mục tiêu và next action được nhìn trong cùng một hàng.', canonicalAction('Tiến hành lead canonical'))}
      ${section('Pipeline', table([{ label: 'Lead', render: (row) => `<a class="table-link" href="#/app/admissions/leads/${row.id}"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.phone)}</small></a>` }, { label: 'Nguồn', key: 'channel' }, { label: 'Mục tiêu', key: 'goal' }, { label: 'Owner', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.ownerId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Ngày tạo', render: (row) => formatDate(row.createdAt) }], ctx.state.leads))}</div>`;
  }

  function leadDetail(ctx, leadId) {
    const lead = ctx.state.leads.find((item) => item.id === leadId) || ctx.state.leads[0];
    const consultations = ctx.state.consultations.filter((item) => item.leadId === lead.id);
    const placement = ctx.state.placementResults.find((item) => item.leadId === lead.id);
    const offer = ctx.state.offers.find((item) => item.leadId === lead.id);
    const invoice = ctx.state.invoices.find((item) => item.leadId === lead.id);
    const events = ctx.state.domainEvents.filter((item) => item.learnerId === lead.learnerId);
    return `<div class="workspace-page">${pageHeader('Lead profile', lead.name, `${lead.parentName || 'Khách hàng'} · ${lead.phone} · ${lead.goal}`, canonicalAction('Thực hiện next action'))}
      <div class="profile-strip"><div>${person({ name: lead.name }, 'Prospective learner')}</div><div><small>Chi nhánh</small><strong>${escapeHtml(ctx.state.branches.find((item) => item.id === lead.branchId)?.name || '')}</strong></div><div><small>Nguồn</small><strong>${escapeHtml(lead.channel)}</strong></div><div><small>Trạng thái</small>${badge(lead.status)}</div></div>
      <div class="content-grid main-aside"><div class="stack-lg">${section('Consultation', consultations.length ? consultations.map((item) => `<div class="timeline-item"><span></span><div><strong>${escapeHtml(item.note)}</strong><small>${formatDate(item.occurredAt)} · ${escapeHtml(ctx.state.users.find((user) => user.id === item.ownerId)?.name || '')}</small></div></div>`).join('') : '<p class="muted">Chưa có consultation note.</p>')}
      ${section('Placement recommendation', placement ? `<div class="placement-result"><span class="level-orb">${escapeHtml(placement.frameworkLevel)}</span><div><h3>${escapeHtml(placement.recommendation)}</h3><p>Đề xuất dựa trên sáu kỹ năng; Academic Manager đã review.</p><div class="mini-skills">${Object.entries(placement.skills).map(([key, value]) => `<span>${escapeHtml(key)} <b>${value}</b></span>`).join('')}</div></div>${badge(placement.status)}</div>` : empty('Chưa có placement', 'Cần booking và Academic review trước khi phát hành.'))}</div>
      <div class="stack-lg">${section('Commercial snapshot', `<dl class="detail-list"><div><dt>Offer</dt><dd>${offer ? `${money(offer.total)} · ${badge(offer.status)}` : 'Chưa tạo'}</dd></div><div><dt>Invoice</dt><dd>${invoice ? `${money(invoice.amount)} · ${badge(invoice.status)}` : 'Chưa phát hành'}</dd></div><div><dt>Integration</dt><dd>Mock only</dd></div></dl>`)}${section('Activity', events.length ? events.slice(0, 6).map((item) => `<div class="event-row"><span>${icon('check')}</span><div><strong>${escapeHtml(item.summary)}</strong><small>${formatDate(item.occurredAt)}</small></div></div>`).join('') : '<p class="muted">Chưa có domain event.</p>')}</div></div>`;
  }

  function placementQueue(ctx) {
    const bookings = ctx.state.placementBookings.map((item) => ({ ...item, lead: ctx.state.leads.find((lead) => lead.id === item.leadId) }));
    return `<div class="workspace-page">${pageHeader('Admissions · Placement', 'Placement pipeline', 'Booking, review và release được tách thành các bước có owner.', canonicalAction('Hoàn thành placement canonical'))}
      <div class="metric-grid three">${metric('Đã đặt', bookings.filter((item) => item.status === 'BOOKED').length, 'Chờ examiner', 'calendar')}${metric('Đã review', ctx.state.placementResults.filter((item) => item.status === 'REVIEWED').length, 'Chờ release', 'shield')}${metric('Đã release', ctx.state.placementResults.filter((item) => item.status === 'RELEASED').length, 'Sẵn sàng tạo offer', 'check')}</div>
      ${section('Booking & result queue', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.lead?.name || row.learnerId)}</strong>` }, { label: 'Lịch', render: (row) => formatDate(row.startsAt) }, { label: 'Mode', key: 'mode' }, { label: 'Booking', render: (row) => badge(row.status) }, { label: 'Result', render: (row) => { const result = ctx.state.placementResults.find((item) => item.leadId === row.leadId); return result ? `${escapeHtml(result.frameworkLevel)} · ${badge(result.status)}` : 'Chưa ghi'; } }], bookings))}</div>`;
  }

  function offers(ctx) {
    const rows = ctx.state.offers.map((item) => ({ ...item, lead: ctx.state.leads.find((lead) => lead.id === item.leadId), packageItem: ctx.state.packages.find((pkg) => pkg.id === item.packageId) }));
    return `<div class="workspace-page">${pageHeader('Admissions · Commerce', 'Offers', 'Giá, discount, package và trạng thái gửi được lưu thành evidence.', canonicalAction('Xử lý offer canonical'))}${section('Offer register', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.lead?.name || '')}</strong><small>${escapeHtml(row.packageItem?.name || '')}</small>` }, { label: 'Giá niêm yết', render: (row) => money(row.listPrice) }, { label: 'Giảm', render: (row) => money(row.discount) }, { label: 'Tổng', render: (row) => `<strong>${money(row.total)}</strong>` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Chưa có offer', emptyBody: 'Offer được tạo sau khi placement đã release.' }))}</div>`;
  }

  function renewals(ctx) {
    const rows = ctx.state.renewals.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId), course: ctx.state.courseVersions.find((version) => version.id === item.nextCourseVersionId) }));
    return `<div class="workspace-page">${pageHeader('Admissions · Retention', 'Renewal', 'Kết hợp outcome, next goal, recommended course và trạng thái offer.', canonicalAction('Hoàn tất renewal canonical'))}${section('Renewal pipeline', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.learner?.name || '')}</strong><small>${escapeHtml(row.nextGoal)}</small>` }, { label: 'Outcome', key: 'outcome' }, { label: 'Khóa tiếp theo', render: (row) => escapeHtml(row.course?.title || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Chưa có renewal', emptyBody: 'Chỉ tạo renewal sau promotion decision FINAL.' }))}</div>`;
  }

  function financeDashboard(ctx) {
    const values = root.YC.selectors.metrics(ctx.state, 'FINANCE');
    return `<div class="workspace-page">${pageHeader('Finance workspace', 'Mock ledger & financial clearance', 'Mọi bản ghi đều gắn nhãn MOCK; không gọi payment provider thật.', canonicalAction('Ghi nhận payment canonical'))}
      <div class="notice-panel panel"><b>DEMO MODE</b><p>Hóa đơn và thanh toán bên dưới chỉ tồn tại trong localStorage của trình duyệt.</p></div><div class="metric-grid three">${metric('Invoice đã trả', values.paidInvoices, 'Financial clearance', 'check')}${metric('Mock revenue', money(values.mockRevenue), 'Không phải doanh thu thật', 'wallet')}${metric('Chờ xuất hóa đơn', ctx.state.offers.filter((item) => item.status === 'ACCEPTED').length, 'Offer accepted', 'calendar')}</div>
      ${section('Recent finance activity', table([{ label: 'Loại', render: (row) => row.resourceType }, { label: 'Nội dung', key: 'summary' }, { label: 'Thời gian', render: (row) => formatDate(row.occurredAt) }], ctx.state.domainEvents.filter((item) => ['INVOICE', 'PAYMENT'].includes(item.resourceType)).slice(0, 8)))}</div>`;
  }

  function invoices(ctx) {
    const rows = ctx.state.invoices.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Finance · Billing', 'Invoices', 'Phát hành, due date và settlement status trên demo ledger.', canonicalAction('Xuất hóa đơn / payment'))}${section('Invoice register', table([{ label: 'Invoice', render: (row) => `<strong>${escapeHtml(row.id)}</strong><small>MOCK DOCUMENT</small>` }, { label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || '') }, { label: 'Số tiền', render: (row) => money(row.amount, row.currency) }, { label: 'Hạn', render: (row) => formatDate(row.dueAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function payments(ctx) {
    return `<div class="workspace-page">${pageHeader('Finance · Ledger', 'Payments', 'Reference và provider đều được mô phỏng để giữ prototype trung thực.')}${section('Mock payment ledger', table([{ label: 'Reference', key: 'reference' }, { label: 'Provider', render: (row) => `<strong>${escapeHtml(row.provider)}</strong><small>${escapeHtml(row.mode)}</small>` }, { label: 'Số tiền', render: (row) => money(row.amount, row.currency) }, { label: 'Thời gian', render: (row) => formatDate(row.paidAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.payments))}</div>`;
  }

  function serviceDashboard(ctx) {
    const noSeat = ctx.state.serviceCases.filter((item) => item.type === 'NO_SEAT' && item.status === 'OPEN').length;
    return `<div class="workspace-page">${pageHeader('Student Service workspace', 'Giải quyết exception mà không mất lịch sử', 'Allocation, make-up, transfer và substitution đều có owner và evidence.', canonicalAction('Xếp lớp canonical'))}
      <div class="metric-grid four">${metric('Chờ xếp lớp', ctx.state.payments.filter((item) => item.status === 'PAID' && !ctx.state.enrollments.some((enrollment) => enrollment.learnerId === item.learnerId && enrollment.status === 'ACTIVE')).length, 'Payment đã clear', 'people')}${metric('No-seat cases', noSeat, 'Cần phương án thay thế', 'shield')}${metric('Make-up', ctx.state.makeUpBookings.filter((item) => item.status !== 'ATTENDED').length, 'Eligibility → booking', 'calendar')}${metric('Substitution', ctx.state.substitutions.filter((item) => item.status !== 'CLOSED').length, 'Cần handover', 'people')}</div>
      <div class="content-grid two">${section('Exception queue', table([{ label: 'Case', key: 'type' }, { label: 'Lý do', key: 'reason' }, { label: 'Owner', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.ownerId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.serviceCases))}${section('Operational guardrails', '<ul class="check-list"><li>✓ No-seat trả ranked alternatives</li><li>✓ Transfer giữ enrollment cũ</li><li>✓ Attendance correction cần reason</li><li>✓ Substitute cần handover trước close</li></ul>')}</div></div>`;
  }

  function allocation(ctx) {
    const candidates = ctx.state.leads.filter((lead) => ctx.state.payments.some((item) => item.leadId === lead.id && item.status === 'PAID') && !ctx.state.enrollments.some((item) => item.learnerId === lead.learnerId && item.status === 'ACTIVE'));
    const classRows = ctx.state.classes.map((cohort) => { const used = ctx.state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length; return { ...cohort, used, seats: cohort.capacity - used }; });
    return `<div class="workspace-page">${pageHeader('Student Service · Allocation', 'Class allocation', 'Match course version, branch, schedule và remaining capacity.', canonicalAction('Xếp Minh Anh vào 6A'))}
      <div class="content-grid main-aside">${section('Lớp phù hợp', table([{ label: 'Lớp', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small>` }, { label: 'Lịch', key: 'scheduleLabel' }, { label: 'Mode', key: 'mode' }, { label: 'Còn chỗ', render: (row) => `<strong>${Math.max(0, row.seats)}</strong> / ${row.capacity}` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], classRows))}${section('Ready to allocate', candidates.length ? candidates.map((lead) => `<div class="queue-card">${person({ name: lead.name }, lead.goal)}${badge('PAID')}</div>`).join('') : empty('Không có learner chờ', 'Ghi nhận mock payment để financial-clear learner xuất hiện.'))}</div></div>`;
  }

  function cases(ctx) {
    const rows = [...ctx.state.serviceCases, ...ctx.state.interventionCases].map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Student Service · Case management', 'Cases & interventions', 'Mỗi case có signal, owner, plan, follow-up và outcome.')}${section('Owned work', table([{ label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || row.leadId || 'Chưa tạo learner') }, { label: 'Loại / signal', render: (row) => escapeHtml(row.type || row.signal) }, { label: 'Kế hoạch / lý do', render: (row) => escapeHtml(row.plan || row.reason) }, { label: 'Follow-up', render: (row) => formatDate(row.followUpAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function makeUp(ctx) {
    return `<div class="workspace-page">${pageHeader('Student Service · Recovery', 'Make-up bookings', 'Eligibility, target session và attendance bù không làm mất bản ghi gốc.')}${section('Booking register', table([{ label: 'Học viên', render: (row) => escapeHtml(ctx.state.learners.find((item) => item.id === row.learnerId)?.name || '') }, { label: 'Buổi gốc', key: 'originalSessionId' }, { label: 'Buổi bù', key: 'targetSessionId' }, { label: 'Lý do', key: 'reason' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.makeUpBookings))}</div>`;
  }

  function transfers(ctx) {
    const transferred = ctx.state.enrollments.filter((item) => item.status === 'TRANSFERRED');
    return `<div class="workspace-page">${pageHeader('Student Service · Mobility', 'Transfers', 'Enrollment cũ được đóng, enrollment mới được tạo và roster scope đổi theo hiệu lực.')}${section('Transfer history', table([{ label: 'Học viên', render: (row) => escapeHtml(ctx.state.learners.find((item) => item.id === row.learnerId)?.name || '') }, { label: 'Lớp cũ', render: (row) => escapeHtml(ctx.state.classes.find((item) => item.id === row.classId)?.name || '') }, { label: 'Lý do', key: 'transferReason' }, { label: 'Kết thúc', render: (row) => formatDate(row.endsAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], transferred))}</div>`;
  }

  function substitutions(ctx) {
    const rows = ctx.state.substitutions.map((item) => ({ ...item, session: ctx.state.sessions.find((session) => session.id === item.sessionId), original: ctx.state.teacherProfiles.find((profile) => profile.id === item.originalTeacherProfileId), replacement: ctx.state.teacherProfiles.find((profile) => profile.id === item.replacementTeacherProfileId) }));
    return `<div class="workspace-page">${pageHeader('Student Service · Continuity', 'Teacher substitutions', 'Candidate → confirmation → time-boxed access → handover → closure.')}${section('Substitution queue', table([{ label: 'Session', render: (row) => `<strong>${escapeHtml(row.session?.id || '')}</strong><small>${formatDate(row.session?.startsAt)}</small>` }, { label: 'Giáo viên chính', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.original?.userId)?.name || '') }, { label: 'Thay thế', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.replacement?.userId)?.name || 'Chưa chọn') }, { label: 'Handover', render: (row) => row.handover ? escapeHtml(row.handover.note) : 'Chưa có' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function teacherDashboard(ctx) {
    const metrics = root.YC.selectors.metrics(ctx.state, 'TEACHER');
    const profile = ctx.state.teacherProfiles.find((item) => item.userId === ctx.actor?.id) || ctx.state.teacherProfiles[0];
    const assignments = ctx.state.teacherAssignments.filter((item) => item.teacherProfileId === profile.id);
    return `<div class="workspace-page teacher-page">${pageHeader('Teacher workspace', `Chào ${ctx.actor?.name?.split(' ').at(-1) || 'giáo viên'}`, 'Chuẩn bị, dạy, ghi evidence và xử lý feedback trong một workbench.', canonicalAction('Thực hiện teacher step'))}
      <div class="metric-grid four">${metric('Buổi sắp tới', metrics.upcomingSessions, 'Confirmed hoặc planned', 'calendar')}${metric('Chờ chấm', metrics.gradingBacklog, 'Manual grading queue', 'check')}${metric('Lớp đang dạy', assignments.filter((item) => item.status === 'ACTIVE').length, 'Theo effective assignment', 'people')}${metric('Open cases', metrics.openCases, 'Cần phối hợp', 'shield')}</div>
      <section class="today-session"><div class="today-time"><b>18:00</b><span>HÔM NAY</span></div><div><p class="eyebrow on-dark">Next session</p><h2>English Foundation 6A</h2><p>Unit 4 · Past Simple · P.302 · 90 phút</p><div class="inline"><span>${icon('people')} ${root.YC.selectors.sessionWorkbench(ctx.state, 'session-canonical').roster.length} learners</span><span>${icon('book')} Lesson plan v2</span></div></div>${link('Mở session workbench', '/app/teacher/sessions/session-canonical', { kind: 'primary' })}</section>
      <div class="content-grid two">${section('Assignments', table([{ label: 'Lớp', render: (row) => escapeHtml(ctx.state.classes.find((item) => item.id === row.classId)?.name || '') }, { label: 'Role', key: 'role' }, { label: 'Workload', render: (row) => `${row.workloadMinutes} phút` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], assignments))}${section('Teaching signals', '<div class="insight-list"><div><span class="signal warning">1</span><p><strong>Coverage gap</strong><small>Pronunciation được defer sang practice.</small></p></div><div><span class="signal success">✓</span><p><strong>Visibility safe</strong><small>Parent chỉ thấy feedback được release.</small></p></div></div>')}</div></div>`;
  }

  function teacherSessions(ctx) {
    const rows = ctx.state.sessions.map((item) => ({ ...item, cohort: ctx.state.classes.find((cohort) => cohort.id === item.classId), plan: ctx.state.lessonPlans.find((plan) => plan.sessionId === item.id) }));
    return `<div class="workspace-page">${pageHeader('Teacher · Delivery', 'Sessions', 'Từ readiness đến delivery evidence và finalized attendance.', canonicalAction('Cập nhật session canonical'))}${section('Session list', table([{ label: 'Buổi học', render: (row) => `<a class="table-link" href="#/app/teacher/sessions/${row.id}"><strong>${escapeHtml(row.cohort?.name || '')}</strong><small>${escapeHtml(row.id)}</small></a>` }, { label: 'Lịch', render: (row) => formatDate(row.startsAt) }, { label: 'Phòng', key: 'room' }, { label: 'Readiness', render: (row) => badge(row.plan?.readiness || 'DRAFT') }, { label: 'Delivery', render: (row) => badge(row.status) }, { label: 'Attendance', render: (row) => row.attendanceFinalized ? badge('COMPLETED', 'Đã finalize') : badge('DRAFT', 'Chưa finalize') }], rows))}</div>`;
  }

  function sessionDetail(ctx, sessionId) {
    const workbench = root.YC.selectors.sessionWorkbench(ctx.state, sessionId) || root.YC.selectors.sessionWorkbench(ctx.state, 'session-canonical');
    const { session, plan, roster, risks, openHomework, delivery } = workbench;
    const cohort = ctx.state.classes.find((item) => item.id === session.classId);
    const lesson = ctx.state.lessonTemplates.find((item) => item.id === session.lessonTemplateId);
    return `<div class="workspace-page session-workbench">${pageHeader('Session workbench', cohort.name, `${formatDate(session.startsAt)} · ${session.room} · ${session.mode}`, canonicalAction('Chạy session step'))}
      <div class="session-tabs"><a class="active" href="#/app/teacher/sessions/${session.id}">Overview</a><a href="#/app/teacher/sessions/${session.id}">Attendance</a><a href="#/app/teacher/grading">Homework</a><a href="#/app/teacher/quality">Evidence</a></div>
      <div class="content-grid main-aside"><div class="stack-lg">${section('Lesson plan', `<div class="lesson-plan"><div><p class="eyebrow">${escapeHtml(lesson.title)}</p><h3>${escapeHtml(lesson.objectives.join(' · '))}</h3></div>${badge(plan?.readiness || 'DRAFT')}</div><dl class="detail-list"><div><dt>Adaptations</dt><dd>${escapeHtml((plan?.adaptations || []).join(', ') || 'Chưa có')}</dd></div><div><dt>Planned items</dt><dd>${ctx.state.learningItems.filter((item) => item.lessonTemplateId === lesson.id).length} activities</dd></div><div><dt>Delivery evidence</dt><dd>${delivery ? `${delivery.taughtItemIds.length} taught · ${delivery.deferredItemIds.length} deferred` : 'Chưa ghi'}</dd></div></dl>`)}
      ${section('Roster & attendance', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small>` }, { label: 'Risk', render: (row) => risks.some((risk) => risk.learnerId === row.id) ? badge('REQUESTED', 'Cần lưu ý') : '—' }, { label: 'Attendance', render: (row) => { const record = ctx.state.attendanceRecords.find((item) => item.sessionId === session.id && item.learnerId === row.id); return record ? badge(record.status) : badge('DRAFT', 'Chưa ghi'); } }], roster))}</div>
      <div class="stack-lg">${section('Session controls', `<div class="state-machine"><span class="done">Confirmed</span><span class="${['READY', 'IN_PROGRESS', 'COMPLETED'].includes(session.status) ? 'done' : ''}">Ready</span><span class="${['IN_PROGRESS', 'COMPLETED'].includes(session.status) ? 'done' : ''}">Live</span><span class="${session.status === 'COMPLETED' ? 'done' : ''}">Completed</span></div><p>Trạng thái hiện tại: ${badge(session.status)}</p>${canonicalAction('Thực hiện bước hợp lệ tiếp theo')}`)}${section('Open homework', openHomework.length ? openHomework.map((item) => `<div class="queue-card"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(ctx.state.learners.find((learner) => learner.id === item.learnerId)?.name || '')}</small></div>${badge(item.status)}</div>`).join('') : '<p class="muted">Không có homework mở cho lớp này.</p>')}</div></div>`;
  }

  function grading(ctx) {
    const homework = ctx.state.homeworkAssignments.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId), submission: ctx.state.homeworkSubmissions.find((entry) => entry.id === item.currentSubmissionId) }));
    const grades = ctx.state.gradingRecords.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Teacher · Assessment', 'Grading queue', 'Feedback được chuẩn bị, release, revision và accept theo trạng thái rõ ràng.')}
      <div class="content-grid two">${section('Homework', table([{ label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || '') }, { label: 'Bài', key: 'title' }, { label: 'Version', render: (row) => row.submission ? `v${row.submission.version}` : '—' }, { label: 'Điểm', render: (row) => row.submission?.score ?? '—' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], homework))}${section('Manual assessment', table([{ label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || '') }, { label: 'Điểm', render: (row) => `<strong>${row.score}/100</strong>` }, { label: 'Feedback', key: 'feedback' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], grades))}</div></div>`;
  }

  function workload(ctx) {
    const teacherId = ctx.actor?.role === 'TEACHER' ? ctx.actor.id : 'teacher-1';
    const value = root.YC.selectors.teacherWorkload(ctx.state, teacherId);
    const segments = [['Teaching', value.teachingMinutes, 'blue'], ['Preparation', value.preparationMinutes, 'violet'], ['Grading', value.gradingMinutes, 'amber'], ['Administration', value.administrationMinutes, 'green']];
    return `<div class="workspace-page">${pageHeader('Teacher · Capacity', 'Workload', 'Teaching, preparation, grading và administration cùng đóng góp vào limit.')}
      <div class="workload-summary"><div class="workload-ring" style="--value:${Math.round(value.totalMinutes / value.limitMinutes * 100)}"><span><strong>${Math.round(value.totalMinutes / 60)}h</strong><small>/ ${Math.round(value.limitMinutes / 60)}h</small></span></div><div><p class="eyebrow">Current allocation</p><h2>${Math.round(value.totalMinutes / value.limitMinutes * 100)}% workload limit</h2><p>Eligibility gate sẽ chặn assignment làm vượt giới hạn.</p></div></div>
      <div class="segment-grid">${segments.map(([label, minutes, color]) => `<article><span class="segment-dot ${color}"></span><div><small>${label}</small><strong>${Math.round(minutes / 60 * 10) / 10} giờ</strong></div>${progress(Math.round(minutes / value.limitMinutes * 100))}</article>`).join('')}</div></div>`;
  }

  function quality(ctx) {
    return `<div class="workspace-page">${pageHeader('Teacher · Quality', 'Balanced teaching evidence', 'Không xếp hạng giáo viên bằng một điểm duy nhất; dùng nhiều nguồn evidence.')}
      <div class="quality-grid">${[['Delivery completeness', 92, 'Lesson plan, taught vs deferred'], ['Feedback timeliness', 86, 'Grading và release timestamps'], ['Learner progress', 78, 'Skill evidence theo cohort'], ['Class continuity', 96, 'Attendance và substitution'], ['Observation', 82, 'Academic coaching evidence']].map(([label, value, note]) => `<article><div><span>${label}</span><strong>${value}%</strong></div>${progress(value)}<small>${note}</small></article>`).join('')}</div>${section('Evidence policy', '<p>Quality signals dùng cho coaching và capacity planning. Safeguarding, restricted note và dữ liệu không đủ context không được đưa vào score hiển thị.</p>', { className: 'notice-panel' })}</div>`;
  }

  function contentStudio(ctx) {
    const drafts = ctx.state.contentDrafts || [];
    const activePath = ctx.path || '/app/teacher/content';
    const tabs = [['Kho nội dung', '/app/teacher/content'], ['Khóa học', '/app/teacher/courses'], ['Ngân hàng câu hỏi', '/app/teacher/question-bank'], ['Bài kiểm tra', '/app/teacher/quizzes']];
    return `<div class="workspace-page">${pageHeader('Giáo viên · Course', 'Xưởng nội dung', 'Chuẩn bị bài học, xem trước activity và quản lý câu hỏi trên cùng curriculum.', button('Tạo bản nháp mẫu', 'create-content-draft', { payload: { courseVersionId: 'course-v6', lessonTemplateId: 'lesson-past-simple', title: 'Luyện nói cuối bài' }, icon: 'book' }))}
      <nav class="session-tabs">${tabs.map(([label, href]) => `<a class="${activePath === href ? 'active' : ''}" href="#${href}">${label}</a>`).join('')}</nav>
      <div class="content-grid main-aside">${section('Kho nội dung khóa học', ctx.state.lessonTemplates.map((lesson) => { const unit = ctx.state.units.find((item) => item.id === lesson.unitId); const items = ctx.state.learningItems.filter((item) => item.lessonTemplateId === lesson.id); return `<article class="lesson-plan"><div><p class="eyebrow">${escapeHtml(unit?.title || '')}</p><h3>${escapeHtml(lesson.title)}</h3><small>${items.length} hoạt động · ${lesson.durationMinutes} phút</small></div><div class="inline">${badge(lesson.status)}${link('Xem trước', `/app/teacher/content/preview/${lesson.id}`, { small: true })}</div></article>`; }).join(''))}
      ${section('Ngân hàng câu hỏi', `<dl class="detail-list"><div><dt>Tổng câu hỏi</dt><dd>${ctx.state.questions.length}</dd></div><div><dt>Bài kiểm tra đã xuất bản</dt><dd>${ctx.state.assessments.filter((item) => item.status === 'PUBLISHED').length}</dd></div><div><dt>Bản nháp cá nhân</dt><dd>${drafts.length}</dd></div></dl>${drafts.map((item) => `<div class="queue-card"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)}</small></div>${badge(item.status)}</div>`).join('')}`)}</div></div>`;
  }

  function contentPreview(ctx, lessonId) {
    const lesson = ctx.state.lessonTemplates.find((item) => item.id === lessonId) || ctx.state.lessonTemplates[0];
    const items = ctx.state.learningItems.filter((item) => item.lessonTemplateId === lesson.id);
    return `<div class="workspace-page">${pageHeader('Giáo viên · Xem trước', 'Xem trước bài học', 'Chế độ này không ghi tiến độ vào tài khoản học viên.', link('Về Xưởng nội dung', '/app/teacher/content'))}<section class="course-overview"><div><p class="eyebrow">${escapeHtml(lesson.status)}</p><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.objectives.join(' · '))}</p></div><div class="course-stat"><strong>${items.length}</strong><span>hoạt động</span></div></section><div class="lesson-list">${items.map((item, index) => `<article class="lesson-row"><span class="lesson-order">${index + 1}</span><div class="lesson-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.type)} · ${item.durationMinutes} phút</span></div><div class="lesson-action">${badge(item.required ? 'ACTIVE' : 'DRAFT', item.required ? 'Bắt buộc' : 'Tự chọn')}</div></article>`).join('')}</div></div>`;
  }

  function render(path, ctx) {
    if (path === '/app/admissions/dashboard') return admissionsDashboard(ctx);
    if (path === '/app/admissions/leads') return admissionsLeads(ctx);
    if (path.startsWith('/app/admissions/leads/')) return leadDetail(ctx, path.split('/').at(-1));
    if (path === '/app/admissions/placement') return placementQueue(ctx);
    if (path === '/app/admissions/offers') return offers(ctx);
    if (path === '/app/admissions/renewals') return renewals(ctx);
    if (path === '/app/finance/dashboard') return financeDashboard(ctx);
    if (path === '/app/finance/invoices') return invoices(ctx);
    if (path === '/app/finance/payments') return payments(ctx);
    if (path === '/app/service/dashboard') return serviceDashboard(ctx);
    if (path === '/app/service/allocation') return allocation(ctx);
    if (path === '/app/service/cases') return cases(ctx);
    if (path === '/app/service/make-up') return makeUp(ctx);
    if (path === '/app/service/transfers') return transfers(ctx);
    if (path === '/app/service/substitutions') return substitutions(ctx);
    if (path === '/app/teacher/dashboard') return teacherDashboard(ctx);
    if (path === '/app/teacher/sessions') return teacherSessions(ctx);
    if (path.startsWith('/app/teacher/sessions/')) return sessionDetail(ctx, path.split('/').at(-1));
    if (path === '/app/teacher/grading') return grading(ctx);
    if (path === '/app/teacher/workload') return workload(ctx);
    if (path === '/app/teacher/quality') return quality(ctx);
    if (path.startsWith('/app/teacher/content/preview/')) return contentPreview(ctx, path.split('/').at(-1));
    if (['/app/teacher/content', '/app/teacher/courses', '/app/teacher/question-bank', '/app/teacher/quizzes'].includes(path) || path.startsWith('/app/teacher/quizzes/')) return contentStudio(ctx);
    return '';
  }

  root.YC.define('operationsViews', Object.freeze({ render }));
})(globalThis);

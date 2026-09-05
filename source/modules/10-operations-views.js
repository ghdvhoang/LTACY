(function defineOperationsViews(root) {
  'use strict';

  const { badge, button, empty, icon, link, metric, money, pageHeader, person, progress, section, table, valueLabel } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  function canonicalAction() {
    return '';
  }

  function admissionsDashboard(ctx) {
    const metrics = root.YC.selectors.metrics(ctx.state, 'ADMISSIONS');
    const recent = ctx.state.leads.slice(0, 5);
    return `<div class="workspace-page">${pageHeader('Tư vấn tuyển sinh', 'Từ nhu cầu đến gói học phù hợp', 'Ưu tiên khách hàng tiềm năng theo việc cần làm tiếp theo.', canonicalAction('Xử lý việc tiếp theo'))}
      <div class="metric-grid four">${metric('Khách hàng mới', metrics.newLeads, 'Cần liên hệ trong ngày', 'people')}${metric('Chờ kiểm tra đầu vào', ctx.state.leads.filter((item) => ['CONTACTED', 'PLACEMENT_BOOKED'].includes(item.status)).length, 'Đặt lịch và duyệt kết quả', 'calendar')}${metric('Gói học đang mở', ctx.state.offers.filter((item) => !['ACCEPTED', 'EXPIRED'].includes(item.status)).length, 'Bản nháp hoặc đã gửi', 'wallet')}${metric('Gia hạn đến hạn', metrics.renewalDue, 'Dựa trên quyết định lên lớp', 'trend')}</div>
      <div class="content-grid main-aside">${section('Khách hàng cần xử lý', table([{ label: 'Học viên / phụ huynh', render: (row) => `<a class="table-link" href="#/app/admissions/leads/${row.id}"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.parentName || row.channel)}</small></a>` }, { label: 'Mục tiêu', key: 'goal' }, { label: 'Chi nhánh', render: (row) => escapeHtml(ctx.state.branches.find((item) => item.id === row.branchId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Việc tiếp theo', render: (row) => row.status === 'NEW' ? 'Liên hệ' : row.status === 'PLACED' ? 'Tạo gói học' : 'Theo dõi' }], recent), { action: link('Xem tất cả', '/app/admissions/leads', { small: true }) })}
      ${section('Phễu hôm nay', `<div class="funnel">${[['Khách hàng', ctx.state.leads.length, 100], ['Đầu vào', ctx.state.placementResults.length, 68], ['Gói học', ctx.state.offers.length, 44], ['Đã chốt', ctx.state.leads.filter((item) => item.status === 'WON').length, 24]].map(([label, value, width]) => `<div><span>${label}</span><i style="width:${width}%"></i><b>${value}</b></div>`).join('')}</div><div class="insight-note">${icon('spark')}<p><strong>Lưu ý bằng chứng</strong><br>Kết quả đầu vào phải được Học thuật công bố trước khi tạo gói học.</p></div>`)}</div></div>`;
  }

  function admissionsLeads(ctx) {
    return `<div class="workspace-page">${pageHeader('Tuyển sinh · Khách hàng', 'Khách hàng và tư vấn', 'Người phụ trách, nguồn, mục tiêu và việc tiếp theo được nhìn trong cùng một hàng.', canonicalAction('Xử lý khách hàng mẫu'))}
      ${section('Quy trình', table([{ label: 'Khách hàng', render: (row) => `<a class="table-link" href="#/app/admissions/leads/${row.id}"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.phone)}</small></a>` }, { label: 'Nguồn', key: 'channel' }, { label: 'Mục tiêu', key: 'goal' }, { label: 'Người phụ trách', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.ownerId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Ngày tạo', render: (row) => formatDate(row.createdAt) }], ctx.state.leads))}</div>`;
  }

  function leadDetail(ctx, leadId) {
    const lead = ctx.state.leads.find((item) => item.id === leadId) || ctx.state.leads[0];
    const consultations = ctx.state.consultations.filter((item) => item.leadId === lead.id);
    const placement = ctx.state.placementResults.find((item) => item.leadId === lead.id);
    const offer = ctx.state.offers.find((item) => item.leadId === lead.id);
    const invoice = ctx.state.invoices.find((item) => item.leadId === lead.id);
    const events = ctx.state.domainEvents.filter((item) => item.learnerId === lead.learnerId);
    return `<div class="workspace-page">${pageHeader('Hồ sơ khách hàng', lead.name, `${lead.parentName || 'Khách hàng'} · ${lead.phone} · ${lead.goal}`, canonicalAction('Thực hiện việc tiếp theo'))}
      <div class="profile-strip"><div>${person({ name: lead.name }, 'Học viên tiềm năng')}</div><div><small>Chi nhánh</small><strong>${escapeHtml(ctx.state.branches.find((item) => item.id === lead.branchId)?.name || '')}</strong></div><div><small>Nguồn</small><strong>${escapeHtml(lead.channel)}</strong></div><div><small>Trạng thái</small>${badge(lead.status)}</div></div>
      <div class="content-grid main-aside"><div class="stack-lg">${section('Tư vấn', consultations.length ? consultations.map((item) => `<div class="timeline-item"><span></span><div><strong>${escapeHtml(item.note)}</strong><small>${formatDate(item.occurredAt)} · ${escapeHtml(ctx.state.users.find((user) => user.id === item.ownerId)?.name || '')}</small></div></div>`).join('') : '<p class="muted">Chưa có ghi chú tư vấn.</p>')}
      ${section('Đề xuất đầu vào', placement ? `<div class="placement-result"><span class="level-orb">${escapeHtml(placement.frameworkLevel)}</span><div><h3>${escapeHtml(placement.recommendation)}</h3><p>Đề xuất dựa trên sáu kỹ năng; Quản lý học thuật đã duyệt.</p><div class="mini-skills">${Object.entries(placement.skills).map(([key, value]) => `<span>${escapeHtml(key)} <b>${value}</b></span>`).join('')}</div></div>${badge(placement.status)}</div>` : empty('Chưa có kết quả đầu vào', 'Cần đặt lịch và Học thuật duyệt trước khi công bố.'))}</div>
      <div class="stack-lg">${section('Tóm tắt thương mại', `<dl class="detail-list"><div><dt>Gói học</dt><dd>${offer ? `${money(offer.total)} · ${badge(offer.status)}` : 'Chưa tạo'}</dd></div><div><dt>Hóa đơn</dt><dd>${invoice ? `${money(invoice.amount)} · ${badge(invoice.status)}` : 'Chưa phát hành'}</dd></div><div><dt>Tích hợp</dt><dd>Chỉ mô phỏng</dd></div></dl>`)}${section('Hoạt động', events.length ? events.slice(0, 6).map((item) => `<div class="event-row"><span>${icon('check')}</span><div><strong>${escapeHtml(item.summary)}</strong><small>${formatDate(item.occurredAt)}</small></div></div>`).join('') : '<p class="muted">Chưa có sự kiện nghiệp vụ.</p>')}</div></div>`;
  }

  function placementQueue(ctx) {
    const bookings = ctx.state.placementBookings.map((item) => ({ ...item, lead: ctx.state.leads.find((lead) => lead.id === item.leadId) }));
    return `<div class="workspace-page">${pageHeader('Tuyển sinh · Đầu vào', 'Quy trình kiểm tra đầu vào', 'Đặt lịch, duyệt và công bố được tách thành các bước có người phụ trách.', canonicalAction('Hoàn thành đầu vào mẫu'))}
      <div class="metric-grid three">${metric('Đã đặt', bookings.filter((item) => item.status === 'BOOKED').length, 'Chờ người đánh giá', 'calendar')}${metric('Đã duyệt', ctx.state.placementResults.filter((item) => item.status === 'REVIEWED').length, 'Chờ công bố', 'shield')}${metric('Đã công bố', ctx.state.placementResults.filter((item) => item.status === 'RELEASED').length, 'Sẵn sàng tạo gói học', 'check')}</div>
      ${section('Hàng chờ lịch và kết quả', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.lead?.name || row.learnerId)}</strong>` }, { label: 'Lịch', render: (row) => formatDate(row.startsAt) }, { label: 'Hình thức', render: (row) => escapeHtml(valueLabel(row.mode)) }, { label: 'Lịch hẹn', render: (row) => badge(row.status) }, { label: 'Kết quả', render: (row) => { const result = ctx.state.placementResults.find((item) => item.leadId === row.leadId); return result ? `${escapeHtml(result.frameworkLevel)} · ${badge(result.status)}` : 'Chưa ghi'; } }], bookings))}</div>`;
  }

  function offers(ctx) {
    const rows = ctx.state.offers.map((item) => ({ ...item, lead: ctx.state.leads.find((lead) => lead.id === item.leadId), packageItem: ctx.state.packages.find((pkg) => pkg.id === item.packageId) }));
    return `<div class="workspace-page">${pageHeader('Tuyển sinh · Gói học', 'Đề xuất gói học', 'Giá, giảm giá, gói và trạng thái gửi được lưu thành bằng chứng.', canonicalAction('Xử lý gói học mẫu'))}${section('Danh sách gói đề xuất', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.lead?.name || '')}</strong><small>${escapeHtml(row.packageItem?.name || '')}</small>` }, { label: 'Giá niêm yết', render: (row) => money(row.listPrice) }, { label: 'Giảm', render: (row) => money(row.discount) }, { label: 'Tổng', render: (row) => `<strong>${money(row.total)}</strong>` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Chưa có gói đề xuất', emptyBody: 'Gói học được tạo sau khi kết quả đầu vào đã công bố.' }))}</div>`;
  }

  function renewals(ctx) {
    const rows = ctx.state.renewals.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId), course: ctx.state.courseVersions.find((version) => version.id === item.nextCourseVersionId) }));
    return `<div class="workspace-page">${pageHeader('Tuyển sinh · Duy trì', 'Gia hạn', 'Kết hợp kết quả, mục tiêu tiếp theo, khóa đề xuất và trạng thái gói học.', canonicalAction('Hoàn tất gia hạn mẫu'))}${section('Quy trình gia hạn', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.learner?.name || '')}</strong><small>${escapeHtml(row.nextGoal)}</small>` }, { label: 'Kết quả', key: 'outcome' }, { label: 'Khóa tiếp theo', render: (row) => escapeHtml(row.course?.title || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Chưa có gia hạn', emptyBody: 'Chỉ tạo gia hạn sau khi quyết định lên lớp đã được chốt.' }))}</div>`;
  }

  function financeDashboard(ctx) {
    const values = root.YC.selectors.metrics(ctx.state, 'FINANCE');
    return `<div class="workspace-page">${pageHeader('Khu vực tài chính', 'Sổ thu chi và xác nhận tài chính mô phỏng', 'Mọi bản ghi đều gắn nhãn MÔ PHỎNG; không gọi nhà cung cấp thanh toán thật.', canonicalAction('Ghi nhận thanh toán mẫu'))}
      <div class="notice-panel panel"><b>CHẾ ĐỘ MÔ PHỎNG</b><p>Hóa đơn và thanh toán bên dưới chỉ tồn tại trong bộ nhớ trình duyệt.</p></div><div class="metric-grid three">${metric('Hóa đơn đã trả', values.paidInvoices, 'Đã xác nhận tài chính', 'check')}${metric('Doanh thu mô phỏng', money(values.mockRevenue), 'Không phải doanh thu thật', 'wallet')}${metric('Chờ xuất hóa đơn', ctx.state.offers.filter((item) => item.status === 'ACCEPTED').length, 'Gói học đã được chấp nhận', 'calendar')}</div>
      ${section('Hoạt động tài chính gần đây', table([{ label: 'Loại', render: (row) => row.resourceType }, { label: 'Nội dung', key: 'summary' }, { label: 'Thời gian', render: (row) => formatDate(row.occurredAt) }], ctx.state.domainEvents.filter((item) => ['INVOICE', 'PAYMENT'].includes(item.resourceType)).slice(0, 8)))}</div>`;
  }

  function invoices(ctx) {
    const rows = ctx.state.invoices.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Tài chính · Hóa đơn', 'Hóa đơn', 'Phát hành, hạn thanh toán và trạng thái quyết toán trên sổ mô phỏng.', canonicalAction('Xuất hóa đơn / thanh toán'))}${section('Danh sách hóa đơn', table([{ label: 'Hóa đơn', render: (row) => `<strong>${escapeHtml(row.id)}</strong><small>CHỨNG TỪ MÔ PHỎNG</small>` }, { label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || '') }, { label: 'Số tiền', render: (row) => money(row.amount, row.currency) }, { label: 'Hạn', render: (row) => formatDate(row.dueAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function payments(ctx) {
    return `<div class="workspace-page">${pageHeader('Tài chính · Sổ thu chi', 'Thanh toán', 'Mã tham chiếu và nhà cung cấp đều được mô phỏng để bản mẫu trung thực.')}${section('Sổ thanh toán mô phỏng', table([{ label: 'Mã tham chiếu', key: 'reference' }, { label: 'Nhà cung cấp', render: (row) => `<strong>${escapeHtml(row.provider)}</strong><small>${escapeHtml(row.mode)}</small>` }, { label: 'Số tiền', render: (row) => money(row.amount, row.currency) }, { label: 'Thời gian', render: (row) => formatDate(row.paidAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.payments))}</div>`;
  }

  function serviceDashboard(ctx) {
    const noSeat = ctx.state.serviceCases.filter((item) => item.type === 'NO_SEAT' && item.status === 'OPEN').length;
    return `<div class="workspace-page">${pageHeader('Khu vực dịch vụ học viên', 'Giải quyết ngoại lệ mà không mất lịch sử', 'Xếp lớp, học bù, chuyển lớp và dạy thay đều có người phụ trách và bằng chứng.', canonicalAction('Xếp lớp học viên mẫu'))}
      <div class="metric-grid four">${metric('Chờ xếp lớp', ctx.state.payments.filter((item) => item.status === 'PAID' && !ctx.state.enrollments.some((enrollment) => enrollment.learnerId === item.learnerId && enrollment.status === 'ACTIVE')).length, 'Đã xác nhận thanh toán', 'people')}${metric('Vụ việc hết chỗ', noSeat, 'Cần phương án thay thế', 'shield')}${metric('Học bù', ctx.state.makeUpBookings.filter((item) => item.status !== 'ATTENDED').length, 'Đủ điều kiện → đặt lịch', 'calendar')}${metric('Dạy thay', ctx.state.substitutions.filter((item) => item.status !== 'CLOSED').length, 'Cần bàn giao', 'people')}</div>
      <div class="content-grid two">${section('Hàng chờ ngoại lệ', table([{ label: 'Vụ việc', render: (row) => escapeHtml(valueLabel(row.type)) }, { label: 'Lý do', key: 'reason' }, { label: 'Người phụ trách', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.ownerId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.serviceCases))}${section('Quy tắc vận hành', '<ul class="check-list"><li>✓ Hết chỗ trả về các phương án thay thế xếp hạng</li><li>✓ Chuyển lớp giữ hồ sơ ghi danh cũ</li><li>✓ Sửa điểm danh cần lý do</li><li>✓ Giáo viên dạy thay cần bàn giao trước khi đóng</li></ul>')}</div></div>`;
  }

  function allocation(ctx) {
    const candidates = ctx.state.leads.filter((lead) => ctx.state.payments.some((item) => item.leadId === lead.id && item.status === 'PAID') && !ctx.state.enrollments.some((item) => item.learnerId === lead.learnerId && item.status === 'ACTIVE'));
    const classRows = ctx.state.classes.map((cohort) => { const used = ctx.state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length; return { ...cohort, used, seats: cohort.capacity - used }; });
    return `<div class="workspace-page">${pageHeader('Dịch vụ học viên · Xếp lớp', 'Xếp lớp', 'Khớp phiên bản khóa học, chi nhánh, lịch và số chỗ còn lại.', canonicalAction('Xếp Minh Anh vào 6A'))}
      <div class="content-grid main-aside">${section('Lớp phù hợp', table([{ label: 'Lớp', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small>` }, { label: 'Lịch', key: 'scheduleLabel' }, { label: 'Hình thức', render: (row) => escapeHtml(valueLabel(row.mode)) }, { label: 'Còn chỗ', render: (row) => `<strong>${Math.max(0, row.seats)}</strong> / ${row.capacity}` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], classRows))}${section('Sẵn sàng xếp lớp', candidates.length ? candidates.map((lead) => `<div class="queue-card">${person({ name: lead.name }, lead.goal)}${badge('PAID')}</div>`).join('') : empty('Không có học viên chờ', 'Ghi nhận thanh toán mô phỏng để học viên đủ điều kiện tài chính xuất hiện.'))}</div></div>`;
  }

  function cases(ctx) {
    const rows = [...ctx.state.serviceCases, ...ctx.state.interventionCases].map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Dịch vụ học viên · Quản lý vụ việc', 'Vụ việc và can thiệp', 'Mỗi vụ việc có tín hiệu, người phụ trách, kế hoạch, lịch theo dõi và kết quả.')}${section('Công việc phụ trách', table([{ label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || row.leadId || 'Chưa tạo học viên') }, { label: 'Loại / tín hiệu', render: (row) => escapeHtml(row.type || row.signal) }, { label: 'Kế hoạch / lý do', render: (row) => escapeHtml(row.plan || row.reason) }, { label: 'Theo dõi lại', render: (row) => formatDate(row.followUpAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function makeUp(ctx) {
    const openCases = ctx.state.remedialCases.filter((item) => item.resolution !== 'NOT_REQUIRED');
    const bookingRows = ctx.state.makeUpBookings.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId), targetSession: ctx.state.sessions.find((session) => session.id === item.targetSessionId), targetClass: ctx.state.classes.find((cohort) => cohort.id === item.targetClassId) }));
    const ranking = openCases.map((remedialCase) => {
      const learner = ctx.state.learners.find((item) => item.id === remedialCase.learnerId);
      const candidates = root.YC.remedial.rankMakeUpTargets(ctx.state, remedialCase.id);
      const eligible = candidates.filter((item) => item.eligible);
      const active = ctx.state.makeUpBookings.find((item) => item.remedialCaseId === remedialCase.id && ['HELD', 'BOOKED', 'NOTIFIED'].includes(item.status));
      return `<article class="ranking-card"><div class="between"><div><p class="eyebrow">${escapeHtml(learner?.code || '')}</p><h3>${escapeHtml(learner?.name || '')}</h3></div>${badge(root.YC.remedial.caseStatus(ctx.state, remedialCase.id)?.status || 'OPEN')}</div>${active ? `<div class="notice-panel"><b>Đã có lịch đang hoạt động</b><p>${escapeHtml(active.targetSessionId)} · ${escapeHtml(valueLabel(active.status))}</p></div>` : `<form data-form="make-up-booking" class="stack"><input type="hidden" name="caseId" value="${escapeHtml(remedialCase.id)}"><label>Buổi học đích<select class="input" name="targetSessionId" required>${eligible.map((candidate) => { const session = ctx.state.sessions.find((item) => item.id === candidate.sessionId); const cohort = ctx.state.classes.find((item) => item.id === candidate.classId); return `<option value="${escapeHtml(candidate.sessionId)}">${escapeHtml(cohort?.name || '')} · ${formatDate(session?.startsAt, true)} · ${candidate.score} điểm · ${escapeHtml(candidate.sessionId)}</option>`; }).join('')}</select></label><button class="btn btn-primary" type="submit" ${eligible.length ? '' : 'disabled'}>Xác nhận lịch học bù</button></form>`}<details><summary>Điều kiện và xếp hạng</summary><div class="candidate-list">${candidates.slice(0, 5).map((candidate) => `<div class="candidate-card ${candidate.eligible ? '' : 'muted-card'}"><strong>${escapeHtml(candidate.sessionId)}</strong><span>${candidate.score} điểm</span><div class="gate-row">${candidate.hardGates.map((gate) => `<span class="${gate.passed ? 'pass' : 'fail'}">${gate.passed ? '✓' : '×'} ${escapeHtml(gate.label)}</span>`).join('')}</div></div>`).join('') || '<p class="muted">Chưa có buổi học đích phù hợp.</p>'}</div></details></article>`;
    }).join('');
    return `<div class="workspace-page">${pageHeader('Dịch vụ học viên · Học bù', 'Đặt lịch học bù', 'Hệ thống xếp hạng đúng nội dung, còn chỗ, không trùng lịch và có giáo viên hiệu lực trước khi đặt.')}<div class="content-grid main-aside">${section('Xếp hạng buổi học đích', ranking || empty('Chưa có hồ sơ cần xếp lịch', 'Hồ sơ đủ điều kiện sẽ xuất hiện sau khi điểm danh được chốt.'))}${section('Quy tắc giữ chỗ', '<ul class="check-list"><li>✓ Một hồ sơ chỉ có một booking hoạt động</li><li>✓ Giữ chỗ được tính vào sức chứa</li><li>✓ No-show cho phép đặt lại nhưng không xóa lần cũ</li><li>✓ Khác bài học cần Admin duyệt mapping</li></ul>')}</div>${section('Lịch sử đặt học bù', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.learner?.name || '')}</strong><small>Khách học bù</small>` }, { label: 'Buổi gốc', key: 'originalSessionId' }, { label: 'Buổi đích', render: (row) => `<strong>${escapeHtml(row.targetClass?.name || '')}</strong><small>${formatDate(row.targetSession?.startsAt, true)}</small>` }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Thao tác', render: (row) => ['HELD', 'BOOKED', 'NOTIFIED'].includes(row.status) ? `<button class="text-link danger-link" data-action="cancel-make-up-booking" data-booking-id="${escapeHtml(row.id)}">Hủy lịch</button>` : 'Đã đóng' }], bookingRows))}</div>`;
  }

  function transfers(ctx) {
    const transferred = ctx.state.enrollments.filter((item) => item.status === 'TRANSFERRED');
    return `<div class="workspace-page">${pageHeader('Dịch vụ học viên · Chuyển lớp', 'Chuyển lớp', 'Ghi danh cũ được đóng, ghi danh mới được tạo và phạm vi danh sách lớp đổi theo hiệu lực.')}${section('Lịch sử chuyển lớp', table([{ label: 'Học viên', render: (row) => escapeHtml(ctx.state.learners.find((item) => item.id === row.learnerId)?.name || '') }, { label: 'Lớp cũ', render: (row) => escapeHtml(ctx.state.classes.find((item) => item.id === row.classId)?.name || '') }, { label: 'Lý do', key: 'transferReason' }, { label: 'Kết thúc', render: (row) => formatDate(row.endsAt) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], transferred))}</div>`;
  }

  function substitutions(ctx) {
    const rows = ctx.state.substitutions.map((item) => ({ ...item, session: ctx.state.sessions.find((session) => session.id === item.sessionId), original: ctx.state.teacherProfiles.find((profile) => profile.id === item.originalTeacherProfileId), replacement: ctx.state.teacherProfiles.find((profile) => profile.id === item.replacementTeacherProfileId) }));
    return `<div class="workspace-page">${pageHeader('Dịch vụ học viên · Liên tục', 'Giáo viên dạy thay', 'Ứng viên → xác nhận → quyền có thời hạn → bàn giao → đóng.')}${section('Hàng chờ dạy thay', table([{ label: 'Buổi học', render: (row) => `<strong>${escapeHtml(row.session?.id || '')}</strong><small>${formatDate(row.session?.startsAt)}</small>` }, { label: 'Giáo viên chính', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.original?.userId)?.name || '') }, { label: 'Thay thế', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.replacement?.userId)?.name || 'Chưa chọn') }, { label: 'Bàn giao', render: (row) => row.handover ? escapeHtml(row.handover.note) : 'Chưa có' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function traceBreadcrumb(items) {
    return `<nav class="trace-breadcrumb" aria-label="Chuỗi truy vết">${items.map((item, index) => `${index ? '<span>›</span>' : ''}${item.href ? `<a href="#${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>` : `<strong>${escapeHtml(item.label)}</strong>`}`).join('')}</nav>`;
  }

  function teacherCourseRequestForm(ctx) {
    return `<form class="operations-form panel" data-form="request-course"><div class="panel-heading"><div><h2>Đề xuất khóa học mới</h2><p>Dữ liệu chỉ xuất hiện chính thức sau khi được duyệt.</p></div>${badge('SUBMITTED', 'Chờ Admin duyệt')}</div><div class="form-grid"><label>Mã khóa học<input class="input" name="code" required placeholder="YEN-KIDS-A2"></label><label>Tên khóa học<input class="input" name="name" required></label><label>Chương trình<select class="input" name="programId">${ctx.state.programs.filter((item) => item.status === 'PUBLISHED').map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><label>Cấp độ<select class="input" name="levelId">${ctx.state.levels.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><label>Nhóm tuổi<select class="input" name="ageBand"><option value="YOUNG_LEARNER">Thiếu nhi</option><option value="TEEN">Thiếu niên</option></select></label><label>Hình thức<select class="input" name="mode"><option value="OFFLINE">Tại trung tâm</option><option value="ONLINE">Trực tuyến</option><option value="HYBRID">Kết hợp</option></select></label><label class="span-two">Mô tả<textarea class="input" name="description" rows="2"></textarea></label><label class="span-two">Lý do đề xuất<textarea class="input" name="reason" rows="2" required></textarea></label></div><button class="btn btn-primary" type="submit">Gửi đề xuất · Chờ Admin duyệt</button></form>`;
  }

  function teacherClassRequestForm(ctx) {
    return `<form class="operations-form panel" data-form="request-class"><div class="panel-heading"><div><h2>Đề xuất lớp học mới</h2><p>Admin kiểm tra sức chứa, lịch, khóa học và chi nhánh.</p></div>${badge('SUBMITTED', 'Chờ Admin duyệt')}</div><div class="form-grid"><label>Mã lớp<input class="input" name="code" required placeholder="YEN-A2-T3T5"></label><label>Tên lớp<input class="input" name="name" required></label><label>Chi nhánh<select class="input" name="branchId">${ctx.state.branches.filter((item) => (ctx.actor.branchIds || []).includes(item.id)).map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><label>Phiên bản khóa học<select class="input" name="courseVersionId">${ctx.state.courseVersions.filter((item) => item.status === 'PUBLISHED' && item.immutable).map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.id)}</option>`).join('')}</select></label><label>Nhóm tuổi<select class="input" name="ageBand"><option value="YOUNG_LEARNER">Thiếu nhi</option><option value="TEEN">Thiếu niên</option></select></label><label>Hình thức<select class="input" name="mode"><option value="OFFLINE">Tại trung tâm</option><option value="ONLINE">Trực tuyến</option></select></label><label>Sức chứa tối thiểu<input class="input" type="number" name="minCapacity" min="1" value="4"></label><label>Sức chứa tối đa<input class="input" type="number" name="capacity" min="1" value="12"></label><label>Phòng<input class="input" name="room" value="P.204"></label><label>Lịch định kỳ<input class="input" name="recurrence" value="TUE_1800,THU_1800"></label><label>Ngày bắt đầu<input class="input" type="date" name="startDate" value="2026-09-15"></label><label>Ngày kết thúc<input class="input" type="date" name="endDate" value="2026-12-15"></label><label class="span-two">Lý do đề xuất<textarea class="input" name="reason" rows="2" required></textarea></label></div><button class="btn btn-primary" type="submit">Gửi đề xuất · Chờ Admin duyệt</button></form>`;
  }

  function teacherSessionRequestForm(ctx) {
    const profile = ctx.state.teacherProfiles.find((item) => item.userId === ctx.actor.id);
    const classIds = ctx.state.teacherAssignments.filter((item) => item.teacherProfileId === profile?.id && ['ACTIVE', 'ACCEPTED'].includes(item.status)).map((item) => item.classId);
    const classes = ctx.state.classes.filter((item) => classIds.includes(item.id));
    const versionIds = classes.map((item) => item.courseVersionId);
    const unitIds = ctx.state.units.filter((item) => versionIds.includes(item.courseVersionId)).map((item) => item.id);
    const lessons = ctx.state.lessonTemplates.filter((item) => unitIds.includes(item.unitId));
    return `<form class="operations-form panel" data-form="request-session"><div class="panel-heading"><div><h2>Đề xuất buổi học bổ sung</h2><p>Hệ thống kiểm tra bài học, phòng, giáo viên và trùng lịch trước khi gửi.</p></div>${badge('SUBMITTED', 'Chờ Admin duyệt')}</div><div class="form-grid"><label>Lớp học<select class="input" name="classId">${classes.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><label>Bài học<select class="input" name="lessonTemplateId">${lessons.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.id)}</option>`).join('')}</select></label><label>Bắt đầu<input class="input" type="datetime-local" name="startsAt" value="2026-09-08T18:00" required></label><label>Kết thúc<input class="input" type="datetime-local" name="endsAt" value="2026-09-08T19:30" required></label><label>Phòng<input class="input" name="room" value="P.304"></label><label>Hình thức<select class="input" name="mode"><option value="OFFLINE">Tại trung tâm</option><option value="ONLINE">Trực tuyến</option></select></label><label class="span-two">Lý do đề xuất<textarea class="input" name="reason" rows="2" required></textarea></label></div><button class="btn btn-primary" type="submit">Gửi đề xuất · Chờ Admin duyệt</button></form>`;
  }

  function teacherDashboard(ctx) {
    const metrics = root.YC.selectors.metrics(ctx.state, 'TEACHER');
    const profile = ctx.state.teacherProfiles.find((item) => item.userId === ctx.actor?.id) || ctx.state.teacherProfiles[0];
    const assignments = ctx.state.teacherAssignments.filter((item) => item.teacherProfileId === profile.id);
    return `<div class="workspace-page teacher-page">${pageHeader('Khu vực giáo viên', `Chào ${ctx.actor?.name?.split(' ').at(-1) || 'giáo viên'}`, 'Chuẩn bị, giảng dạy, ghi bằng chứng và xử lý phản hồi trong một nơi.', canonicalAction('Thực hiện bước của giáo viên'))}
      <div class="metric-grid four">${metric('Buổi sắp tới', metrics.upcomingSessions, 'Đã xác nhận hoặc đang lên kế hoạch', 'calendar')}${metric('Chờ chấm', metrics.gradingBacklog, 'Hàng chờ chấm thủ công', 'check')}${metric('Lớp đang dạy', assignments.filter((item) => item.status === 'ACTIVE').length, 'Theo phân công còn hiệu lực', 'people')}${metric('Vụ việc đang mở', metrics.openCases, 'Cần phối hợp', 'shield')}</div>
      <section class="today-session"><div class="today-time"><b>18:00</b><span>HÔM NAY</span></div><div><p class="eyebrow on-dark">Buổi học tiếp theo</p><h2>Tiếng Anh nền tảng 6A</h2><p>Học phần 4 · Thì quá khứ đơn · P.302 · 90 phút</p><div class="inline"><span>${icon('people')} ${root.YC.selectors.sessionWorkbench(ctx.state, 'session-canonical').roster.length} học viên</span><span>${icon('book')} Giáo án v2</span></div></div>${link('Mở bàn điều khiển buổi học', '/app/teacher/sessions/session-canonical', { kind: 'primary' })}</section>
      <div class="content-grid two">${section('Phân công', table([{ label: 'Lớp', render: (row) => escapeHtml(ctx.state.classes.find((item) => item.id === row.classId)?.name || '') }, { label: 'Vai trò', key: 'role' }, { label: 'Khối lượng', render: (row) => `${row.workloadMinutes} phút` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], assignments))}${section('Tín hiệu giảng dạy', '<div class="insight-list"><div><span class="signal warning">1</span><p><strong>Thiếu nội dung</strong><small>Phần phát âm được chuyển sang bài luyện tập.</small></p></div><div><span class="signal success">✓</span><p><strong>Chia sẻ an toàn</strong><small>Phụ huynh chỉ thấy phản hồi đã công bố.</small></p></div></div>')}</div></div>`;
  }

  function teacherSessions(ctx) {
    const rows = ctx.state.sessions.map((item) => ({ ...item, cohort: ctx.state.classes.find((cohort) => cohort.id === item.classId), plan: ctx.state.lessonPlans.find((plan) => plan.sessionId === item.id) }));
    return `<div class="workspace-page">${pageHeader('Giáo viên · Giảng dạy', 'Buổi học', 'Từ mức độ sẵn sàng đến bằng chứng giảng dạy và điểm danh đã chốt.', canonicalAction('Cập nhật buổi học mẫu'))}${section('Danh sách buổi học', table([{ label: 'Buổi học', render: (row) => `<a class="table-link" href="#/app/teacher/sessions/${row.id}"><strong>${escapeHtml(row.cohort?.name || '')}</strong><small>${escapeHtml(row.id)}</small></a>` }, { label: 'Lịch', render: (row) => formatDate(row.startsAt) }, { label: 'Phòng', key: 'room' }, { label: 'Sẵn sàng', render: (row) => badge(row.plan?.readiness || 'DRAFT') }, { label: 'Giảng dạy', render: (row) => badge(row.status) }, { label: 'Điểm danh', render: (row) => row.attendanceFinalized ? badge('COMPLETED', 'Đã chốt') : badge('DRAFT', 'Chưa chốt') }], rows))}${teacherSessionRequestForm(ctx)}</div>`;
  }

  function teacherClasses(ctx) {
    const profile = ctx.state.teacherProfiles.find((item) => item.userId === ctx.actor?.id) || ctx.state.teacherProfiles[0];
    const classIds = ctx.state.teacherAssignments.filter((item) => item.teacherProfileId === profile.id && ['PROPOSED', 'ACTIVE'].includes(item.status)).map((item) => item.classId);
    const cohorts = ctx.state.classes.filter((item) => classIds.includes(item.id));
    return `<div class="workspace-page">${pageHeader('Giáo viên · Lớp học', 'Lớp của tôi', 'Danh sách học viên, lịch học, nội dung và điểm danh dùng cùng dữ liệu phân công.')}${section('Danh sách lớp', table([{ label: 'Lớp', render: (row) => `<a class="table-link" href="#/app/teacher/classes/${row.id}"><strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small></a>` }, { label: 'Lịch học', key: 'scheduleLabel' }, { label: 'Phòng', key: 'room' }, { label: 'Học viên', render: (row) => ctx.state.enrollments.filter((item) => item.classId === row.id && item.status === 'ACTIVE').length }, { label: 'Trạng thái', render: (row) => badge(row.status) }], cohorts, { emptyTitle: 'Chưa có lớp được phân công', emptyBody: 'Lớp sẽ xuất hiện khi giáo viên có phân công đang hiệu lực.' }))}${teacherClassRequestForm(ctx)}</div>`;
  }

  function teacherClassDetail(ctx, classId) {
    const cohort = ctx.state.classes.find((item) => item.id === classId) || ctx.state.classes[0];
    const learnerIds = ctx.state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').map((item) => item.learnerId);
    const learners = ctx.state.learners.filter((item) => learnerIds.includes(item.id));
    const sessions = ctx.state.sessions.filter((item) => item.classId === cohort.id);
    const version = ctx.state.courseVersions.find((item) => item.id === cohort.courseVersionId);
    const course = ctx.state.courses.find((item) => item.id === version?.courseId);
    return `<div class="workspace-page">${traceBreadcrumb([{ label: 'Khóa học', href: '/app/teacher/courses' }, { label: course?.name || 'Khóa học' }, { label: `Phiên bản v${version?.version || '—'}` }, { label: 'Lớp học' }])}${pageHeader('Giáo viên · Lớp học', cohort.name, `${cohort.scheduleLabel} · ${cohort.room}`, link('Về danh sách lớp', '/app/teacher/classes'))}
      <div class="metric-grid three">${metric('Học viên', learners.length, `${cohort.capacity - learners.length} chỗ còn lại`, 'people')}${metric('Buổi học', sessions.length, 'Theo lịch đang hiệu lực', 'calendar')}${metric('Phiên bản khóa học', ctx.state.courseVersions.find((item) => item.id === cohort.courseVersionId)?.version || '—', 'Snapshot không đổi', 'book')}</div>
      <div class="content-grid two">${section('Danh sách học viên', table([{ label: 'Mã', key: 'code' }, { label: 'Họ và tên', key: 'name' }, { label: 'Mục tiêu', key: 'goal' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], learners))}${section('Các buổi học', sessions.map((session) => `<div class="queue-card"><div><strong>${formatDate(session.startsAt)}</strong><small>${escapeHtml(ctx.state.lessonTemplates.find((item) => item.id === session.lessonTemplateId)?.title || '')}</small></div>${link(session.attendanceFinalized ? 'Xem điểm danh' : 'Điểm danh', `/app/teacher/sessions/${session.id}/attendance`, { small: true, kind: session.attendanceFinalized ? 'secondary' : 'primary' })}</div>`).join('') || '<p class="muted">Chưa có buổi học.</p>')}</div></div>`;
  }

  function attendanceEditor(ctx, sessionId) {
    const workbench = root.YC.selectors.sessionWorkbench(ctx.state, sessionId) || root.YC.selectors.sessionWorkbench(ctx.state, 'session-canonical');
    const { session, roster } = workbench;
    const cohort = ctx.state.classes.find((item) => item.id === session.classId);
    const draft = ctx.attendanceDraft || {};
    const statuses = [['PRESENT', 'Có mặt'], ['ABSENT', 'Vắng'], ['LATE', 'Đi muộn']];
    return `<div class="workspace-page attendance-page">${pageHeader('Giáo viên · Buổi học', 'Điểm danh lớp học', `${cohort.name} · ${formatDate(session.startsAt)} · ${session.room}`, `<button class="btn btn-secondary" type="button" data-action="attendance-all-present" data-session-id="${escapeHtml(session.id)}">Tất cả có mặt</button><button class="btn btn-secondary" type="button" data-action="reset-attendance-draft" data-session-id="${escapeHtml(session.id)}">Hoàn tác</button>`)}
      <div class="notice-panel panel"><b>Dùng chung dữ liệu với tài khoản Học viên</b><p>Đánh dấu Nguyễn Minh Anh vắng rồi lưu. Tài khoản HS6A001 sẽ thấy bài học bù được tạo ngay.</p></div>
      <section class="panel attendance-editor"><div class="panel-heading"><div><h2>Danh sách học viên</h2><p>${roster.length} học viên · Trạng thái chỉ được ghi khi bấm Lưu điểm danh</p></div>${badge(session.attendanceFinalized ? 'COMPLETED' : 'DRAFT', session.attendanceFinalized ? 'Đã lưu' : 'Chưa lưu')}</div>
      <div class="attendance-list">${roster.map((learner) => { const stored = ctx.state.attendanceRecords.find((item) => item.sessionId === session.id && item.learnerId === learner.id)?.status; const selected = draft[learner.id] || stored || 'PRESENT'; return `<article class="attendance-row"><div>${person({ name: learner.name }, learner.code)}${learner.id === 'student-canonical' ? '<small class="canonical-label">Học viên demo chính</small>' : ''}</div><div class="attendance-options" role="group" aria-label="Điểm danh ${escapeHtml(learner.name)}">${statuses.map(([status, label]) => `<button type="button" data-action="set-attendance" data-session-id="${escapeHtml(session.id)}" data-learner-id="${escapeHtml(learner.id)}" data-status="${status}" aria-pressed="${selected === status}">${label}</button>`).join('')}</div></article>`; }).join('')}</div>
      <div class="attendance-save"><span>Vắng sẽ tự động tạo đúng một bài học bù.</span><button class="btn btn-primary" type="button" data-action="save-attendance" data-session-id="${escapeHtml(session.id)}">Lưu điểm danh</button></div></section></div>`;
  }

  function teacherRemedial(ctx) {
    const rows = ctx.state.remedialCases.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId), lesson: ctx.state.lessonTemplates.find((lesson) => lesson.id === item.sourceLessonTemplateId), assignment: ctx.state.remedialAssignments.find((entry) => entry.remedialCaseId === item.id), computed: root.YC.remedial.caseStatus(ctx.state, item.id) }));
    return `<div class="workspace-page">${pageHeader('Giáo viên · Học bù', 'Theo dõi bài học bù', 'Một hồ sơ chung cho bài trực tuyến và lịch học tại lớp, luôn truy về buổi vắng.')}${section('Danh sách hồ sơ học bù', table([{ label: 'Học viên', render: (row) => `<a class="table-link" href="#/app/teacher/remedial/${escapeHtml(row.id)}"><strong>${escapeHtml(row.learner?.name || '')}</strong><small>${escapeHtml(row.learner?.code || '')}</small></a>` }, { label: 'Bài học', render: (row) => escapeHtml(row.lesson?.title || '') }, { label: 'Hạn hoàn thành', render: (row) => formatDate(row.assignment?.dueAt) }, { label: 'Tiến độ', render: (row) => `${row.assignment?.videoProgress || 0}% · ${row.assignment?.highestScore ?? '—'}/100` }, { label: 'Trạng thái tổng', render: (row) => badge(row.computed?.status || 'OPEN') }, { label: 'Quản lý liên kết', render: (row) => row.assignment ? `<div class="table-actions"><button type="button" data-action="copy-remedial-link" data-assignment-id="${escapeHtml(row.assignment.id)}">Sao chép</button><button type="button" data-action="regenerate-remedial-link" data-assignment-id="${escapeHtml(row.assignment.id)}">Tạo lại</button><button type="button" data-action="revoke-remedial-link" data-assignment-id="${escapeHtml(row.assignment.id)}">Thu hồi</button><button type="button" data-action="extend-remedial-deadline" data-assignment-id="${escapeHtml(row.assignment.id)}">Gia hạn</button></div>` : '—' }], rows, { emptyTitle: 'Chưa có hồ sơ học bù', emptyBody: 'Điểm danh một học viên vắng để tạo hồ sơ.' }))}</div>`;
  }

  function teacherRemedialDetail(ctx, caseId) {
    const remedialCase = ctx.state.remedialCases.find((item) => item.id === caseId);
    if (!remedialCase) return '';
    const attendance = ctx.state.attendanceRecords.find((item) => item.id === remedialCase.sourceAttendanceId);
    const trace = root.YC.remedial.sourceTrace(ctx.state, attendance);
    const learner = ctx.state.learners.find((item) => item.id === remedialCase.learnerId);
    const assignment = ctx.state.remedialAssignments.find((item) => item.remedialCaseId === caseId);
    const bookings = ctx.state.makeUpBookings.filter((item) => item.remedialCaseId === caseId);
    return `<div class="workspace-page">${traceBreadcrumb([{ label: 'Khóa học', href: '/app/teacher/courses' }, { label: `Phiên bản v${trace.courseVersion?.version || '—'}` }, { label: 'Lớp gốc', href: `/app/teacher/classes/${trace.cohort?.id}` }, { label: 'Buổi gốc', href: `/app/teacher/sessions/${trace.session?.id}` }, { label: 'Điểm danh' }, { label: 'Hồ sơ học bù' }])}${pageHeader('Giáo viên · Học bù', learner?.name || 'Hồ sơ học bù', 'Chuỗi truy vết từ nội dung gốc đến bằng chứng hoàn thành.', link('Về danh sách', '/app/teacher/remedial'))}<div class="content-grid main-aside">${section('Nguồn phát sinh', `<dl class="detail-list"><div><dt>Khóa học</dt><dd>${escapeHtml(trace.courseVersion?.title || '')}</dd></div><div><dt>Lớp gốc</dt><dd>${escapeHtml(trace.cohort?.name || '')}</dd></div><div><dt>Buổi gốc</dt><dd>${formatDate(trace.session?.startsAt, true)}</dd></div><div><dt>Điểm danh</dt><dd>${badge(attendance?.status || 'DRAFT')}</dd></div></dl>`)}${section('Bằng chứng trực tuyến', assignment ? `<dl class="detail-list"><div><dt>Tiến độ video</dt><dd>${assignment.videoProgress || 0}%</dd></div><div><dt>Điểm cao nhất</dt><dd>${assignment.highestScore ?? '—'}</dd></div><div><dt>Trạng thái</dt><dd>${badge(assignment.status)}</dd></div></dl>` : '<p class="muted">Không yêu cầu hình thức trực tuyến.</p>')}</div>${section('Lịch học tại lớp', bookings.map((booking) => `<div class="queue-card"><div><strong>${escapeHtml(ctx.state.classes.find((item) => item.id === booking.targetClassId)?.name || '')}</strong><small>${formatDate(ctx.state.sessions.find((item) => item.id === booking.targetSessionId)?.startsAt, true)}</small></div>${badge(booking.status)}</div>`).join('') || '<p class="muted">Chưa đặt lịch tại lớp.</p>')}</div>`;
  }

  function teacherReports(ctx) {
    const rows = ctx.state.sessions.map((session) => { const cohort = ctx.state.classes.find((item) => item.id === session.classId); const attendance = ctx.state.attendanceRecords.filter((item) => item.sessionId === session.id); const remedial = ctx.state.remedialAssignments.filter((item) => item.sessionId === session.id); return { session, cohort, attendance, remedial }; });
    return `<div class="workspace-page">${pageHeader('Giáo viên · Báo cáo', 'Báo cáo lớp học', 'Đối chiếu chuyên cần, học bù và kết quả theo từng buổi.', `${button('Xuất CSV', 'export-csv', { kind: 'secondary', payload: { type: 'sessions' } })}${button('In báo cáo', 'print-view', { kind: 'secondary' })}`)}${section('Theo từng buổi học', table([{ label: 'Buổi học', render: (row) => `<strong>${escapeHtml(row.cohort?.name || '')}</strong><small>${formatDate(row.session.startsAt)}</small>` }, { label: 'Có mặt', render: (row) => row.attendance.filter((item) => item.status === 'PRESENT').length }, { label: 'Vắng', render: (row) => row.attendance.filter((item) => item.status === 'ABSENT').length }, { label: 'Đã giao bù', render: (row) => row.remedial.length }, { label: 'Đã hoàn thành', render: (row) => row.remedial.filter((item) => item.status === 'COMPLETED').length }], rows))}</div>`;
  }

  function teacherNotifications(ctx) {
    const rows = ctx.state.notifications.filter((item) => item.userId === ctx.actor.id);
    return `<div class="workspace-page">${pageHeader('Giáo viên · Thông báo', 'Thông báo', 'Bài học bù hoàn tất, phân công và việc cần xử lý.', button('Đánh dấu tất cả đã đọc', 'mark-notifications-read', { kind: 'secondary' }))}${section('Hộp thư', rows.length ? rows.map((item) => `<article class="notification-item ${item.read ? '' : 'unread'}"><span>${icon('spark')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${formatDate(item.createdAt)}</small></div>${badge(item.read ? 'COMPLETED' : 'NEW', item.read ? 'Đã đọc' : 'Mới')}</article>`).join('') : '<p class="muted">Chưa có thông báo.</p>')}</div>`;
  }

  function sessionDetail(ctx, sessionId) {
    const workbench = root.YC.selectors.sessionWorkbench(ctx.state, sessionId) || root.YC.selectors.sessionWorkbench(ctx.state, 'session-canonical');
    const { session, plan, roster, risks, openHomework, delivery } = workbench;
    const cohort = ctx.state.classes.find((item) => item.id === session.classId);
    const lesson = ctx.state.lessonTemplates.find((item) => item.id === session.lessonTemplateId);
    const version = ctx.state.courseVersions.find((item) => item.id === cohort.courseVersionId);
    const course = ctx.state.courses.find((item) => item.id === version?.courseId);
    const canPrepare = root.YC.policy.can(ctx.actor, 'session.prepare', { classId: cohort.id, sessionId: session.id }, ctx.state);
    let controls = '';
    if (canPrepare && session.status === 'CONFIRMED' && plan?.readiness !== 'READY') controls = button('Xác nhận giáo án sẵn sàng', 'mark-session-ready', { payload: { sessionId: session.id }, icon: 'check' });
    else if (canPrepare && session.status === 'CONFIRMED' && plan?.readiness === 'READY') controls = button('Bắt đầu buổi học', 'start-session', { payload: { sessionId: session.id }, icon: 'arrow' });
    else if (canPrepare && session.status === 'IN_PROGRESS') controls = `${link('Mở điểm danh', `/app/teacher/sessions/${session.id}/attendance`, { kind: 'secondary' })}${button('Hoàn tất và lưu bằng chứng', 'complete-session', { payload: { sessionId: session.id }, icon: 'check' })}`;
    return `<div class="workspace-page session-workbench">${traceBreadcrumb([{ label: 'Khóa học', href: '/app/teacher/courses' }, { label: course?.name || 'Khóa học' }, { label: `Phiên bản v${version?.version || '—'}` }, { label: 'Lớp', href: `/app/teacher/classes/${cohort.id}` }, { label: 'Buổi học' }])}${pageHeader('Bàn điều khiển buổi học', cohort.name, `${formatDate(session.startsAt)} · ${session.room} · ${session.mode}`, controls)}
      <div class="session-tabs"><a class="active" href="#/app/teacher/sessions/${session.id}">Tổng quan</a><a href="#/app/teacher/sessions/${session.id}/attendance">Điểm danh</a><a href="#/app/teacher/grading">Bài tập</a><a href="#/app/teacher/quality">Bằng chứng</a></div>
      <div class="content-grid main-aside"><div class="stack-lg">${section('Giáo án', `<div class="lesson-plan"><div><p class="eyebrow">${escapeHtml(lesson.title)}</p><h3>${escapeHtml(lesson.objectives.join(' · '))}</h3></div>${badge(plan?.readiness || 'DRAFT')}</div><dl class="detail-list"><div><dt>Điều chỉnh</dt><dd>${escapeHtml((plan?.adaptations || []).join(', ') || 'Chưa có')}</dd></div><div><dt>Nội dung dự kiến</dt><dd>${ctx.state.learningItems.filter((item) => item.lessonTemplateId === lesson.id).length} hoạt động</dd></div><div><dt>Bằng chứng giảng dạy</dt><dd>${delivery ? `${delivery.taughtItemIds.length} đã dạy · ${delivery.deferredItemIds.length} chuyển sau` : 'Chưa ghi'}</dd></div></dl>`)}
      ${section('Danh sách lớp và điểm danh', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small>` }, { label: 'Rủi ro', render: (row) => risks.some((risk) => risk.learnerId === row.id) ? badge('REQUESTED', 'Cần lưu ý') : '—' }, { label: 'Điểm danh', render: (row) => { const record = ctx.state.attendanceRecords.find((item) => item.sessionId === session.id && item.learnerId === row.id); return record ? badge(record.status) : badge('DRAFT', 'Chưa ghi'); } }], roster))}</div>
      <div class="stack-lg">${section('Điều khiển buổi học', `<div class="state-machine"><span class="done">Đã xác nhận</span><span class="${plan?.readiness === 'READY' || ['IN_PROGRESS', 'COMPLETED'].includes(session.status) ? 'done' : ''}">Sẵn sàng</span><span class="${['IN_PROGRESS', 'COMPLETED'].includes(session.status) ? 'done' : ''}">Đang diễn ra</span><span class="${session.status === 'COMPLETED' ? 'done' : ''}">Đã hoàn thành</span></div><p>Trạng thái hiện tại: ${badge(session.status)}</p>${controls}`)}${section('Bài tập đang mở', openHomework.length ? openHomework.map((item) => `<div class="queue-card"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(ctx.state.learners.find((learner) => learner.id === item.learnerId)?.name || '')}</small></div>${badge(item.status)}</div>`).join('') : '<p class="muted">Không có bài tập đang mở cho lớp này.</p>')}</div></div>`;
  }

  function grading(ctx) {
    const homework = ctx.state.homeworkAssignments.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId), submission: ctx.state.homeworkSubmissions.find((entry) => entry.id === item.currentSubmissionId) }));
    const grades = ctx.state.gradingRecords.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Giáo viên · Đánh giá', 'Hàng chờ chấm bài', 'Phản hồi được chuẩn bị, công bố, yêu cầu sửa và chấp nhận theo trạng thái rõ ràng.')}
      <div class="content-grid two">${section('Bài tập', table([{ label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || '') }, { label: 'Bài', key: 'title' }, { label: 'Phiên bản', render: (row) => row.submission ? `v${row.submission.version}` : '—' }, { label: 'Điểm', render: (row) => row.submission?.score ?? '—' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], homework))}${section('Đánh giá thủ công', table([{ label: 'Học viên', render: (row) => escapeHtml(row.learner?.name || '') }, { label: 'Điểm', render: (row) => `<strong>${row.score}/100</strong>` }, { label: 'Phản hồi', key: 'feedback' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], grades))}</div></div>`;
  }

  function workload(ctx) {
    const teacherId = ctx.actor?.role === 'TEACHER' ? ctx.actor.id : 'teacher-1';
    const value = root.YC.selectors.teacherWorkload(ctx.state, teacherId);
    const segments = [['Giảng dạy', value.teachingMinutes, 'blue'], ['Chuẩn bị', value.preparationMinutes, 'violet'], ['Chấm bài', value.gradingMinutes, 'amber'], ['Hành chính', value.administrationMinutes, 'green']];
    return `<div class="workspace-page">${pageHeader('Giáo viên · Năng lực', 'Khối lượng công việc', 'Giảng dạy, chuẩn bị, chấm bài và hành chính cùng đóng góp vào giới hạn.')}
      <div class="workload-summary"><div class="workload-ring" style="--value:${Math.round(value.totalMinutes / value.limitMinutes * 100)}"><span><strong>${Math.round(value.totalMinutes / 60)}h</strong><small>/ ${Math.round(value.limitMinutes / 60)}h</small></span></div><div><p class="eyebrow">Phân bổ hiện tại</p><h2>${Math.round(value.totalMinutes / value.limitMinutes * 100)}% giới hạn khối lượng</h2><p>Điều kiện phân công sẽ chặn trường hợp vượt giới hạn.</p></div></div>
      <div class="segment-grid">${segments.map(([label, minutes, color]) => `<article><span class="segment-dot ${color}"></span><div><small>${label}</small><strong>${Math.round(minutes / 60 * 10) / 10} giờ</strong></div>${progress(Math.round(minutes / value.limitMinutes * 100))}</article>`).join('')}</div></div>`;
  }

  function quality(ctx) {
    return `<div class="workspace-page">${pageHeader('Giáo viên · Chất lượng', 'Bằng chứng giảng dạy cân bằng', 'Không xếp hạng giáo viên bằng một điểm duy nhất; dùng nhiều nguồn bằng chứng.')}
      <div class="quality-grid">${[['Mức độ hoàn thành giảng dạy', 92, 'Giáo án, nội dung đã dạy và chuyển sau'], ['Tốc độ phản hồi', 86, 'Thời điểm chấm và công bố'], ['Tiến bộ học viên', 78, 'Bằng chứng kỹ năng theo lớp'], ['Tính liên tục của lớp', 96, 'Điểm danh và dạy thay'], ['Quan sát lớp học', 82, 'Bằng chứng cố vấn học thuật']].map(([label, value, note]) => `<article><div><span>${label}</span><strong>${value}%</strong></div>${progress(value)}<small>${note}</small></article>`).join('')}</div>${section('Chính sách bằng chứng', '<p>Tín hiệu chất lượng dùng cho cố vấn và lập kế hoạch năng lực. Ghi chú bảo vệ học viên, ghi chú hạn chế và dữ liệu thiếu ngữ cảnh không được đưa vào điểm hiển thị.</p>', { className: 'notice-panel' })}</div>`;
  }

  function contentStudio(ctx) {
    const drafts = ctx.state.contentDrafts || [];
    const activePath = ctx.path || '/app/teacher/content';
    const tabs = [['Kho nội dung', '/app/teacher/content'], ['Khóa học', '/app/teacher/courses'], ['Ngân hàng câu hỏi', '/app/teacher/question-bank'], ['Bài kiểm tra', '/app/teacher/quizzes']];
    return `<div class="workspace-page">${pageHeader('Giáo viên · Khóa học', 'Xưởng nội dung', 'Chuẩn bị bài học, xem trước hoạt động và quản lý câu hỏi trên cùng chương trình.', button('Tạo bản nháp mẫu', 'create-content-draft', { payload: { courseVersionId: 'course-v6', lessonTemplateId: 'lesson-past-simple', title: 'Luyện nói cuối bài' }, icon: 'book' }))}
      <nav class="session-tabs">${tabs.map(([label, href]) => `<a class="${activePath === href ? 'active' : ''}" href="#${href}">${label}</a>`).join('')}</nav>
      <div class="content-grid main-aside">${section('Kho nội dung khóa học', ctx.state.lessonTemplates.map((lesson) => { const unit = ctx.state.units.find((item) => item.id === lesson.unitId); const items = ctx.state.learningItems.filter((item) => item.lessonTemplateId === lesson.id); return `<article class="lesson-plan"><div><p class="eyebrow">${escapeHtml(unit?.title || '')}</p><h3>${escapeHtml(lesson.title)}</h3><small>${items.length} hoạt động · ${lesson.durationMinutes} phút</small></div><div class="inline">${badge(lesson.status)}${link('Xem trước', `/app/teacher/content/preview/${lesson.id}`, { small: true })}</div></article>`; }).join(''))}
      ${section('Ngân hàng câu hỏi', `<dl class="detail-list"><div><dt>Tổng câu hỏi</dt><dd>${ctx.state.questions.length}</dd></div><div><dt>Bài kiểm tra đã xuất bản</dt><dd>${ctx.state.assessments.filter((item) => item.status === 'PUBLISHED').length}</dd></div><div><dt>Bản nháp cá nhân</dt><dd>${drafts.length}</dd></div></dl>${drafts.map((item) => `<div class="queue-card"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(valueLabel(item.type))}</small></div>${badge(item.status)}</div>`).join('')}`)}</div>${activePath === '/app/teacher/courses' ? teacherCourseRequestForm(ctx) : ''}</div>`;
  }

  function contentPreview(ctx, lessonId) {
    const lesson = ctx.state.lessonTemplates.find((item) => item.id === lessonId) || ctx.state.lessonTemplates[0];
    const items = ctx.state.learningItems.filter((item) => item.lessonTemplateId === lesson.id);
    return `<div class="workspace-page">${pageHeader('Giáo viên · Xem trước', 'Xem trước bài học', 'Chế độ này không ghi tiến độ vào tài khoản học viên.', link('Về Xưởng nội dung', '/app/teacher/content'))}<section class="course-overview"><div><p class="eyebrow">${lesson.status === 'PUBLISHED' ? 'Đã công bố' : 'Bản nháp'}</p><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.objectives.join(' · '))}</p></div><div class="course-stat"><strong>${items.length}</strong><span>hoạt động</span></div></section><div class="lesson-list">${items.map((item, index) => `<article class="lesson-row"><span class="lesson-order">${index + 1}</span><div class="lesson-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(valueLabel(item.type))} · ${item.durationMinutes} phút</span></div><div class="lesson-action">${badge(item.required ? 'ACTIVE' : 'DRAFT', item.required ? 'Bắt buộc' : 'Tự chọn')}</div></article>`).join('')}</div></div>`;
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
    if (path === '/app/teacher/classes') return teacherClasses(ctx);
    if (path.startsWith('/app/teacher/classes/')) return teacherClassDetail(ctx, path.split('/').at(-1));
    if (path === '/app/teacher/sessions') return teacherSessions(ctx);
    if (/^\/app\/teacher\/sessions\/[^/]+\/attendance$/.test(path)) return attendanceEditor(ctx, path.split('/')[4]);
    if (path.startsWith('/app/teacher/sessions/')) return sessionDetail(ctx, path.split('/').at(-1));
    if (path.startsWith('/app/teacher/remedial/')) return teacherRemedialDetail(ctx, path.split('/').at(-1));
    if (path === '/app/teacher/remedial') return teacherRemedial(ctx);
    if (path === '/app/teacher/reports') return teacherReports(ctx);
    if (path === '/app/teacher/notifications') return teacherNotifications(ctx);
    if (path === '/app/teacher/grading') return grading(ctx);
    if (path === '/app/teacher/workload') return workload(ctx);
    if (path === '/app/teacher/quality') return quality(ctx);
    if (path.startsWith('/app/teacher/content/preview/')) return contentPreview(ctx, path.split('/').at(-1));
    if (['/app/teacher/content', '/app/teacher/courses', '/app/teacher/question-bank', '/app/teacher/quizzes'].includes(path) || path.startsWith('/app/teacher/quizzes/')) return contentStudio(ctx);
    return '';
  }

  root.YC.define('operationsViews', Object.freeze({ render }));
})(globalThis);

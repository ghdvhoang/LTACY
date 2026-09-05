(function defineManagementViews(root) {
  'use strict';

  const { badge, button, icon, link, metric, money, pageHeader, person, progress, section, table, valueLabel } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  function canonicalAction() {
    return '';
  }

  function academicDashboard(ctx) {
    const moderation = ctx.state.moderationCases.filter((item) => item.status !== 'APPROVED').length;
    const classesWithoutTeacher = ctx.state.classes.filter((cohort) => !ctx.state.teacherAssignments.some((item) => item.classId === cohort.id && ['PROPOSED', 'ACTIVE'].includes(item.status))).length;
    return `<div class="workspace-page">${pageHeader('Quản lý học thuật', 'Bằng chứng học thuật trước quyết định', 'Chương trình, điều kiện giáo viên, kiểm duyệt và lên lớp dùng cùng một bộ quy tắc.', canonicalAction())}
      <div class="metric-grid four">${metric('Lớp chưa có giáo viên', classesWithoutTeacher, 'Cần đối chiếu điều kiện', 'people')}${metric('Kiểm duyệt đang mở', moderation, 'Cuối khóa / sát ngưỡng', 'shield')}${metric('Tiến bộ chờ công bố', ctx.state.skillResults.length && !ctx.state.progressReports.length ? 1 : 0, 'Đủ bằng chứng 6 kỹ năng', 'trend')}${metric('Phiên bản khóa học', ctx.state.courseVersions.filter((item) => item.status === 'PUBLISHED').length, 'Đã công bố và bất biến', 'book')}</div>
      <div class="content-grid main-aside">${section('Hàng chờ quyết định', `<div class="decision-list"><a href="#/app/academic/assignments"><span class="decision-icon blue">${icon('people')}</span><span><strong>Phân công giáo viên</strong><small>Điều kiện bắt buộc và tín hiệu xếp hạng</small></span><b>${classesWithoutTeacher}</b></a><a href="#/app/academic/moderation"><span class="decision-icon violet">${icon('shield')}</span><span><strong>Kiểm duyệt</strong><small>Thang điểm, độ lệch và ghi chú bằng chứng</small></span><b>${moderation}</b></a><a href="#/app/academic/progress-reviews"><span class="decision-icon green">${icon('trend')}</span><span><strong>Tiến bộ và lên lớp</strong><small>6 kỹ năng, chuyên cần và việc tiếp theo</small></span><b>${ctx.state.progressReports.length}</b></a></div>`)}
      ${section('Tóm tắt chính sách', `<dl class="detail-list"><div><dt>Chuyên cần tối thiểu</dt><dd>75%</dd></div><div><dt>Điểm cuối khóa</dt><dd>≥ 70</dd></div><div><dt>Mỗi kỹ năng</dt><dd>≥ 60</dd></div><div><dt>Ngoại lệ</dt><dd>Lý do, bằng chứng và nhật ký</dd></div></dl><a class="text-link" href="#/app/academic/curriculum">Mở chương trình học ${icon('arrow')}</a>`)}</div></div>`;
  }

  function curriculum(ctx) {
    const rows = ctx.state.courseVersions.map((version) => {
      const course = ctx.state.courses.find((item) => item.id === version.courseId);
      const level = ctx.state.levels.find((item) => item.id === course?.levelId);
      return { ...version, course, level };
    });
    return `<div class="workspace-page">${pageHeader('Học thuật · Thiết kế chương trình', 'Chương trình và phiên bản', 'Lớp luôn tham chiếu một bản chụp đã công bố; phiên bản đã công bố không thể sửa.')}
      <div class="curriculum-tree"><span>Dòng sản phẩm</span>${icon('arrow')}<span>Chương trình</span>${icon('arrow')}<span>Cấp độ</span>${icon('arrow')}<span>Khóa học</span>${icon('arrow')}<strong>Phiên bản khóa học</strong>${icon('arrow')}<span>Học phần · Bài học · Hoạt động</span></div>
      ${section('Danh sách phiên bản', table([{ label: 'Phiên bản khóa học', render: (row) => `<strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.course?.code || '')} · v${row.version}</small>` }, { label: 'Cấp độ', render: (row) => escapeHtml(row.level?.code || '') }, { label: 'Số giờ', render: (row) => `${row.totalHours}h` }, { label: 'Quy tắc hoàn thành', render: (row) => `Chuyên cần ${row.completionRule.attendanceMinimum}% · Cuối khóa ${row.completionRule.finalScoreMinimum} · Kỹ năng ${row.completionRule.skillMinimum}` }, { label: 'Vòng đời', render: (row) => `${badge(row.status)}${row.immutable ? '<small>Không thể sửa</small>' : ''}` }], rows))}
      ${section('Cấu trúc bài học đã công bố', ctx.state.units.map((unit) => { const lessons = ctx.state.lessonTemplates.filter((item) => item.unitId === unit.id); return `<details class="course-module"><summary><span><small>HỌC PHẦN ${unit.order}</small><strong>${escapeHtml(unit.title)}</strong></span><span>${lessons.length} bài học ${icon('arrow')}</span></summary><div>${lessons.map((lesson) => `<div class="curriculum-lesson"><div><strong>${escapeHtml(lesson.title)}</strong><small>${lesson.durationMinutes} phút · phiên bản ${lesson.version}</small></div>${badge(lesson.status)}</div>`).join('')}</div></details>`; }).join(''))}</div>`;
  }

  function teachers(ctx) {
    const rows = ctx.state.teacherProfiles.map((profile) => {
      const user = ctx.state.users.find((item) => item.id === profile.userId);
      const qualification = ctx.state.qualifications.find((item) => item.teacherProfileId === profile.id);
      const workload = root.YC.selectors.teacherWorkload(ctx.state, user.id);
      return { ...profile, user, qualification, workload };
    });
    return `<div class="workspace-page">${pageHeader('Học thuật · Đội ngũ', 'Danh sách giáo viên', 'Bằng cấp, phạm vi, năng lực và khối lượng được kiểm tra trước khi phân công.')}${section('Hồ sơ giáo viên', table([{ label: 'Giáo viên', render: (row) => person(row.user, row.teacherCode) }, { label: 'Bằng cấp', render: (row) => `<strong>${escapeHtml(row.qualification?.type || '—')}</strong><small>Hạn ${formatDate(row.qualification?.expiresAt)}</small>` }, { label: 'Cấp độ', render: (row) => escapeHtml(row.levels.join(', ')) }, { label: 'Hình thức', render: (row) => escapeHtml(row.modes.join(', ')) }, { label: 'Khối lượng', render: (row) => `${Math.round(row.workload.totalMinutes / 60)} / ${Math.round(row.workload.limitMinutes / 60)}h` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function assignments(ctx) {
    const candidates = ctx.state.teacherProfiles.map((profile) => ({ profile, user: ctx.state.users.find((item) => item.id === profile.userId), evidence: root.YC.selectors.teacherEligibility(ctx.state, profile.userId, 'class-6a') })).sort((a, b) => Number(b.evidence.eligible) - Number(a.evidence.eligible));
    const active = ctx.state.teacherAssignments.map((item) => ({ ...item, user: ctx.state.users.find((user) => user.id === ctx.state.teacherProfiles.find((profile) => profile.id === item.teacherProfileId)?.userId), cohort: ctx.state.classes.find((cohort) => cohort.id === item.classId) }));
    return `<div class="workspace-page">${pageHeader('Học thuật · Nhân sự', 'Phân công giáo viên', 'Điều kiện bắt buộc loại ứng viên không phù hợp; tín hiệu xếp hạng hỗ trợ quyết định.', canonicalAction('Gán giáo viên mẫu'))}
      <div class="content-grid main-aside">${section('Xếp hạng ứng viên · Tiếng Anh nền tảng 6A', candidates.map((item) => `<article class="candidate-card ${item.evidence.eligible ? '' : 'muted-card'}"><div>${person(item.user, item.profile.teacherCode)}</div><div class="gate-row">${item.evidence.hardGates.map((gate) => `<span class="${gate.passed ? 'pass' : 'fail'}" title="${escapeHtml(gate.label)}">${gate.passed ? '✓' : '×'} ${escapeHtml(valueLabel(gate.key))}</span>`).join('')}</div><div><strong>${item.evidence.rankingSignals.reduce((sum, signal) => sum + signal.score, 0)} điểm</strong>${badge(item.evidence.eligible ? 'ACTIVE' : 'REJECTED', item.evidence.eligible ? 'Đủ điều kiện' : 'Không đủ điều kiện')}</div></article>`).join(''), { subtitle: 'Điều kiện bắt buộc khác điểm xếp hạng' })}
      ${section('Phân công', active.length ? active.map((item) => `<div class="queue-card"><div><strong>${escapeHtml(item.cohort?.name || '')}</strong><small>${escapeHtml(item.user?.name || '')}</small></div>${badge(item.status)}</div>`).join('') : '<p class="muted">Chưa có phân công cho lớp mẫu.</p>')}</div></div>`;
  }

  function moderation(ctx) {
    const rows = ctx.state.moderationCases.map((item) => {
      const attempt = ctx.state.attempts.find((entry) => entry.id === item.attemptId);
      const grading = ctx.state.gradingRecords.find((entry) => entry.attemptId === item.attemptId);
      return { ...item, attempt, grading, learner: ctx.state.learners.find((entry) => entry.id === item.learnerId) };
    });
    return `<div class="workspace-page">${pageHeader('Học thuật · Cổng chất lượng', 'Kiểm duyệt đánh giá', 'Kết quả cuối khóa hoặc sát ngưỡng phải được người độc lập duyệt trước khi công bố.', canonicalAction('Xử lý kiểm duyệt mẫu'))}
      ${section('Hàng chờ kiểm duyệt', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.learner?.name || '')}</strong><small>${escapeHtml(row.attempt?.assessmentId || '')}</small>` }, { label: 'Điểm', render: (row) => `<strong>${row.attempt?.score ?? '—'}/100</strong>` }, { label: 'Độ lệch', render: (row) => row.variance ?? '—' }, { label: 'Ghi chú bằng chứng', render: (row) => escapeHtml(row.note || row.grading?.feedback || 'Chờ ghi chú người duyệt') }, { label: 'Người duyệt', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.reviewerId)?.name || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Không có vụ việc cần kiểm duyệt', emptyBody: 'Điểm cuối khóa chấm thủ công sẽ vào hàng chờ sau khi giáo viên nộp.' }))}</div>`;
  }

  function progressReviews(ctx) {
    const learner = ctx.state.learners.find((item) => item.id === ctx.state.demo.canonicalLearnerId);
    const profile = root.YC.selectors.skillProfile(ctx.state, learner.id);
    const report = ctx.state.progressReports.find((item) => item.learnerId === learner.id && item.status === 'PUBLISHED');
    const promotion = ctx.state.promotionDecisions.find((item) => item.learnerId === learner.id);
    return `<div class="workspace-page">${pageHeader('Học thuật · Kết quả', 'Duyệt tiến bộ và lên lớp', 'Chuyên cần, bài tập và bằng chứng sáu kỹ năng được chụp lại trước quyết định.', canonicalAction('Công bố báo cáo và lên lớp'))}
      <div class="profile-strip"><div>${person({ name: learner.name }, learner.code)}</div><div><small>Báo cáo</small>${badge(report?.status || 'DRAFT')}</div><div><small>Lên lớp</small>${promotion ? badge(promotion.status, promotion.decision) : badge('DRAFT', 'Chưa quyết định')}</div><div><small>Khóa tiếp theo</small><strong>${escapeHtml(ctx.state.courseVersions.find((item) => item.id === promotion?.nextCourseVersionId)?.title || '—')}</strong></div></div>
      <div class="content-grid main-aside">${section('Bằng chứng sáu kỹ năng', `<div class="skill-grid compact">${profile.map((item) => `<article><span>${escapeHtml(valueLabel(item.skill))}</span><strong>${item.score ?? '—'}</strong>${progress(item.score || 0)}<small>${item.evidenceId ? 'Đã công bố' : 'Thiếu bằng chứng'}</small></article>`).join('')}</div>`)}
      ${section('Quy tắc quyết định', `<dl class="detail-list"><div><dt>Chuyên cần</dt><dd>${report?.snapshot.attendanceRate ?? '—'} / 75%</dd></div><div><dt>Bài tập</dt><dd>${report?.snapshot.homeworkCompletion ?? '—'}%</dd></div><div><dt>Tổng thể</dt><dd>${promotion?.evidence.overall ?? '—'} / 70</dd></div><div><dt>Ngoại lệ</dt><dd>${escapeHtml(promotion?.overrideReason || 'Không')}</dd></div></dl>${promotion?.overrideEvidence?.length ? `<p class="evidence-note">Mã bằng chứng: ${escapeHtml(promotion.overrideEvidence.join(', '))}</p>` : ''}`)}</div></div>`;
  }

  function managerDashboard(ctx) {
    const active = ctx.state.enrollments.filter((item) => item.status === 'ACTIVE').length;
    const capacity = ctx.state.classes.reduce((sum, item) => sum + item.capacity, 0);
    const mockRevenue = ctx.state.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `<div class="workspace-page">${pageHeader('Quản lý trung tâm', 'Tổng quan sức khỏe vận hành', 'Sức chứa, chất lượng, duy trì học viên và tài chính mô phỏng đều có thể truy về bằng chứng.')}
      <div class="metric-grid four">${metric('Học viên đang học', active, `${ctx.state.branches.length} chi nhánh`, 'people')}${metric('Mức sử dụng chỗ', `${Math.round(active / capacity * 100)}%`, `${active}/${capacity} chỗ`, 'grid')}${metric('Vụ việc rủi ro đang mở', [...ctx.state.serviceCases, ...ctx.state.interventionCases].filter((item) => item.status === 'OPEN').length, 'Có người phụ trách và lịch theo dõi', 'shield')}${metric('Doanh thu mô phỏng', money(mockRevenue), 'Chỉ từ sổ demo', 'wallet')}</div>
      <div class="content-grid main-aside">${section('Hiệu quả chi nhánh', ctx.state.branches.map((branch, index) => { const cohorts = ctx.state.classes.filter((item) => item.branchId === branch.id); const seats = cohorts.reduce((sum, item) => sum + item.capacity, 0); const used = ctx.state.enrollments.filter((item) => item.status === 'ACTIVE' && cohorts.some((cohort) => cohort.id === item.classId)).length; return `<div class="branch-row"><div><strong>${escapeHtml(branch.name)}</strong><small>${cohorts.length} lớp · ${used} học viên đang học</small></div>${progress(seats ? Math.round(used / seats * 100) : 0, 'Mức sử dụng')}<b>${index === 0 ? 'Ổn định' : 'Theo dõi'}</b></div>`; }).join(''), { action: link('Sức chứa', '/app/manager/capacity', { small: true }) })}
      ${section('Tín hiệu quản lý', `<div class="insight-list"><div><span class="signal warning">!</span><p><strong>Lớp cuối tuần đã đầy</strong><small>Cần đề xuất lớp thay thế.</small></p></div><div><span class="signal success">✓</span><p><strong>Tiến bộ có thể truy vết</strong><small>Kết quả → báo cáo → lên lớp → gia hạn.</small></p></div><div><span class="signal info">i</span><p><strong>Tài chính đang mô phỏng</strong><small>Không dùng để báo cáo doanh thu thật.</small></p></div></div>`)}</div></div>`;
  }

  function capacity(ctx) {
    const rows = ctx.state.classes.map((cohort) => { const active = ctx.state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length; return { ...cohort, active, utilization: Math.round(active / cohort.capacity * 100) }; });
    return `<div class="workspace-page">${pageHeader('Quản lý · Vận hành', 'Sức chứa', 'Mức sử dụng chỗ theo chi nhánh, lớp và lịch học.')}${section('Sức chứa lớp học', table([{ label: 'Lớp', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(ctx.state.branches.find((item) => item.id === row.branchId)?.name || '')}</small>` }, { label: 'Lịch', key: 'scheduleLabel' }, { label: 'Học viên', render: (row) => `${row.active}/${row.capacity}` }, { label: 'Mức sử dụng', render: (row) => progress(row.utilization) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function managerQuality(ctx) {
    return `<div class="workspace-page">${pageHeader('Quản lý · Học thuật', 'Tín hiệu chất lượng', 'Cân bằng mức độ hoàn thành, phản hồi, tiến bộ, tính liên tục và quan sát lớp học.')}
      <div class="quality-grid">${[['Mức độ hoàn thành giảng dạy', 91], ['Tốc độ phản hồi', 84], ['Tiến bộ học viên', 79], ['Tính liên tục của lớp', 94], ['Quan sát giáo viên', 82], ['Hài lòng của phụ huynh', 88]].map(([label, value]) => `<article><div><span>${label}</span><strong>${value}%</strong></div>${progress(value)}<small>Số liệu tổng hợp demo · có thể truy về bằng chứng</small></article>`).join('')}</div></div>`;
  }

  function retention(ctx) {
    const promotions = ctx.state.promotionDecisions;
    const renewals = ctx.state.renewals;
    return `<div class="workspace-page">${pageHeader('Quản lý · Tăng trưởng', 'Duy trì và gia hạn', 'Gia hạn bắt đầu từ kết quả và mục tiêu tiếp theo, không chỉ từ ngày hết hạn.')}
      <div class="metric-grid three">${metric('Đã chốt lên lớp', promotions.filter((item) => item.status === 'FINAL').length, 'Quyết định học thuật', 'trend')}${metric('Đã đề xuất gia hạn', renewals.filter((item) => item.status === 'OFFERED').length, 'Gói cấp độ tiếp theo', 'wallet')}${metric('Đã chấp nhận gia hạn', renewals.filter((item) => item.status === 'ACCEPTED').length, 'Kết quả luồng mẫu', 'check')}</div>
      ${section('Bằng chứng gia hạn', table([{ label: 'Học viên', render: (row) => escapeHtml(ctx.state.learners.find((item) => item.id === row.learnerId)?.name || '') }, { label: 'Kết quả', key: 'outcome' }, { label: 'Mục tiêu tiếp theo', key: 'nextGoal' }, { label: 'Khóa tiếp theo', render: (row) => escapeHtml(ctx.state.courseVersions.find((item) => item.id === row.nextCourseVersionId)?.title || '') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], renewals))}</div>`;
  }

  function adminDashboard(ctx) {
    return `<div class="workspace-page">${pageHeader('Bảng điều khiển quản trị', 'Kiểm soát và truy vết hệ thống', 'Một tổ chức Yen Center, nhiều chi nhánh, phạm vi vai trò và tích hợp mô phỏng.')}
      <div class="metric-grid four">${metric('Người dùng hoạt động', ctx.state.users.filter((item) => item.status === 'ACTIVE').length, '10 loại vai trò', 'people')}${metric('Sự kiện nghiệp vụ', ctx.state.domainEvents.length, 'Bàn giao giữa các luồng', 'trend')}${metric('Bản ghi kiểm toán', ctx.state.auditLogs.length, 'Truy vết thao tác quan trọng', 'shield')}${metric('Tích hợp mô phỏng', 4, 'Tất cả đang MÔ PHỎNG', 'grid')}</div>
      <div class="content-grid two">${section('Ranh giới hệ thống', '<ul class="check-list"><li>✓ Một tổ chức, nhiều chi nhánh</li><li>✓ Chỉ lưu trên trình duyệt</li><li>✓ Minh họa phân quyền giao diện</li><li>✓ Thanh toán, nhắn tin và xác thực đều mô phỏng</li></ul>')}${section('Tình trạng dữ liệu', `<dl class="detail-list"><div><dt>Phiên bản dữ liệu</dt><dd>${escapeHtml(ctx.state.schemaVersion)}</dd></div><div><dt>Thời điểm khởi tạo</dt><dd>${formatDate(ctx.state.seededAt)}</dd></div><div><dt>Thông báo chuyển đổi</dt><dd>${escapeHtml(ctx.state.migrationNotice?.message || 'Không có')}</dd></div><div><dt>Học viên mẫu</dt><dd>${escapeHtml(ctx.state.demo.canonicalLearnerId)}</dd></div></dl>`)}</div></div>`;
  }

  function access(ctx) {
    const rows = ctx.state.users.map((user) => ({ ...user, scopes: ctx.state.roleScopes.filter((item) => item.userId === user.id) }));
    return `<div class="workspace-page">${pageHeader('Quản trị · Truy cập', 'Vai trò và phạm vi', 'Quyền được minh họa theo vai trò, chi nhánh, lớp, phân công và thời hạn hiệu lực.')}${section('Danh sách quyền truy cập', table([{ label: 'Người dùng', render: (row) => person(row, row.id) }, { label: 'Vai trò', render: (row) => badge('ACTIVE', row.role.replaceAll('_', ' ')) }, { label: 'Phạm vi chi nhánh', render: (row) => escapeHtml(row.scopes.flatMap((item) => item.branchIds || []).join(', ') || 'Suy ra từ hồ sơ') }, { label: 'Học viên liên kết', render: (row) => escapeHtml((row.linkedLearnerIds || []).join(', ') || '—') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}<div class="notice-panel panel"><b>Chỉ minh họa giao diện</b><p>Phạm vi phía trình duyệt không thay thế phân quyền phía máy chủ trong sản phẩm thật.</p></div></div>`;
  }

  function auditLogs(ctx) {
    const actions = `${button('In trang', 'print-view', { kind: 'secondary' })}${button('Xuất CSV', 'export-csv', { payload: { type: 'audit' } })}`;
    return `<div class="workspace-page">${pageHeader('Quản trị · Kiểm soát', 'Nhật ký kiểm toán', 'Ai làm gì, trên tài nguyên nào, với lý do hoặc bằng chứng nào.', actions)}${section('Lịch sử kiểm toán', table([{ label: 'Thời gian', render: (row) => formatDate(row.occurredAt) }, { label: 'Người thực hiện', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.actorId)?.name || row.actorId) }, { label: 'Thao tác', render: (row) => `<code>${escapeHtml(row.action)}</code>` }, { label: 'Tài nguyên', render: (row) => `${escapeHtml(row.resourceType)}<small>${escapeHtml(row.resourceId)}</small>` }, { label: 'Chi tiết', key: 'detail' }], ctx.state.auditLogs))}</div>`;
  }

  function events(ctx) {
    return `<div class="workspace-page">${pageHeader('Quản trị · Luồng công việc', 'Sự kiện nghiệp vụ', 'Sự kiện nối các bên phụ trách và khu vực làm việc; không gửi qua nhà cung cấp nhắn tin thật.')}${section('Dòng sự kiện', table([{ label: 'Thời gian', render: (row) => formatDate(row.occurredAt) }, { label: 'Sự kiện', render: (row) => `<code>${escapeHtml(row.type)}</code>` }, { label: 'Tóm tắt', key: 'summary' }, { label: 'Tài nguyên', render: (row) => `${escapeHtml(row.resourceType)} · ${escapeHtml(row.resourceId)}` }, { label: 'Người thực hiện', render: (row) => escapeHtml(ctx.state.users.find((item) => item.id === row.actorId)?.name || row.actorId) }], ctx.state.domainEvents))}</div>`;
  }

  function integrations() {
    const rows = [['Cổng thanh toán', 'DEMO_LEDGER', 'MOCKED', 'Không gọi nhà cung cấp'], ['Email / SMS / Zalo', 'OUTBOUND_PREVIEW', 'MOCKED', 'Chỉ lưu bản ghi tin nhắn'], ['Học qua video', 'LOCAL_PROGRESS', 'MOCKED', 'Tiến độ trong bộ nhớ trình duyệt'], ['Nhà cung cấp danh tính', 'ROLE_PICKER', 'MOCKED', 'Truy cập nhanh bản demo']];
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Nền tảng', 'Tích hợp', 'Ranh giới nhà cung cấp được gắn nhãn rõ để demo không bị hiểu nhầm là sản phẩm thật.', button('Chạy đồng bộ mô phỏng', 'mock-sync', { icon: 'trend' }))}${section('Danh sách kết nối', table([{ label: 'Khả năng', render: (row) => `<strong>${escapeHtml(row[0])}</strong>` }, { label: 'Bộ chuyển đổi', render: (row) => `<code>${escapeHtml(row[1])}</code>` }, { label: 'Chế độ', render: (row) => badge(row[2]) }, { label: 'Ranh giới', render: (row) => escapeHtml(row[3]) }], rows))}</div>`;
  }

  function adminUsers(ctx) {
    const rows = ctx.path === '/app/admin/teachers' ? ctx.state.users.filter((item) => ['TEACHER', 'TA'].includes(item.role)) : ctx.state.users.filter((item) => item.role !== 'PUBLIC');
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Tài khoản', ctx.path === '/app/admin/teachers' ? 'Giáo viên và trợ giảng' : 'Người dùng và phân quyền', 'Tài khoản, vai trò và phạm vi truy cập trong bản demo.')}${section('Danh sách tài khoản', table([{ label: 'Người dùng', render: (row) => person(row, row.identifiers?.[0] || row.id) }, { label: 'Vai trò', render: (row) => badge('ACTIVE', root.YC.router.ROLE_LABELS[row.role] || row.role) }, { label: 'Chi nhánh', render: (row) => escapeHtml((row.branchIds || []).join(', ') || 'Theo hồ sơ liên kết') }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function adminStudents(ctx) {
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Học viên', 'Quản lý học viên', 'Tìm kiếm, thêm hồ sơ và kiểm tra lớp đang học.', `<button class="btn btn-primary" type="button" data-action="open-add-student">Thêm học viên</button>${button('Xuất CSV', 'export-csv', { kind: 'secondary', payload: { type: 'students' } })}`)}${section('Danh sách học viên', table([{ label: 'Mã', key: 'code' }, { label: 'Họ và tên', key: 'name' }, { label: 'Lớp', render: (row) => escapeHtml(ctx.state.classes.find((item) => item.id === row.classId)?.name || 'Chưa xếp lớp') }, { label: 'Mục tiêu', key: 'goal' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.learners))}
      <dialog class="form-card" data-add-student-dialog><form data-form="add-student" class="stack"><div class="between"><h2>Thêm học viên</h2><button type="button" class="icon-btn" data-action="close-add-student">×</button></div><label>Mã học viên<input class="input" name="code" required placeholder="HSNEW01"></label><label>Họ và tên<input class="input" name="name" required placeholder="Nguyễn Văn An"></label><label>Số điện thoại<input class="input" name="phone" placeholder="0900 000 000"></label><label>Lớp<select class="input" name="classId"><option value="">Chưa xếp lớp</option>${ctx.state.classes.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')}</select></label><button class="btn btn-primary" type="submit">Lưu học viên</button></form></dialog></div>`;
  }

  function adminClasses(ctx) {
    const rows = ctx.state.classes.map((cohort) => ({ ...cohort, enrollmentCount: ctx.state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length, sessionCount: ctx.state.sessions.filter((item) => item.classId === cohort.id).length }));
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Vận hành', 'Lớp, lịch và buổi học', 'Ghi danh, lịch học và buổi học dùng cùng phiên bản khóa học.')}${section('Danh sách lớp', table([{ label: 'Lớp', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small>` }, { label: 'Lịch', key: 'scheduleLabel' }, { label: 'Khóa học', render: (row) => escapeHtml(ctx.state.courseVersions.find((item) => item.id === row.courseVersionId)?.title || '') }, { label: 'Học viên', render: (row) => `${row.enrollmentCount}/${row.capacity}` }, { label: 'Buổi học', key: 'sessionCount' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}</div>`;
  }

  function adminRemedial(ctx) {
    const rows = ctx.state.remedialAssignments.map((item) => ({ ...item, learner: ctx.state.learners.find((learner) => learner.id === item.learnerId) }));
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Học bù', 'Quản lý học bù', 'Theo dõi hạn, liên kết, tiến độ video và kết quả.', button('Xuất CSV', 'export-csv', { kind: 'secondary', payload: { type: 'remedial' } }))}${section('Toàn trung tâm', table([{ label: 'Học viên', render: (row) => `<strong>${escapeHtml(row.learner?.name || '')}</strong><small>${escapeHtml(row.learner?.code || '')}</small>` }, { label: 'Hạn', render: (row) => formatDate(row.dueAt) }, { label: 'Tiến độ', render: (row) => `${row.videoProgress || 0}% · ${row.highestScore ?? '—'}/100` }, { label: 'Liên kết', render: (row) => `${row.accessStatus || 'ACTIVE'} · phiên bản ${row.linkVersion || 1}` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows, { emptyTitle: 'Chưa có bài học bù', emptyBody: 'Bản ghi sẽ xuất hiện khi giáo viên lưu một lượt điểm danh vắng.' }))}</div>`;
  }

  function adminContacts(ctx) {
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Liên hệ', 'Hộp thư liên hệ', 'Yêu cầu B2C, B2B và hỗ trợ từ các biểu mẫu công khai.', button('Xuất CSV', 'export-csv', { kind: 'secondary', payload: { type: 'contacts' } }))}${section('Yêu cầu đã tiếp nhận', table([{ label: 'Mã', render: (row) => `<strong>${escapeHtml(row.code)}</strong><small>${escapeHtml(row.type)}</small>` }, { label: 'Người liên hệ', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.organization || row.studentName || '')}</small>` }, { label: 'Liên hệ', render: (row) => escapeHtml(row.phone || row.email) }, { label: 'Nhu cầu', render: (row) => escapeHtml(row.message || row.goal || '') }, { label: 'Trạng thái', render: (row) => `<select data-action="lead-status" data-lead-id="${escapeHtml(row.id)}"><option value="NEW" ${row.status === 'NEW' ? 'selected' : ''}>Mới</option><option value="CONTACTED" ${row.status === 'CONTACTED' ? 'selected' : ''}>Đã liên hệ</option><option value="WON" ${row.status === 'WON' ? 'selected' : ''}>Đã chốt</option><option value="LOST" ${row.status === 'LOST' ? 'selected' : ''}>Không phù hợp</option></select>` }], ctx.state.leads))}</div>`;
  }

  function adminReports(ctx) {
    const completed = ctx.state.remedialAssignments.filter((item) => item.status === 'COMPLETED').length;
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Báo cáo', 'Báo cáo hệ thống', 'Chuyên cần, học bù, kết quả và dữ liệu vận hành.', `${button('Xuất báo cáo buổi học', 'export-csv', { kind: 'secondary', payload: { type: 'sessions' } })}${button('In báo cáo', 'print-view', { kind: 'secondary' })}`)}<div class="metric-grid four">${metric('Học viên', ctx.state.learners.length, 'Tất cả hồ sơ', 'people')}${metric('Chuyên cần', ctx.state.attendanceRecords.length, 'Bản ghi đã lưu', 'calendar')}${metric('Bài học bù', ctx.state.remedialAssignments.length, `${completed} hoàn thành`, 'spark')}${metric('Kết quả', ctx.state.attempts.length, 'Tất cả lượt làm', 'check')}</div></div>`;
  }

  function adminNotifications(ctx) {
    const rows = ctx.state.notifications.filter((item) => item.userId === ctx.actor.id);
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Thông báo', 'Thông báo', 'Sự kiện hệ thống và việc cần xử lý.', button('Đánh dấu tất cả đã đọc', 'mark-notifications-read', { kind: 'secondary' }))}${section('Hộp thư', rows.length ? rows.map((item) => `<article class="notification-item ${item.read ? '' : 'unread'}"><span>${icon('spark')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${formatDate(item.createdAt)}</small></div>${badge(item.read ? 'COMPLETED' : 'NEW', item.read ? 'Đã đọc' : 'Mới')}</article>`).join('') : '<p class="muted">Chưa có thông báo.</p>')}</div>`;
  }

  function settings(ctx) {
    const settings = ctx.state.settings;
    return `<div class="workspace-page">${pageHeader('Quản trị · Cấu hình', 'Thiết lập bản demo', 'Các quy tắc này được dùng khi kiểm tra tiến độ video, điểm đạt và hạn học bù.')}
      <form class="settings-form panel" data-form="settings"><div class="settings-grid"><label>Tiến độ video tối thiểu (%)<input class="input" type="number" name="minimumVideoProgress" min="1" max="100" value="${settings.minimumVideoProgress}" required></label><label>Điểm đạt mặc định (%)<input class="input" type="number" name="defaultPassingScore" min="1" max="100" value="${settings.defaultPassingScore}" required></label><label>Hạn học bù (ngày)<input class="input" type="number" name="remedialDeadlineDays" min="1" max="60" value="${settings.remedialDeadlineDays}" required></label></div><button class="btn btn-primary" type="submit">Lưu thiết lập</button></form>${section('Đặt lại dữ liệu', `<p>Đặt lại sẽ đưa toàn bộ dữ liệu về điểm bắt đầu và xóa các thao tác demo trong bộ nhớ trình duyệt.</p>${button('Đặt lại toàn bộ demo', 'reset-demo', { kind: 'secondary' })}`, { className: 'danger-zone' })}</div>`;
  }

  function adminCourses(ctx) {
    const rows = ctx.state.courses.map((course) => {
      const versions = ctx.state.courseVersions.filter((item) => item.courseId === course.id);
      const versionIds = versions.map((item) => item.id);
      const units = ctx.state.units.filter((item) => versionIds.includes(item.courseVersionId));
      const unitIds = units.map((item) => item.id);
      const lessons = ctx.state.lessonTemplates.filter((item) => unitIds.includes(item.unitId));
      return { ...course, versions, lessons };
    });
    return `<div class="workspace-page">${pageHeader('Quản trị viên · Khóa học', 'Quản trị khóa học', 'Kiểm kê khóa học, phiên bản, bài học, video, câu hỏi và bài kiểm tra từ cùng một nguồn dữ liệu.')}
      <div class="metric-grid four">${metric('Khóa học', ctx.state.courses.length, 'Theo chương trình và cấp độ', 'book')}${metric('Bài học', ctx.state.lessonTemplates.length, 'Mẫu bài có phiên bản', 'grid')}${metric('Video', ctx.state.learningItems.filter((item) => item.type === 'VIDEO').length, 'Thông tin mô phỏng', 'trend')}${metric('Câu hỏi', ctx.state.questions.length, 'Ngân hàng dùng chung', 'check')}</div>
      ${section('Danh mục khóa học', table([{ label: 'Khóa học', render: (row) => `<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(row.code)}</small>` }, { label: 'Phiên bản', render: (row) => row.versions.map((item) => `v${item.version}`).join(', ') }, { label: 'Bài học', render: (row) => row.lessons.length }, { label: 'Trạng thái', render: (row) => badge(row.status) }], rows))}
      <div class="content-grid two">${section('Video & hoạt động', table([{ label: 'Nội dung', render: (row) => `<strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(valueLabel(row.type))}</small>` }, { label: 'Thời lượng', render: (row) => `${row.durationMinutes} phút` }, { label: 'Yêu cầu', render: (row) => row.required ? 'Bắt buộc' : 'Tự chọn' }], ctx.state.learningItems))}${section('Bài kiểm tra', table([{ label: 'Tên bài', key: 'title' }, { label: 'Số câu', render: (row) => row.questionIds.length }, { label: 'Điểm đạt', render: (row) => `${row.passingScore}%` }, { label: 'Trạng thái', render: (row) => badge(row.status) }], ctx.state.assessments))}</div></div>`;
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
    if (['/app/admin/courses', '/app/admin/lessons', '/app/admin/videos', '/app/admin/questions', '/app/admin/quizzes'].includes(path)) return adminCourses(ctx);
    if (['/app/admin/users', '/app/admin/teachers'].includes(path)) return adminUsers(ctx);
    if (path === '/app/admin/students') return adminStudents(ctx);
    if (['/app/admin/classes', '/app/admin/enrollments', '/app/admin/schedules', '/app/admin/sessions'].includes(path)) return adminClasses(ctx);
    if (path === '/app/admin/remedial') return adminRemedial(ctx);
    if (path === '/app/admin/contacts') return adminContacts(ctx);
    if (path === '/app/admin/reports') return adminReports(ctx);
    if (path === '/app/admin/notifications') return adminNotifications(ctx);
    if (path === '/app/admin/demo') return settings(ctx);
    return routes[path] ? routes[path](ctx) : '';
  }

  root.YC.define('managementViews', Object.freeze({ render }));
})(globalThis);

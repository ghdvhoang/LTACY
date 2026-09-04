(function defineLearningViews(root) {
  'use strict';

  const { badge, button, empty, fact, icon, link, metric, pageHeader, person, progress, section, table } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  function learnerFor(ctx) {
    const linked = ctx.actor?.linkedLearnerIds || [];
    return ctx.state.learners.find((item) => item.id === (ctx.learnerId || linked[0]))
      || ctx.state.learners.find((item) => item.id === linked[0])
      || ctx.state.learners.find((item) => item.id === ctx.state.demo.canonicalLearnerId);
  }

  function courseContext(state, learner) {
    const enrollment = state.enrollments.find((item) => item.learnerId === learner?.id && item.status === 'ACTIVE');
    const cohort = state.classes.find((item) => item.id === (enrollment?.classId || learner?.classId)) || state.classes.find((item) => item.id === 'class-6a');
    const version = state.courseVersions.find((item) => item.id === (enrollment?.courseVersionId || cohort?.courseVersionId)) || state.courseVersions[0];
    return { enrollment, cohort, version };
  }

  function studentDashboard(ctx) {
    const learner = learnerFor(ctx);
    const { cohort, version } = courseContext(ctx.state, learner);
    const remedial = ctx.state.remedialAssignments.find((item) => item.learnerId === learner.id);
    const homework = ctx.state.homeworkAssignments.filter((item) => item.learnerId === learner.id);
    const latestReport = ctx.state.progressReports.filter((item) => item.learnerId === learner.id && item.status === 'PUBLISHED').at(-1);
    return `<div class="workspace-page learner-page">${pageHeader('My learning', `Chào ${learner.name.split(' ').at(-1)}, sẵn sàng học tiếp?`, 'Một việc quan trọng nhất luôn được đưa lên đầu.', link('Xem lộ trình', '/app/student/course', { kind: 'primary' }))}
      <section class="continue-card"><div class="continue-cover"><span>A2.1</span><small>ENGLISH FOUNDATION</small></div><div class="continue-body"><p class="eyebrow">Tiếp tục học</p><h2>Unit 4 · Past Simple in context</h2><p>${escapeHtml(version.title)} · ${escapeHtml(cohort.scheduleLabel)}</p>${progress(remedial?.videoProgress || 42, 'Tiến độ bài hiện tại')}<div class="inline">${link('Tiếp tục học', '/app/student/course', { kind: 'primary', icon: 'arrow' })}<span class="text-small muted">Khoảng 18 phút còn lại</span></div></div></section>
      <div class="metric-grid three">${metric('Việc cần làm', (remedial && remedial.status !== 'COMPLETED' ? 1 : 0) + homework.filter((item) => item.status !== 'ACCEPTED').length, 'Video, quiz hoặc homework', 'check')}${metric('Buổi học tiếp theo', '18:00', 'Thứ 5 · P.302', 'calendar')}${metric('Skill gần nhất', latestReport ? `${Math.round(latestReport.skillProfile.reduce((sum, item) => sum + item.score, 0) / 6)}/100` : 'Chưa có', 'Chỉ hiển thị kết quả đã release', 'trend')}</div>
      <div class="content-grid main-aside">${section('Kế hoạch tuần này', `<div class="task-list"><a href="#/app/student/course"><span class="task-icon blue">${icon('book')}</span><span><strong>Xem lại Past Simple</strong><small>Video · 18 phút</small></span>${badge(remedial?.status || 'ASSIGNED')}</a><a href="#/app/student/assessments"><span class="task-icon violet">${icon('check')}</span><span><strong>Past Simple Check</strong><small>10 câu · Cần đạt 80%</small></span>${badge(remedial?.status === 'COMPLETED' ? 'COMPLETED' : 'ASSIGNED')}</a><a href="#/app/student/progress"><span class="task-icon green">${icon('trend')}</span><span><strong>Xem skill profile</strong><small>6 nhóm kỹ năng</small></span>${badge(latestReport ? 'PUBLISHED' : 'DRAFT')}</a></div>`)}
      ${section('Lịch học', `<div class="agenda"><div class="agenda-date"><b>05</b><span>THÁNG 9</span></div><div><strong>${escapeHtml(cohort.name)}</strong><p>${escapeHtml(cohort.scheduleLabel)} · ${escapeHtml(cohort.room)}</p><span>${icon('people')} Giáo viên Hoàng Yến</span></div></div><a class="text-link" href="#/app/student/course">Xem nội dung buổi học ${icon('arrow')}</a>`)}</div></div>`;
  }

  function studentCourse(ctx) {
    const learner = learnerFor(ctx);
    const { cohort, version } = courseContext(ctx.state, learner);
    const assignment = ctx.state.remedialAssignments.find((item) => item.learnerId === learner.id);
    const videoProgress = assignment?.videoProgress || 0;
    return `<div class="workspace-page course-player-page"><div class="course-player-head"><div><a href="#/app/student/dashboard" class="back-link">← My learning</a><p class="eyebrow">Tiếp tục học · ${escapeHtml(version.title)}</p><h1>Unit 4 · Past experiences</h1></div><div class="course-overall"><span>Course progress</span><strong>68%</strong></div></div>
      <div class="course-player-layout"><aside class="curriculum-sidebar"><div class="curriculum-summary">${progress(68, '12 / 18 activities')}</div>
        <details class="course-module" open><summary><span><small>MODULE 4</small><strong>Past experiences</strong></span><span>3/5 ${icon('arrow')}</span></summary><nav><a class="done" href="#/app/student/course">${icon('check')}<span><b>Reading</b><small>A weekend to remember · 12 phút</small></span></a><a class="active" href="#/app/student/course">${icon('book')}<span><b>Video</b><small>Past Simple in context · 18 phút</small></span></a><a href="#/app/student/assessments">${icon('check')}<span><b>Quiz</b><small>Past Simple Check · 10 câu</small></span></a><a href="#/app/student/remedial">${icon('spark')}<span><b>Practice</b><small>-ed pronunciation · 15 phút</small></span></a></nav></details>
        <details class="course-module"><summary><span><small>MODULE 5</small><strong>Stories we share</strong></span><span>0/4 ${icon('arrow')}</span></summary><nav><a href="#/app/student/course"><span>Speaking lab</span></a></nav></details></aside>
        <main class="learning-content"><div class="video-stage"><div class="video-illustration"><span class="play-button">▶</span><div><small>LESSON VIDEO</small><strong>Past Simple in context</strong></div></div><div class="video-controls"><span>▶</span><div><i style="width:${videoProgress || 42}%"></i></div><span>${videoProgress ? `${videoProgress}%` : '07:32 / 18:00'}</span></div></div>
          <article class="lesson-copy"><p class="eyebrow">Learning objective</p><h2>Kể lại một trải nghiệm đã xảy ra</h2><p>Nhận biết và dùng past simple trong ngữ cảnh kể chuyện. Sau video, hoàn thành knowledge check để lưu evidence.</p><div class="lesson-callout"><b>Ghi nhớ</b><p>Regular verbs thường thêm <code>-ed</code>; irregular verbs cần dùng dạng quá khứ riêng.</p></div>
          <div class="lesson-footer"><span>${icon('clock')} 18 phút</span><span>${icon('shield')} Required evidence</span>${assignment ? button(videoProgress >= 100 ? 'Video đã hoàn thành' : 'Đánh dấu xem đủ 100%', 'complete-video', { payload: { assignmentId: assignment.id }, disabled: videoProgress >= 100 }) : link('Mở Demo Guide để tạo assignment', '/demo-guide')}</div></article>
        </main></div></div>`;
  }

  function studentRemedial(ctx) {
    const learner = learnerFor(ctx);
    const assignments = ctx.state.remedialAssignments.filter((item) => item.learnerId === learner.id);
    const body = assignments.length ? `<div class="learning-list">${assignments.map((item) => { const lesson = ctx.state.lessonTemplates.find((entry) => entry.id === item.lessonTemplateId); const completion = root.YC.selectors.completionStatus(ctx.state, item.id); return `<article><div class="learning-item-icon">${icon('spark')}</div><div><p class="eyebrow">Học bù tự động</p><h3>${escapeHtml(lesson?.title || 'Lesson recovery')}</h3><p>Được tạo từ attendance vắng. Hoàn thành video và quiz để đóng assignment.</p>${progress(item.videoProgress || 0, 'Video evidence')}<div class="inline">${badge(item.status)}${link('Mở nội dung', '/app/student/course', { small: true })}${link('Làm quiz', '/app/student/assessments', { small: true, kind: 'primary' })}</div></div><aside><small>Quiz tốt nhất</small><strong>${completion.highestScore}/100</strong><span>Cần ≥ 80</span></aside></article>`; }).join('')}</div>` : empty('Chưa có bài học bù', 'Khi một attendance vắng được finalize, hệ thống sẽ tạo đúng một assignment tại đây.', link('Chạy hành trình demo', '/demo-guide', { kind: 'primary' }));
    return `<div class="workspace-page">${pageHeader('Learning recovery', 'Bài học bù', 'Nội dung được nối trực tiếp từ buổi học đã vắng; completion cần đủ cả video và quiz.')}${body}</div>`;
  }

  function studentAssessments(ctx) {
    const learner = learnerFor(ctx);
    const assignment = ctx.state.remedialAssignments.find((item) => item.learnerId === learner.id);
    const assessment = ctx.state.assessments.find((item) => item.id === assignment?.assessmentId) || ctx.state.assessments.find((item) => item.id === 'assessment-remedial');
    const attempts = ctx.state.attempts.filter((item) => item.learnerId === learner.id || item.assignmentId === assignment?.id);
    return `<div class="workspace-page">${pageHeader('Assessment center', 'Kiểm tra & kết quả', 'Chỉ kết quả đã release mới đi vào progress evidence.')}
      <div class="content-grid main-aside">${section(assessment.title, `<div class="assessment-summary"><span class="assessment-score">${attempts.length ? Math.max(...attempts.map((item) => item.score)) : '—'}<small>/100</small></span><div><p>${assessment.questionIds.length} câu · ${assessment.passingScore}% để đạt · tối đa ${assessment.maxAttempts} lượt</p>${assignment ? `${progress(assignment.videoProgress || 0, 'Điều kiện video')}${button(assignment.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Nộp đáp án demo 8/10', 'submit-demo-quiz', { payload: { assignmentId: assignment.id }, disabled: assignment.status === 'COMPLETED', icon: 'check' })}` : `<p class="notice-inline">Assignment sẽ xuất hiện sau khi Teacher finalize attendance.</p>${link('Mở Demo Guide', '/demo-guide')}`}</div></div>`, { subtitle: 'Auto-graded · evidence lưu theo attempt' })}
      ${section('Lịch sử attempt', attempts.length ? attempts.map((item, index) => `<div class="attempt-row"><span>Lượt ${index + 1}</span><strong>${item.score}/100</strong>${badge(item.status)}<small>${formatDate(item.submittedAt)}</small></div>`).join('') : '<p class="muted">Chưa có attempt nào.</p>')}</div>
      ${section('Final portfolio', `<div class="assessment-card"><div><p class="eyebrow">Manual grading</p><h3>A2.1 Final Portfolio</h3><p>Listening, reading, speaking interaction, speaking production, writing và language.</p></div>${badge(ctx.state.gradingRecords.some((item) => item.learnerId === learner.id && item.status === 'RELEASED') ? 'RELEASED' : 'DRAFT')}</div>`)}</div>`;
  }

  function studentProgress(ctx) {
    const learner = learnerFor(ctx);
    const report = ctx.state.progressReports.filter((item) => item.learnerId === learner.id && item.status === 'PUBLISHED').at(-1);
    const profile = report?.skillProfile || root.YC.selectors.skillProfile(ctx.state, learner.id);
    return `<div class="workspace-page">${pageHeader('Learning outcomes', 'Tiến bộ của tôi', 'Skill profile đa chiều, không rút gọn thành một điểm duy nhất.')}
      ${report ? `<div class="report-banner"><div><p class="eyebrow on-dark">Progress report đã publish</p><h2>${escapeHtml(report.narrative)}</h2><p>Academic Manager đã duyệt · ${formatDate(report.publishedAt)}</p></div><span class="report-average">${Math.round(profile.reduce((sum, item) => sum + item.score, 0) / profile.length)}<small>overall</small></span></div>` : `<div class="notice-panel panel"><b>Chưa có báo cáo được publish.</b><p>Skill evidence đang được tích lũy qua assessment và moderation.</p></div>`}
      <div class="skill-grid">${profile.map((item) => `<article><div><span>${escapeHtml(item.skill.replaceAll('_', ' '))}</span><strong>${item.score ?? '—'}</strong></div>${progress(item.score || 0)}<small>${item.evidenceId ? 'Có released evidence' : 'Đang chờ assessment'}</small></article>`).join('')}</div>
      ${section('Next actions', report ? `<ul class="check-list">${report.nextActions.map((item) => `<li>${icon('check')} ${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">Next action sẽ được Academic Manager publish cùng báo cáo.</p>')}</div>`;
  }

  function parentData(ctx) {
    const linked = ctx.actor?.linkedLearnerIds || [];
    const selected = linked.includes(ctx.learnerId) ? ctx.learnerId : linked[0];
    const learner = ctx.state.learners.find((item) => item.id === selected) || ctx.state.learners.find((item) => item.id === linked[0]);
    return { linked, learner };
  }

  function learnerSwitcher(ctx, linked, selectedId) {
    return `<div class="learner-switcher"><span>Đang xem</span>${linked.map((id) => { const item = ctx.state.learners.find((learner) => learner.id === id); return `<button type="button" class="${id === selectedId ? 'active' : ''}" data-action="select-learner" data-learner-id="${escapeHtml(id)}">${escapeHtml(item?.name || id)}</button>`; }).join('')}</div>`;
  }

  function parentDashboard(ctx) {
    const { linked, learner } = parentData(ctx);
    const report = ctx.state.progressReports.filter((item) => item.learnerId === learner.id && item.status === 'PUBLISHED').at(-1);
    const attendance = ctx.state.attendanceRecords.filter((item) => item.learnerId === learner.id);
    const present = attendance.filter((item) => item.status === 'PRESENT').length;
    return `<div class="workspace-page parent-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Family portal', `Tổng quan của ${learner.name}`, 'Chỉ hiển thị dữ liệu đã publish và nội dung được phép chia sẻ.')}
      <div class="metric-grid three">${metric('Attendance', attendance.length ? `${Math.round(present / attendance.length * 100)}%` : 'Chưa có', 'Bản ghi đã finalize', 'calendar')}${metric('Homework', ctx.state.homeworkAssignments.filter((item) => item.learnerId === learner.id && item.status === 'ACCEPTED').length, 'Bài đã được giáo viên accept', 'check')}${metric('Progress report', report ? 'Đã có' : 'Đang chờ', report ? formatDate(report.publishedAt) : 'Chỉ hiện sau khi Academic publish', 'trend')}</div>
      <div class="content-grid main-aside">${section('Điều cần biết tuần này', `<div class="parent-update"><span class="update-icon">${icon('book')}</span><div><p class="eyebrow">Học tập</p><h3>${report ? escapeHtml(report.narrative) : 'Đang tích lũy evidence'}</h3><p>${report?.nextActions?.[0] || 'Báo cáo sẽ có next action cụ thể sau khi được duyệt.'}</p>${link('Xem tiến bộ', '/app/parent/progress', { small: true })}</div></div><div class="parent-update"><span class="update-icon amber">${icon('calendar')}</span><div><p class="eyebrow">Lịch học</p><h3>Buổi tiếp theo · Thứ 5, 18:00</h3><p>English Foundation 6A · P.302 · Cơ sở Quận 3</p>${link('Xem attendance', '/app/parent/attendance', { small: true })}</div></div>`)}
      ${section('Hỗ trợ nhanh', `<div class="quick-links"><a href="#/app/parent/services">${icon('people')}<span><strong>Dịch vụ học viên</strong><small>Yêu cầu đổi lịch, make-up</small></span></a><a href="#/app/parent/tuition">${icon('wallet')}<span><strong>Học phí</strong><small>Trạng thái mock payment</small></span></a></div>`)}</div></div>`;
  }

  function parentAttendance(ctx) {
    const { linked, learner } = parentData(ctx);
    const enrollment = ctx.state.enrollments.find((item) => item.learnerId === learner.id && item.status === 'ACTIVE');
    const records = ctx.state.attendanceRecords.filter((item) => item.learnerId === learner.id).map((item) => ({ ...item, session: ctx.state.sessions.find((entry) => entry.id === item.sessionId) }));
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Family portal', 'Chuyên cần & lịch học', 'Attendance đã finalize, thay đổi lịch và make-up được tách thành evidence riêng.')}${section('Lịch sử attendance', table([{ label: 'Buổi học', render: (row) => `<strong>${escapeHtml(row.session?.lessonTemplateId === 'lesson-past-simple' ? 'Past Simple' : row.session?.id || '')}</strong><small>${formatDate(row.session?.startsAt)}</small>` }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Lý do', key: 'reasonCode' }, { label: 'Cập nhật bởi', key: 'markedBy' }], records, { emptyTitle: 'Chưa có attendance', emptyBody: enrollment ? 'Bản ghi sẽ xuất hiện sau khi giáo viên finalize buổi học.' : 'Học viên chưa được xếp lớp.' }))}</div>`;
  }

  function parentProgress(ctx) {
    const { linked, learner } = parentData(ctx);
    const reports = linked.flatMap((learnerId) => ctx.state.progressReports.filter((item) => item.learnerId === learnerId && item.status === 'PUBLISHED'));
    const current = reports.find((item) => item.learnerId === learner.id) || null;
    const feedback = root.YC.policy.visibleFeedback(ctx.actor, ctx.state.feedbackRecords, ctx.state);
    const actions = current ? `${button('In báo cáo', 'print-view', { kind: 'secondary' })}${button('Xác nhận đã xem', 'acknowledge-progress', { payload: { learnerId: learner.id }, icon: 'check' })}` : '';
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Family portal', 'Báo cáo tiến bộ', 'Chỉ hiển thị report đã publish và teacher feedback có visibility phù hợp.', actions)}
      ${current ? `<div class="report-banner light"><div><p class="eyebrow">Academic summary</p><h2>${escapeHtml(current.narrative)}</h2><p>${escapeHtml(current.nextActions.join(' · '))}</p></div><span class="report-average">${Math.round(current.skillProfile.reduce((sum, item) => sum + item.score, 0) / current.skillProfile.length)}<small>overall</small></span></div><div class="skill-grid compact">${current.skillProfile.map((item) => `<article><span>${escapeHtml(item.skill.replaceAll('_', ' '))}</span><strong>${item.score}</strong>${progress(item.score)}</article>`).join('')}</div>` : empty('Chưa có report cho học viên này', 'Academic Manager sẽ publish sau khi đủ skill evidence và moderation.')}
      ${section('Nhận xét có thể chia sẻ', feedback.length ? feedback.map((item) => { const target = ctx.state.learners.find((entry) => entry.id === item.learnerId); return `<blockquote><p>“${escapeHtml(item.body)}”</p><footer>${escapeHtml(target?.name || '')} · ${formatDate(item.createdAt)}</footer></blockquote>`; }).join('') : '<p class="muted">Chưa có nhận xét được phép chia sẻ.</p>', { subtitle: 'Ghi chú nội bộ và safeguarding bị loại bởi visibility policy' })}</div>`;
  }

  function parentServices(ctx) {
    const { linked, learner } = parentData(ctx);
    const cases = ctx.state.serviceCases.filter((item) => !item.learnerId || linked.includes(item.learnerId));
    const makeups = ctx.state.makeUpBookings.filter((item) => linked.includes(item.learnerId));
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Family portal', 'Dịch vụ học viên', 'Theo dõi yêu cầu và make-up theo owner, status và next action.')}
      <div class="content-grid two">${section('Service cases', table([{ label: 'Loại', key: 'type' }, { label: 'Lý do', key: 'reason' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], cases))}${section('Make-up bookings', table([{ label: 'Buổi gốc', key: 'originalSessionId' }, { label: 'Buổi bù', key: 'targetSessionId' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], makeups))}</div></div>`;
  }

  function parentTuition(ctx) {
    const { linked, learner } = parentData(ctx);
    const invoices = ctx.state.invoices.filter((item) => linked.includes(item.learnerId));
    const payments = ctx.state.payments.filter((item) => linked.includes(item.learnerId));
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Family portal', 'Học phí & renewal', 'Thông tin tài chính trong prototype là mock, không phải chứng từ thật.')}
      <div class="notice-panel panel"><b>MOCK FINANCE</b><p>Không có giao dịch hoặc provider thanh toán thật trong bản frontend này.</p></div>
      <div class="content-grid two">${section('Hóa đơn', table([{ label: 'Mã', key: 'id' }, { label: 'Số tiền', render: (row) => root.YC.ui.money(row.amount, row.currency) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], invoices))}${section('Thanh toán', table([{ label: 'Reference', key: 'reference' }, { label: 'Provider', key: 'provider' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], payments))}</div></div>`;
  }

  function render(path, ctx) {
    const routes = {
      '/app/student/dashboard': studentDashboard,
      '/app/student/course': studentCourse,
      '/app/student/remedial': studentRemedial,
      '/app/student/assessments': studentAssessments,
      '/app/student/progress': studentProgress,
      '/app/parent/dashboard': parentDashboard,
      '/app/parent/attendance': parentAttendance,
      '/app/parent/progress': parentProgress,
      '/app/parent/services': parentServices,
      '/app/parent/tuition': parentTuition,
    };
    return routes[path] ? routes[path](ctx) : '';
  }

  root.YC.define('learningViews', Object.freeze({ render }));
})(globalThis);

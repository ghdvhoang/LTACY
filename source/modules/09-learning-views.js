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
    return `<div class="workspace-page learner-page">${pageHeader('Góc học tập', `Chào ${learner.name.split(' ').at(-1)}, sẵn sàng học tiếp?`, 'Một việc quan trọng nhất luôn được đưa lên đầu.', link('Xem lộ trình', '/app/student/course', { kind: 'primary' }))}
      <section class="continue-card"><div class="continue-cover"><span>A2.1</span><small>TIẾNG ANH NỀN TẢNG</small></div><div class="continue-body"><p class="eyebrow">Tiếp tục học</p><h2>Học phần 4 · Thì quá khứ đơn trong ngữ cảnh</h2><p>${escapeHtml(version.title)} · ${escapeHtml(cohort.scheduleLabel)}</p>${progress(remedial ? remedial.videoProgress : 42, 'Tiến độ bài hiện tại')}<div class="inline">${link('Tiếp tục học', '/app/student/course', { kind: 'primary', icon: 'arrow' })}<span class="text-small muted">Khoảng 18 phút còn lại</span></div></div></section>
      <div class="metric-grid three">${metric('Việc cần làm', (remedial && remedial.status !== 'COMPLETED' ? 1 : 0) + homework.filter((item) => item.status !== 'ACCEPTED').length, 'Video, bài kiểm tra hoặc bài tập', 'check')}${metric('Buổi học tiếp theo', '18:00', 'Thứ 5 · P.302', 'calendar')}${metric('Kỹ năng gần nhất', latestReport ? `${Math.round(latestReport.skillProfile.reduce((sum, item) => sum + item.score, 0) / 6)}/100` : 'Chưa có', 'Chỉ hiển thị kết quả đã công bố', 'trend')}</div>
      <div class="content-grid main-aside">${section('Kế hoạch tuần này', `<div class="task-list"><a href="#/app/student/course"><span class="task-icon blue">${icon('book')}</span><span><strong>Xem lại thì quá khứ đơn</strong><small>Video · 18 phút</small></span>${badge(remedial?.status || 'ASSIGNED')}</a><a href="#/app/student/assessments"><span class="task-icon violet">${icon('check')}</span><span><strong>Bài kiểm tra thì quá khứ đơn</strong><small>10 câu · Cần đạt 80%</small></span>${badge(remedial?.status === 'COMPLETED' ? 'COMPLETED' : 'ASSIGNED')}</a><a href="#/app/student/progress"><span class="task-icon green">${icon('trend')}</span><span><strong>Xem hồ sơ kỹ năng</strong><small>6 nhóm kỹ năng</small></span>${badge(latestReport ? 'PUBLISHED' : 'DRAFT')}</a></div>`)}
      ${section('Lịch học', `<div class="agenda"><div class="agenda-date"><b>05</b><span>THÁNG 9</span></div><div><strong>${escapeHtml(cohort.name)}</strong><p>${escapeHtml(cohort.scheduleLabel)} · ${escapeHtml(cohort.room)}</p><span>${icon('people')} Giáo viên Hoàng Yến</span></div></div><a class="text-link" href="#/app/student/course">Xem nội dung buổi học ${icon('arrow')}</a>`)}</div></div>`;
  }

  function studentCourse(ctx) {
    const learner = learnerFor(ctx);
    const { cohort, version } = courseContext(ctx.state, learner);
    const assignment = ctx.state.remedialAssignments.find((item) => item.learnerId === learner.id);
    const videoProgress = assignment?.videoProgress || 0;
    return `<div class="workspace-page course-player-page"><div class="course-player-head"><div><a href="#/app/student/dashboard" class="back-link">← Góc học tập</a><p class="eyebrow">Tiếp tục học · ${escapeHtml(version.title)}</p><h1>Học phần 4 · Trải nghiệm trong quá khứ</h1></div><div class="course-overall"><span>Tiến độ khóa học</span><strong>68%</strong></div></div>
      <div class="course-player-layout"><aside class="curriculum-sidebar"><div class="curriculum-summary">${progress(68, '12 / 18 hoạt động')}</div>
        <details class="course-module" open><summary><span><small>HỌC PHẦN 4</small><strong>Trải nghiệm trong quá khứ</strong></span><span>3/5 ${icon('arrow')}</span></summary><nav><a class="done" href="#/app/student/course/item-past-simple-video">${icon('check')}<span><b>Đọc hiểu</b><small>Một cuối tuần đáng nhớ · 12 phút</small></span></a><a class="active" href="#/app/student/course/item-past-simple-video">${icon('book')}<span><b>Video</b><small>Thì quá khứ đơn trong ngữ cảnh · 18 phút</small></span></a><a href="#/app/student/assessments">${icon('check')}<span><b>Bài kiểm tra</b><small>Kiểm tra thì quá khứ đơn · 10 câu</small></span></a><a href="#/app/student/remedial">${icon('spark')}<span><b>Luyện tập</b><small>Phát âm đuôi -ed · 15 phút</small></span></a></nav></details>
        <details class="course-module"><summary><span><small>HỌC PHẦN 5</small><strong>Những câu chuyện chúng ta chia sẻ</strong></span><span>0/4 ${icon('arrow')}</span></summary><nav><a href="#/app/student/course"><span>Phòng luyện nói</span></a></nav></details></aside>
        <main class="learning-content"><div class="video-stage"><div class="video-illustration"><span class="play-button">▶</span><div><small>VIDEO BÀI HỌC</small><strong>Thì quá khứ đơn trong ngữ cảnh</strong></div></div><div class="video-controls"><span>▶</span><div><i style="width:${videoProgress || 42}%"></i></div><span>${videoProgress ? `${videoProgress}%` : '07:32 / 18:00'}</span></div></div>
          <article class="lesson-copy"><p class="eyebrow">Mục tiêu học tập</p><h2>Kể lại một trải nghiệm đã xảy ra</h2><p>Nhận biết và dùng thì quá khứ đơn trong ngữ cảnh kể chuyện. Sau video, hoàn thành câu hỏi kiểm tra để lưu bằng chứng học tập.</p><div class="lesson-callout"><b>Ghi nhớ</b><p>Động từ có quy tắc thường thêm <code>-ed</code>; động từ bất quy tắc cần dùng dạng quá khứ riêng.</p></div>
          <div class="lesson-footer"><span>${icon('clock')} 18 phút</span><span>${icon('shield')} Bằng chứng bắt buộc</span>${assignment ? button(videoProgress >= 100 ? 'Video đã hoàn thành' : 'Đánh dấu xem đủ 100%', 'complete-video', { payload: { assignmentId: assignment.id }, disabled: videoProgress >= 100 }) : link('Mở hướng dẫn demo để tạo nhiệm vụ', '/demo-guide')}</div></article>
        </main></div></div>`;
  }

  function studentActivity(ctx, itemId) {
    const learner = learnerFor(ctx);
    const { version } = courseContext(ctx.state, learner);
    const item = ctx.state.learningItems.find((entry) => entry.id === itemId) || ctx.state.learningItems[0];
    const lesson = ctx.state.lessonTemplates.find((entry) => entry.id === item.lessonTemplateId);
    const unit = ctx.state.units.find((entry) => entry.id === lesson?.unitId);
    const assignment = ctx.state.remedialAssignments.find((entry) => entry.learnerId === learner.id && entry.lessonTemplateId === lesson?.id);
    return `<div class="workspace-page course-player-page"><div class="course-player-head"><div><a href="#/app/student/course" class="back-link">← Về khóa học</a><p class="eyebrow">${escapeHtml(version.title)} · ${escapeHtml(unit?.title || '')}</p><h1>${escapeHtml(item.title)}</h1></div><div class="course-overall"><span>Tiến độ khóa học</span><strong>68%</strong></div></div>
      <div class="course-player-layout"><aside class="curriculum-sidebar"><div class="curriculum-summary">${progress(68, '12 / 18 hoạt động')}</div><details class="course-module" open><summary><span><small>HỌC PHẦN ${unit?.order || 4}</small><strong>${escapeHtml(unit?.title || '')}</strong></span><span>${icon('arrow')}</span></summary><nav>${ctx.state.learningItems.filter((entry) => entry.lessonTemplateId === lesson?.id).map((entry) => `<a class="${entry.id === item.id ? 'active' : ''}" href="#/app/student/course/${entry.id}">${icon(entry.type === 'QUIZ' ? 'check' : 'book')}<span><b>${escapeHtml(entry.title)}</b><small>${entry.durationMinutes} phút · ${entry.required ? 'Bắt buộc' : 'Tự chọn'}</small></span></a>`).join('')}</nav></details></aside>
      <main class="learning-content"><div class="video-stage"><div class="video-illustration"><span class="play-button">▶</span><div><small>${escapeHtml(item.type === 'VIDEO' ? 'VIDEO BÀI HỌC' : 'HOẠT ĐỘNG HỌC')}</small><strong>${escapeHtml(item.title)}</strong></div></div><div class="video-controls"><span>▶</span><div><i style="width:${assignment?.videoProgress || 0}%"></i></div><span>${assignment ? `${assignment.videoProgress || 0}%` : `${item.durationMinutes}:00`}</span></div></div>
      <article class="lesson-copy"><p class="eyebrow">Mục tiêu học tập</p><h2>${escapeHtml(lesson?.objectives?.[0] || unit?.outcome || '')}</h2><p>Hoàn thành hoạt động này để ghi nhận tiến độ trong khóa học và làm cơ sở cho bài kiểm tra cuối bài.</p><div class="lesson-callout"><b>Nội dung chính</b><p>${escapeHtml((lesson?.objectives || []).join(' · '))}</p></div><div class="lesson-footer"><span>${icon('clock')} ${item.durationMinutes} phút</span><span>${icon('shield')} ${item.required ? 'Bằng chứng bắt buộc' : 'Hoạt động tự chọn'}</span>${assignment && item.type === 'VIDEO' ? button('Lưu tiến độ video', 'complete-video', { payload: { assignmentId: assignment.id }, icon: 'check' }) : link('Tiếp tục đến bài kiểm tra', '/app/student/assessments', { kind: 'primary' })}</div></article></main></div></div>`;
  }

  function studentRemedial(ctx) {
    const learner = learnerFor(ctx);
    const assignments = ctx.state.remedialAssignments.filter((item) => item.learnerId === learner.id);
    const body = assignments.length ? `<div class="learning-list">${assignments.map((item) => { const lesson = ctx.state.lessonTemplates.find((entry) => entry.id === item.lessonTemplateId); const completion = root.YC.selectors.completionStatus(ctx.state, item.id); return `<article><div class="learning-item-icon">${icon('spark')}</div><div><p class="eyebrow">Học bù tự động</p><h3>${escapeHtml(lesson?.title || 'Bài học cần ôn')}</h3><p>Được tạo từ buổi điểm danh vắng. Hoàn thành video và bài kiểm tra để đóng nhiệm vụ.</p>${progress(item.videoProgress || 0, 'Tiến độ video')}<div class="inline">${badge(item.status)}${link('Mở bài học', `/app/student/remedial/${item.id}`, { small: true, kind: 'primary' })}${link('Làm bài kiểm tra', `/app/student/quiz/${item.id}`, { small: true })}</div></div><aside><small>Điểm cao nhất</small><strong>${completion.highestScore}/100</strong><span>Cần ≥ 80</span></aside></article>`; }).join('')}</div>` : empty('Chưa có bài học bù', 'Khi một buổi điểm danh vắng được lưu, hệ thống sẽ tạo đúng một nhiệm vụ tại đây.', link('Mở hướng dẫn demo', '/demo-guide', { kind: 'primary' }));
    return `<div class="workspace-page">${pageHeader('Học bù', 'Bài học bù', 'Nội dung được nối trực tiếp từ buổi học đã vắng; để hoàn thành cần đủ cả video và bài kiểm tra.')}${body}</div>`;
  }

  function studentRemedialDetail(ctx, assignmentId) {
    const learner = learnerFor(ctx);
    const assignment = ctx.state.remedialAssignments.find((item) => (item.id === assignmentId || item.assessmentId === assignmentId) && item.learnerId === learner.id);
    if (!assignment) return empty('Không tìm thấy bài học bù', 'Nhiệm vụ không tồn tại hoặc không thuộc tài khoản học viên này.', link('Về danh sách học bù', '/app/student/remedial'));
    const lesson = ctx.state.lessonTemplates.find((item) => item.id === assignment.lessonTemplateId);
    const assessment = ctx.state.assessments.find((item) => item.id === assignment.assessmentId);
    return `<div class="workspace-page">${pageHeader('Học viên · Học bù', 'Chi tiết bài học bù', `${lesson?.title || ''} · Hạn ${formatDate(assignment.dueAt)}`, link('Về danh sách', '/app/student/remedial'))}
      <div class="content-grid main-aside"><section class="panel remedial-player"><div class="video-stage"><div class="video-illustration"><button class="play-button" type="button" data-action="toggle-video" data-assignment-id="${escapeHtml(assignment.id)}" aria-label="Phát video">▶</button><div><small>VIDEO BÀI HỌC</small><strong>Thì quá khứ đơn trong ngữ cảnh</strong></div></div><div class="video-controls"><span>${assignment.videoProgress >= 100 ? '✓' : '▶'}</span><div><i style="width:${assignment.videoProgress || 0}%"></i></div><strong>${assignment.videoProgress || 0}%</strong></div></div>
      <div class="panel-body"><p>${escapeHtml(lesson?.objectives?.join(' · ') || '')}</p><div class="progress-presets">${[25, 50, 75, 100].map((value) => `<button class="btn btn-secondary btn-sm" type="button" data-action="video-progress" data-assignment-id="${escapeHtml(assignment.id)}" data-progress="${value}">Lưu ${value}%</button>`).join('')}</div></div></section>
      ${section('Điều kiện hoàn thành', `<dl class="detail-list"><div><dt>Video tối thiểu</dt><dd>${ctx.state.settings.minimumVideoProgress}%</dd></div><div><dt>Điểm đạt</dt><dd>${assessment?.passingScore || 80}%</dd></div><div><dt>Số lượt làm</dt><dd>${ctx.state.attempts.filter((item) => item.assignmentId === assignment.id).length}/${assessment?.maxAttempts || 3}</dd></div><div><dt>Trạng thái</dt><dd>${badge(assignment.status)}</dd></div></dl>${link('Làm bài kiểm tra', `/app/student/quiz/${assignment.id}`, { kind: 'primary' })}`)}</div></div>`;
  }

  function studentQuiz(ctx, assignmentId) {
    const learner = learnerFor(ctx);
    const assignment = ctx.state.remedialAssignments.find((item) => item.id === assignmentId && item.learnerId === learner.id);
    if (!assignment) return empty('Không tìm thấy bài kiểm tra', 'Hãy mở bài học bù trước khi làm bài.', link('Về học bù', '/app/student/remedial'));
    const assessment = ctx.state.assessments.find((item) => item.id === assignment.assessmentId);
    const questions = assessment.questionIds.map((id) => ctx.state.questions.find((item) => item.id === id)).filter(Boolean);
    const attempts = ctx.state.attempts.filter((item) => item.assignmentId === assignment.id);
    const exhausted = attempts.length >= assessment.maxAttempts || assignment.status === 'COMPLETED';
    return `<div class="workspace-page quiz-page">${pageHeader('Học viên · Kiểm tra', assessment.title, `${questions.length} câu · Cần đạt ${assessment.passingScore}% · Còn ${Math.max(0, assessment.maxAttempts - attempts.length)} lượt`, `<time class="quiz-timer" data-quiz-timer data-seconds="900">15:00</time>`)}
      <form data-form="quiz" data-assignment-id="${escapeHtml(assignment.id)}"><div class="quiz-toolbar"><span>Trả lời tất cả câu hỏi trước khi nộp.</span><button class="btn btn-secondary btn-sm" type="button" data-action="fill-demo-quiz">Điền đáp án demo 8/10</button></div>
      ${questions.map((question, index) => `<fieldset class="question-card"><legend><span>Câu ${index + 1}</span>${escapeHtml(question.prompt)}</legend><div class="answer-list">${question.options.map((option, optionIndex) => { const demoAnswer = index < 8 ? question.correctIndex : (question.correctIndex + 1) % question.options.length; return `<label><input type="radio" name="answer-${index}" value="${optionIndex}" ${optionIndex === demoAnswer ? 'data-demo-answer' : ''}><span><b>${String.fromCharCode(65 + optionIndex)}</b>${escapeHtml(option)}</span></label>`; }).join('')}</div></fieldset>`).join('')}
      <div class="quiz-submit"><a class="btn btn-secondary" href="#/app/student/remedial/${assignment.id}">Quay lại bài học</a><button class="btn btn-primary" type="submit" ${exhausted ? 'disabled' : ''}>${assignment.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Nộp bài'}</button></div></form></div>`;
  }

  function studentResults(ctx) {
    const learner = learnerFor(ctx);
    const attempts = ctx.state.attempts.filter((item) => item.learnerId === learner.id).slice().reverse();
    return `<div class="workspace-page">${pageHeader('Học viên · Kết quả', 'Kết quả học tập', 'Xem điểm, số câu đúng, trạng thái và lịch sử từng lượt làm.')}${section('Lịch sử bài kiểm tra', attempts.length ? attempts.map((attempt) => `<article class="attempt-row"><span>Lượt ${attempt.attemptNumber}</span><strong>${attempt.score}/100</strong><span>${attempt.correct}/10 câu đúng</span>${badge(attempt.status)}<small>${formatDate(attempt.submittedAt)}</small></article>`).join('') : '<p class="muted">Chưa có kết quả. Hãy hoàn thành một bài kiểm tra.</p>')}</div>`;
  }

  function studentNotifications(ctx) {
    const rows = ctx.state.notifications.filter((item) => item.userId === ctx.actor.id);
    return `<div class="workspace-page">${pageHeader('Học viên · Thông báo', 'Thông báo của tôi', 'Bài học bù, kết quả và báo cáo được gửi vào cùng hộp thư.', button('Đánh dấu tất cả đã đọc', 'mark-notifications-read', { kind: 'secondary' }))}${section('Hộp thư', rows.length ? rows.map((item) => `<article class="notification-item ${item.read ? '' : 'unread'}"><span>${icon('spark')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${formatDate(item.createdAt)}</small></div>${badge(item.read ? 'COMPLETED' : 'NEW', item.read ? 'Đã đọc' : 'Mới')}</article>`).join('') : '<p class="muted">Chưa có thông báo.</p>')}</div>`;
  }

  function studentAssessments(ctx) {
    const learner = learnerFor(ctx);
    const assignment = ctx.state.remedialAssignments.find((item) => item.learnerId === learner.id);
    const assessment = ctx.state.assessments.find((item) => item.id === assignment?.assessmentId) || ctx.state.assessments.find((item) => item.id === 'assessment-remedial');
    const attempts = ctx.state.attempts.filter((item) => item.learnerId === learner.id || item.assignmentId === assignment?.id);
    return `<div class="workspace-page">${pageHeader('Trung tâm kiểm tra', 'Kiểm tra & kết quả', 'Chỉ kết quả đã công bố mới được ghi nhận vào bằng chứng tiến bộ.')}
      <div class="content-grid main-aside">${section(assessment.title, `<div class="assessment-summary"><span class="assessment-score">${attempts.length ? Math.max(...attempts.map((item) => item.score)) : '—'}<small>/100</small></span><div><p>${assessment.questionIds.length} câu · ${assessment.passingScore}% để đạt · tối đa ${assessment.maxAttempts} lượt</p>${assignment ? `${progress(assignment.videoProgress || 0, 'Điều kiện video')}${button(assignment.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Nộp đáp án mẫu 8/10', 'submit-demo-quiz', { payload: { assignmentId: assignment.id }, disabled: assignment.status === 'COMPLETED', icon: 'check' })}` : `<p class="notice-inline">Nhiệm vụ sẽ xuất hiện sau khi Giáo viên chốt điểm danh.</p>${link('Mở hướng dẫn demo', '/demo-guide')}`}</div></div>`, { subtitle: 'Chấm tự động · lưu bằng chứng theo từng lượt làm' })}
      ${section('Lịch sử lượt làm', attempts.length ? attempts.map((item, index) => `<div class="attempt-row"><span>Lượt ${index + 1}</span><strong>${item.score}/100</strong>${badge(item.status)}<small>${formatDate(item.submittedAt)}</small></div>`).join('') : '<p class="muted">Chưa có lượt làm nào.</p>')}</div>
      ${section('Hồ sơ cuối khóa', `<div class="assessment-card"><div><p class="eyebrow">Chấm thủ công</p><h3>Hồ sơ cuối khóa A2.1</h3><p>Nghe, đọc, tương tác nói, trình bày nói, viết và sử dụng ngôn ngữ.</p></div>${badge(ctx.state.gradingRecords.some((item) => item.learnerId === learner.id && item.status === 'RELEASED') ? 'RELEASED' : 'DRAFT')}</div>`)}</div>`;
  }

  function studentProgress(ctx) {
    const learner = learnerFor(ctx);
    const report = ctx.state.progressReports.filter((item) => item.learnerId === learner.id && item.status === 'PUBLISHED').at(-1);
    const profile = report?.skillProfile || root.YC.selectors.skillProfile(ctx.state, learner.id);
    return `<div class="workspace-page">${pageHeader('Kết quả học tập', 'Tiến bộ của tôi', 'Hồ sơ kỹ năng đa chiều, không rút gọn thành một điểm duy nhất.')}
      ${report ? `<div class="report-banner"><div><p class="eyebrow on-dark">Báo cáo tiến bộ đã công bố</p><h2>${escapeHtml(report.narrative)}</h2><p>Quản lý học thuật đã duyệt · ${formatDate(report.publishedAt)}</p></div><span class="report-average">${Math.round(profile.reduce((sum, item) => sum + item.score, 0) / profile.length)}<small>tổng thể</small></span></div>` : `<div class="notice-panel panel"><b>Chưa có báo cáo được công bố.</b><p>Bằng chứng kỹ năng đang được tích lũy qua đánh giá và kiểm duyệt.</p></div>`}
      <div class="skill-grid">${profile.map((item) => `<article><div><span>${escapeHtml(root.YC.ui.valueLabel(item.skill))}</span><strong>${item.score ?? '—'}</strong></div>${progress(item.score || 0)}<small>${item.evidenceId ? 'Có bằng chứng đã công bố' : 'Đang chờ đánh giá'}</small></article>`).join('')}</div>
      ${section('Việc cần làm tiếp theo', report ? `<ul class="check-list">${report.nextActions.map((item) => `<li>${icon('check')} ${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">Việc cần làm tiếp theo sẽ được Quản lý học thuật công bố cùng báo cáo.</p>')}</div>`;
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
    return `<div class="workspace-page parent-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Cổng thông tin gia đình', `Tổng quan của ${learner.name}`, 'Chỉ hiển thị dữ liệu đã công bố và nội dung được phép chia sẻ.')}
      <div class="metric-grid three">${metric('Chuyên cần', attendance.length ? `${Math.round(present / attendance.length * 100)}%` : 'Chưa có', 'Bản ghi đã chốt', 'calendar')}${metric('Bài tập', ctx.state.homeworkAssignments.filter((item) => item.learnerId === learner.id && item.status === 'ACCEPTED').length, 'Bài đã được giáo viên chấp nhận', 'check')}${metric('Báo cáo tiến bộ', report ? 'Đã có' : 'Đang chờ', report ? formatDate(report.publishedAt) : 'Chỉ hiện sau khi Học thuật công bố', 'trend')}</div>
      <div class="content-grid main-aside">${section('Điều cần biết tuần này', `<div class="parent-update"><span class="update-icon">${icon('book')}</span><div><p class="eyebrow">Học tập</p><h3>${report ? escapeHtml(report.narrative) : 'Đang tích lũy bằng chứng'}</h3><p>${report?.nextActions?.[0] || 'Báo cáo sẽ có việc cần làm cụ thể sau khi được duyệt.'}</p>${link('Xem tiến bộ', '/app/parent/progress', { small: true })}</div></div><div class="parent-update"><span class="update-icon amber">${icon('calendar')}</span><div><p class="eyebrow">Lịch học</p><h3>Buổi tiếp theo · Thứ 5, 18:00</h3><p>Tiếng Anh nền tảng 6A · P.302 · Cơ sở Quận 3</p>${link('Xem chuyên cần', '/app/parent/attendance', { small: true })}</div></div>`)}
      ${section('Hỗ trợ nhanh', `<div class="quick-links"><a href="#/app/parent/services">${icon('people')}<span><strong>Dịch vụ học viên</strong><small>Yêu cầu đổi lịch, học bù</small></span></a><a href="#/app/parent/tuition">${icon('wallet')}<span><strong>Học phí</strong><small>Trạng thái thanh toán mô phỏng</small></span></a></div>`)}</div></div>`;
  }

  function parentAttendance(ctx) {
    const { linked, learner } = parentData(ctx);
    const enrollment = ctx.state.enrollments.find((item) => item.learnerId === learner.id && item.status === 'ACTIVE');
    const records = ctx.state.attendanceRecords.filter((item) => item.learnerId === learner.id).map((item) => ({ ...item, session: ctx.state.sessions.find((entry) => entry.id === item.sessionId) }));
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Cổng thông tin gia đình', 'Chuyên cần & lịch học', 'Điểm danh đã được chốt; thay đổi lịch và học bù được tách thành bằng chứng riêng.')}${section('Lịch sử điểm danh', table([{ label: 'Buổi học', render: (row) => `<strong>${escapeHtml(row.session?.lessonTemplateId === 'lesson-past-simple' ? 'Thì quá khứ đơn' : row.session?.id || '')}</strong><small>${formatDate(row.session?.startsAt)}</small>` }, { label: 'Trạng thái', render: (row) => badge(row.status) }, { label: 'Lý do', key: 'reasonCode' }, { label: 'Cập nhật bởi', key: 'markedBy' }], records, { emptyTitle: 'Chưa có điểm danh', emptyBody: enrollment ? 'Bản ghi sẽ xuất hiện sau khi giáo viên chốt buổi học.' : 'Học viên chưa được xếp lớp.' }))}</div>`;
  }

  function parentProgress(ctx) {
    const { linked, learner } = parentData(ctx);
    const reports = linked.flatMap((learnerId) => ctx.state.progressReports.filter((item) => item.learnerId === learnerId && item.status === 'PUBLISHED'));
    const current = reports.find((item) => item.learnerId === learner.id) || null;
    const feedback = root.YC.policy.visibleFeedback(ctx.actor, ctx.state.feedbackRecords, ctx.state);
    const actions = current ? `${button('In báo cáo', 'print-view', { kind: 'secondary' })}${button('Xác nhận đã xem', 'acknowledge-progress', { payload: { learnerId: learner.id }, icon: 'check' })}` : '';
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Cổng thông tin gia đình', 'Báo cáo tiến bộ', 'Chỉ hiển thị báo cáo đã công bố và nhận xét của giáo viên được phép chia sẻ.', actions)}
      ${current ? `<div class="report-banner light"><div><p class="eyebrow">Tóm tắt học thuật</p><h2>${escapeHtml(current.narrative)}</h2><p>${escapeHtml(current.nextActions.join(' · '))}</p></div><span class="report-average">${Math.round(current.skillProfile.reduce((sum, item) => sum + item.score, 0) / current.skillProfile.length)}<small>tổng thể</small></span></div><div class="skill-grid compact">${current.skillProfile.map((item) => `<article><span>${escapeHtml(item.skill.replaceAll('_', ' '))}</span><strong>${item.score}</strong>${progress(item.score)}</article>`).join('')}</div>` : empty('Chưa có báo cáo cho học viên này', 'Quản lý học thuật sẽ công bố sau khi đủ bằng chứng kỹ năng và kiểm duyệt.')}
      ${section('Nhận xét có thể chia sẻ', feedback.length ? feedback.map((item) => { const target = ctx.state.learners.find((entry) => entry.id === item.learnerId); return `<blockquote><p>“${escapeHtml(item.body)}”</p><footer>${escapeHtml(target?.name || '')} · ${formatDate(item.createdAt)}</footer></blockquote>`; }).join('') : '<p class="muted">Chưa có nhận xét được phép chia sẻ.</p>', { subtitle: 'Ghi chú nội bộ và bảo vệ học viên bị loại theo chính sách hiển thị' })}</div>`;
  }

  function parentServices(ctx) {
    const { linked, learner } = parentData(ctx);
    const cases = ctx.state.serviceCases.filter((item) => !item.learnerId || linked.includes(item.learnerId));
    const makeups = ctx.state.makeUpBookings.filter((item) => linked.includes(item.learnerId));
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Cổng thông tin gia đình', 'Dịch vụ học viên', 'Theo dõi yêu cầu và học bù theo người phụ trách, trạng thái và việc tiếp theo.')}
      <div class="content-grid two">${section('Yêu cầu dịch vụ', table([{ label: 'Loại', render: (row) => escapeHtml(root.YC.ui.valueLabel(row.type)) }, { label: 'Lý do', key: 'reason' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], cases))}${section('Lịch học bù', table([{ label: 'Buổi gốc', key: 'originalSessionId' }, { label: 'Buổi bù', key: 'targetSessionId' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], makeups))}</div></div>`;
  }

  function parentTuition(ctx) {
    const { linked, learner } = parentData(ctx);
    const invoices = ctx.state.invoices.filter((item) => linked.includes(item.learnerId));
    const payments = ctx.state.payments.filter((item) => linked.includes(item.learnerId));
    return `<div class="workspace-page">${learnerSwitcher(ctx, linked, learner.id)}${pageHeader('Cổng thông tin gia đình', 'Học phí & gia hạn', 'Thông tin tài chính trong bản mẫu là mô phỏng, không phải chứng từ thật.')}
      <div class="notice-panel panel"><b>TÀI CHÍNH MÔ PHỎNG</b><p>Không có giao dịch hoặc nhà cung cấp thanh toán thật trong bản frontend này.</p></div>
      <div class="content-grid two">${section('Hóa đơn', table([{ label: 'Mã', key: 'id' }, { label: 'Số tiền', render: (row) => root.YC.ui.money(row.amount, row.currency) }, { label: 'Trạng thái', render: (row) => badge(row.status) }], invoices))}${section('Thanh toán', table([{ label: 'Mã tham chiếu', key: 'reference' }, { label: 'Nhà cung cấp', key: 'provider' }, { label: 'Trạng thái', render: (row) => badge(row.status) }], payments))}</div></div>`;
  }

  function render(path, ctx) {
    const routes = {
      '/app/student/dashboard': studentDashboard,
      '/app/student/course': studentCourse,
      '/app/student/remedial': studentRemedial,
      '/app/student/assessments': studentAssessments,
      '/app/student/progress': studentProgress,
      '/app/student/lessons': studentCourse,
      '/app/student/notifications': studentNotifications,
      '/app/parent/dashboard': parentDashboard,
      '/app/parent/attendance': parentAttendance,
      '/app/parent/progress': parentProgress,
      '/app/parent/services': parentServices,
      '/app/parent/tuition': parentTuition,
    };
    if (path.startsWith('/app/student/course/')) return studentActivity(ctx, path.split('/').at(-1));
    if (path.startsWith('/app/student/remedial/')) return studentRemedialDetail(ctx, path.split('/').at(-1));
    if (path.startsWith('/app/student/quiz/')) return studentQuiz(ctx, path.split('/').at(-1));
    if (path === '/app/student/results') return studentResults(ctx);
    return routes[path] ? routes[path](ctx) : '';
  }

  root.YC.define('learningViews', Object.freeze({ render }));
})(globalThis);

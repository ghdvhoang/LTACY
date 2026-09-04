(function definePublicViews(root) {
  'use strict';

  const { badge, button, fact, icon, link, money, section } = root.YC.ui;
  const { escapeHtml } = root.YC.utils;

  function programCards(state) {
    const accents = ['blue', 'violet', 'amber'];
    return `<div class="program-grid">${state.programs.map((program, index) => {
      const courseCount = state.courses.filter((course) => course.programId === program.id).length;
      return `<article class="program-card accent-${accents[index % accents.length]}">
        <div class="program-art"><span>${String(index + 1).padStart(2, '0')}</span>${icon(index === 1 ? 'trend' : index === 2 ? 'people' : 'book')}</div>
        <div class="program-body"><p class="eyebrow">${escapeHtml(program.audience)}</p><h3>${escapeHtml(program.name)}</h3><p>${escapeHtml(program.outcome)}</p>
        <div class="card-meta"><span>${courseCount || 1} lộ trình</span><span>Offline · Online</span></div>${link('Khám phá chương trình', `/chuong-trinh/${program.id}`, { kind: 'ghost' })}</div>
      </article>`;
    }).join('')}</div>`;
  }

  function home(ctx) {
    const { state } = ctx;
    return `<main id="main-content" class="public-main">
      <section class="hero"><div class="container hero-grid"><div class="hero-copy"><p class="eyebrow on-dark">Lộ trình ngoại ngữ có evidence</p>
        <h1>Học đúng trình độ.<br><span>Tiến bộ nhìn thấy được.</span></h1>
        <p>Yen Center kết nối kiểm tra đầu vào, lớp học, bài tập, đánh giá và báo cáo phụ huynh trong một hành trình minh bạch.</p>
        <div class="hero-actions">${link('Khám phá chương trình', '/chuong-trinh', { kind: 'primary' })}${link('Xem demo vận hành', '/demo-guide')}</div>
        <div class="hero-proof"><span>${icon('shield')} Dữ liệu demo minh bạch</span><span>${icon('people')} Nhiều vai trò cùng phối hợp</span></div></div>
        <div class="hero-visual" aria-label="Minh họa lộ trình học"><div class="learning-window"><div class="window-bar"><span></span><span></span><span></span><small>My Learning</small></div>
          <div class="window-content"><div class="lesson-kicker">ENGLISH FOUNDATION · A2.1</div><h2>Tiếp tục hành trình của Minh Anh</h2><p>Unit 4 · Past experiences</p>
          <div class="hero-progress"><span style="width:68%"></span></div><div class="module-preview"><b>✓</b><span><strong>Video · Past Simple in context</strong><small>18 phút · Đã hoàn thành</small></span></div>
          <div class="module-preview active"><b>▶</b><span><strong>Practice · Pair storytelling</strong><small>22 phút · Tiếp theo</small></span></div></div></div>
          <div class="floating-stat"><strong>+18%</strong><span>Speaking confidence</span></div></div>
      </div></section>
      <section class="trust-strip"><div class="container"><span>HÀNH TRÌNH KẾT NỐI</span><strong>Placement</strong><strong>Lớp học</strong><strong>Assessment</strong><strong>Progress</strong><strong>Renewal</strong></div></section>
      <section class="public-section container"><div class="section-intro"><p class="eyebrow">Chương trình nổi bật</p><h2>Một mục tiêu, một lộ trình rõ ràng</h2><p>Mỗi chương trình gắn chuẩn đầu ra, khối lượng học và evidence tiến bộ.</p></div>${programCards(state)}</section>
      <section class="public-section public-band"><div class="container feature-split"><div><p class="eyebrow">Không chỉ là điểm số</p><h2>Phụ huynh biết điều gì đã xảy ra và nên hỗ trợ gì tiếp theo.</h2><p>Báo cáo kết hợp attendance, homework, sáu nhóm kỹ năng, nhận xét được phép chia sẻ và next action.</p>${link('Trải nghiệm cổng phụ huynh', '/phu-huynh-hoc-sinh', { kind: 'primary' })}</div>
        <div class="evidence-card"><div class="evidence-top"><span class="avatar avatar-lg">MA</span><div><b>Nguyễn Minh Anh</b><small>English Foundation 6 · A2.1</small></div>${badge('ACTIVE')}</div>
        ${['Listening|76', 'Reading|78', 'Spoken interaction|62', 'Writing|72'].map((item) => { const [label, score] = item.split('|'); return `<div class="skill-row"><span>${label}</span><div><i style="width:${score}%"></i></div><b>${score}</b></div>`; }).join('')}</div></div></section>
      <section class="public-cta"><div class="container"><div><p class="eyebrow on-dark">Bắt đầu từ đúng trình độ</p><h2>Đặt lịch kiểm tra đầu vào miễn phí</h2><p>Nhận khuyến nghị chương trình theo sáu nhóm kỹ năng.</p></div>${link('Đăng ký tư vấn', '/lien-he', { kind: 'primary' })}</div></section>
    </main>`;
  }

  function catalog(ctx) {
    return `<main id="main-content" class="public-main"><section class="catalog-hero"><div class="container"><p class="eyebrow on-dark">Khám phá</p><h1>Chọn lộ trình phù hợp với mục tiêu</h1><p>Tìm theo độ tuổi, trình độ và hình thức học. Mọi khóa đều có chuẩn đầu ra và progress evidence.</p>
      <label class="search-box">${icon('search')}<input type="search" placeholder="Tìm chương trình, kỹ năng hoặc trình độ" aria-label="Tìm chương trình"></label></div></section>
      <section class="public-section container"><div class="filter-row"><button class="chip active">Tất cả</button><button class="chip">Young Learners</button><button class="chip">Teen</button><button class="chip">Adult</button><button class="chip">IELTS</button></div>${programCards(ctx.state)}</section></main>`;
  }

  function programDetail(ctx, programId) {
    const state = ctx.state;
    const program = state.programs.find((item) => item.id === programId) || state.programs[0];
    const courses = state.courses.filter((item) => item.programId === program.id);
    const versions = courses.map((course) => state.courseVersions.find((item) => item.courseId === course.id)).filter(Boolean);
    return `<main id="main-content" class="public-main"><section class="course-hero"><div class="container"><div><p class="eyebrow on-dark">${escapeHtml(program.audience)}</p><h1>${escapeHtml(program.name)}</h1><p>${escapeHtml(program.outcome)}. Học theo lộ trình rõ ràng với feedback và báo cáo tiến bộ định kỳ.</p>${link('Đăng ký placement', '/lien-he', { kind: 'primary' })}</div>
      <aside class="course-summary"><span class="summary-mark">YC</span><h3>Bắt đầu bằng placement</h3><p>Xác định đúng level trước khi chọn lớp.</p>${link('Xem lịch khai giảng', '/lich-hoc')}</aside></div></section>
      <section class="course-facts"><div class="container">${fact('trend', 'Trình độ', versions.map((item) => item.title.split('·').at(-1).trim()).join(' → ') || 'Theo placement')}${fact('clock', 'Thời lượng', `${versions[0]?.totalHours || 48} giờ / level`)}${fact('calendar', 'Hình thức', 'Offline · Online')}${fact('shield', 'Đầu ra', '6 skill evidence')}</div></section>
      <section class="public-section container course-layout"><div><div class="section-intro align-left"><p class="eyebrow">Lộ trình học</p><h2>Từ nền tảng đến sử dụng tự tin</h2></div>
        <div class="course-levels">${versions.map((version, index) => `<details class="course-module" ${index === 0 ? 'open' : ''}><summary><span><small>LEVEL ${index + 1}</small><strong>${escapeHtml(version.title)}</strong></span><span>${version.totalHours} giờ ${icon('arrow')}</span></summary><div><p>Chuẩn đầu ra: attendance ≥ ${version.completionRule.attendanceMinimum}%, final ≥ ${version.completionRule.finalScoreMinimum}, từng skill ≥ ${version.completionRule.skillMinimum}.</p><ul><li>Live lesson và guided practice</li><li>Homework với feedback vòng lặp</li><li>Progress report và promotion decision</li></ul></div></details>`).join('')}</div></div>
        <aside class="sticky-enroll"><p class="eyebrow">Bước tiếp theo</p><h3>Chưa chắc mình ở level nào?</h3><p>Placement đa kỹ năng giúp trung tâm xếp đúng lớp và lịch phù hợp.</p>${link('Đặt lịch miễn phí', '/lien-he', { kind: 'primary' })}<small>Không cần thanh toán ở bước này.</small></aside></section></main>`;
  }

  function schedule(ctx) {
    const { state } = ctx;
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Lịch khai giảng</p><h1>Tìm lớp vừa mục tiêu, vừa lịch sống</h1><p>Lịch dưới đây là dữ liệu demo và số chỗ được tính từ enrollment hiện tại.</p></div></section><section class="public-section container">
      <div class="schedule-list">${state.classes.map((cohort) => { const used = state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length; return `<article class="schedule-row"><div><p>${escapeHtml(state.branches.find((item) => item.id === cohort.branchId)?.name || '')}</p><h3>${escapeHtml(cohort.name)}</h3><span>${escapeHtml(cohort.code)}</span></div><div><small>Lịch học</small><strong>${escapeHtml(cohort.scheduleLabel)}</strong><span>${escapeHtml(cohort.mode)} · ${escapeHtml(cohort.room)}</span></div><div><small>Số chỗ</small><strong>${Math.max(0, cohort.capacity - used)}/${cohort.capacity}</strong>${badge(cohort.status)}</div>${link('Nhận tư vấn', '/lien-he')}</article>`; }).join('')}</div></section></main>`;
  }

  function family() {
    return `<main id="main-content" class="public-main"><section class="simple-hero family-hero"><div class="container feature-split"><div><p class="eyebrow">Phụ huynh & học viên</p><h1>Mỗi tuần đều biết mình đang tiến về đâu</h1><p>Một cổng học tập tách biệt cho học viên và phụ huynh, với quyền xem đúng phạm vi.</p>${link('Đăng nhập cổng học tập', '/login', { kind: 'primary' })}</div><div class="family-cards"><article><b>01</b><h3>Tiếp tục học</h3><p>Video, quiz, homework và feedback trong một learning path.</p></article><article><b>02</b><h3>Theo dõi evidence</h3><p>Attendance, skill profile và next action đã được duyệt.</p></article><article><b>03</b><h3>Phối hợp đúng lúc</h3><p>Nhận thay đổi lịch, dịch vụ và học phí phù hợp quyền xem.</p></article></div></div></section></main>`;
  }

  function centerSolution() {
    return `<main id="main-content" class="public-main"><section class="simple-hero dark"><div class="container"><p class="eyebrow on-dark">Giải pháp trung tâm</p><h1>Một operating model từ lead đến renewal</h1><p>Quyết định dựa trên evidence, chuyển giao bằng event, truy vết bằng audit.</p></div></section><section class="public-section container"><div class="solution-grid">${[
      ['Admissions & placement', 'Lead, consultation, placement, offer và mock commerce.'], ['Academic design', 'Course version immutable, lesson template và completion rule.'], ['Teacher operations', 'Eligibility, workload, assignment, delivery và grading.'], ['Student service', 'Allocation, make-up, transfer, substitution và case ownership.'], ['Learning outcomes', 'Homework loop, assessment, moderation và promotion.'], ['Parent & renewal', 'Published progress, visibility policy và next-level offer.'],
    ].map(([title, text], index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>${section('Frontend demo trung thực', '<p>Authentication, payment, messaging và integrations đều được mô phỏng rõ ràng. Không có dữ liệu thật được gửi ra bên ngoài.</p>', { className: 'notice-panel' })}</section></main>`;
  }

  function contact() {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Tư vấn & placement</p><h1>Bắt đầu bằng một cuộc trò chuyện đúng trọng tâm</h1><p>Form này chỉ mô phỏng trải nghiệm frontend; dữ liệu không được gửi đến hệ thống ngoài.</p></div></section><section class="public-section container contact-grid"><form class="panel contact-form" data-demo-form><label>Họ và tên<input name="name" required placeholder="Nguyễn Minh Anh"></label><label>Số điện thoại<input name="phone" required placeholder="0900 000 000"></label><label>Mục tiêu học<select name="goal"><option>Nền tảng giao tiếp</option><option>IELTS</option><option>Speaking confidence</option></select></label><label>Khung giờ phù hợp<textarea name="schedule" rows="3" placeholder="Ví dụ: Thứ 3 & 5 sau 18:00"></textarea></label>${button('Gửi yêu cầu demo', 'submit-demo-contact', { icon: 'arrow' })}<small>Demo only · Không gửi email, SMS hoặc Zalo thật.</small></form><aside><p class="eyebrow">Sau khi gửi</p><h2>Luồng xử lý minh bạch</h2><ol class="process-list"><li><b>1</b><span><strong>Admissions liên hệ</strong><small>Xác nhận nhu cầu và lịch.</small></span></li><li><b>2</b><span><strong>Placement đa kỹ năng</strong><small>Academic Manager review.</small></span></li><li><b>3</b><span><strong>Khuyến nghị level</strong><small>Offer và lịch lớp phù hợp.</small></span></li></ol></aside></section></main>`;
  }

  function login(ctx) {
    const roleOrder = ['ADMISSIONS', 'ACADEMIC_MANAGER', 'STUDENT_SERVICE', 'FINANCE', 'TEACHER', 'STUDENT', 'PARENT', 'CENTER_MANAGER', 'ADMIN'];
    const users = roleOrder.map((role) => ctx.state.users.find((item) => item.role === role)).filter(Boolean);
    return `<main id="main-content" class="login-page"><section class="login-intro"><a class="brand brand-light" href="#/"><span class="brand-mark"></span><span class="brand-copy"><strong>Yen Center</strong><small>LEARNING OPERATING SYSTEM</small></span></a><div><p class="eyebrow on-dark">Demo workspace</p><h1>Chọn một vai trò để bước vào hành trình.</h1><p>Mỗi vai trò có quyết định, phạm vi và evidence riêng. Đăng nhập này chỉ là mô phỏng frontend.</p></div><small>Demo authentication · Không dùng cho dữ liệu thật.</small></section><section class="role-picker"><div><p class="eyebrow">Quick access</p><h2>Bạn muốn xem workspace nào?</h2><p>Chuyển vai trò bất kỳ lúc nào từ thanh điều hướng.</p></div><div class="role-card-grid">${users.map((user) => `<button type="button" class="role-card" data-action="login" data-actor-id="${escapeHtml(user.id)}"><span class="avatar">${escapeHtml(user.name.split(' ').slice(-2).map((part) => part[0]).join(''))}</span><span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.role.replaceAll('_', ' '))}</small></span>${icon('arrow')}</button>`).join('')}</div>${link('Hoặc mở Demo Guide', '/demo-guide', { kind: 'ghost' })}</section></main>`;
  }

  function render(path, ctx) {
    if (path === '/') return home(ctx);
    if (path === '/chuong-trinh') return catalog(ctx);
    if (path.startsWith('/chuong-trinh/')) return programDetail(ctx, path.split('/').at(-1));
    if (path === '/lich-hoc') return schedule(ctx);
    if (path === '/phu-huynh-hoc-sinh') return family(ctx);
    if (path === '/giai-phap-trung-tam') return centerSolution(ctx);
    if (path === '/lien-he') return contact(ctx);
    if (path === '/login') return login(ctx);
    return '';
  }

  root.YC.define('publicViews', Object.freeze({ render }));
})(globalThis);

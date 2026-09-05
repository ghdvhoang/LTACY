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
        <div class="card-meta"><span>${courseCount || 1} lộ trình</span><span>Trực tiếp · Trực tuyến</span></div>${link('Khám phá chương trình', `/chuong-trinh/${program.id}`, { kind: 'ghost' })}</div>
      </article>`;
    }).join('')}</div>`;
  }

  function home(ctx) {
    const { state } = ctx;
    return `<main id="main-content" class="public-main">
      <section class="hero"><div class="container hero-grid"><div class="hero-copy"><p class="eyebrow on-dark">Lộ trình ngoại ngữ có bằng chứng</p>
        <h1>Học đúng trình độ.<br><span>Tiến bộ nhìn thấy được.</span></h1>
        <p>Yen Center kết nối kiểm tra đầu vào, lớp học, bài tập, đánh giá và báo cáo phụ huynh trong một hành trình minh bạch.</p>
        <div class="hero-actions">${link('Khám phá chương trình', '/chuong-trinh', { kind: 'primary' })}${link('Xem demo vận hành', '/demo-guide')}</div>
        <div class="hero-proof"><span>${icon('shield')} Dữ liệu demo minh bạch</span><span>${icon('people')} Nhiều vai trò cùng phối hợp</span></div></div>
        <div class="hero-visual" aria-label="Minh họa lộ trình học"><div class="learning-window"><div class="window-bar"><span></span><span></span><span></span><small>GÓC HỌC TẬP</small></div>
          <div class="window-content"><div class="lesson-kicker">TIẾNG ANH NỀN TẢNG · A2.1</div><h2>Tiếp tục hành trình của Minh Anh</h2><p>Học phần 4 · Trải nghiệm trong quá khứ</p>
          <div class="hero-progress"><span style="width:68%"></span></div><div class="module-preview"><b>✓</b><span><strong>Video · Thì quá khứ đơn trong ngữ cảnh</strong><small>18 phút · Đã hoàn thành</small></span></div>
          <div class="module-preview active"><b>▶</b><span><strong>Luyện tập · Kể chuyện theo cặp</strong><small>22 phút · Tiếp theo</small></span></div></div></div>
          <div class="floating-stat"><strong>+18%</strong><span>Tự tin giao tiếp</span></div></div>
      </div></section>
      <section class="trust-strip"><div class="container"><span>HÀNH TRÌNH KẾT NỐI</span><strong>Đầu vào</strong><strong>Lớp học</strong><strong>Đánh giá</strong><strong>Tiến bộ</strong><strong>Gia hạn</strong></div></section>
      <section class="public-section container"><div class="section-intro"><p class="eyebrow">Chương trình nổi bật</p><h2>Một mục tiêu, một lộ trình rõ ràng</h2><p>Mỗi chương trình gắn chuẩn đầu ra, khối lượng học và bằng chứng tiến bộ.</p></div>${programCards(state)}</section>
      <section class="public-section public-band"><div class="container feature-split"><div><p class="eyebrow">Không chỉ là điểm số</p><h2>Phụ huynh biết điều gì đã xảy ra và nên hỗ trợ gì tiếp theo.</h2><p>Báo cáo kết hợp chuyên cần, bài tập, sáu nhóm kỹ năng, nhận xét được phép chia sẻ và việc cần làm tiếp theo.</p>${link('Trải nghiệm cổng phụ huynh', '/phu-huynh-hoc-sinh', { kind: 'primary' })}</div>
        <div class="evidence-card"><div class="evidence-top"><span class="avatar avatar-lg">MA</span><div><b>Nguyễn Minh Anh</b><small>Tiếng Anh nền tảng 6 · A2.1</small></div>${badge('ACTIVE')}</div>
        ${['Nghe|76', 'Đọc|78', 'Tương tác nói|62', 'Viết|72'].map((item) => { const [label, score] = item.split('|'); return `<div class="skill-row"><span>${label}</span><div><i style="width:${score}%"></i></div><b>${score}</b></div>`; }).join('')}</div></div></section>
      <section class="public-cta"><div class="container"><div><p class="eyebrow on-dark">Bắt đầu từ đúng trình độ</p><h2>Đặt lịch kiểm tra đầu vào miễn phí</h2><p>Nhận khuyến nghị chương trình theo sáu nhóm kỹ năng.</p></div>${link('Đăng ký tư vấn', '/lien-he', { kind: 'primary' })}</div></section>
    </main>`;
  }

  function catalog(ctx) {
    return `<main id="main-content" class="public-main"><section class="catalog-hero"><div class="container"><p class="eyebrow on-dark">Khám phá</p><h1>Chọn lộ trình phù hợp với mục tiêu</h1><p>Tìm theo độ tuổi, trình độ và hình thức học. Mọi khóa đều có chuẩn đầu ra và bằng chứng tiến bộ.</p>
      <label class="search-box">${icon('search')}<input type="search" placeholder="Tìm chương trình, kỹ năng hoặc trình độ" aria-label="Tìm chương trình"></label></div></section>
      <section class="public-section container"><div class="filter-row"><button class="chip active">Tất cả</button><button class="chip">Thiếu nhi</button><button class="chip">Thiếu niên</button><button class="chip">Người lớn</button><button class="chip">IELTS</button></div>${programCards(ctx.state)}</section></main>`;
  }

  function programDetail(ctx, programId) {
    const state = ctx.state;
    const program = state.programs.find((item) => item.id === programId) || state.programs[0];
    const courses = state.courses.filter((item) => item.programId === program.id);
    const versions = courses.map((course) => state.courseVersions.find((item) => item.courseId === course.id)).filter(Boolean);
    return `<main id="main-content" class="public-main"><section class="course-hero"><div class="container"><div><p class="eyebrow on-dark">${escapeHtml(program.audience)}</p><h1>${escapeHtml(program.name)}</h1><p>${escapeHtml(program.outcome)}. Học theo lộ trình rõ ràng với phản hồi và báo cáo tiến bộ định kỳ.</p>${link('Đăng ký kiểm tra đầu vào', '/lien-he', { kind: 'primary' })}</div>
      <aside class="course-summary"><span class="summary-mark">YC</span><h3>Bắt đầu bằng kiểm tra đầu vào</h3><p>Xác định đúng cấp độ trước khi chọn lớp.</p>${link('Xem lịch khai giảng', '/lich-hoc')}</aside></div></section>
      <section class="course-facts"><div class="container">${fact('trend', 'Trình độ', versions.map((item) => item.title.split('·').at(-1).trim()).join(' → ') || 'Theo đầu vào')}${fact('clock', 'Thời lượng', `${versions[0]?.totalHours || 48} giờ / cấp độ`)}${fact('calendar', 'Hình thức', 'Trực tiếp · Trực tuyến')}${fact('shield', 'Đầu ra', 'Bằng chứng 6 kỹ năng')}</div></section>
      <section class="public-section container course-layout"><div><div class="section-intro align-left"><p class="eyebrow">Lộ trình học</p><h2>Từ nền tảng đến sử dụng tự tin</h2></div>
        <div class="course-levels">${versions.map((version, index) => `<details class="course-module" ${index === 0 ? 'open' : ''}><summary><span><small>CẤP ĐỘ ${index + 1}</small><strong>${escapeHtml(version.title)}</strong></span><span>${version.totalHours} giờ ${icon('arrow')}</span></summary><div><p>Chuẩn đầu ra: chuyên cần ≥ ${version.completionRule.attendanceMinimum}%, cuối khóa ≥ ${version.completionRule.finalScoreMinimum}, từng kỹ năng ≥ ${version.completionRule.skillMinimum}.</p><ul><li>Bài học trực tiếp và luyện tập có hướng dẫn</li><li>Bài tập với vòng lặp phản hồi</li><li>Báo cáo tiến bộ và quyết định lên lớp</li></ul></div></details>`).join('')}</div></div>
        <aside class="sticky-enroll"><p class="eyebrow">Bước tiếp theo</p><h3>Chưa chắc mình ở cấp độ nào?</h3><p>Kiểm tra đầu vào đa kỹ năng giúp trung tâm xếp đúng lớp và lịch phù hợp.</p>${link('Đặt lịch miễn phí', '/lien-he', { kind: 'primary' })}<small>Không cần thanh toán ở bước này.</small></aside></section></main>`;
  }

  function schedule(ctx) {
    const { state } = ctx;
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Lịch khai giảng</p><h1>Tìm lớp vừa mục tiêu, vừa lịch sống</h1><p>Lịch dưới đây là dữ liệu demo và số chỗ được tính từ ghi danh hiện tại.</p></div></section><section class="public-section container">
      <div class="schedule-list">${state.classes.map((cohort) => { const used = state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length; return `<article class="schedule-row"><div><p>${escapeHtml(state.branches.find((item) => item.id === cohort.branchId)?.name || '')}</p><h3>${escapeHtml(cohort.name)}</h3><span>${escapeHtml(cohort.code)}</span></div><div><small>Lịch học</small><strong>${escapeHtml(cohort.scheduleLabel)}</strong><span>${escapeHtml(cohort.mode)} · ${escapeHtml(cohort.room)}</span></div><div><small>Số chỗ</small><strong>${Math.max(0, cohort.capacity - used)}/${cohort.capacity}</strong>${badge(cohort.status)}</div>${link('Nhận tư vấn', '/lien-he')}</article>`; }).join('')}</div></section></main>`;
  }

  function publicLeadForm(type) {
    const isB2B = type === 'B2B';
    const isSupport = type === 'SUPPORT';
    return `<form class="panel contact-form" data-form="public-lead" data-type="${type}" novalidate><h2>${isSupport ? 'Gửi yêu cầu hỗ trợ' : isB2B ? 'Đặt lịch demo giải pháp' : 'Đăng ký tư vấn chương trình'}</h2>
      ${isB2B ? '<label>Tên tổ chức<input name="organization" required placeholder="Trung tâm hoặc trường học"></label>' : ''}
      <label>Họ và tên<input name="name" required placeholder="Nguyễn Thu Hà"></label>${!isB2B && !isSupport ? '<label>Tên học viên<input name="studentName" placeholder="Nguyễn Minh Anh"></label>' : ''}
      <label>Số điện thoại<input name="phone" inputmode="tel" placeholder="0900 000 000"></label><label>Email<input name="email" type="email" placeholder="email@example.com"></label>
      <label>${isSupport ? 'Nội dung cần hỗ trợ' : 'Nhu cầu'}<textarea name="message" rows="3" required placeholder="Mô tả ngắn nhu cầu của bạn"></textarea></label><label class="checkbox"><input type="checkbox" name="consent" required><span>Tôi đồng ý để Yen Center xử lý thông tin nhằm liên hệ.</span></label>
      <button class="btn btn-primary" type="submit">${isSupport ? 'Gửi yêu cầu hỗ trợ' : 'Gửi yêu cầu'}</button><small>Dữ liệu chỉ lưu trong trình duyệt của bản demo.</small></form>`;
  }

  function family() {
    return `<main id="main-content" class="public-main"><section class="simple-hero family-hero"><div class="container feature-split"><div><p class="eyebrow">Phụ huynh & học viên</p><h1>Mỗi tuần đều biết mình đang tiến về đâu</h1><p>Một cổng học tập cho học viên và phụ huynh, với quyền xem đúng phạm vi.</p>${link('Đăng nhập cổng học tập', '/login', { kind: 'primary' })}</div><div class="family-cards"><article><b>01</b><h3>Tiếp tục học</h3><p>Video, bài kiểm tra, bài tập và nhận xét trong một lộ trình.</p></article><article><b>02</b><h3>Theo dõi bằng chứng</h3><p>Chuyên cần, hồ sơ kỹ năng và bước tiếp theo đã được duyệt.</p></article><article><b>03</b><h3>Phối hợp đúng lúc</h3><p>Nhận thay đổi lịch, dịch vụ và học phí phù hợp quyền xem.</p></article></div></div></section><section class="public-section container contact-grid"><div><p class="eyebrow">Tư vấn chương trình</p><h2>Chọn đúng lớp ngay từ đầu</h2><p>Yêu cầu sau khi gửi sẽ xuất hiện ngay trong Hộp thư liên hệ của Quản trị viên.</p></div>${publicLeadForm('B2C')}</section></main>`;
  }

  function centerSolution() {
    return `<main id="main-content" class="public-main"><section class="simple-hero dark"><div class="container"><p class="eyebrow on-dark">Giải pháp trung tâm</p><h1>Một mô hình vận hành từ khách hàng đến gia hạn</h1><p>Quyết định dựa trên bằng chứng, chuyển giao bằng sự kiện, truy vết bằng nhật ký.</p></div></section><section class="public-section container"><div class="solution-grid">${[
      ['Tuyển sinh và đầu vào', 'Khách hàng, tư vấn, kiểm tra đầu vào, gói học và tài chính mô phỏng.'], ['Thiết kế học thuật', 'Phiên bản khóa học không thể sửa, mẫu bài học và quy tắc hoàn thành.'], ['Vận hành giáo viên', 'Điều kiện, khối lượng, phân công, giảng dạy và chấm bài.'], ['Dịch vụ học viên', 'Xếp lớp, học bù, chuyển lớp, dạy thay và người phụ trách vụ việc.'], ['Kết quả học tập', 'Vòng lặp bài tập, đánh giá, kiểm duyệt và lên lớp.'], ['Phụ huynh và gia hạn', 'Tiến bộ đã công bố, chính sách hiển thị và gói cấp độ tiếp theo.'],
    ].map(([title, text], index) => `<article><span>${String(index + 1).padStart(2, '0')}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>${section('Bản demo giao diện trung thực', '<p>Xác thực, thanh toán, nhắn tin và tích hợp đều được mô phỏng rõ ràng. Không có dữ liệu thật được gửi ra bên ngoài.</p>', { className: 'notice-panel' })}</section><section class="public-section container contact-grid"><div><p class="eyebrow">Dành cho trung tâm</p><h2>Đặt lịch xem luồng vận hành</h2><p>Thông tin được lưu vào Hộp thư liên hệ để kiểm tra xuyên vai trò.</p></div>${publicLeadForm('B2B')}</section></main>`;
  }

  function contact() {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Liên hệ và hỗ trợ</p><h1>Bắt đầu bằng một cuộc trò chuyện đúng trọng tâm</h1><p>Yêu cầu hỗ trợ được lưu trong trình duyệt và hiển thị ngay cho Quản trị viên.</p></div></section><section class="public-section container contact-grid">${publicLeadForm('SUPPORT')}<aside><p class="eyebrow">Sau khi gửi</p><h2>Luồng xử lý minh bạch</h2><ol class="process-list"><li><b>1</b><span><strong>Tiếp nhận</strong><small>Tạo mã yêu cầu.</small></span></li><li><b>2</b><span><strong>Phân loại</strong><small>Chuyển đúng người phụ trách.</small></span></li><li><b>3</b><span><strong>Theo dõi</strong><small>Cập nhật trạng thái trong hộp thư.</small></span></li></ol></aside></section></main>`;
  }

  function publicNews(ctx) {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Tin tức</p><h1>Cập nhật từ Yen Center</h1><p>Thông tin chương trình, khai giảng và hoạt động học tập.</p></div></section><section class="public-section container"><div class="program-grid">${ctx.state.publicContent.news.map((item) => `<article class="program-card"><div class="program-body"><p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2><p>Nội dung minh họa được xuất bản trong cổng thông tin.</p>${badge(item.status)}</div></article>`).join('')}</div></section></main>`;
  }

  function publicEvents(ctx) {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Sự kiện</p><h1>Hoạt động sắp diễn ra</h1><p>Đăng ký kiểm tra đầu vào và các buổi trải nghiệm.</p></div></section><section class="public-section container">${ctx.state.publicContent.events.map((item) => `<article class="schedule-row"><div><p>Sự kiện</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml(item.location)}</span></div><div><small>Thời gian</small><strong>${escapeHtml(item.startsAt)}</strong></div>${link('Đăng ký', '/lien-he', { kind: 'primary' })}</article>`).join('')}</section></main>`;
  }

  function publicDocuments(ctx) {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Tài liệu</p><h1>Hướng dẫn sử dụng</h1><p>Tài liệu tải xuống được tạo cục bộ trong bản demo.</p></div></section><section class="public-section container"><div class="program-grid">${ctx.state.publicContent.documents.map((item) => `<article class="program-card"><div class="program-body"><p class="eyebrow">${escapeHtml(item.type)}</p><h2>${escapeHtml(item.title)}</h2><p>Dành cho ${escapeHtml(item.audience)}.</p><button class="btn btn-secondary" type="button" data-action="download-demo-document" data-document-id="${escapeHtml(item.id)}">Tải bản mô phỏng</button></div></article>`).join('')}</div></section></main>`;
  }

  function faq() {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Câu hỏi thường gặp</p><h1>Thông tin cần biết</h1></div></section><section class="public-section container"><details class="course-module" open><summary><strong>Bài học bù được tạo khi nào?</strong>${icon('arrow')}</summary><div><p>Khi giáo viên lưu trạng thái vắng, hệ thống tạo đúng một nhiệm vụ gắn với bài của buổi học.</p></div></details><details class="course-module"><summary><strong>Dữ liệu demo có được gửi đi không?</strong>${icon('arrow')}</summary><div><p>Không. Tất cả chỉ được lưu cục bộ trong trình duyệt.</p></div></details></section></main>`;
  }

  function legal(kind) {
    const privacy = kind === 'privacy';
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Thông tin pháp lý</p><h1>${privacy ? 'Chính sách bảo mật' : 'Điều khoản sử dụng'}</h1><p>Bản demo giao diện này không phải dịch vụ sản xuất và không tiếp nhận dữ liệu thật.</p></div></section><section class="public-section container"><div class="panel panel-body"><h2>${privacy ? 'Dữ liệu cục bộ' : 'Phạm vi sử dụng'}</h2><p>${privacy ? 'Dữ liệu nhập trong demo được lưu vào bộ nhớ trình duyệt và có thể xóa bằng thao tác đặt lại demo.' : 'Chỉ sử dụng để đánh giá luồng giao diện và nghiệp vụ mô phỏng. Thanh toán, nhắn tin và tích hợp không gọi hệ thống bên ngoài.'}</p></div></section></main>`;
  }

  function errorPage(code) {
    return `<main id="main-content" class="not-found"><div class="not-found-code">${code}</div><p class="eyebrow">${code === 403 ? 'Không có quyền truy cập' : 'Không tìm thấy trang'}</p><h1>${code === 403 ? 'Bạn không có quyền mở khu vực này' : 'Không tìm thấy trang'}</h1><p>Hãy quay về trang chủ hoặc đăng nhập bằng tài khoản phù hợp.</p><a class="btn btn-primary" href="#/">Về trang chủ</a></main>`;
  }

  function login(ctx) {
    const primaryAccounts = [
      ['teacher-1', 'Giáo viên', 'teacher@yencenter.demo · Demo@123'],
      ['ta-1', 'Trợ giảng', 'ta@yencenter.demo · Demo@123'],
      ['student-login-1', 'Học viên', 'HS6A001 · 123456'],
      ['admin-1', 'Quản trị viên', 'admin@yencenter.demo · Demo@123'],
    ].map(([id, label, credentials]) => ({ user: ctx.state.users.find((item) => item.id === id), label, credentials })).filter((item) => item.user);
    return `<main id="main-content" class="login-page"><section class="login-intro"><a class="brand brand-light" href="#/"><span class="brand-mark"></span><span class="brand-copy"><strong>Yen Center</strong><small>HỆ THỐNG VẬN HÀNH HỌC TẬP</small></span></a><div><p class="eyebrow on-dark">Cổng học tập demo</p><h1>Đăng nhập như phiên bản quen thuộc.</h1><p>Dùng tài khoản bên dưới để kiểm tra luồng Giáo viên giao việc và Học viên Nguyễn Minh Anh nhận đúng nội dung trên cùng dữ liệu.</p></div><small>Xác thực mô phỏng · Không dùng dữ liệu thật.</small></section><section class="role-picker"><div><p class="eyebrow">Đăng nhập</p><h2>Chào mừng bạn quay lại</h2><p>Nhập email/mã học viên và mật khẩu hoặc dùng tài khoản nhanh.</p></div>
      <form class="login-form" data-form="login" novalidate><label>Email hoặc mã học viên<input class="input" name="identifier" autocomplete="username" required placeholder="Ví dụ: HS6A001"></label><label>Mật khẩu / PIN<input class="input" name="secret" type="password" autocomplete="current-password" required placeholder="Nhập mật khẩu"></label><button class="btn btn-primary" type="submit">Đăng nhập</button><a class="text-link" href="#/forgot-password">Quên mật khẩu?</a></form>
      <div class="login-divider"><span>Hoặc dùng tài khoản nhanh</span></div><div class="role-card-grid primary-accounts">${primaryAccounts.map(({ user, label, credentials }) => `<button type="button" class="role-card" data-primary-account data-action="login" data-actor-id="${escapeHtml(user.id)}"><span class="avatar">${escapeHtml(user.name.split(' ').slice(-2).map((part) => part[0]).join(''))}</span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(user.name)} · ${escapeHtml(credentials)}</small></span>${icon('arrow')}</button>`).join('')}</div>${link('Mở hướng dẫn demo', '/demo-guide', { kind: 'ghost' })}</section></main>`;
  }

  function forgotPassword() {
    return `<main id="main-content" class="auth-page"><section class="form-card auth-card"><a class="back-link" href="#/login">← Quay lại đăng nhập</a><p class="eyebrow">Khôi phục tài khoản</p><h1>Quên mật khẩu</h1><p>Nhập email hoặc mã học viên. Bản demo sẽ tạo mã xác thực mô phỏng và không gửi ra ngoài.</p><form data-form="forgot" class="stack"><label>Email hoặc mã học viên<input class="input" name="identifier" required placeholder="HS6A001"></label><button class="btn btn-primary" type="submit">Nhận mã xác thực</button></form></section></main>`;
  }

  function verifyOtp() {
    return `<main id="main-content" class="auth-page"><section class="form-card auth-card"><a class="back-link" href="#/forgot-password">← Nhập lại tài khoản</a><p class="eyebrow">Xác thực mô phỏng</p><h1>Nhập mã xác thực</h1><p>Dùng mã <strong>123456</strong> để hoàn tất luồng demo.</p><form data-form="otp" class="stack"><label>Mã xác thực gồm 6 số<input class="input" name="otp" inputmode="numeric" minlength="6" maxlength="6" required value="123456"></label><button class="btn btn-primary" type="submit">Xác nhận mã</button></form></section></main>`;
  }

  function selectProfile(ctx) {
    const actor = ctx.actor;
    const learnerIds = actor?.linkedLearnerIds || [];
    const learners = learnerIds.map((id) => ctx.state.learners.find((item) => item.id === id)).filter(Boolean);
    return `<main id="main-content" class="auth-page"><section class="form-card auth-card"><p class="eyebrow">Tài khoản gia đình</p><h1>Chọn hồ sơ học viên</h1><p>Chọn người học bạn muốn xem trong phiên này.</p><div class="profile-choice-list">${learners.map((learner) => `<button type="button" class="role-card" data-action="select-login-profile" data-learner-id="${escapeHtml(learner.id)}"><span class="avatar">${escapeHtml(learner.name.split(' ').slice(-2).map((part) => part[0]).join(''))}</span><span><strong>${escapeHtml(learner.name)}</strong><small>${escapeHtml(learner.code)}</small></span>${icon('arrow')}</button>`).join('') || '<p>Hãy đăng nhập bằng tài khoản có nhiều hồ sơ để kiểm tra bước này.</p>'}<a class="text-link" href="#/login">Dùng tài khoản khác</a></div></section></main>`;
  }

  function render(path, ctx) {
    if (path === '/') return home(ctx);
    if (path === '/chuong-trinh') return catalog(ctx);
    if (path.startsWith('/chuong-trinh/')) return programDetail(ctx, path.split('/').at(-1));
    if (path === '/lich-hoc') return schedule(ctx);
    if (path === '/phu-huynh-hoc-sinh') return family(ctx);
    if (path === '/giai-phap-trung-tam') return centerSolution(ctx);
    if (path === '/lien-he') return contact(ctx);
    if (path === '/tin-tuc') return publicNews(ctx);
    if (path === '/su-kien') return publicEvents(ctx);
    if (path === '/tai-lieu') return publicDocuments(ctx);
    if (path === '/faq') return faq(ctx);
    if (path === '/dieu-khoan-su-dung') return legal('terms');
    if (path === '/chinh-sach-bao-mat') return legal('privacy');
    if (path === '/403') return errorPage(403);
    if (path === '/404') return errorPage(404);
    if (path === '/login') return login(ctx);
    if (path === '/forgot-password') return forgotPassword(ctx);
    if (path === '/verify-otp') return verifyOtp(ctx);
    if (path === '/select-profile') return selectProfile(ctx);
    return '';
  }

  root.YC.define('publicViews', Object.freeze({ render }));
})(globalThis);

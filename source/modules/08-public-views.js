(function definePublicViews(root) {
  'use strict';

  const { badge, button, fact, icon, link, money, section } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  function programInterestAction(program, actor) {
    if (!actor) return link('Đăng nhập để lưu', '/login', { kind: 'ghost' });
    if (actor.role !== 'VISITOR') return '';
    const programId = program.programId || program.id;
    const saved = (actor.savedProgramIds || []).includes(programId);
    return `<button class="btn ${saved ? 'btn-secondary' : 'btn-ghost'}" type="button" data-action="toggle-program-interest" data-program-id="${escapeHtml(programId)}">${saved ? 'Đã lưu' : 'Lưu quan tâm'}</button>`;
  }

  function programCards(state, actor) {
    const accents = ['blue', 'violet', 'amber'];
    return `<div class="program-grid">${state.programs.map((program, index) => {
      const courseCount = state.courses.filter((course) => course.programId === program.id).length;
      return `<article class="program-card accent-${accents[index % accents.length]}">
        <div class="program-art"><span>${String(index + 1).padStart(2, '0')}</span>${icon(index === 1 ? 'trend' : index === 2 ? 'people' : 'book')}</div>
        <div class="program-body"><p class="eyebrow">${escapeHtml(program.audience)}</p><h3>${escapeHtml(program.name)}</h3><p>${escapeHtml(program.outcome)}</p>
        <div class="card-meta"><span>${courseCount || 1} lộ trình</span><span>Trực tiếp · Trực tuyến</span></div><div class="card-actions">${link('Khám phá chương trình', `/chuong-trinh/${program.id}`, { kind: 'ghost' })}${programInterestAction(program, actor)}</div></div>
      </article>`;
    }).join('')}</div>`;
  }

  function homepageProgramCards(programs, actor) {
    return `<div class="yen-program-grid">${programs.map((program, index) => `<article class="yen-program-card accent-${String(program.accent || 'NAVY').toLowerCase()}"><span class="yen-card-index">${String(index + 1).padStart(2, '0')}</span><p>${escapeHtml(program.ageRange)}</p><h3>${escapeHtml(program.name)}</h3><div>${escapeHtml(program.summary)}</div><small>${escapeHtml(program.outcome)}</small><footer><a class="text-link" href="#/chuong-trinh/${escapeHtml(program.slug)}">Xem lộ trình ${icon('arrow')}</a>${programInterestAction(program, actor)}</footer></article>`).join('')}</div>`;
  }

  function availableSeats(state, cohort) {
    const enrolled = state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').length;
    const sessionIds = state.sessions.filter((item) => item.classId === cohort.id).map((item) => item.id);
    const reserved = state.makeUpBookings.filter((item) => sessionIds.includes(item.targetSessionId || item.sessionId) && ['HELD', 'BOOKED', 'NOTIFIED'].includes(item.status)).reduce((sum, item) => sum + Number(item.reservedSeats || 1), 0);
    return Math.max(0, Number(cohort.capacity || 0) - enrolled - reserved);
  }

  function home(ctx) {
    const { state, actor } = ctx;
    const content = root.YC.publicContent.homepage(state, actor);
    const hero = content.hero;
    const openClasses = state.classes.filter((item) => ['OPEN', 'ACTIVE'].includes(item.status)).slice(0, 3);
    const featured = content.articles.find((item) => item.featured) || content.articles[0];
    const articleList = content.articles.filter((item) => item.id !== featured?.id).slice(0, 3);
    const heroSection = hero ? `<section class="yen-hero"><div class="container yen-hero-inner"><div class="yen-hero-copy"><p class="eyebrow">${escapeHtml(hero.eyebrow)}</p><h1>${escapeHtml(hero.title)}</h1><p>${escapeHtml(hero.description)}</p><div class="hero-actions">${link(hero.primaryCtaLabel, hero.primaryCtaHref, { kind: 'primary' })}${link(hero.secondaryCtaLabel, hero.secondaryCtaHref)}</div><div class="yen-hero-points"><span>${icon('check')} Kiểm tra đúng trình độ</span><span>${icon('check')} Theo sát từng tiến bộ</span></div></div><div class="yen-hero-media"><img src="${escapeHtml(hero.image)}" alt="${escapeHtml(hero.imageAlt)}"><span><b>6</b> nhóm kỹ năng được theo dõi</span></div></div></section>` : '';
    return `<main id="main-content" class="public-main yen-home">
      ${heroSection}
      ${content.programs.length ? `<section class="yen-section container"><div class="yen-section-head"><div><p class="eyebrow">Chương trình nổi bật</p><h2>Chọn lộ trình phù hợp với tuổi và mục tiêu</h2></div><a class="text-link" href="#/chuong-trinh">Xem tất cả ${icon('arrow')}</a></div>${homepageProgramCards(content.programs, actor)}</section>` : ''}
      <section class="yen-section yen-why"><div class="container"><div class="yen-section-head light"><div><p class="eyebrow">Vì sao chọn Cô Yến</p><h2>Một lớp học gần gũi, một hệ thống theo sát</h2></div></div><div class="yen-benefit-grid">${[
        ['01', 'Lộ trình vừa sức', 'Kiểm tra đầu vào và xếp lớp theo năng lực thực tế.'],
        ['02', 'Tương tác thật', 'Học viên được nói, thực hành và nhận phản hồi ngay trong buổi học.'],
        ['03', 'Tiến bộ rõ ràng', 'Chuyên cần, bài tập và kỹ năng được nối thành bằng chứng dễ hiểu.'],
        ['04', 'Gia đình cùng đồng hành', 'Phụ huynh nhận đúng thông tin cần biết và việc nên hỗ trợ tiếp theo.'],
      ].map(([number, title, body]) => `<article><b>${number}</b><h3>${title}</h3><p>${body}</p></article>`).join('')}</div></div></section>
      <section class="yen-section container yen-process"><div class="yen-section-head"><div><p class="eyebrow">Cách bắt đầu</p><h2>Ba bước để vào đúng lớp</h2></div></div><div class="yen-process-grid">${[
        ['1', 'Đăng ký tư vấn', 'Chia sẻ độ tuổi, mục tiêu và lịch học phù hợp.'],
        ['2', 'Kiểm tra đầu vào', 'Đánh giá năng lực và trao đổi khuyến nghị lộ trình.'],
        ['3', 'Xếp lớp & bắt đầu', 'Chọn lớp còn chỗ, hoàn tất ghi danh và nhận lịch học.'],
      ].map(([number, title, body]) => `<article><span>${number}</span><div><h3>${title}</h3><p>${body}</p></div></article>`).join('')}</div>${link('Đăng ký tư vấn', '/lien-he', { kind: 'primary' })}</section>
      ${openClasses.length ? `<section class="yen-section yen-schedule"><div class="container"><div class="yen-section-head"><div><p class="eyebrow">Lịch khai giảng</p><h2>Lớp đang nhận học viên</h2></div><a class="text-link" href="#/lich-hoc">Xem toàn bộ lịch ${icon('arrow')}</a></div><div class="yen-schedule-list">${openClasses.map((cohort) => { const branch = state.branches.find((item) => item.id === cohort.branchId); const course = state.courseVersions.find((item) => item.id === cohort.courseVersionId); const seats = availableSeats(state, cohort); return `<article><div><p>${escapeHtml(branch?.name || '')}</p><h3>${escapeHtml(cohort.name)}</h3><small>${escapeHtml(course?.title || '')}</small></div><div><span>${icon('calendar')} ${escapeHtml(cohort.scheduleLabel || 'Đang cập nhật')}</span><span>${icon('grid')} ${escapeHtml(cohort.room || 'Trực tuyến')}</span></div><div><strong>${seats}</strong><small>chỗ còn lại</small></div>${link('Nhận tư vấn', '/lien-he')}</article>`; }).join('')}</div></div></section>` : ''}
      <section class="yen-section container yen-progress"><div class="yen-progress-story"><p class="eyebrow">Tiến bộ có thể theo dõi</p><h2>Không chỉ biết điểm số, mà biết nên làm gì tiếp theo</h2><p>Cùng một hồ sơ học viên kết nối buổi học, điểm danh, bài tập, học bù và báo cáo. Khi giáo viên cập nhật, học viên và phụ huynh nhìn thấy đúng phần được phép chia sẻ.</p>${link('Khám phá góc phụ huynh', '/phu-huynh-hoc-sinh', { kind: 'primary' })}</div><div class="yen-progress-card"><header><span class="avatar avatar-lg">MA</span><div><strong>Nguyễn Minh Anh</strong><small>Hồ sơ học tập liên tục</small></div>${badge('ACTIVE')}</header>${[['Chuyên cần', 92], ['Hoàn thành bài tập', 84], ['Tự tin giao tiếp', 76]].map(([label, score]) => `<div class="yen-progress-row"><span>${label}</span><div><i style="width:${score}%"></i></div><b>${score}%</b></div>`).join('')}<footer><span>${icon('check')} Có bằng chứng</span><span>${icon('trend')} Có bước tiếp theo</span></footer></div></section>
      ${content.teachers.length ? `<section class="yen-section yen-teachers"><div class="container"><div class="yen-section-head"><div><p class="eyebrow">Đội ngũ giáo viên</p><h2>Người đồng hành hiểu từng giai đoạn học</h2></div><a class="text-link" href="#/giao-vien">Xem đội ngũ ${icon('arrow')}</a></div><div class="yen-teacher-grid">${content.teachers.map((teacher) => `<article><span>${escapeHtml(teacher.name.split(' ').slice(-2).map((part) => part[0]).join(''))}</span><h3>${escapeHtml(teacher.name)}</h3><p>${escapeHtml(teacher.roleLabel)}</p><small>${escapeHtml((teacher.qualifications || []).join(' · '))}</small><blockquote>“${escapeHtml(teacher.quote)}”</blockquote></article>`).join('')}</div></div></section>` : ''}
      ${featured ? `<section class="yen-section container yen-news"><div class="yen-section-head"><div><p class="eyebrow">Tin mới nhất</p><h2>Cùng học tốt hơn mỗi ngày</h2></div><a class="text-link" href="#/tin-tuc">Xem tất cả ${icon('arrow')}</a></div><div class="yen-news-grid"><a class="yen-featured-news" href="#/tin-tuc/${escapeHtml(featured.slug)}"><span>${escapeHtml(content.categories.find((item) => item.id === featured.categoryId)?.name || 'Tin mới')}</span><h3>${escapeHtml(featured.title)}</h3><p>${escapeHtml(featured.summary)}</p><b>Đọc bài viết ${icon('arrow')}</b></a><div>${articleList.map((article) => `<a class="yen-news-row" href="#/tin-tuc/${escapeHtml(article.slug)}"><div><small>${escapeHtml(content.categories.find((item) => item.id === article.categoryId)?.name || 'Tin mới')}</small><strong>${escapeHtml(article.title)}</strong><p>${escapeHtml(article.summary)}</p></div>${icon('arrow')}</a>`).join('')}</div></div></section>` : ''}
      ${content.events.length ? `<section class="yen-section yen-events"><div class="container"><div class="yen-section-head"><div><p class="eyebrow">Sự kiện sắp tới</p><h2>Trải nghiệm trước khi chọn lộ trình</h2></div><a class="text-link" href="#/su-kien">Xem sự kiện ${icon('arrow')}</a></div><div class="yen-event-grid">${content.events.slice(0, 3).map((event) => `<article><time><b>${new Date(event.startsAt).getDate()}</b><span>Tháng ${new Date(event.startsAt).getMonth() + 1}</span></time><div><p>${escapeHtml(event.location)}</p><h3>${escapeHtml(event.title)}</h3><span>${formatDate(event.startsAt, true)}</span><small>${escapeHtml(event.summary)}</small></div>${link('Đăng ký', event.registrationHref || '/lien-he')}</article>`).join('')}</div></div></section>` : ''}
      <section class="yen-final-cta"><div class="container"><div><p class="eyebrow">Sẵn sàng bắt đầu?</p><h2>Để Cô Yến cùng bạn chọn lộ trình phù hợp</h2><p>Đăng ký tư vấn để kiểm tra đầu vào, chọn lớp và nhận lịch học còn chỗ.</p></div><div>${link('Đăng ký tư vấn', '/lien-he', { kind: 'primary' })}${link('Xem chương trình', '/chuong-trinh')}</div></div></section>
    </main>`;
  }

  function catalog(ctx) {
    return `<main id="main-content" class="public-main"><section class="catalog-hero"><div class="container"><p class="eyebrow on-dark">Khám phá</p><h1>Chọn lộ trình phù hợp với mục tiêu</h1><p>Tìm theo độ tuổi, trình độ và hình thức học. Mọi khóa đều có chuẩn đầu ra và bằng chứng tiến bộ.</p>
      <label class="search-box">${icon('search')}<input type="search" placeholder="Tìm chương trình, kỹ năng hoặc trình độ" aria-label="Tìm chương trình"></label></div></section>
      <section class="public-section container"><div class="filter-row"><button class="chip active">Tất cả</button><button class="chip">Thiếu nhi</button><button class="chip">Thiếu niên</button><button class="chip">Người lớn</button><button class="chip">IELTS</button></div>${programCards(ctx.state, ctx.actor)}</section></main>`;
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
        <aside class="sticky-enroll"><p class="eyebrow">Bước tiếp theo</p><h3>Chưa chắc mình ở cấp độ nào?</h3><p>Kiểm tra đầu vào đa kỹ năng giúp trung tâm xếp đúng lớp và lịch phù hợp.</p>${link('Đặt lịch miễn phí', '/lien-he', { kind: 'primary' })}${programInterestAction(program, ctx.actor)}<small>Không cần thanh toán ở bước này.</small></aside></section></main>`;
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
      <label>${isSupport ? 'Nội dung cần hỗ trợ' : 'Nhu cầu'}<textarea name="message" rows="3" required placeholder="Mô tả ngắn nhu cầu của bạn"></textarea></label><label class="checkbox"><input type="checkbox" name="consent" required><span>Tôi đồng ý để Lớp Tiếng Anh Cô Yến xử lý thông tin nhằm liên hệ.</span></label>
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
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Tin tức</p><h1>Cập nhật từ Cô Yến</h1><p>Thông tin chương trình, khai giảng và hoạt động học tập.</p></div></section><section class="public-section container"><div class="program-grid">${ctx.state.publicContent.news.map((item) => `<article class="program-card"><div class="program-body"><p class="eyebrow">${escapeHtml(item.category)}</p><h2>${escapeHtml(item.title)}</h2><p>Nội dung minh họa được xuất bản trong cổng thông tin.</p>${badge(item.status)}</div></article>`).join('')}</div></section></main>`;
  }

  function publicEvents(ctx) {
    return `<main id="main-content" class="public-main"><section class="simple-hero"><div class="container"><p class="eyebrow">Sự kiện</p><h1>Hoạt động sắp diễn ra</h1><p>Đăng ký kiểm tra đầu vào và các buổi trải nghiệm.</p></div></section><section class="public-section container">${ctx.state.publicContent.events.map((item) => { const registered = (ctx.actor?.registeredEventIds || []).includes(item.id); const action = ctx.actor?.role === 'VISITOR' ? `<button class="btn ${registered ? 'btn-secondary' : 'btn-primary'}" type="button" data-action="register-public-event" data-event-id="${escapeHtml(item.id)}" ${registered ? 'disabled' : ''}>${registered ? 'Đã đăng ký' : 'Đăng ký'}</button>` : link(ctx.actor ? 'Nhận tư vấn' : 'Đăng nhập để đăng ký', ctx.actor ? '/lien-he' : '/login', { kind: 'primary' }); return `<article class="schedule-row"><div><p>Sự kiện</p><h3>${escapeHtml(item.title)}</h3><span>${escapeHtml(item.location)}</span></div><div><small>Thời gian</small><strong>${escapeHtml(formatDate(item.startsAt, true))}</strong></div>${action}</article>`; }).join('')}</section></main>`;
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
    return `<main id="main-content" class="login-page"><section class="login-intro"><a class="brand brand-light" href="#/"><img class="brand-logo" src="./assets/yen-logo-horizontal.png" alt="Lớp Tiếng Anh Cô Yến"></a><div><p class="eyebrow on-dark">Cổng học tập</p><h1>Chào mừng bạn quay lại.</h1><p>Đăng nhập để tiếp tục lớp học, bài tập và các tương tác được đồng bộ trên cùng hồ sơ học viên.</p></div><small>Xác thực mô phỏng · Không dùng dữ liệu thật.</small></section><section class="role-picker"><div><p class="eyebrow">Đăng nhập</p><h2>Chào mừng bạn quay lại</h2><p>Nhập email/mã học viên và mật khẩu hoặc dùng tài khoản nhanh.</p></div>
      <form class="login-form" data-form="login" novalidate><label>Email hoặc mã học viên<input class="input" name="identifier" autocomplete="username" required placeholder="Ví dụ: HS6A001"></label><label>Mật khẩu / PIN<input class="input" name="secret" type="password" autocomplete="current-password" required placeholder="Nhập mật khẩu"></label><button class="btn btn-primary" type="submit">Đăng nhập</button><a class="text-link" href="#/forgot-password">Quên mật khẩu?</a></form>
      <div class="login-divider"><span>Hoặc dùng tài khoản nhanh</span></div><div class="role-card-grid primary-accounts">${primaryAccounts.map(({ user, label, credentials }) => `<button type="button" class="role-card" data-primary-account data-action="login" data-actor-id="${escapeHtml(user.id)}"><span class="avatar">${escapeHtml(user.name.split(' ').slice(-2).map((part) => part[0]).join(''))}</span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(user.name)} · ${escapeHtml(credentials)}</small></span>${icon('arrow')}</button>`).join('')}</div><p class="auth-switch">Chưa có tài khoản? <a href="#/dang-ky">Đăng ký khách hàng</a></p></section></main>`;
  }

  function register() {
    return `<main id="main-content" class="auth-page visitor-register-page"><section class="form-card auth-card"><a class="back-link" href="#/">← Về trang chủ</a><p class="eyebrow">Tạo tài khoản</p><h1>Đăng ký khách hàng</h1><p>Lưu chương trình quan tâm, đăng ký sự kiện và theo dõi yêu cầu tư vấn trên cùng một tài khoản.</p><form data-form="register-visitor" class="stack" novalidate><label>Họ và tên<input class="input" name="name" autocomplete="name" required placeholder="Nguyễn Thu Hà"></label><label>Email<input class="input" name="email" type="email" autocomplete="email" required placeholder="email@example.com"></label><label>Số điện thoại<input class="input" name="phone" inputmode="tel" autocomplete="tel" required placeholder="0900 000 000"></label><label>Mật khẩu<input class="input" name="secret" type="password" autocomplete="new-password" minlength="6" required placeholder="Tối thiểu 6 ký tự"></label><label class="checkbox"><input type="checkbox" name="consent" required><span>Tôi đồng ý để Lớp Tiếng Anh Cô Yến lưu thông tin trong trình duyệt này.</span></label><button class="btn btn-primary" type="submit">Tạo tài khoản</button></form><p class="auth-switch">Đã có tài khoản? <a href="#/login">Đăng nhập</a></p></section></main>`;
  }

  function visitorAccount(ctx) {
    const actor = ctx.actor;
    if (!actor) return `<main id="main-content" class="auth-required"><div class="empty-icon">${icon('people')}</div><h1>Đăng nhập để xem tài khoản</h1><p>Khu vực này lưu các chương trình, sự kiện và yêu cầu tư vấn của bạn.</p>${link('Đăng nhập', '/login', { kind: 'primary' })}${link('Đăng ký', '/dang-ky')}</main>`;
    if (actor.role !== 'VISITOR') return `<main id="main-content" class="auth-required"><div class="empty-icon">${icon('shield')}</div><h1>Đây là khu vực khách hàng</h1><p>Tài khoản học viên và nhân sự sử dụng khu vực học tập riêng.</p>${link('Mở khu vực học tập', root.YC.selectors.roleHome(actor.role), { kind: 'primary' })}</main>`;
    const programs = (actor.savedProgramIds || []).map((id) => ctx.state.programs.find((item) => item.id === id)).filter(Boolean);
    const events = (actor.registeredEventIds || []).map((id) => ctx.state.publicContent.events.find((item) => item.id === id)).filter(Boolean);
    const leads = ctx.state.leads.filter((item) => item.visitorUserId === actor.id);
    const notices = ctx.state.notifications.filter((item) => item.userId === actor.id);
    const emptyText = '<p class="muted">Chưa có dữ liệu. Bạn có thể khám phá và lưu từ các trang công khai.</p>';
    return `<main id="main-content" class="public-main visitor-account"><section class="simple-hero"><div class="container account-hero"><div><p class="eyebrow">Tài khoản của tôi</p><h1>Xin chào, ${escapeHtml(actor.name)}</h1><p>Theo dõi những nội dung bạn quan tâm trước khi trở thành học viên.</p></div>${link('Khám phá chương trình', '/chuong-trinh', { kind: 'primary' })}</div></section><section class="public-section container account-grid">
      ${section('Chương trình quan tâm', programs.length ? programs.map((item) => `<article class="account-item"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.audience)} · ${escapeHtml(item.outcome)}</small></div>${link('Xem chương trình', `/chuong-trinh/${item.id}`, { small: true })}</article>`).join('') : emptyText)}
      ${section('Sự kiện đã đăng ký', events.length ? events.map((item) => `<article class="account-item"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.location)} · ${escapeHtml(formatDate(item.startsAt, true))}</small></div>${badge('CONFIRMED')}</article>`).join('') : emptyText)}
      ${section('Yêu cầu tư vấn', leads.length ? leads.map((item) => `<article class="account-item"><div><strong>${escapeHtml(item.code)}</strong><small>${escapeHtml(item.message || item.goal)}</small></div>${badge(item.status)}</article>`).join('') : emptyText)}
      ${section('Thông báo', notices.length ? notices.slice(0, 6).map((item) => `<article class="account-item"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.body)}</small></div></article>`).join('') : emptyText)}
    </section></main>`;
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
    if (path === '/dang-ky') return register();
    if (path === '/tai-khoan') return visitorAccount(ctx);
    if (path === '/forgot-password') return forgotPassword(ctx);
    if (path === '/verify-otp') return verifyOtp(ctx);
    if (path === '/select-profile') return selectProfile(ctx);
    return '';
  }

  root.YC.define('publicViews', Object.freeze({ render }));
})(globalThis);

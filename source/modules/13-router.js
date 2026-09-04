(function defineRouter(root) {
  'use strict';

  const { icon } = root.YC.ui;
  const { escapeHtml } = root.YC.utils;

  const NAV = Object.freeze({
    ADMISSIONS: [['Tổng quan', '/app/admissions/dashboard', 'grid'], ['Khách hàng tiềm năng', '/app/admissions/leads', 'people'], ['Kiểm tra đầu vào', '/app/admissions/placement', 'check'], ['Đề nghị học phí', '/app/admissions/offers', 'wallet'], ['Tái ghi danh', '/app/admissions/renewals', 'trend']],
    FINANCE: [['Tổng quan', '/app/finance/dashboard', 'grid'], ['Hóa đơn', '/app/finance/invoices', 'wallet'], ['Thanh toán', '/app/finance/payments', 'check']],
    ACADEMIC_MANAGER: [['Tổng quan', '/app/academic/dashboard', 'grid'], ['Chương trình học', '/app/academic/curriculum', 'book'], ['Giáo viên', '/app/academic/teachers', 'people'], ['Phân công', '/app/academic/assignments', 'calendar'], ['Kiểm duyệt', '/app/academic/moderation', 'shield'], ['Duyệt tiến bộ', '/app/academic/progress-reviews', 'trend']],
    STUDENT_SERVICE: [['Tổng quan', '/app/service/dashboard', 'grid'], ['Xếp lớp', '/app/service/allocation', 'people'], ['Hồ sơ hỗ trợ', '/app/service/cases', 'shield'], ['Học bù', '/app/service/make-up', 'calendar'], ['Chuyển lớp', '/app/service/transfers', 'trend'], ['Dạy thay', '/app/service/substitutions', 'people']],
    TEACHER: [['Tổng quan', '/app/teacher/dashboard', 'grid'], ['Lớp học', '/app/teacher/classes', 'people'], ['Buổi học', '/app/teacher/sessions', 'calendar'], ['Nội dung', '/app/teacher/content', 'book'], ['Học bù', '/app/teacher/remedial', 'spark'], ['Chấm bài', '/app/teacher/grading', 'check'], ['Báo cáo', '/app/teacher/reports', 'trend']],
    TA: [['Tổng quan', '/app/teacher/dashboard', 'grid'], ['Lớp học', '/app/teacher/classes', 'people'], ['Buổi học', '/app/teacher/sessions', 'calendar'], ['Nội dung', '/app/teacher/content', 'book'], ['Học bù', '/app/teacher/remedial', 'spark']],
    STUDENT: [['Học tập', '/app/student/dashboard', 'grid'], ['Khóa học', '/app/student/course', 'book'], ['Học bù', '/app/student/remedial', 'spark'], ['Kiểm tra', '/app/student/assessments', 'check'], ['Tiến bộ', '/app/student/progress', 'trend']],
    PARENT: [['Tổng quan', '/app/parent/dashboard', 'grid'], ['Chuyên cần', '/app/parent/attendance', 'calendar'], ['Tiến bộ', '/app/parent/progress', 'trend'], ['Dịch vụ', '/app/parent/services', 'people'], ['Học phí', '/app/parent/tuition', 'wallet']],
    CENTER_MANAGER: [['Tổng quan', '/app/manager/dashboard', 'grid'], ['Sức chứa', '/app/manager/capacity', 'people'], ['Chất lượng', '/app/manager/quality', 'shield'], ['Duy trì học viên', '/app/manager/retention', 'trend']],
    ADMIN: [['Tổng quan', '/app/admin/dashboard', 'grid'], ['Tài khoản', '/app/admin/access', 'people'], ['Khóa học', '/app/admin/courses', 'book'], ['Nhật ký', '/app/admin/audit-logs', 'shield'], ['Sự kiện', '/app/admin/events', 'trend'], ['Tích hợp', '/app/admin/integrations', 'grid'], ['Cấu hình', '/app/admin/settings', 'book']],
  });

  const ROLE_LABELS = Object.freeze({
    ADMISSIONS: 'Tuyển sinh', FINANCE: 'Tài chính', ACADEMIC_MANAGER: 'Quản lý học thuật', STUDENT_SERVICE: 'Dịch vụ học viên', TEACHER: 'Giáo viên', TA: 'Trợ giảng', STUDENT: 'Học viên', PARENT: 'Phụ huynh', CENTER_MANAGER: 'Quản lý trung tâm', ADMIN: 'Quản trị viên',
  });

  function normalize(path) {
    const clean = String(path || '/').split('?')[0].replace(/\/{2,}/g, '/');
    return clean.length > 1 ? clean.replace(/\/$/, '') : '/';
  }

  function render(path, ctx) {
    const clean = normalize(path);
    if (clean === '/demo-guide') return root.YC.demoGuide.render({ ...ctx, path: clean });
    const renderers = [root.YC.publicViews, root.YC.learningViews, root.YC.operationsViews, root.YC.managementViews];
    for (const renderer of renderers) {
      const html = renderer.render(clean, { ...ctx, path: clean });
      if (html) return html;
    }
    return `<main id="main-content" class="not-found"><div class="not-found-code">404</div><p class="eyebrow">Route not found</p><h1>Không tìm thấy trang</h1><p>Đường dẫn <code>${escapeHtml(clean)}</code> không thuộc bản demo. Bạn có thể quay về trang chủ hoặc mở hành trình có hướng dẫn.</p><div class="inline"><a class="btn btn-primary" href="#/">Về trang chủ</a><a class="btn btn-secondary" href="#/demo-guide">Mở Demo Guide</a></div></main>`;
  }

  function brand(light = false) {
    return `<a class="brand ${light ? 'brand-light' : ''}" href="#/"><span class="brand-mark"></span><span class="brand-copy"><strong>Yen Center</strong><small>LEARNING OPERATING SYSTEM</small></span></a>`;
  }

  function publicHeader(ctx) {
    const actorLink = ctx.actor ? root.YC.selectors.roleHome(ctx.actor.role) : '/login';
    return `<header class="public-header"><div class="container">${brand()}<nav aria-label="Điều hướng chính"><a href="#/chuong-trinh">Chương trình</a><a href="#/lich-hoc">Lịch khai giảng</a><a href="#/phu-huynh-hoc-sinh">Phụ huynh & học viên</a><a href="#/giai-phap-trung-tam">Giải pháp trung tâm</a></nav><div class="public-actions"><a class="header-search" href="#/chuong-trinh" aria-label="Tìm kiếm">${icon('search')}</a><a class="btn btn-ghost" href="#${actorLink}">${ctx.actor ? 'Workspace' : 'Đăng nhập'}</a><a class="btn btn-primary" href="#/demo-guide">Demo Guide</a></div><button class="mobile-menu" type="button" data-action="toggle-mobile-nav" aria-label="Mở menu">☰</button></div></header>`;
  }

  function publicFooter() {
    return `<footer class="public-footer"><div class="container"><div>${brand(true)}<p>Hành trình ngoại ngữ dựa trên evidence.</p><small>Frontend demonstrator · Dữ liệu và integrations đều là mock.</small></div><div><strong>Khám phá</strong><a href="#/chuong-trinh">Chương trình</a><a href="#/lich-hoc">Lịch học</a><a href="#/demo-guide">Full journey</a></div><div><strong>Cổng học tập</strong><a href="#/login">Learner</a><a href="#/login">Parent</a><a href="#/login">Staff</a></div><div><strong>Thông tin</strong><a href="#/giai-phap-trung-tam">Operating model</a><a href="#/lien-he">Liên hệ</a><span>© 2026 Yen Center Demo</span></div></div></footer>`;
  }

  function notifications(ctx) {
    if (!ctx.actor) return '';
    const count = ctx.state.notifications.filter((item) => item.userId === ctx.actor.id && !item.read).length;
    return `<button class="icon-btn notification-button" type="button" data-action="show-notifications" aria-label="Thông báo">${icon('spark')}${count ? `<b>${count}</b>` : ''}</button>`;
  }

  function appShell(content, path, ctx) {
    const actor = ctx.actor;
    if (!actor) return `<main class="auth-required">${brand()}<h1>Cần chọn vai trò demo</h1><p>Mở role picker để vào đúng workspace và scope.</p><a class="btn btn-primary" href="#/login">Chọn vai trò</a></main>`;
    const nav = NAV[actor.role] || NAV.ADMIN;
    const unread = ctx.state.notifications.filter((item) => item.userId === actor.id && !item.read).length;
    const initials = actor.name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();
    return `<div class="app-shell" data-role="${escapeHtml(actor.role)}"><aside class="app-sidebar">${brand(true)}<div class="workspace-label"><span>${escapeHtml(ROLE_LABELS[actor.role] || actor.role)}</span><small>Yen Center · Demo</small></div><nav aria-label="Workspace navigation">${nav.map(([label, href, iconName]) => `<a class="${path === href || (href.endsWith('/sessions') && path.startsWith(`${href}/`)) ? 'active' : ''}" href="#${href}">${icon(iconName)}<span>${escapeHtml(label)}</span></a>`).join('')}</nav><div class="sidebar-guide"><span>${icon('spark')}</span><p><strong>Full Journey</strong><small>Lead → Renewal</small></p><a href="#/demo-guide">Mở guide</a></div><button class="sidebar-collapse" type="button" data-action="toggle-sidebar">‹ <span>Thu gọn</span></button></aside>
      <div class="app-main"><header class="app-topbar"><button class="mobile-menu dark-menu" type="button" data-action="toggle-sidebar" aria-label="Mở thanh điều hướng">☰</button><div class="context-crumb"><span>Yen Center</span><b>/</b><strong>${escapeHtml(ROLE_LABELS[actor.role] || actor.role)}</strong></div><div class="topbar-search">${icon('search')}<input type="search" placeholder="Tìm học viên, lớp, hồ sơ…" aria-label="Tìm trong khu vực làm việc"></div><div class="topbar-actions">${notifications(ctx)}<a class="topbar-guide" href="#/demo-guide">${icon('spark')} Hướng dẫn</a><button type="button" class="user-menu" data-action="open-role-switcher"><span class="avatar">${escapeHtml(initials)}</span><span><strong>${escapeHtml(actor.name)}</strong><small>${escapeHtml(ROLE_LABELS[actor.role] || actor.role)}</small></span><span>⌄</span></button></div></header><main id="main-content" class="app-content">${content}</main></div>
      <div class="role-switcher" data-role-switcher hidden><div class="role-switcher-backdrop" data-action="close-role-switcher"></div><section><div class="panel-heading"><div><h2>Chuyển tài khoản</h2><p>Truy cập nhanh bốn tài khoản chính của bản demo.</p></div><button class="icon-btn" data-action="close-role-switcher">×</button></div>${ctx.state.users.filter((user) => ['teacher-1', 'ta-1', 'student-login-1', 'admin-1'].includes(user.id)).map((user) => `<button type="button" class="role-option ${user.id === actor.id ? 'active' : ''}" data-action="login" data-actor-id="${escapeHtml(user.id)}"><span class="avatar">${escapeHtml(user.name.split(' ').slice(-2).map((part) => part[0]).join(''))}</span><span><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(ROLE_LABELS[user.role] || user.role)}</small></span>${user.id === actor.id ? '✓' : icon('arrow')}</button>`).join('')}<a class="text-link" href="#/login">Về trang đăng nhập</a><button type="button" class="text-link logout-link" data-action="logout">Đăng xuất</button></section></div>
      <div class="notification-drawer" data-notification-drawer hidden><div class="role-switcher-backdrop" data-action="close-notifications"></div><section><div class="panel-heading"><div><h2>Thông báo</h2><p>${unread} chưa đọc</p></div><button class="icon-btn" data-action="close-notifications">×</button></div>${ctx.state.notifications.filter((item) => item.userId === actor.id).slice(0, 8).map((item) => `<a href="#${escapeHtml(item.link || path)}" class="notification-item ${item.read ? '' : 'unread'}"><span>${icon('spark')}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${escapeHtml(item.createdAt)}</small></div></a>`).join('') || '<p class="muted">Chưa có thông báo.</p>'}</section></div></div>`;
  }

  function allowedWorkspaceRoles(path) {
    const rules = [
      ['/app/admissions/', ['ADMISSIONS']], ['/app/finance/', ['FINANCE']], ['/app/academic/', ['ACADEMIC_MANAGER']],
      ['/app/service/', ['STUDENT_SERVICE']], ['/app/teacher/', ['TEACHER', 'TA']], ['/app/student/', ['STUDENT']],
      ['/app/parent/', ['PARENT']], ['/app/manager/', ['CENTER_MANAGER']], ['/app/admin/', ['ADMIN']],
    ];
    return rules.find(([prefix]) => path.startsWith(prefix))?.[1] || [];
  }

  function accessDenied(path, actor) {
    const expected = allowedWorkspaceRoles(path).map((role) => ROLE_LABELS[role] || role).join(' / ');
    return `<section class="auth-required"><div class="empty-icon">${icon('shield')}</div><p class="eyebrow">Scope guard</p><h1>Không có quyền vào workspace này</h1><p>Bạn đang ở vai trò <strong>${escapeHtml(ROLE_LABELS[actor.role] || actor.role)}</strong>; trang này thuộc <strong>${escapeHtml(expected)}</strong>.</p><a class="btn btn-primary" href="#/login">Chọn vai trò phù hợp</a></section>`;
  }

  function frame(path, ctx) {
    const clean = normalize(path);
    if (clean.startsWith('/app/')) {
      if (!ctx.actor) return appShell('', clean, ctx);
      const allowed = allowedWorkspaceRoles(clean);
      if (allowed.length && !allowed.includes(ctx.actor.role)) return appShell(accessDenied(clean, ctx.actor), clean, ctx);
      return appShell(render(clean, ctx), clean, ctx);
    }
    const content = render(clean, ctx);
    if (clean === '/login') return content;
    return `<div class="public-page">${publicHeader(ctx)}${content}${publicFooter()}</div>`;
  }

  root.YC.define('router', Object.freeze({ NAV, ROLE_LABELS, frame, normalize, render }));
})(globalThis);

(function defineCmsViews(root) {
  'use strict';

  const { badge, button, icon, link, metric, pageHeader, section, table } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  const TYPES = Object.freeze([
    { key: 'heroBanners', label: 'Banner trang chủ', singular: 'banner', icon: 'spark' },
    { key: 'publicProgramProfiles', label: 'Chương trình', singular: 'chương trình', icon: 'book' },
    { key: 'publicBranchProfiles', label: 'Cơ sở', singular: 'cơ sở', icon: 'grid' },
    { key: 'publicTeacherProfiles', label: 'Giáo viên công khai', singular: 'hồ sơ giáo viên', icon: 'people' },
    { key: 'articles', label: 'Tin tức', singular: 'bài viết', icon: 'book' },
    { key: 'publicEvents', label: 'Sự kiện', singular: 'sự kiện', icon: 'calendar' },
    { key: 'staticPages', label: 'Trang nội dung', singular: 'trang', icon: 'book' },
    { key: 'navigationGroups', label: 'Nhóm menu', singular: 'nhóm menu', icon: 'grid' },
    { key: 'navigationItems', label: 'Mục menu', singular: 'mục menu', icon: 'grid' },
    { key: 'contactChannels', label: 'Kênh liên hệ', singular: 'kênh liên hệ', icon: 'people' },
    { key: 'articleCategories', label: 'Danh mục bài viết', singular: 'danh mục', icon: 'grid' },
  ]);

  function typeOf(key) { return TYPES.find((item) => item.key === key) || null; }
  function can(ctx, permissionId) { return root.YC.policy.can(ctx.actor, permissionId, { organizationId: ctx.state.settings.organizationId }, ctx.state); }
  function labelOf(item, fallback) { return item.title || item.name || item.label || item.eyebrow || fallback; }
  function hrefFor(collection, item) {
    if (collection === 'articles') return `/tin-tuc/${item.slug || item.id}`;
    if (collection === 'publicEvents') return `/su-kien/${item.slug || item.id}`;
    if (collection === 'publicProgramProfiles') return `/chuong-trinh/${item.slug || item.id}`;
    if (collection === 'publicBranchProfiles') return `/co-so/${item.slug || item.id}`;
    if (collection === 'staticPages') return `/${item.slug || ''}`;
    return '/';
  }

  function lifecycleActions(ctx, collection, item) {
    const payload = { collection, contentId: item.id };
    const actions = [];
    if (['DRAFT', 'SUBMITTED'].includes(item.status) && can(ctx, 'site.publish')) actions.push(button(item.effectiveFrom && item.effectiveFrom > ctx.state.currentAt ? 'Duyệt & lên lịch' : 'Xuất bản', 'publish-site-content', { small: true, payload }));
    if (item.status === 'DRAFT' && can(ctx, 'site.submit') && !can(ctx, 'site.publish')) actions.push(button('Gửi Admin duyệt', 'submit-site-content', { small: true, payload: { ...payload, reason: 'Đã hoàn tất nội dung và gửi Admin duyệt.' } }));
    if (item.status === 'PUBLISHED' && can(ctx, 'site.archive')) actions.push(button('Lưu trữ', 'archive-site-content', { kind: 'secondary', small: true, payload: { ...payload, reason: 'Lưu trữ từ khu vực quản trị website.' } }));
    if (['PUBLISHED', 'ARCHIVED'].includes(item.status) && can(ctx, 'site.edit')) actions.push(button('Tạo bản chỉnh sửa', 'clone-site-content', { kind: 'secondary', small: true, payload: { collection, sourceContentId: item.id } }));
    if (item.status === 'PUBLISHED') actions.push(`<a class="text-link" href="#${escapeHtml(hrefFor(collection, item))}" target="_self">Xem trên website ${icon('arrow')}</a>`);
    return `<div class="cms-row-actions">${actions.join('')}</div>`;
  }

  function overview(ctx) {
    const records = TYPES.flatMap((type) => (ctx.state[type.key] || []).map((item) => ({ ...item, collection: type.key, typeLabel: type.label })));
    const pending = records.filter((item) => item.status === 'SUBMITTED');
    const drafts = records.filter((item) => item.status === 'DRAFT');
    const published = records.filter((item) => item.status === 'PUBLISHED');
    return `<div class="workspace-page cms-page">${pageHeader('Quản trị website', 'Nội dung công khai', 'Quản lý bản nháp, duyệt, hẹn giờ xuất bản và lịch sử phiên bản trên cùng dữ liệu.', link('Cấu hình website', '/app/admin/site-settings', { kind: 'primary' }))}
      <div class="metric-grid four">${metric('Đã công bố', published.length, 'Đang hoặc sắp có hiệu lực', 'check')}${metric('Bản nháp', drafts.length, 'Chưa xuất hiện công khai', 'book')}${metric('Chờ duyệt', pending.length, 'Cần Admin quyết định', 'shield')}${metric('Nhóm nội dung', TYPES.length, 'Mỗi nhóm có lịch sử riêng', 'grid')}</div>
      <div class="cms-type-grid">${TYPES.map((type) => { const items = ctx.state[type.key] || []; return `<a class="cms-type-card" href="#/app/admin/site-content/${escapeHtml(type.key)}"><span>${icon(type.icon)}</span><div><strong>${escapeHtml(type.label)}</strong><small>${items.filter((item) => item.status === 'PUBLISHED').length} công bố · ${items.filter((item) => item.status === 'DRAFT').length} nháp</small></div>${icon('arrow')}</a>`; }).join('')}</div>
      ${section('Cần xử lý', table([
        { label: 'Nội dung', render: (row) => `<strong>${escapeHtml(labelOf(row, row.typeLabel))}</strong><small>${escapeHtml(row.typeLabel)} · phiên bản ${row.revision || 1}</small>` },
        { label: 'Trạng thái', render: (row) => badge(row.status) },
        { label: 'Hiệu lực', render: (row) => formatDate(row.effectiveFrom, true) },
        { label: 'Thao tác', render: (row) => lifecycleActions(ctx, row.collection, row) },
      ], [...pending, ...drafts], { emptyTitle: 'Không có nội dung chờ xử lý', emptyBody: 'Mọi nội dung đã được duyệt hoặc lưu trữ.' }))}</div>`;
  }

  function draftForm(ctx, type) {
    if (!can(ctx, 'site.edit')) return '<p class="muted">Tài khoản chưa được cấp quyền sửa nội dung website.</p>';
    return `<form class="cms-editor-form" data-form="site-content-draft">
      <input type="hidden" name="collection" value="${escapeHtml(type.key)}">
      <label>Tiêu đề / tên hiển thị<input class="input" name="title" required placeholder="Nhập tên ${escapeHtml(type.singular)}"></label>
      <label>Đường dẫn ngắn<input class="input" name="slug" placeholder="duong-dan-khong-dau"></label>
      <label class="span-two">Mô tả ngắn<textarea class="input" name="summary" rows="2" placeholder="Nội dung xuất hiện trên thẻ giới thiệu"></textarea></label>
      <label class="span-two">Nội dung chi tiết<textarea class="input" name="body" rows="4" placeholder="Nội dung tiếng Việt đã được biên tập"></textarea></label>
      <label>Bắt đầu hiệu lực<input class="input" name="effectiveFrom" type="datetime-local"></label>
      <label>Kết thúc hiệu lực<input class="input" name="effectiveTo" type="datetime-local"></label>
      <button class="btn btn-primary" type="submit">Lưu bản nháp</button>
    </form>`;
  }

  function contentList(ctx, collection) {
    const type = typeOf(collection);
    if (!type) return '';
    const rows = (ctx.state[collection] || []).slice().sort((a, b) => Number(b.revision || 0) - Number(a.revision || 0));
    return `<div class="workspace-page cms-page">${pageHeader('Quản trị website', type.label, `Tạo và quản lý từng phiên bản ${type.singular}; chỉ bản đã công bố trong thời hạn hiệu lực mới xuất hiện ngoài website.`, link('Về tổng quan', '/app/admin/site-content'))}
      <div class="content-grid main-aside">${section('Phiên bản nội dung', table([
        { label: 'Nội dung', render: (row) => `<strong>${escapeHtml(labelOf(row, type.label))}</strong><small>${escapeHtml(row.contentKey || row.id)}</small>` },
        { label: 'Phiên bản', render: (row) => `<strong>v${row.revision || 1}</strong><small>${row.sourceRevisionId ? `Từ ${escapeHtml(row.sourceRevisionId)}` : 'Bản gốc'}</small>` },
        { label: 'Hiệu lực', render: (row) => `<span>${formatDate(row.effectiveFrom, true)}</span><small>${row.effectiveTo ? `đến ${formatDate(row.effectiveTo, true)}` : 'Không giới hạn'}</small>` },
        { label: 'Trạng thái', render: (row) => badge(row.status) },
        { label: 'Thao tác', render: (row) => lifecycleActions(ctx, collection, row) },
      ], rows))}${section(`Tạo ${type.singular}`, draftForm(ctx, type), { subtitle: 'Bản mới luôn bắt đầu ở trạng thái Bản nháp.' })}</div></div>`;
  }

  function settings(ctx) {
    const settings = ctx.state.siteSettings[0];
    const contacts = ctx.state.contactChannels || [];
    const editable = can(ctx, 'site.configure_contact');
    return `<div class="workspace-page cms-page">${pageHeader('Quản trị website', 'Cấu hình thương hiệu & liên hệ', 'Tên trung tâm, thông điệp và kênh liên hệ được dùng thống nhất trên website.', link('Quản lý nội dung', '/app/admin/site-content'))}
      <div class="content-grid main-aside">${section('Nhận diện website', `<form class="cms-editor-form" data-form="site-settings">
        <label>Tên trung tâm<input class="input" name="centerName" required value="${escapeHtml(settings.centerName)}" ${editable ? '' : 'disabled'}></label>
        <label>Tên rút gọn<input class="input" name="shortName" value="${escapeHtml(settings.shortName)}" ${editable ? '' : 'disabled'}></label>
        <label class="span-two">Thông điệp chính<input class="input" name="tagline" value="${escapeHtml(settings.tagline)}" ${editable ? '' : 'disabled'}></label>
        <label class="span-two">Mô tả<textarea class="input" name="description" rows="3" ${editable ? '' : 'disabled'}>${escapeHtml(settings.description)}</textarea></label>
        <label>Màu chính<input class="input" name="primaryColor" type="color" value="${escapeHtml(settings.primaryColor)}" ${editable ? '' : 'disabled'}></label>
        <label>Màu nhấn<input class="input" name="accentColor" type="color" value="${escapeHtml(settings.accentColor)}" ${editable ? '' : 'disabled'}></label>
        ${editable ? '<button class="btn btn-primary" type="submit">Lưu cấu hình</button>' : ''}
      </form>`)}${section('Kênh liên hệ công khai', contacts.map((item) => `<article class="contact-config-row"><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.value || 'Đang để trống')}</small></div>${badge(item.status)}</article>`).join(''), { subtitle: 'Kênh rỗng hoặc chưa công bố sẽ tự ẩn khỏi website.' })}</div></div>`;
  }

  function render(path, ctx) {
    if (path === '/app/admin/site-content') return overview(ctx);
    if (path === '/app/admin/site-settings') return settings(ctx);
    const match = /^\/app\/admin\/site-content\/([^/]+)$/.exec(path);
    return match ? contentList(ctx, decodeURIComponent(match[1])) : '';
  }

  root.YC.define('cmsViews', Object.freeze({ TYPES, render }));
})(globalThis);

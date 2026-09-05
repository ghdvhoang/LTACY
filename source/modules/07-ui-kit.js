(function defineUiKit(root) {
  'use strict';

  const { escapeHtml, formatDate } = root.YC.utils;

  const STATUS_LABELS = Object.freeze({
    NEW: 'Mới', CONTACTED: 'Đã liên hệ', PLACEMENT_BOOKED: 'Đã đặt kiểm tra đầu vào', PLACED: 'Đã kiểm tra đầu vào',
    OFFERED: 'Đã gửi đề nghị', SENT: 'Đã gửi', ACCEPTED: 'Đã chấp nhận', ISSUED: 'Đã phát hành', PAID: 'Đã thanh toán', WON: 'Đã chốt',
    OPEN: 'Đang mở', ACTIVE: 'Đang hoạt động', PROPOSED: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', DRAFT: 'Bản nháp',
    READY: 'Sẵn sàng', IN_PROGRESS: 'Đang diễn ra', COMPLETED: 'Hoàn thành', NOT_PASSED: 'Cần học lại', ASSIGNED: 'Đã giao',
    SUBMITTED: 'Đã nộp', RESUBMITTED: 'Đã nộp lại', FEEDBACK_READY: 'Chờ phát hành', RELEASED: 'Đã phát hành',
    REVISION_REQUIRED: 'Cần chỉnh sửa', APPROVED: 'Đã duyệt', MODERATION: 'Đang kiểm duyệt', PUBLISHED: 'Đã công bố',
    FINAL: 'Đã chốt', MOCKED: 'Mô phỏng', FULL: 'Hết chỗ', PRESENT: 'Có mặt', ABSENT: 'Vắng', LATE: 'Đi muộn',
    REQUESTED: 'Đã yêu cầu', HANDOVER_READY: 'Đã bàn giao', CLOSED: 'Đã đóng', VALID: 'Còn hiệu lực',
    REJECTED: 'Không đủ điều kiện', OVERDUE: 'Quá hạn', REVOKED: 'Đã thu hồi', EXPIRED: 'Hết hạn', LOST: 'Không phù hợp',
  });

  const VALUE_LABELS = Object.freeze({
    OFFLINE: 'Trực tiếp', ONLINE: 'Trực tuyến', HYBRID: 'Kết hợp', VIDEO: 'Video', ARTICLE: 'Bài đọc', PRACTICE: 'Luyện tập', QUIZ: 'Bài kiểm tra', LIVE_ACTIVITY: 'Hoạt động trên lớp', LESSON: 'Bài học',
    NO_SEAT: 'Hết chỗ', SCHEDULE_CHANGE: 'Đổi lịch', TRANSFER: 'Chuyển lớp', SUBSTITUTION: 'Dạy thay', B2C: 'Cá nhân', B2B: 'Tổ chức', SUPPORT: 'Hỗ trợ',
    LISTENING: 'Nghe', READING: 'Đọc', WRITING: 'Viết', LANGUAGE: 'Ngôn ngữ', SPOKEN_INTERACTION: 'Tương tác nói', SPOKEN_PRODUCTION: 'Trình bày nói',
    QUALIFICATION_CURRENT: 'Bằng cấp còn hạn', LEVEL_SCOPE: 'Đúng cấp độ', AGE_SCOPE: 'Đúng nhóm tuổi', MODE_SCOPE: 'Đúng hình thức', BRANCH_SCOPE: 'Đúng cơ sở', WORKLOAD_CAP: 'Trong giới hạn giờ dạy',
  });

  function valueLabel(value) {
    const key = String(value || '').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
    return VALUE_LABELS[key] || value || '—';
  }

  function money(value, currency = 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function tone(status) {
    if (['ACTIVE', 'ACCEPTED', 'PAID', 'WON', 'READY', 'COMPLETED', 'RELEASED', 'APPROVED', 'PUBLISHED', 'FINAL', 'PRESENT', 'VALID'].includes(status)) return 'success';
    if (['ABSENT', 'FULL', 'NOT_PASSED', 'REJECTED', 'OVERDUE'].includes(status)) return 'danger';
    if (['DRAFT', 'PROPOSED', 'SUBMITTED', 'FEEDBACK_READY', 'MODERATION', 'REQUESTED', 'PLACEMENT_BOOKED'].includes(status)) return 'warning';
    return 'info';
  }

  function badge(status, label) {
    return `<span class="status status-${tone(status)}"><span aria-hidden="true"></span>${escapeHtml(label || STATUS_LABELS[status] || status || '—')}</span>`;
  }

  function icon(name) {
    const paths = {
      arrow: '<path d="m9 18 6-6-6-6"/>',
      book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
      calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      check: '<path d="m20 6-11 11-5-5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
      spark: '<path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7L12 3Z"/><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8L5 16Z"/>',
      trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
      wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 13h2"/>',
    };
    return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
  }

  function button(label, action, options = {}) {
    const classes = `btn ${options.kind === 'secondary' ? 'btn-secondary' : options.kind === 'ghost' ? 'btn-ghost' : 'btn-primary'}${options.small ? ' btn-sm' : ''}`;
    const payload = options.payload ? ` data-payload="${escapeHtml(encodeURIComponent(JSON.stringify(options.payload)))}"` : '';
    const disabled = options.disabled ? ' disabled aria-disabled="true"' : '';
    return `<button class="${classes}" type="button" data-action="${escapeHtml(action)}"${payload}${disabled}>${options.icon ? icon(options.icon) : ''}${escapeHtml(label)}</button>`;
  }

  function link(label, href, options = {}) {
    return `<a class="btn ${options.kind === 'primary' ? 'btn-primary' : options.kind === 'ghost' ? 'btn-ghost' : 'btn-secondary'}${options.small ? ' btn-sm' : ''}" href="#${escapeHtml(href)}">${options.icon ? icon(options.icon) : ''}${escapeHtml(label)}</a>`;
  }

  function metric(label, value, note, iconName = 'trend', accent = '') {
    return `<article class="metric-card ${accent}"><div class="metric-icon">${icon(iconName)}</div><div><p>${escapeHtml(label)}</p><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(note || '')}</small></div></article>`;
  }

  function progress(value, label = '') {
    const normalized = Math.max(0, Math.min(100, Number(value || 0)));
    return `<div class="progress-block"><div class="progress-meta"><span>${escapeHtml(label)}</span><strong>${normalized}%</strong></div><div class="progress-track"><span style="width:${normalized}%"></span></div></div>`;
  }

  function empty(title, body, actionHtml = '') {
    return `<div class="empty-state"><div class="empty-icon">${icon('spark')}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p>${actionHtml}</div>`;
  }

  function table(columns, rows, options = {}) {
    if (!rows.length) return empty(options.emptyTitle || 'Chưa có dữ liệu', options.emptyBody || 'Bằng chứng sẽ xuất hiện sau khi luồng được thực hiện.');
    return `<div class="table-wrap"><table><thead><tr>${columns.map((item) => `<th>${escapeHtml(item.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${typeof column.render === 'function' ? column.render(row) : escapeHtml(row[column.key] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function pageHeader(eyebrow, title, description, actions = '') {
    return `<header class="page-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
  }

  function section(title, body, options = {}) {
    return `<section class="panel ${options.className || ''}"><div class="panel-heading"><div><h2>${escapeHtml(title)}</h2>${options.subtitle ? `<p>${escapeHtml(options.subtitle)}</p>` : ''}</div>${options.action || ''}</div>${body}</section>`;
  }

  function person(user, subtitle = '') {
    const initials = (user?.name || '?').split(' ').slice(-2).map((word) => word[0]).join('').toUpperCase();
    return `<div class="person"><span class="avatar">${escapeHtml(initials)}</span><span><strong>${escapeHtml(user?.name || 'Chưa gán')}</strong><small>${escapeHtml(subtitle)}</small></span></div>`;
  }

  function fact(iconName, label, value) {
    return `<div class="fact">${icon(iconName)}<span><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></span></div>`;
  }

  root.YC.define('ui', Object.freeze({ badge, button, empty, fact, formatDate, icon, link, metric, money, pageHeader, person, progress, section, table, valueLabel }));
})(globalThis);

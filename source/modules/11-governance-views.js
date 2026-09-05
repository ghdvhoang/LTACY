(function defineGovernanceViews(root) {
  'use strict';

  const { badge, empty, icon, metric, pageHeader, person, section, table } = root.YC.ui;
  const { escapeHtml, formatDate } = root.YC.utils;

  const DOMAIN_LABELS = Object.freeze({
    ACCESS: 'Truy cập', APPROVAL: 'Phê duyệt', COURSE: 'Khóa học', CONTENT: 'Nội dung học', CLASS: 'Lớp học',
    SESSION: 'Buổi học', ATTENDANCE: 'Điểm danh', REMEDIAL: 'Học bù', SITE: 'Website', REPORT: 'Báo cáo', AUDIT: 'Kiểm toán',
    ADMISSIONS: 'Tuyển sinh', SERVICE: 'Dịch vụ học viên', FINANCE: 'Tài chính', LEARNING: 'Học tập',
  });
  const RESOURCE_LABELS = Object.freeze({ COURSE: 'Khóa học', COURSE_VERSION: 'Phiên bản khóa học', CLASS: 'Lớp học', SESSION: 'Buổi học', SITE_CONTENT: 'Nội dung website', REMEDIAL_EXCEPTION: 'Ngoại lệ học bù' });
  const OPERATION_LABELS = Object.freeze({ CREATE: 'Tạo mới', UPDATE: 'Cập nhật', ARCHIVE: 'Lưu trữ', CANCEL: 'Hủy', RESCHEDULE: 'Đổi lịch', PUBLISH: 'Xuất bản' });

  function roleLabel(role) {
    return root.YC.router.ROLE_LABELS[role] || role.replaceAll('_', ' ');
  }

  function currentRoleGrant(state, role, permissionId) {
    const moment = new Date(state.currentAt || state.seededAt).getTime();
    return state.rolePermissions.filter((item) => item.role === role
      && item.permissionId === permissionId
      && item.status !== 'REPLACED'
      && item.status !== 'REVOKED'
      && (!item.effectiveFrom || new Date(item.effectiveFrom).getTime() <= moment)
      && (!item.effectiveTo || new Date(item.effectiveTo).getTime() > moment)).at(-1) || null;
  }

  function scopeOptions(selected = 'ORGANIZATION') {
    const choices = [
      ['ORGANIZATION', 'Toàn trung tâm'], ['BRANCH', 'Theo chi nhánh'], ['CLASS', 'Theo lớp'], ['SESSION', 'Theo buổi học'],
      ['ASSIGNED_CLASS', 'Lớp được phân công'], ['OWN_LEARNER', 'Hồ sơ học viên của mình'], ['LINKED_LEARNER', 'Học viên được liên kết'],
    ];
    return choices.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
  }

  function permissionOptions(state, selected = '') {
    return state.permissionDefinitions.map((item) => `<option value="${escapeHtml(item.id)}" ${selected === item.id ? 'selected' : ''}>${escapeHtml(item.label)} · ${escapeHtml(item.id)}</option>`).join('');
  }

  function roleOptions(state, selected = '') {
    const roles = [...new Set(state.users.map((item) => item.role).filter((role) => !['PUBLIC', 'VISITOR'].includes(role)))];
    return roles.map((role) => `<option value="${escapeHtml(role)}" ${selected === role ? 'selected' : ''}>${escapeHtml(roleLabel(role))}</option>`).join('');
  }

  function branchHint(state) {
    return state.branches.map((branch) => `<span>Chi nhánh ${escapeHtml(branch.name.replace(/^Cơ sở\s+/, ''))}: <code>${escapeHtml(branch.id)}</code></span>`).join('');
  }

  function permissionForm(state, values = {}) {
    return `<form class="governance-form" data-form="role-permissions">
      <label>Vai trò<select class="input" name="role" required>${roleOptions(state, values.role)}</select></label>
      <label>Quyền<select class="input" name="permissionId" required>${permissionOptions(state, values.permissionId)}</select></label>
      <label>Quyết định<select class="input" name="effect"><option value="ALLOW" ${values.effect !== 'DENY' ? 'selected' : ''}>Cho phép</option><option value="DENY" ${values.effect === 'DENY' ? 'selected' : ''}>Từ chối</option></select></label>
      <label>Phạm vi<select class="input" name="scopeType">${scopeOptions(values.scopeType)}</select></label>
      <label class="span-two">Mã phạm vi <input class="input" name="scopeIds" value="${escapeHtml((values.scopeIds || []).join(', '))}" placeholder="branch-q3, class-6a"></label>
      <label class="span-two">Lý do <textarea class="input" name="reason" rows="2" required placeholder="Nêu rõ nhu cầu và thời hạn áp dụng"></textarea></label>
      <button class="btn btn-primary" type="submit">Lưu quyền vai trò</button>
    </form>`;
  }

  function roles(ctx) {
    const roleNames = [...new Set(ctx.state.users.map((item) => item.role).filter((role) => !['PUBLIC', 'VISITOR'].includes(role)))];
    const rows = roleNames.map((role) => {
      const active = ctx.state.permissionDefinitions.filter((permission) => currentRoleGrant(ctx.state, role, permission.id)?.effect === 'ALLOW').length;
      return { role, active, users: ctx.state.users.filter((item) => item.role === role && item.status === 'ACTIVE').length };
    });
    return `<div class="workspace-page governance-page">${pageHeader('Quản trị · Phân quyền', 'Ma trận quyền', 'Cấu hình quyền theo vai trò, ngoại lệ theo tài khoản, phạm vi và thời hạn hiệu lực.')}
      <div class="metric-grid three">${metric('Vai trò', rows.length, 'Không tính khách công khai', 'people')}${metric('Quyền hệ thống', ctx.state.permissionDefinitions.length, 'Nhóm theo nghiệp vụ', 'shield')}${metric('Ngoại lệ tài khoản', ctx.state.userPermissionOverrides.filter((item) => item.status === 'ACTIVE').length, 'Có lịch sử hiệu lực', 'trend')}</div>
      <div class="content-grid main-aside">${section('Quyền theo vai trò', table([
        { label: 'Vai trò', render: (row) => `<strong>${escapeHtml(roleLabel(row.role))}</strong><small>${escapeHtml(row.role)}</small>` },
        { label: 'Tài khoản', key: 'users' },
        { label: 'Quyền cho phép', render: (row) => `${row.active}/${ctx.state.permissionDefinitions.length}` },
        { label: 'Chi tiết', render: (row) => `<a class="text-link" href="#/app/admin/roles/${escapeHtml(row.role)}/permissions">Mở ma trận ${icon('arrow')}</a>` },
      ], rows))}${section('Cập nhật nhanh', `${permissionForm(ctx.state)}<div class="scope-hints">${branchHint(ctx.state)}</div>`, { subtitle: 'Bản ghi cũ được đóng hiệu lực; không xóa lịch sử.' })}</div></div>`;
  }

  function rolePermissions(ctx, role) {
    const grouped = Object.groupBy
      ? Object.groupBy(ctx.state.permissionDefinitions, (item) => item.domain)
      : ctx.state.permissionDefinitions.reduce((result, item) => { (result[item.domain] ||= []).push(item); return result; }, {});
    return `<div class="workspace-page governance-page">${pageHeader('Quản trị · Phân quyền', `Quyền của ${roleLabel(role)}`, 'Mỗi quyền có quyết định, phạm vi và bằng chứng thay đổi độc lập.', `<a class="btn btn-secondary" href="#/app/admin/roles">Về ma trận quyền</a>`)}
      ${Object.entries(grouped).map(([domain, permissions]) => section(DOMAIN_LABELS[domain] || domain, `<div class="permission-matrix">${permissions.map((permission) => {
        const grant = currentRoleGrant(ctx.state, role, permission.id);
        return `<article class="permission-row"><div><strong>${escapeHtml(permission.label)}</strong><code>${escapeHtml(permission.id)}</code><small>Rủi ro ${escapeHtml(permission.riskLevel)}</small></div><div>${grant ? badge(grant.effect === 'ALLOW' ? 'ACTIVE' : 'REJECTED', grant.effect === 'ALLOW' ? 'Cho phép' : 'Từ chối') : badge('DRAFT', 'Chưa cấp')}<small>${escapeHtml(grant?.scopeType || 'Mặc định từ chối')}</small></div><details><summary>Chỉnh quyền</summary>${permissionForm(ctx.state, { role, permissionId: permission.id, effect: grant?.effect, scopeType: grant?.scopeType, scopeIds: grant?.scopeIds })}</details></article>`;
      }).join('')}</div>`)).join('')}</div>`;
  }

  function userAccess(ctx, userId) {
    const user = ctx.state.users.find((item) => item.id === userId);
    if (!user) return '';
    const overrides = ctx.state.userPermissionOverrides.filter((item) => item.userId === user.id).slice().reverse();
    return `<div class="workspace-page governance-page">${pageHeader('Quản trị · Tài khoản', `Ngoại lệ quyền của ${user.name}`, 'Ngoại lệ Từ chối luôn ưu tiên hơn Cho phép; quyền hết hạn được giữ lại để truy vết.', `<a class="btn btn-secondary" href="#/app/admin/users">Về tài khoản</a>`)}
      <div class="content-grid main-aside">${section('Lịch sử ngoại lệ', table([
        { label: 'Quyền', render: (row) => `<strong>${escapeHtml(row.permissionId)}</strong><small>${escapeHtml(row.reason || '')}</small>` },
        { label: 'Hiệu lực', render: (row) => badge(row.effect === 'ALLOW' ? 'ACTIVE' : 'REJECTED', row.effect === 'ALLOW' ? 'Cho phép' : 'Từ chối') },
        { label: 'Phạm vi', render: (row) => `${escapeHtml(row.scopeType)}<small>${escapeHtml((row.scopeIds || []).join(', ') || 'Toàn bộ')}</small>` },
        { label: 'Trạng thái', render: (row) => `${badge(row.status || 'ACTIVE')} ${row.status === 'ACTIVE' ? `<button class="text-link danger-link" data-action="revoke-user-permission" data-payload="${escapeHtml(encodeURIComponent(JSON.stringify({ overrideId: row.id, reason: 'Thu hồi từ màn quản trị tài khoản' })))}">Thu hồi</button>` : ''}` },
      ], overrides, { emptyTitle: 'Chưa có ngoại lệ', emptyBody: 'Tài khoản đang dùng toàn bộ quyền từ vai trò.' }))}
      ${section('Thêm ngoại lệ', `<form class="governance-form" data-form="user-permissions"><input type="hidden" name="userId" value="${escapeHtml(user.id)}"><label class="span-two">Quyền<select class="input" name="permissionId" required>${permissionOptions(ctx.state)}</select></label><label>Quyết định<select class="input" name="effect"><option value="ALLOW">Cho phép</option><option value="DENY">Từ chối</option></select></label><label>Phạm vi<select class="input" name="scopeType">${scopeOptions()}</select></label><label class="span-two">Mã phạm vi<input class="input" name="scopeIds" placeholder="branch-q3, class-6a"></label><label class="span-two">Lý do<textarea class="input" name="reason" rows="3" required></textarea></label><button class="btn btn-primary" type="submit">Lưu ngoại lệ</button></form><div class="scope-hints">${branchHint(ctx.state)}</div>`)}</div></div>`;
  }

  function requestTitle(request) {
    return `${RESOURCE_LABELS[request.resourceType] || request.resourceType} · ${OPERATION_LABELS[request.operation] || request.operation}`;
  }

  function requestCard(ctx, request, ownerView = false) {
    const requester = ctx.state.users.find((item) => item.id === request.submittedBy);
    const href = ownerView ? `/app/teacher/requests/${request.id}` : `/app/admin/approvals/${request.id}`;
    return `<article class="approval-card"><div class="approval-main"><div class="between"><span class="request-type">${escapeHtml(requestTitle(request))}</span>${badge(request.status)}</div><h3><a href="#${href}">${escapeHtml(request.reason)}</a></h3>${person(requester, `Gửi ${formatDate(request.submittedAt, true)}`)}<div class="request-meta"><span>Phiên bản gốc <b>${request.baseVersion}</b></span><span>Revision <b>${request.revision}</b></span><span>Thay đổi <b>${request.diff.length}</b> trường</span></div></div>${ownerView && ['SUBMITTED', 'CHANGES_REQUESTED'].includes(request.status) ? `<form data-form="withdraw-change-request" class="withdraw-form"><input type="hidden" name="requestId" value="${escapeHtml(request.id)}"><input class="input" name="reason" required placeholder="Lý do rút yêu cầu"><button class="btn btn-secondary btn-sm" type="submit">Rút yêu cầu</button></form>` : `<a class="btn btn-secondary btn-sm" href="#${href}">So sánh thay đổi</a>`}</article>`;
  }

  function approvals(ctx) {
    const pending = ctx.state.changeRequests.filter((item) => ['SUBMITTED', 'IN_REVIEW'].includes(item.status));
    const history = ctx.state.changeRequests.filter((item) => !['SUBMITTED', 'IN_REVIEW'].includes(item.status));
    return `<div class="workspace-page governance-page">${pageHeader('Quản trị · Phê duyệt', 'Hàng chờ phê duyệt', 'Duyệt thay đổi master data bằng so sánh trước/sau, cảnh báo phiên bản và audit.')}
      <div class="metric-grid three">${metric('Đang chờ', pending.length, 'Cần quyết định Admin', 'shield')}${metric('Đã xử lý', history.length, 'Giữ toàn bộ lịch sử', 'check')}${metric('Xung đột', history.filter((item) => item.status === 'CONFLICTED').length, 'Cần gửi revision mới', 'trend')}</div>
      ${section('So sánh thay đổi đang chờ', pending.length ? pending.map((item) => requestCard(ctx, item)).join('') : empty('Không có yêu cầu đang chờ', 'Đề xuất của Giáo viên sẽ xuất hiện tại đây để Admin so sánh thay đổi.'))}
      ${section('Lịch sử quyết định', history.length ? history.map((item) => requestCard(ctx, item)).join('') : '<p class="muted governance-empty">Chưa có quyết định.</p>')}</div>`;
  }

  function displayValue(value) {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  function requestDetail(ctx, request, ownerView = false) {
    const requester = ctx.state.users.find((item) => item.id === request.submittedBy);
    const reviewer = ctx.state.users.find((item) => item.id === request.reviewerId);
    const canReview = !ownerView && ['SUBMITTED', 'IN_REVIEW'].includes(request.status);
    return `<div class="workspace-page governance-page">${pageHeader(ownerView ? 'Giáo viên · Yêu cầu của tôi' : 'Quản trị · Phê duyệt', requestTitle(request), request.reason, `<a class="btn btn-secondary" href="#${ownerView ? '/app/teacher/requests' : '/app/admin/approvals'}">Về danh sách</a>`)}
      <div class="request-summary panel"><div>${person(requester, 'Người gửi')}<dl class="detail-list"><div><dt>Trạng thái</dt><dd>${badge(request.status)}</dd></div><div><dt>Phiên bản gốc</dt><dd>${request.baseVersion}</dd></div><div><dt>Revision</dt><dd>${request.revision}</dd></div><div><dt>Người duyệt</dt><dd>${escapeHtml(reviewer?.name || 'Chưa có')}</dd></div></dl></div><div class="request-reason"><small>Lý do đề xuất</small><strong>${escapeHtml(request.reason)}</strong><p>${escapeHtml(request.reviewNote || 'Chưa có ghi chú duyệt.')}</p></div></div>
      ${section('So sánh thay đổi', `<div class="diff-table"><div class="diff-head"><span>Trường dữ liệu</span><span>Trước thay đổi</span><span>Sau thay đổi</span></div>${request.diff.map((item) => `<div class="diff-row"><code>${escapeHtml(item.field)}</code><pre>${escapeHtml(displayValue(item.before))}</pre><pre>${escapeHtml(displayValue(item.after))}</pre></div>`).join('') || '<p class="muted">Không có trường dữ liệu thay đổi.</p>'}</div>`, { subtitle: request.status === 'CONFLICTED' ? 'Cảnh báo: dữ liệu gốc đã đổi; cần gửi revision mới.' : 'Canonical data chỉ đổi sau khi duyệt thành công.' })}
      ${canReview ? section('Quyết định của Quản trị viên', `<form class="review-form" data-form="review-change-request"><input type="hidden" name="requestId" value="${escapeHtml(request.id)}"><label>Quyết định<select class="input" name="decision"><option value="APPROVE">Duyệt và áp dụng</option><option value="REQUEST_CHANGES">Yêu cầu chỉnh sửa</option><option value="REJECT">Từ chối</option></select></label><label>Ghi chú<textarea class="input" name="note" rows="3" placeholder="Bắt buộc khi từ chối hoặc yêu cầu chỉnh sửa"></textarea></label><button class="btn btn-primary" type="submit">Xác nhận quyết định</button></form>`) : ''}
      ${ownerView && ['SUBMITTED', 'CHANGES_REQUESTED'].includes(request.status) ? section('Rút yêu cầu', `<form data-form="withdraw-change-request" class="review-form"><input type="hidden" name="requestId" value="${escapeHtml(request.id)}"><label>Lý do<input class="input" name="reason" required></label><button class="btn btn-secondary" type="submit">Rút yêu cầu</button></form>`) : ''}</div>`;
  }

  function teacherRequests(ctx) {
    const requests = ctx.state.changeRequests.filter((item) => item.submittedBy === ctx.actor.id).slice().reverse();
    return `<div class="workspace-page governance-page">${pageHeader('Giáo viên · Thay đổi', 'Yêu cầu của tôi', 'Theo dõi đề xuất khóa học, lớp và buổi học trên cùng dữ liệu mà Admin đang duyệt.')}
      ${section('Tất cả yêu cầu', requests.length ? requests.map((item) => requestCard(ctx, item, true)).join('') : empty('Chưa có yêu cầu', 'Khi gửi đề xuất từ khóa học, lớp hoặc buổi học, trạng thái sẽ xuất hiện tại đây.'))}</div>`;
  }

  function render(path, ctx) {
    if (path === '/app/admin/roles') return roles(ctx);
    const roleMatch = /^\/app\/admin\/roles\/([^/]+)\/permissions$/.exec(path);
    if (roleMatch) return rolePermissions(ctx, decodeURIComponent(roleMatch[1]));
    const userMatch = /^\/app\/admin\/users\/([^/]+)\/access$/.exec(path);
    if (userMatch) return userAccess(ctx, decodeURIComponent(userMatch[1]));
    if (path === '/app/admin/approvals') return approvals(ctx);
    const approvalMatch = /^\/app\/admin\/approvals\/([^/]+)$/.exec(path);
    if (approvalMatch) {
      const request = ctx.state.changeRequests.find((item) => item.id === decodeURIComponent(approvalMatch[1]));
      return request ? requestDetail(ctx, request) : '';
    }
    if (path === '/app/teacher/requests') return teacherRequests(ctx);
    const teacherMatch = /^\/app\/teacher\/requests\/([^/]+)$/.exec(path);
    if (teacherMatch) {
      const request = ctx.state.changeRequests.find((item) => item.id === decodeURIComponent(teacherMatch[1]) && item.submittedBy === ctx.actor.id);
      return request ? requestDetail(ctx, request, true) : '';
    }
    return '';
  }

  root.YC.define('governanceViews', Object.freeze({ render }));
})(globalThis);

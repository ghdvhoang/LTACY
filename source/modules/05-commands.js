(function defineCommands(root) {
  'use strict';

  const { uid } = root.YC.utils;

  class CommandError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = 'CommandError';
      this.code = code;
      Object.assign(this, details);
    }
  }

  function required(value, code, message) {
    if (!value) throw new CommandError(code, message);
    return value;
  }

  function requireRole(actor, roles) {
    required(actor, 'AUTH_REQUIRED', 'Cần đăng nhập để thực hiện thao tác này.');
    if (!roles.includes(actor.role) && actor.role !== 'ADMIN') {
      throw new CommandError('FORBIDDEN', 'Vai trò hiện tại không có quyền thực hiện thao tác này.');
    }
  }

  function create(store) {
    function nowIso() {
      return new Date(store.clock()).toISOString();
    }

    function appendEvent(draft, context, type, resourceType, resourceId, summary, extra = {}) {
      const event = {
        id: uid('event'),
        type,
        resourceType,
        resourceId,
        actorId: context.actor.id,
        occurredAt: nowIso(),
        summary,
        ...extra,
      };
      draft.domainEvents.unshift(event);
      context.eventIds.push(event.id);
      return event;
    }

    function appendAudit(draft, context, action, resourceType, resourceId, detail) {
      draft.auditLogs.unshift({
        id: uid('audit'),
        actorId: context.actor.id,
        action,
        resourceType,
        resourceId,
        detail,
        occurredAt: nowIso(),
      });
    }

    function notifyRole(draft, role, title, body, link = '') {
      const recipient = draft.users.find((item) => item.role === role && item.status === 'ACTIVE');
      if (!recipient) return;
      draft.notifications.unshift({ id: uid('notification'), userId: recipient.id, title, body, link, read: false, createdAt: nowIso() });
    }

    function findLead(draft, leadId) {
      return required(draft.leads.find((item) => item.id === leadId), 'LEAD_NOT_FOUND', 'Không tìm thấy lead.');
    }

    function latestForLead(collection, leadId) {
      return collection.filter((item) => item.leadId === leadId).at(-1) || null;
    }

    const handlers = {
      CONTACT_LEAD(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        if (lead.status !== 'NEW') throw new CommandError('INVALID_LEAD_STATE', 'Lead chỉ được liên hệ lần đầu từ trạng thái NEW.');
        lead.status = 'CONTACTED';
        lead.contactedAt = nowIso();
        draft.consultations.push({ id: uid('consultation'), leadId: lead.id, ownerId: context.actor.id, note: payload.note || 'Đã xác nhận nhu cầu.', occurredAt: nowIso() });
        appendEvent(draft, context, 'LEAD_CONTACTED', 'LEAD', lead.id, `${lead.name} đã được liên hệ.` , { learnerId: lead.learnerId });
        appendAudit(draft, context, 'LEAD_CONTACTED', 'LEAD', lead.id, payload.note || 'Xác nhận nhu cầu học.');
        return { message: 'Đã liên hệ và ghi nhận nhu cầu.' };
      },

      BOOK_PLACEMENT(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        if (lead.status !== 'CONTACTED') throw new CommandError('LEAD_NOT_CONTACTED', 'Cần liên hệ lead trước khi đặt placement.');
        lead.status = 'PLACEMENT_BOOKED';
        const booking = { id: uid('placement-booking'), leadId: lead.id, learnerId: lead.learnerId, branchId: lead.branchId, startsAt: payload.startsAt, mode: payload.mode || 'OFFLINE', status: 'BOOKED', createdBy: context.actor.id };
        draft.placementBookings.push(booking);
        appendEvent(draft, context, 'PLACEMENT_BOOKED', 'PLACEMENT_BOOKING', booking.id, `Đặt lịch placement cho ${lead.name}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'PLACEMENT_BOOKED', 'PLACEMENT_BOOKING', booking.id, `${payload.startsAt} · ${booking.mode}`);
        notifyRole(draft, 'ACADEMIC_MANAGER', 'Có lịch placement mới', `${lead.name} cần được đánh giá đầu vào.`, '/app/academic/dashboard');
        return { message: 'Đã đặt lịch placement.' };
      },

      RECORD_PLACEMENT(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const lead = findLead(draft, payload.leadId);
        const booking = latestForLead(draft.placementBookings, lead.id);
        if (!booking || booking.status !== 'BOOKED') throw new CommandError('PLACEMENT_NOT_BOOKED', 'Cần có booking placement hợp lệ trước khi ghi kết quả.');
        if (draft.placementResults.some((item) => item.leadId === lead.id)) throw new CommandError('PLACEMENT_EXISTS', 'Lead đã có kết quả placement.');
        booking.status = 'COMPLETED';
        const result = {
          id: uid('placement'),
          leadId: lead.id,
          learnerId: lead.learnerId,
          status: 'REVIEWED',
          frameworkLevel: payload.frameworkLevel,
          centerLevelId: payload.centerLevelId,
          skills: { ...payload.skills },
          recommendation: payload.recommendation,
          reviewedBy: context.actor.id,
          recordedAt: nowIso(),
        };
        draft.placementResults.push(result);
        appendEvent(draft, context, 'PLACEMENT_RECORDED', 'PLACEMENT_RESULT', result.id, `${lead.name}: ${result.frameworkLevel} · ${result.recommendation}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'PLACEMENT_RECORDED', 'PLACEMENT_RESULT', result.id, 'Kết quả đa kỹ năng đã được ghi nhận.');
        return { message: 'Đã ghi kết quả placement.' };
      },

      RELEASE_PLACEMENT(draft, payload, context) {
        requireRole(context.actor, ['ACADEMIC_MANAGER']);
        const lead = findLead(draft, payload.leadId);
        const result = latestForLead(draft.placementResults, lead.id);
        if (!result || result.status !== 'REVIEWED') throw new CommandError('PLACEMENT_NOT_REVIEWED', 'Kết quả placement chưa sẵn sàng để release.');
        result.status = 'RELEASED';
        result.releasedAt = nowIso();
        lead.status = 'PLACED';
        appendEvent(draft, context, 'PLACEMENT_RELEASED', 'PLACEMENT_RESULT', result.id, `Đã phát hành khuyến nghị ${result.recommendation}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'PLACEMENT_RELEASED', 'PLACEMENT_RESULT', result.id, 'Academic Manager phê duyệt kết quả.');
        notifyRole(draft, 'ADMISSIONS', 'Placement đã được phát hành', `${lead.name}: ${result.recommendation}.`, '/app/admissions/offers');
        return { message: 'Đã phát hành kết quả placement.' };
      },

      CREATE_OFFER(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const placement = latestForLead(draft.placementResults, lead.id);
        if (!placement || placement.status !== 'RELEASED') throw new CommandError('PLACEMENT_NOT_RELEASED', 'Cần placement đã phát hành trước khi tạo offer.');
        const packageItem = required(draft.packages.find((item) => item.id === payload.packageId), 'PACKAGE_NOT_FOUND', 'Không tìm thấy package.');
        const discount = Math.max(0, Number(payload.discount || 0));
        const offer = { id: uid('offer'), leadId: lead.id, learnerId: lead.learnerId, packageId: packageItem.id, listPrice: packageItem.price, discount, total: packageItem.price - discount, currency: packageItem.currency, status: 'DRAFT', createdBy: context.actor.id, createdAt: nowIso() };
        draft.offers.push(offer);
        lead.status = 'OFFERED';
        appendEvent(draft, context, 'OFFER_CREATED', 'OFFER', offer.id, `Offer ${offer.total.toLocaleString('vi-VN')} ${offer.currency}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'OFFER_CREATED', 'OFFER', offer.id, `Giảm ${discount.toLocaleString('vi-VN')} ${offer.currency}.`);
        return { message: 'Đã tạo offer nháp.' };
      },

      SEND_OFFER(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const offer = required(latestForLead(draft.offers, lead.id), 'OFFER_NOT_FOUND', 'Không tìm thấy offer.');
        if (offer.status !== 'DRAFT') throw new CommandError('INVALID_OFFER_STATE', 'Chỉ offer nháp mới được gửi.');
        offer.status = 'SENT';
        offer.sentAt = nowIso();
        draft.outboundMessages.unshift({ id: uid('outbound'), channel: 'EMAIL', recipient: lead.email || lead.phone, template: 'OFFER_SENT', status: 'MOCKED', mode: 'MOCK', createdAt: nowIso() });
        appendEvent(draft, context, 'OFFER_SENT', 'OFFER', offer.id, `Đã gửi offer mock cho ${lead.parentName || lead.name}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'OFFER_SENT_MOCK', 'OFFER', offer.id, 'Outbound mock, không gửi ra provider thật.');
        return { message: 'Đã gửi offer ở chế độ mock.' };
      },

      ACCEPT_OFFER(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const lead = findLead(draft, payload.leadId);
        const offer = required(latestForLead(draft.offers, lead.id), 'OFFER_NOT_FOUND', 'Không tìm thấy offer.');
        if (offer.status !== 'SENT') throw new CommandError('OFFER_NOT_SENT', 'Offer phải được gửi trước khi ghi nhận chấp nhận.');
        offer.status = 'ACCEPTED';
        offer.acceptedAt = nowIso();
        appendEvent(draft, context, 'OFFER_ACCEPTED', 'OFFER', offer.id, `${lead.parentName || lead.name} đã chấp nhận offer.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'OFFER_ACCEPTED', 'OFFER', offer.id, 'Admissions ghi nhận xác nhận trong demo.');
        notifyRole(draft, 'FINANCE', 'Offer chờ xuất hóa đơn', `${lead.name} đã chấp nhận offer.`, '/app/finance/invoices');
        return { message: 'Đã ghi nhận offer được chấp nhận.' };
      },

      ISSUE_INVOICE(draft, payload, context) {
        requireRole(context.actor, ['FINANCE']);
        const lead = findLead(draft, payload.leadId);
        const offer = required(latestForLead(draft.offers, lead.id), 'OFFER_NOT_FOUND', 'Không tìm thấy offer.');
        if (offer.status !== 'ACCEPTED') throw new CommandError('OFFER_NOT_ACCEPTED', 'Offer chưa được chấp nhận.');
        const invoice = { id: uid('invoice'), leadId: lead.id, learnerId: lead.learnerId, offerId: offer.id, amount: offer.total, currency: offer.currency, status: 'ISSUED', mode: 'MOCK', issuedAt: nowIso(), dueAt: new Date(new Date(nowIso()).getTime() + 3 * 86400000).toISOString() };
        draft.invoices.push(invoice);
        appendEvent(draft, context, 'INVOICE_ISSUED', 'INVOICE', invoice.id, `Hóa đơn mock ${invoice.amount.toLocaleString('vi-VN')} ${invoice.currency}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'MOCK_INVOICE_ISSUED', 'INVOICE', invoice.id, 'Hóa đơn demo, không phải chứng từ tài chính thật.');
        return { message: 'Đã phát hành hóa đơn mock.' };
      },

      RECORD_MOCK_PAYMENT(draft, payload, context) {
        requireRole(context.actor, ['FINANCE']);
        const lead = findLead(draft, payload.leadId);
        const invoice = required(latestForLead(draft.invoices, lead.id), 'INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn.');
        if (invoice.status !== 'ISSUED') throw new CommandError('INVOICE_NOT_PAYABLE', 'Hóa đơn không ở trạng thái chờ thanh toán.');
        invoice.status = 'PAID';
        invoice.paidAt = nowIso();
        const payment = { id: uid('payment'), invoiceId: invoice.id, leadId: lead.id, learnerId: lead.learnerId, amount: invoice.amount, currency: invoice.currency, reference: payload.reference || uid('MOCK'), provider: 'DEMO_LEDGER', mode: 'MOCK', status: 'PAID', paidAt: nowIso() };
        draft.payments.push(payment);
        lead.status = 'WON';
        appendEvent(draft, context, 'PAYMENT_RECORDED', 'PAYMENT', payment.id, `Đã ghi nhận thanh toán mock cho ${lead.name}.`, { learnerId: lead.learnerId });
        appendAudit(draft, context, 'MOCK_PAYMENT_RECORDED', 'PAYMENT', payment.id, `${payment.reference} · DEMO_LEDGER.`);
        notifyRole(draft, 'STUDENT_SERVICE', 'Học viên đã đủ điều kiện xếp lớp', `${lead.name} đã hoàn tất payment mock.`, '/app/service/allocation');
        return { message: 'Đã ghi nhận thanh toán mock.' };
      },

      ALLOCATE_CLASS(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE']);
        const lead = findLead(draft, payload.leadId);
        const classItem = required(draft.classes.find((item) => item.id === payload.classId), 'CLASS_NOT_FOUND', 'Không tìm thấy lớp.');
        const activeCount = draft.enrollments.filter((item) => item.classId === classItem.id && item.status === 'ACTIVE').length;
        if (activeCount >= classItem.capacity || classItem.status === 'FULL') {
          const alternatives = draft.classes
            .filter((item) => item.id !== classItem.id && item.courseVersionId === classItem.courseVersionId && ['OPEN', 'ACTIVE'].includes(item.status))
            .map((item) => ({ classId: item.id, name: item.name, seats: item.capacity - draft.enrollments.filter((enrollment) => enrollment.classId === item.id && enrollment.status === 'ACTIVE').length, scheduleLabel: item.scheduleLabel }))
            .filter((item) => item.seats > 0)
            .sort((a, b) => b.seats - a.seats);
          throw new CommandError('NO_SEAT', 'Lớp đã hết chỗ; cần chọn phương án thay thế.', { alternatives });
        }
        const learner = required(draft.learners.find((item) => item.id === lead.learnerId), 'LEARNER_NOT_FOUND', 'Lead chưa có learner profile.');
        const paid = draft.payments.some((item) => item.leadId === lead.id && item.status === 'PAID');
        if (!paid) throw new CommandError('PAYMENT_REQUIRED', 'Cần ghi nhận thanh toán trước khi xếp lớp.');
        if (draft.enrollments.some((item) => item.learnerId === learner.id && item.status === 'ACTIVE')) throw new CommandError('ACTIVE_ENROLLMENT_EXISTS', 'Học viên đã có enrollment đang hoạt động.');
        const enrollment = { id: uid('enrollment'), learnerId: learner.id, classId: classItem.id, courseVersionId: classItem.courseVersionId, status: 'ACTIVE', startsAt: nowIso(), endsAt: null, allocatedBy: context.actor.id };
        draft.enrollments.push(enrollment);
        learner.classId = classItem.id;
        learner.branchId = classItem.branchId;
        learner.status = 'ACTIVE';
        appendEvent(draft, context, 'LEARNER_ALLOCATED', 'ENROLLMENT', enrollment.id, `${learner.name} vào lớp ${classItem.name}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'CLASS_ALLOCATED', 'ENROLLMENT', enrollment.id, `Payment cleared · ${classItem.code}.`);
        notifyRole(draft, 'ACADEMIC_MANAGER', 'Lớp cần gán giáo viên', `${classItem.name} có learner mới.`, '/app/academic/assignments');
        return { message: 'Đã xếp lớp và tạo enrollment.' };
      },

      TRANSFER_ENROLLMENT(draft, payload, context) {
        requireRole(context.actor, ['STUDENT_SERVICE']);
        if (!String(payload.reason || '').trim()) throw new CommandError('REASON_REQUIRED', 'Chuyển lớp cần có lý do.');
        const current = required(draft.enrollments.find((item) => item.learnerId === payload.learnerId && item.status === 'ACTIVE'), 'ACTIVE_ENROLLMENT_NOT_FOUND', 'Không tìm thấy enrollment đang hoạt động.');
        const nextClass = required(draft.classes.find((item) => item.id === payload.toClassId), 'CLASS_NOT_FOUND', 'Không tìm thấy lớp đích.');
        const occupied = draft.enrollments.filter((item) => item.classId === nextClass.id && item.status === 'ACTIVE').length;
        if (occupied >= nextClass.capacity) throw new CommandError('NO_SEAT', 'Lớp đích đã hết chỗ.', { alternatives: [] });
        current.status = 'TRANSFERRED';
        current.endsAt = nowIso();
        current.transferReason = payload.reason.trim();
        const replacement = { id: uid('enrollment'), learnerId: payload.learnerId, classId: nextClass.id, courseVersionId: nextClass.courseVersionId, status: 'ACTIVE', startsAt: nowIso(), endsAt: null, transferredFromId: current.id, allocatedBy: context.actor.id };
        draft.enrollments.push(replacement);
        const learner = draft.learners.find((item) => item.id === payload.learnerId);
        learner.classId = nextClass.id;
        learner.branchId = nextClass.branchId;
        appendEvent(draft, context, 'ENROLLMENT_TRANSFERRED', 'ENROLLMENT', replacement.id, `${learner.name} chuyển sang ${nextClass.name}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'ENROLLMENT_TRANSFERRED', 'ENROLLMENT', replacement.id, payload.reason.trim());
        return { message: 'Đã chuyển lớp và giữ nguyên lịch sử enrollment cũ.' };
      },

      CREATE_RENEWAL(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const learner = required(draft.learners.find((item) => item.id === payload.learnerId), 'LEARNER_NOT_FOUND', 'Không tìm thấy học viên.');
        const promotion = draft.promotionDecisions.find((item) => item.learnerId === learner.id && item.decision === 'PROMOTE' && item.status === 'FINAL');
        if (!promotion) throw new CommandError('PROMOTION_REQUIRED', 'Cần quyết định promotion đã chốt trước khi tạo renewal.');
        const packageItem = required(draft.packages.find((item) => item.id === payload.packageId), 'PACKAGE_NOT_FOUND', 'Không tìm thấy package.');
        const renewal = { id: uid('renewal'), learnerId: learner.id, nextCourseVersionId: promotion.nextCourseVersionId, packageId: packageItem.id, status: 'OFFERED', outcome: promotion.decision, nextGoal: 'Tiếp tục A2.2 và tăng speaking confidence', offeredAt: nowIso(), ownerId: context.actor.id };
        draft.renewals.push(renewal);
        appendEvent(draft, context, 'RENEWAL_OFFERED', 'RENEWAL', renewal.id, `Đã tạo renewal cho ${learner.name}.`, { learnerId: learner.id });
        appendAudit(draft, context, 'RENEWAL_OFFERED', 'RENEWAL', renewal.id, `Next course: ${promotion.nextCourseVersionId}.`);
        return { message: 'Đã tạo renewal offer.' };
      },

      ACCEPT_RENEWAL(draft, payload, context) {
        requireRole(context.actor, ['ADMISSIONS']);
        const renewal = required(draft.renewals.find((item) => item.learnerId === payload.learnerId && item.status === 'OFFERED'), 'RENEWAL_NOT_FOUND', 'Không tìm thấy renewal đang chờ.');
        renewal.status = 'ACCEPTED';
        renewal.acceptedAt = nowIso();
        appendEvent(draft, context, 'RENEWAL_ACCEPTED', 'RENEWAL', renewal.id, 'Phụ huynh đã chấp nhận lộ trình tiếp theo.', { learnerId: renewal.learnerId });
        appendAudit(draft, context, 'RENEWAL_ACCEPTED', 'RENEWAL', renewal.id, 'Admissions ghi nhận xác nhận trong demo.');
        return { message: 'Đã hoàn tất renewal.' };
      },
    };

    function dispatch(name, payload = {}, actorId) {
      const handler = handlers[name];
      if (!handler) return { ok: false, code: 'UNKNOWN_COMMAND', message: `Command không tồn tại: ${name}` };
      const eventIds = [];
      try {
        let output;
        store.transact((draft) => {
          const actor = required(draft.users.find((item) => item.id === actorId), 'ACTOR_NOT_FOUND', 'Không tìm thấy người thực hiện.');
          const context = { actor, eventIds };
          output = handler(draft, payload, context) || {};
        });
        return { ok: true, eventIds, message: output.message || 'Đã cập nhật.', ...output };
      } catch (error) {
        if (error instanceof CommandError) {
          return { ok: false, code: error.code, message: error.message, alternatives: error.alternatives || [], evidence: error.evidence || null };
        }
        throw error;
      }
    }

    return Object.freeze({ dispatch, registered: Object.freeze(Object.keys(handlers)) });
  }

  root.YC.define('commands', Object.freeze({ CommandError, create }));
})(globalThis);

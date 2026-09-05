(function defineSelectors(root) {
  'use strict';

  const ROLE_HOME = Object.freeze({
    ADMIN: '/app/admin/dashboard',
    CENTER_MANAGER: '/app/manager/dashboard',
    ADMISSIONS: '/app/admissions/dashboard',
    ACADEMIC_MANAGER: '/app/academic/dashboard',
    STUDENT_SERVICE: '/app/service/dashboard',
    FINANCE: '/app/finance/dashboard',
    TEACHER: '/app/teacher/dashboard',
    TA: '/app/teacher/dashboard',
    STUDENT: '/app/student/dashboard',
    PARENT: '/app/parent/dashboard',
    VISITOR: '/tai-khoan',
  });

  function byId(state, collection, id) {
    return (state[collection] || []).find((item) => item.id === id) || null;
  }

  function roleHome(role) {
    return ROLE_HOME[role] || '/login';
  }

  function journey(state) {
    const learnerId = state.demo.canonicalLearnerId;
    const lead = state.leads.find((item) => item.learnerId === learnerId);
    const checks = [
      { status: 'LEAD', ownerRole: 'ADMISSIONS', done: lead && lead.status !== 'NEW' },
      { status: 'PLACEMENT', ownerRole: 'ADMISSIONS', done: state.placementResults.some((item) => item.learnerId === learnerId && item.status === 'RELEASED') },
      { status: 'PAID', ownerRole: 'FINANCE', done: state.payments.some((item) => item.learnerId === learnerId && item.status === 'PAID') },
      { status: 'ENROLLED', ownerRole: 'STUDENT_SERVICE', done: state.enrollments.some((item) => item.learnerId === learnerId && item.status === 'ACTIVE') },
      { status: 'TEACHER_ASSIGNED', ownerRole: 'ACADEMIC_MANAGER', done: state.teacherAssignments.some((item) => item.classId === 'class-6a' && item.status === 'ACTIVE') },
      { status: 'SESSION_DELIVERED', ownerRole: 'TEACHER', done: state.deliveryRecords.some((item) => item.sessionId === 'session-canonical') },
      { status: 'REMEDIAL_ASSIGNED', ownerRole: 'TEACHER', done: state.remedialAssignments.some((item) => item.learnerId === learnerId) },
      { status: 'REMEDIAL_COMPLETED', ownerRole: 'STUDENT', done: state.remedialAssignments.some((item) => item.learnerId === learnerId && item.status === 'COMPLETED') && state.homeworkAssignments.some((item) => item.learnerId === learnerId && item.status === 'ACCEPTED') },
      { status: 'MODERATED', ownerRole: 'ACADEMIC_MANAGER', done: state.moderationCases.some((item) => item.learnerId === learnerId && item.status === 'APPROVED') },
      { status: 'PROGRESS_PUBLISHED', ownerRole: 'ACADEMIC_MANAGER', done: state.progressReports.some((item) => item.learnerId === learnerId && item.status === 'PUBLISHED') },
      { status: 'PARENT_REVIEWED', ownerRole: 'PARENT', done: state.domainEvents.some((item) => item.type === 'PARENT_PROGRESS_VIEWED' && item.learnerId === learnerId) },
      { status: 'RENEWED', ownerRole: 'ADMISSIONS', done: state.renewals.some((item) => item.learnerId === learnerId && item.status === 'ACCEPTED') },
    ];
    const index = checks.findIndex((item) => !item.done);
    if (index === -1) return { status: 'RENEWED', index: checks.length, total: checks.length, ownerRole: 'ADMISSIONS', complete: true };
    return { status: checks[index].status, index, total: checks.length, ownerRole: checks[index].ownerRole, complete: false };
  }

  function metrics(state, role) {
    const activeEnrollments = state.enrollments.filter((item) => item.status === 'ACTIVE');
    const openCases = [...state.serviceCases, ...state.interventionCases].filter((item) => item.status === 'OPEN');
    const common = {
      activeLearners: activeEnrollments.length,
      openCases: openCases.length,
      branchCount: state.branches.filter((item) => item.status === 'ACTIVE').length,
    };
    if (role === 'ADMISSIONS') return { ...common, newLeads: state.leads.filter((item) => item.status === 'NEW').length, renewalDue: state.renewals.filter((item) => item.status === 'DUE').length };
    if (role === 'FINANCE') return { ...common, paidInvoices: state.invoices.filter((item) => item.status === 'PAID').length, mockRevenue: state.payments.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.amount, 0) };
    if (role === 'TEACHER') return { ...common, gradingBacklog: state.gradingRecords.filter((item) => !['RELEASED', 'APPROVED'].includes(item.status)).length, upcomingSessions: state.sessions.filter((item) => ['CONFIRMED', 'PLANNED'].includes(item.status)).length };
    return common;
  }

  function teacherWorkload(state, teacherId) {
    const profile = state.teacherProfiles.find((item) => item.userId === teacherId);
    const teachingMinutes = profile
      ? state.teacherAssignments
        .filter((item) => item.teacherProfileId === profile.id && ['ACCEPTED', 'ACTIVE'].includes(item.status))
        .reduce((sum, item) => sum + Number(item.workloadMinutes || 0), 0)
      : 0;
    const preparationMinutes = Math.round(teachingMinutes * 0.2);
    const gradingMinutes = Math.round(teachingMinutes * 0.25);
    const administrationMinutes = Math.round(teachingMinutes * 0.15);
    return {
      teachingMinutes,
      preparationMinutes,
      gradingMinutes,
      administrationMinutes,
      totalMinutes: teachingMinutes + preparationMinutes + gradingMinutes + administrationMinutes,
      limitMinutes: state.settings.workloadLimitMinutes,
    };
  }

  function teacherEligibility(state, teacherId, classId, requestedWorkloadMinutes = 720) {
    const user = state.users.find((item) => item.id === teacherId);
    const profile = state.teacherProfiles.find((item) => item.userId === teacherId);
    const cohort = state.classes.find((item) => item.id === classId);
    const courseVersion = state.courseVersions.find((item) => item.id === cohort?.courseVersionId);
    const levelCode = state.levels.find((item) => item.id === state.courses.find((course) => course.id === courseVersion?.courseId)?.levelId)?.code || '';
    const frameworkLevel = levelCode.split('.')[0];
    const now = new Date(state.currentAt || state.seededAt).getTime();
    const qualificationValid = Boolean(profile && state.qualifications.some((item) => item.teacherProfileId === profile.id
      && item.status === 'VALID'
      && new Date(item.expiresAt).getTime() >= now));
    const workload = teacherWorkload(state, teacherId);
    const hardGates = [
      { key: 'ACTIVE_PROFILE', label: 'Hồ sơ đang hoạt động', passed: Boolean(user?.status === 'ACTIVE' && profile?.status === 'ACTIVE') },
      { key: 'QUALIFICATION', label: 'Qualification còn hiệu lực', passed: qualificationValid },
      { key: 'LEVEL', label: `Được phép dạy ${frameworkLevel || 'level yêu cầu'}`, passed: Boolean(profile?.levels.includes(frameworkLevel)) },
      { key: 'AGE_BAND', label: `Có kinh nghiệm ${cohort?.ageBand || 'age band'}`, passed: Boolean(profile?.ageBands.includes(cohort?.ageBand)) },
      { key: 'BRANCH', label: `Được phân scope ${cohort?.branchId || 'chi nhánh'}`, passed: Boolean(profile?.branchIds.includes(cohort?.branchId)) },
      { key: 'MODE', label: `Dạy được mode ${cohort?.mode || ''}`, passed: Boolean(profile?.modes.includes(cohort?.mode) || (cohort?.mode === 'HYBRID' && profile?.modes.includes('ONLINE') && profile?.modes.includes('OFFLINE'))) },
      { key: 'WORKLOAD', label: 'Không vượt giới hạn workload', passed: workload.totalMinutes + Math.round(requestedWorkloadMinutes * 1.6) <= workload.limitMinutes },
    ];
    const rankingSignals = [
      { key: 'BRANCH_CONTINUITY', label: 'Liên tục cùng chi nhánh', score: profile?.branchIds.includes(cohort?.branchId) ? 20 : 0 },
      { key: 'PROGRAM_EXPERIENCE', label: 'Kinh nghiệm cùng level', score: profile?.levels.includes(frameworkLevel) ? 20 : 0 },
      { key: 'LOAD_BALANCE', label: 'Dư địa workload', score: Math.max(0, Math.round((1 - workload.totalMinutes / workload.limitMinutes) * 20)) },
    ];
    return { teacherId, classId, eligible: hardGates.every((item) => item.passed), hardGates, rankingSignals, workload };
  }

  function overlaps(firstStart, firstEnd, secondStart, secondEnd) {
    return new Date(firstStart).getTime() < new Date(secondEnd).getTime()
      && new Date(firstEnd).getTime() > new Date(secondStart).getTime();
  }

  function scheduleConflicts(state, request) {
    const profile = state.teacherProfiles.find((item) => item.userId === request.teacherId);
    const conflicts = [];
    for (const session of state.sessions.filter((item) => !['CANCELLED', 'REVIEWED'].includes(item.status))) {
      if (!overlaps(request.startsAt, request.endsAt, session.startsAt, session.endsAt)) continue;
      if (session.room === request.room && state.classes.find((item) => item.id === session.classId)?.branchId === request.branchId) {
        conflicts.push({ type: 'ROOM', sessionId: session.id, label: `Phòng ${request.room} đã có lịch.` });
      }
      const assigned = profile && state.teacherAssignments.some((item) => item.teacherProfileId === profile.id
        && item.classId === session.classId
        && ['ACCEPTED', 'ACTIVE'].includes(item.status));
      if (assigned) conflicts.push({ type: 'TEACHER', sessionId: session.id, label: 'Giáo viên đã có buổi dạy trùng giờ.' });
    }
    return conflicts;
  }

  function sessionValidation(state, proposal) {
    const errors = [];
    const warnings = [];
    const cohort = byId(state, 'classes', proposal.classId);
    if (!cohort) return { valid: false, errors: [{ code: 'CLASS_NOT_FOUND', message: 'Không tìm thấy lớp.' }], warnings };
    const startsAt = new Date(proposal.startsAt).getTime();
    const endsAt = new Date(proposal.endsAt).getTime();
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt) errors.push({ code: 'INVALID_SESSION_TIME', message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' });
    const unitIds = state.units.filter((item) => item.courseVersionId === cohort.courseVersionId).map((item) => item.id);
    const lesson = byId(state, 'lessonTemplates', proposal.lessonTemplateId);
    if (!lesson || !unitIds.includes(lesson.unitId)) errors.push({ code: 'LESSON_COURSE_MISMATCH', message: 'Bài học không thuộc phiên bản khóa học của lớp.' });
    if (!proposal.room && (proposal.mode || cohort.mode) !== 'ONLINE') errors.push({ code: 'ROOM_REQUIRED', message: 'Buổi học trực tiếp cần có phòng.' });
    const excludedId = proposal.excludeSessionId || proposal.id || null;
    const candidates = state.sessions.filter((item) => item.id !== excludedId && !['CANCELLED', 'COMPLETED', 'REVIEWED'].includes(item.status)
      && Number.isFinite(startsAt) && overlaps(proposal.startsAt, proposal.endsAt, item.startsAt, item.endsAt));
    const targetAssignments = state.teacherAssignments.filter((item) => item.classId === cohort.id && ['ACCEPTED', 'ACTIVE'].includes(item.status)).map((item) => item.teacherProfileId);
    const targetLearners = state.enrollments.filter((item) => item.classId === cohort.id && item.status === 'ACTIVE').map((item) => item.learnerId);
    for (const session of candidates) {
      const otherClass = byId(state, 'classes', session.classId);
      if (session.room === proposal.room && otherClass?.branchId === cohort.branchId) errors.push({ code: 'ROOM_CONFLICT', sessionId: session.id, message: `Phòng ${proposal.room} đã có lịch.` });
      const otherAssignments = state.teacherAssignments.filter((item) => item.classId === session.classId && ['ACCEPTED', 'ACTIVE'].includes(item.status)).map((item) => item.teacherProfileId);
      if (targetAssignments.some((id) => otherAssignments.includes(id))) errors.push({ code: 'TEACHER_CONFLICT', sessionId: session.id, message: 'Giáo viên đã có buổi dạy trùng giờ.' });
      const otherLearners = state.enrollments.filter((item) => item.classId === session.classId && item.status === 'ACTIVE').map((item) => item.learnerId);
      const conflictedLearners = targetLearners.filter((id) => otherLearners.includes(id));
      if (conflictedLearners.length) errors.push({ code: 'LEARNER_CONFLICT', sessionId: session.id, learnerIds: conflictedLearners, message: `${conflictedLearners.length} học viên có lịch học trùng.` });
    }
    if (!targetAssignments.length) warnings.push({ code: 'TEACHER_NOT_ASSIGNED', message: 'Lớp chưa có giáo viên đang hiệu lực.' });
    return { valid: errors.length === 0, errors, warnings };
  }

  function sessionTrace(state, sessionId) {
    const session = byId(state, 'sessions', sessionId);
    if (!session) return null;
    const cohort = byId(state, 'classes', session.classId);
    const courseVersion = byId(state, 'courseVersions', cohort?.courseVersionId);
    const course = byId(state, 'courses', courseVersion?.courseId);
    const lesson = byId(state, 'lessonTemplates', session.lessonTemplateId);
    const unit = byId(state, 'units', lesson?.unitId);
    const branch = byId(state, 'branches', cohort?.branchId);
    const enrollments = state.enrollments.filter((item) => item.classId === cohort?.id && item.status === 'ACTIVE');
    const makeUpBookings = state.makeUpBookings.filter((item) => (item.targetSessionId || item.sessionId) === session.id && ['HELD', 'BOOKED', 'NOTIFIED', 'ATTENDED'].includes(item.status));
    return {
      session, cohort, courseVersion, course, lesson, unit, branch,
      teacherAssignments: state.teacherAssignments.filter((item) => item.classId === cohort?.id && ['ACCEPTED', 'ACTIVE'].includes(item.status)),
      learnerIds: [...new Set([...enrollments.map((item) => item.learnerId), ...makeUpBookings.map((item) => item.learnerId)])],
      enrollmentIds: enrollments.map((item) => item.id),
      makeUpBookingIds: makeUpBookings.map((item) => item.id),
    };
  }

  function sessionWorkbench(state, sessionId) {
    const session = byId(state, 'sessions', sessionId);
    if (!session) return null;
    const plan = state.lessonPlans.find((item) => item.sessionId === sessionId) || null;
    const learnerIds = state.enrollments.filter((item) => item.classId === session.classId && item.status === 'ACTIVE').map((item) => item.learnerId);
    return {
      session,
      plan,
      roster: state.learners.filter((item) => learnerIds.includes(item.id)),
      risks: state.interventionCases.filter((item) => learnerIds.includes(item.learnerId) && item.status === 'OPEN'),
      openHomework: state.homeworkAssignments.filter((item) => item.classId === session.classId && !['ACCEPTED', 'CLOSED'].includes(item.status)),
      delivery: state.deliveryRecords.find((item) => item.sessionId === sessionId) || null,
    };
  }

  function completionStatus(state, assignmentId) {
    const assignment = state.remedialAssignments.find((item) => item.id === assignmentId);
    if (!assignment) return null;
    const assessment = state.assessments.find((item) => item.id === assignment.assessmentId);
    const attempts = state.attempts.filter((item) => item.assignmentId === assignment.id && item.status === 'RELEASED');
    const highestScore = attempts.reduce((highest, item) => Math.max(highest, Number(item.score || 0)), 0);
    const videoPassed = Number(assignment.videoProgress || 0) >= Number(state.settings.minimumVideoProgress || 0);
    const scorePassed = highestScore >= Number(assessment?.passingScore || state.settings.defaultPassingScore);
    return { assignmentId, videoPassed, scorePassed, highestScore, completed: videoPassed && scorePassed };
  }

  function skillProfile(state, learnerId) {
    const labels = ['LISTENING', 'READING', 'SPOKEN_INTERACTION', 'SPOKEN_PRODUCTION', 'WRITING', 'LANGUAGE'];
    return labels.map((skill) => {
      const result = state.skillResults.filter((item) => item.learnerId === learnerId && item.skill === skill && item.status === 'RELEASED').at(-1);
      return { skill, score: result?.score ?? null, evidenceId: result?.id || null };
    });
  }

  function progressReportEvidence(state, learnerId) {
    const enrollment = state.enrollments.find((item) => item.learnerId === learnerId && item.status === 'ACTIVE');
    const classSessions = state.sessions.filter((item) => item.classId === enrollment?.classId);
    const attendance = state.attendanceRecords.filter((item) => item.learnerId === learnerId && classSessions.some((session) => session.id === item.sessionId));
    const present = attendance.filter((item) => ['PRESENT', 'LATE', 'ONLINE', 'MAKE_UP'].includes(item.status)).length;
    const homework = state.homeworkAssignments.filter((item) => item.learnerId === learnerId);
    const acceptedHomework = homework.filter((item) => item.status === 'ACCEPTED').length;
    return {
      enrollmentId: enrollment?.id || null,
      attendanceRate: attendance.length ? Math.round((present / attendance.length) * 100) : 100,
      homeworkCompletion: homework.length ? Math.round((acceptedHomework / homework.length) * 100) : 100,
      skillProfile: skillProfile(state, learnerId),
      interventionIds: state.interventionCases.filter((item) => item.learnerId === learnerId).map((item) => item.id),
      remedialIds: state.remedialAssignments.filter((item) => item.learnerId === learnerId).map((item) => item.id),
    };
  }

  function riskSignals(state) {
    return state.learners.flatMap((learner) => {
      const records = state.attendanceRecords.filter((item) => item.learnerId === learner.id);
      const recentAbsences = records.filter((item) => item.status === 'ABSENT').length;
      const overdueHomework = state.homeworkAssignments.filter((item) => item.learnerId === learner.id && !['ACCEPTED', 'CLOSED'].includes(item.status) && item.dueAt && new Date(item.dueAt) < new Date(state.currentAt || state.seededAt)).length;
      const signals = [];
      if (recentAbsences >= 2) signals.push({ learnerId: learner.id, type: 'ABSENT_TWO_SESSIONS', severity: 'HIGH', ownerRole: 'STUDENT_SERVICE' });
      if (overdueHomework > 0) signals.push({ learnerId: learner.id, type: 'HOMEWORK_OVERDUE', severity: 'MEDIUM', ownerRole: 'TEACHER' });
      return signals;
    });
  }

  function coursePublishValidation(state, courseVersionId) {
    const version = byId(state, 'courseVersions', courseVersionId);
    const errors = [];
    const warnings = [];
    if (!version) return { valid: false, errors: [{ code: 'COURSE_VERSION_NOT_FOUND', message: 'Không tìm thấy phiên bản khóa học.' }], warnings };
    const course = byId(state, 'courses', version.courseId);
    if (!course) errors.push({ code: 'COURSE_REQUIRED', message: 'Phiên bản chưa gắn với khóa học.' });
    else {
      if (!byId(state, 'programs', course.programId)) errors.push({ code: 'PROGRAM_REQUIRED', message: 'Khóa học chưa có chương trình.' });
      if (!byId(state, 'levels', course.levelId)) errors.push({ code: 'LEVEL_REQUIRED', message: 'Khóa học chưa có cấp độ.' });
      if (!String(course.description || '').trim()) warnings.push({ code: 'DESCRIPTION_RECOMMENDED', message: 'Nên bổ sung mô tả khóa học.' });
    }
    const units = state.units.filter((item) => item.courseVersionId === version.id);
    if (!units.length) errors.push({ code: 'UNIT_REQUIRED', message: 'Cần ít nhất một học phần.' });
    const unitIds = units.map((item) => item.id);
    const lessons = state.lessonTemplates.filter((item) => unitIds.includes(item.unitId));
    if (units.length && !lessons.length) errors.push({ code: 'LESSON_REQUIRED', message: 'Cần ít nhất một bài học.' });
    for (const lesson of lessons) {
      if (!Array.isArray(lesson.objectives) || !lesson.objectives.filter(Boolean).length) errors.push({ code: 'LESSON_OBJECTIVE_REQUIRED', lessonId: lesson.id, message: `${lesson.title}: thiếu mục tiêu.` });
      if (!Number(lesson.durationMinutes) || Number(lesson.durationMinutes) < 1) errors.push({ code: 'LESSON_DURATION_REQUIRED', lessonId: lesson.id, message: `${lesson.title}: thiếu thời lượng.` });
      if (!state.learningItems.some((item) => item.lessonTemplateId === lesson.id && item.status !== 'ARCHIVED')) warnings.push({ code: 'LEARNING_ITEM_RECOMMENDED', lessonId: lesson.id, message: `${lesson.title}: chưa có học liệu.` });
    }
    const lessonIds = lessons.map((item) => item.id);
    const assessments = state.assessments.filter((item) => item.courseVersionId === version.id || lessonIds.includes(item.lessonTemplateId));
    if (!assessments.length) errors.push({ code: 'ASSESSMENT_REQUIRED', message: 'Cần ít nhất một bài đánh giá.' });
    for (const assessment of assessments) {
      const invalidQuestion = (assessment.questionIds || []).find((id) => !state.questions.some((item) => item.id === id));
      if (invalidQuestion) errors.push({ code: 'ASSESSMENT_QUESTION_INVALID', assessmentId: assessment.id, message: `${assessment.title}: câu hỏi không tồn tại.` });
    }
    if (!version.completionRule) errors.push({ code: 'COMPLETION_RULE_REQUIRED', message: 'Thiếu quy tắc hoàn thành.' });
    if (!version.remedialPolicy) errors.push({ code: 'REMEDIAL_POLICY_REQUIRED', message: 'Thiếu chính sách học bù.' });
    if (!Number(version.totalHours)) errors.push({ code: 'TOTAL_HOURS_REQUIRED', message: 'Thiếu tổng số giờ học.' });
    return { valid: errors.length === 0, errors, warnings };
  }

  function classCapacity(state, classId) {
    const cohort = byId(state, 'classes', classId);
    if (!cohort) return null;
    const activeEnrollments = state.enrollments.filter((item) => item.classId === classId && item.status === 'ACTIVE').length;
    const sessionIds = state.sessions.filter((item) => item.classId === classId).map((item) => item.id);
    const makeUpReservations = state.makeUpBookings.filter((item) => ['HELD', 'BOOKED', 'NOTIFIED'].includes(item.status)
      && sessionIds.includes(item.targetSessionId || item.sessionId)).length;
    const capacity = Number(cohort.capacity || 0);
    const used = activeEnrollments + makeUpReservations;
    return { classId, capacity, activeEnrollments, makeUpReservations, used, remaining: Math.max(0, capacity - used), full: used >= capacity };
  }

  function classReadiness(state, classId) {
    const cohort = byId(state, 'classes', classId);
    if (!cohort) return { ready: false, errors: [{ code: 'CLASS_NOT_FOUND', message: 'Không tìm thấy lớp.' }], warnings: [] };
    const errors = [];
    const warnings = [];
    const version = byId(state, 'courseVersions', cohort.courseVersionId);
    if (!version || version.status !== 'PUBLISHED' || !version.immutable) errors.push({ code: 'COURSE_VERSION_NOT_PUBLISHED', message: 'Phiên bản khóa học chưa được công bố.' });
    const rules = state.timetableRules.filter((item) => item.classId === cohort.id && item.status !== 'INACTIVE');
    if (!rules.length || rules.some((item) => !Array.isArray(item.recurrence) || !item.recurrence.length || !Number(item.durationMinutes))) errors.push({ code: 'TIMETABLE_REQUIRED', message: 'Lớp chưa có lịch định kỳ hợp lệ.' });
    if (!cohort.room && cohort.mode !== 'ONLINE') errors.push({ code: 'ROOM_REQUIRED', message: 'Lớp trực tiếp cần có phòng.' });
    if (!cohort.meetingUrl && cohort.mode === 'ONLINE') errors.push({ code: 'MEETING_URL_REQUIRED', message: 'Lớp trực tuyến cần có liên kết học.' });
    const assignment = state.teacherAssignments.find((item) => item.classId === cohort.id && item.role === 'PRIMARY' && ['ACCEPTED', 'ACTIVE'].includes(item.status));
    if (!assignment) errors.push({ code: 'PRIMARY_TEACHER_REQUIRED', message: 'Lớp chưa có giáo viên chính đang hiệu lực.' });
    if (!state.sessions.some((item) => item.classId === cohort.id && item.status !== 'CANCELLED')) errors.push({ code: 'SESSION_REQUIRED', message: 'Lớp chưa có buổi học.' });
    const capacity = classCapacity(state, cohort.id);
    if (capacity.used < Number(cohort.minCapacity || 1)) errors.push({ code: 'MINIMUM_CAPACITY', message: `Cần tối thiểu ${cohort.minCapacity || 1} học viên; hiện có ${capacity.used}.` });
    if (capacity.remaining <= 1) warnings.push({ code: 'CAPACITY_LOW', message: 'Lớp gần đạt sức chứa tối đa.' });
    return { classId, ready: errors.length === 0, errors, warnings, capacity, assignmentId: assignment?.id || null };
  }

  root.YC.define('selectors', Object.freeze({ byId, classCapacity, classReadiness, completionStatus, coursePublishValidation, journey, metrics, progressReportEvidence, riskSignals, roleHome, scheduleConflicts, sessionTrace, sessionValidation, sessionWorkbench, skillProfile, teacherEligibility, teacherWorkload }));
})(globalThis);

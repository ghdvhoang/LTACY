(function defineRemedial(root) {
  'use strict';

  const { clone, uid } = root.YC.utils;

  function sourceTrace(state, attendance) {
    const session = state.sessions.find((item) => item.id === attendance.sessionId);
    const cohort = state.classes.find((item) => item.id === session?.classId);
    const courseVersion = state.courseVersions.find((item) => item.id === cohort?.courseVersionId);
    const course = state.courses.find((item) => item.id === courseVersion?.courseId);
    const lesson = state.lessonTemplates.find((item) => item.id === session?.lessonTemplateId);
    return { session, cohort, courseVersion, course, lesson };
  }

  function overlaps(firstStart, firstEnd, secondStart, secondEnd) {
    return new Date(firstStart).getTime() < new Date(secondEnd).getTime()
      && new Date(firstEnd).getTime() > new Date(secondStart).getTime();
  }

  function activeAt(assignment, instant) {
    const time = new Date(instant).getTime();
    return ['ACTIVE', 'ACCEPTED'].includes(assignment.status)
      && (!assignment.startsAt || new Date(assignment.startsAt).getTime() <= time)
      && (!assignment.endsAt || new Date(assignment.endsAt).getTime() >= time);
  }

  function rankMakeUpTargets(state, caseId) {
    const remedialCase = state.remedialCases.find((item) => item.id === caseId);
    if (!remedialCase) return [];
    const sourceSession = state.sessions.find((item) => item.id === remedialCase.sourceSessionId);
    const sourceClass = state.classes.find((item) => item.id === remedialCase.sourceClassId);
    const learner = state.learners.find((item) => item.id === remedialCase.learnerId);
    const currentAt = new Date(state.currentAt || state.seededAt).getTime();
    const activeEnrollmentClassIds = state.enrollments
      .filter((item) => item.learnerId === remedialCase.learnerId && item.status === 'ACTIVE')
      .map((item) => item.classId);
    const activeBookingSessionIds = state.makeUpBookings
      .filter((item) => item.remedialCaseId !== caseId && item.learnerId === remedialCase.learnerId && ['HELD', 'BOOKED', 'NOTIFIED'].includes(item.status))
      .map((item) => item.targetSessionId || item.sessionId);

    return state.sessions
      .filter((session) => session.id !== remedialCase.sourceSessionId)
      .map((session) => {
        const cohort = state.classes.find((item) => item.id === session.classId);
        const targetCourseVersionId = cohort?.courseVersionId || null;
        const activeEnrollments = state.enrollments.filter((item) => item.classId === session.classId && item.status === 'ACTIVE').length;
        const reservations = state.makeUpBookings.filter((item) => item.remedialCaseId !== caseId
          && (item.targetSessionId || item.sessionId) === session.id
          && ['HELD', 'BOOKED', 'NOTIFIED'].includes(item.status)).length;
        const capacity = Number(cohort?.capacity || 0);
        const learnerConflict = state.sessions.some((other) => other.id !== session.id
          && !['CANCELLED', 'REVIEWED'].includes(other.status)
          && (activeEnrollmentClassIds.includes(other.classId) || activeBookingSessionIds.includes(other.id))
          && overlaps(session.startsAt, session.endsAt, other.startsAt, other.endsAt));
        const teacherAccess = state.teacherAssignments.some((item) => item.classId === session.classId && activeAt(item, session.startsAt));
        const sameCourseVersion = targetCourseVersionId === remedialCase.sourceCourseVersionId;
        const sameLesson = session.lessonTemplateId === remedialCase.sourceLessonTemplateId;
        const futureAndOpen = new Date(session.startsAt).getTime() > currentAt && ['CONFIRMED', 'READY'].includes(session.status);
        const hardGates = [
          { key: 'CASE_ACTIVE', label: 'Hồ sơ học bù còn hiệu lực', passed: remedialCase.resolution !== 'NOT_REQUIRED' },
          { key: 'COURSE_VERSION', label: 'Cùng phiên bản khóa học', passed: sameCourseVersion },
          { key: 'LESSON_TEMPLATE', label: 'Cùng bài học', passed: sameLesson },
          { key: 'CAPACITY', label: 'Còn chỗ cho khách học bù', passed: capacity > activeEnrollments + reservations },
          { key: 'LEARNER_SCHEDULE', label: 'Không trùng lịch học viên', passed: !learnerConflict },
          { key: 'SESSION_OPEN', label: 'Buổi học chưa bắt đầu và đã xác nhận', passed: futureAndOpen },
          { key: 'TEACHER_ACCESS', label: 'Giáo viên đích có phân công hiệu lực', passed: teacherAccess },
        ];
        const rankingSignals = [
          { key: 'EXACT_COURSE', label: 'Đúng phiên bản khóa học', score: sameCourseVersion ? 40 : 0 },
          { key: 'EXACT_LESSON', label: 'Đúng bài học', score: sameLesson ? 40 : 0 },
          { key: 'BRANCH_FIT', label: 'Cùng cơ sở', score: cohort?.branchId === sourceClass?.branchId ? 10 : 0 },
          { key: 'MODE_FIT', label: 'Cùng hình thức học', score: session.mode === sourceSession?.mode ? 5 : 0 },
          { key: 'AGE_BAND_FIT', label: 'Cùng nhóm tuổi', score: cohort?.ageBand === sourceClass?.ageBand ? 5 : 0 },
        ];
        const score = rankingSignals.reduce((sum, item) => sum + item.score, 0);
        const failedKeys = hardGates.filter((item) => !item.passed).map((item) => item.key);
        return {
          sessionId: session.id,
          classId: session.classId,
          learnerId: learner?.id || remedialCase.learnerId,
          eligible: failedKeys.length === 0,
          requiresAdminOverride: failedKeys.length === 1 && failedKeys[0] === 'LESSON_TEMPLATE',
          score,
          hardGates,
          rankingSignals,
          reasons: [...hardGates.filter((item) => !item.passed).map((item) => item.label), ...rankingSignals.filter((item) => item.score > 0).map((item) => item.label)],
        };
      })
      .sort((first, second) => Number(second.eligible) - Number(first.eligible)
        || Number(second.requiresAdminOverride) - Number(first.requiresAdminOverride)
        || second.score - first.score
        || new Date(state.sessions.find((item) => item.id === first.sessionId)?.startsAt).getTime() - new Date(state.sessions.find((item) => item.id === second.sessionId)?.startsAt).getTime());
  }

  function evaluateEligibility(state, attendanceId) {
    const attendance = state.attendanceRecords.find((item) => item.id === attendanceId);
    if (!attendance) return { eligible: false, code: 'ATTENDANCE_NOT_FOUND', policySnapshot: null };
    const trace = sourceTrace(state, attendance);
    if (!trace.session || !trace.cohort || !trace.courseVersion || !trace.lesson) return { eligible: false, code: 'SOURCE_TRACE_INCOMPLETE', policySnapshot: null };
    const policySnapshot = clone(trace.courseVersion.remedialPolicy || {
      triggerStatuses: ['ABSENT'], requiredModes: ['ONLINE'], deadlineDays: state.settings.remedialDeadlineDays,
      passingScore: state.settings.defaultPassingScore, minimumVideoProgress: state.settings.minimumVideoProgress,
    });
    const eligible = (policySnapshot.triggerStatuses || ['ABSENT']).includes(attendance.status);
    return { eligible, code: eligible ? 'ELIGIBLE' : 'ATTENDANCE_STATUS_NOT_ELIGIBLE', attendance, policySnapshot, ...trace };
  }

  function caseStatus(state, caseId) {
    const remedialCase = state.remedialCases.find((item) => item.id === caseId);
    if (!remedialCase) return null;
    const online = state.remedialAssignments.find((item) => item.remedialCaseId === remedialCase.id) || null;
    const liveBookings = state.makeUpBookings.filter((item) => item.remedialCaseId === remedialCase.id);
    const completedModes = [];
    if (online?.status === 'COMPLETED') completedModes.push('ONLINE');
    if (liveBookings.some((item) => item.status === 'ATTENDED')) completedModes.push('LIVE');
    const requiredModes = remedialCase.requiredModes || [];
    if (requiredModes.length && requiredModes.every((mode) => completedModes.includes(mode))) {
      return { caseId, status: 'COMPLETED', requiredModes, completedModes, online, liveBookings };
    }
    if (remedialCase.resolution === 'NOT_REQUIRED') return { caseId, status: 'NOT_REQUIRED', requiredModes, completedModes, online, liveBookings };
    const hasProgress = online && ['IN_PROGRESS', 'NOT_PASSED', 'COMPLETED'].includes(online.status)
      || liveBookings.some((item) => ['HELD', 'BOOKED', 'NOTIFIED', 'ATTENDED'].includes(item.status));
    return { caseId, status: hasProgress ? 'IN_PROGRESS' : 'OPEN', requiredModes, completedModes, online, liveBookings };
  }

  function createOnlineAssignment(draft, remedialCase, evaluation, context) {
    const now = context.now;
    const deadlineDays = Number(evaluation.policySnapshot.deadlineDays || draft.settings.remedialDeadlineDays);
    const dueAt = new Date(new Date(now).getTime() + deadlineDays * 86400000).toISOString();
    const assessment = draft.assessments.find((item) => item.lessonTemplateId === evaluation.lesson.id && item.purpose === 'FORMATIVE')
      || draft.assessments.find((item) => item.id === 'assessment-remedial');
    const assignment = {
      id: uid('remedial'), remedialCaseId: remedialCase.id, learnerId: remedialCase.learnerId,
      sessionId: remedialCase.sourceSessionId, lessonTemplateId: remedialCase.sourceLessonTemplateId,
      assessmentId: assessment?.id || null, status: 'ASSIGNED', assignedAt: now, dueAt,
      videoProgress: 0, highestScore: null, completionMode: null, completedAt: null,
      accessToken: uid('access'), accessStatus: 'ACTIVE', linkVersion: 1, accessExpiresAt: dueAt,
      policySnapshot: clone(evaluation.policySnapshot),
    };
    draft.remedialAssignments.push(assignment);
    return assignment;
  }

  function reconcileAttendance(draft, attendance, previousStatus, context) {
    const evaluation = evaluateEligibility(draft, attendance.id);
    let remedialCase = draft.remedialCases.find((item) => item.sourceAttendanceId === attendance.id) || null;
    let assignment = remedialCase ? draft.remedialAssignments.find((item) => item.remedialCaseId === remedialCase.id) || null : null;
    let createdCase = false;
    let createdAssignment = false;

    if (evaluation.eligible) {
      if (!remedialCase) {
        remedialCase = {
          id: uid('remedial-case'), learnerId: attendance.learnerId, sourceAttendanceId: attendance.id,
          sourceSessionId: evaluation.session.id, sourceClassId: evaluation.cohort.id,
          sourceCourseVersionId: evaluation.courseVersion.id, sourceCourseId: evaluation.course?.id || null,
          sourceLessonTemplateId: evaluation.lesson.id, policySnapshot: clone(evaluation.policySnapshot),
          requiredModes: clone(evaluation.policySnapshot.requiredModes || ['ONLINE']), openedAt: context.now,
          openedBy: context.actorId, resolution: null, reconciliationHistory: [],
        };
        draft.remedialCases.push(remedialCase);
        createdCase = true;
      }
      if (remedialCase.resolution === 'NOT_REQUIRED') {
        remedialCase.resolution = null;
        remedialCase.resolutionAt = null;
      }
      if ((remedialCase.requiredModes || []).includes('ONLINE')) {
        if (!assignment) {
          assignment = createOnlineAssignment(draft, remedialCase, evaluation, context);
          createdAssignment = true;
        } else if (assignment.status === 'CANCELLED' && !draft.attempts.some((item) => item.assignmentId === assignment.id)) {
          assignment.status = 'ASSIGNED';
          assignment.cancelledAt = null;
          assignment.cancellationReason = null;
          assignment.accessStatus = 'ACTIVE';
        }
      }
    } else if (remedialCase) {
      const completedEvidence = assignment?.status === 'COMPLETED' || draft.makeUpBookings.some((item) => item.remedialCaseId === remedialCase.id && item.status === 'ATTENDED');
      if (!completedEvidence) {
        remedialCase.resolution = 'NOT_REQUIRED';
        remedialCase.resolutionAt = context.now;
        remedialCase.resolvedBy = context.actorId;
        if (assignment && !['COMPLETED', 'CANCELLED'].includes(assignment.status)) {
          assignment.status = 'CANCELLED';
          assignment.cancelledAt = context.now;
          assignment.cancellationReason = 'Điểm danh nguồn không còn đủ điều kiện.';
          assignment.accessStatus = 'REVOKED';
        }
        draft.makeUpBookings.filter((item) => item.remedialCaseId === remedialCase.id && ['HELD', 'BOOKED', 'NOTIFIED'].includes(item.status)).forEach((item) => {
          item.status = 'CANCELLED';
          item.cancelledAt = context.now;
          item.cancellationReason = 'Điểm danh nguồn đã được sửa.';
        });
      }
    }

    if (remedialCase && previousStatus !== attendance.status) {
      remedialCase.reconciliationHistory ||= [];
      remedialCase.reconciliationHistory.push({ fromStatus: previousStatus || null, toStatus: attendance.status, occurredAt: context.now, actorId: context.actorId });
    }
    return { remedialCase, assignment, createdCase, createdAssignment, evaluation };
  }

  root.YC.define('remedial', Object.freeze({ caseStatus, evaluateEligibility, rankMakeUpTargets, reconcileAttendance, sourceTrace }));
})(globalThis);

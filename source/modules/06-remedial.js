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

  root.YC.define('remedial', Object.freeze({ caseStatus, evaluateEligibility, reconcileAttendance, sourceTrace }));
})(globalThis);

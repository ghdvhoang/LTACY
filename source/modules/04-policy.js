(function definePolicy(root) {
  'use strict';

  const roleCapabilities = Object.freeze({
    ADMIN: ['*'],
    CENTER_MANAGER: ['DASHBOARD_VIEW', 'CLASS_VIEW', 'REPORT_VIEW', 'QUALITY_VIEW'],
    ADMISSIONS: ['LEAD_VIEW', 'LEAD_EDIT', 'PLACEMENT_VIEW', 'OFFER_EDIT', 'RENEWAL_EDIT'],
    ACADEMIC_MANAGER: ['CLASS_VIEW', 'CURRICULUM_EDIT', 'TEACHER_ASSIGN', 'GRADE_REVIEW', 'PROGRESS_APPROVE', 'QUALITY_VIEW'],
    STUDENT_SERVICE: ['CLASS_VIEW', 'ALLOCATION_EDIT', 'SERVICE_CASE_EDIT', 'ATTENDANCE_CORRECT', 'SUBSTITUTION_EDIT'],
    FINANCE: ['INVOICE_EDIT', 'PAYMENT_EDIT', 'REFUND_EDIT', 'TUITION_VIEW'],
    TEACHER: ['CLASS_VIEW', 'SESSION_DELIVER', 'ATTENDANCE_EDIT', 'HOMEWORK_EDIT', 'GRADE_EDIT', 'LEARNER_VIEW'],
    TA: ['CLASS_VIEW', 'ATTENDANCE_EDIT', 'LEARNER_VIEW'],
    STUDENT: ['OWN_LEARNING_VIEW', 'OWN_LEARNING_EDIT'],
    PARENT: ['LINKED_LEARNER_VIEW', 'TUITION_VIEW'],
  });

  function assignmentAllows(actor, resource, state) {
    const profile = state.teacherProfiles.find((item) => item.userId === actor.id);
    if (!profile || !resource.classId) return false;
    const moment = new Date(state.seededAt).getTime();
    return state.teacherAssignments.some((item) => item.teacherProfileId === profile.id
      && item.classId === resource.classId
      && ['ACCEPTED', 'ACTIVE'].includes(item.status)
      && new Date(item.startsAt).getTime() <= moment
      && new Date(item.endsAt).getTime() >= moment);
  }

  function can(actor, capability, resource = {}, state) {
    if (!actor || actor.status !== 'ACTIVE') return false;
    const allowed = roleCapabilities[actor.role] || [];
    if (!allowed.includes('*') && !allowed.includes(capability)) return false;
    if (actor.role === 'ADMIN') return true;
    if (resource.branchId && actor.branchIds && !actor.branchIds.includes(resource.branchId)) return false;
    if (['TEACHER', 'TA'].includes(actor.role) && ['CLASS_VIEW', 'LEARNER_VIEW', 'SESSION_DELIVER', 'ATTENDANCE_EDIT', 'HOMEWORK_EDIT', 'GRADE_EDIT'].includes(capability)) {
      return assignmentAllows(actor, resource, state);
    }
    if (actor.role === 'STUDENT' && resource.learnerId) return (actor.linkedLearnerIds || []).includes(resource.learnerId);
    if (actor.role === 'PARENT' && resource.learnerId) return (actor.linkedLearnerIds || []).includes(resource.learnerId);
    return true;
  }

  function visibleFeedback(actor, records, state) {
    if (!actor) return [];
    if (['ADMIN', 'ACADEMIC_MANAGER'].includes(actor.role)) return records.slice();
    if (actor.role === 'PARENT') {
      return records.filter((item) => (actor.linkedLearnerIds || []).includes(item.learnerId)
        && ['PARENT', 'LEARNER_PARENT'].includes(item.visibility));
    }
    if (actor.role === 'STUDENT') {
      return records.filter((item) => (actor.linkedLearnerIds || []).includes(item.learnerId)
        && ['LEARNER', 'LEARNER_PARENT'].includes(item.visibility));
    }
    if (actor.role === 'TEACHER') {
      return records.filter((item) => item.visibility !== 'RESTRICTED'
        && can(actor, 'LEARNER_VIEW', { learnerId: item.learnerId, classId: state.learners.find((learner) => learner.id === item.learnerId)?.classId }, state));
    }
    return [];
  }

  root.YC.define('policy', Object.freeze({ can, roleCapabilities, visibleFeedback }));
})(globalThis);

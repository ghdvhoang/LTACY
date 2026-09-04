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
      { status: 'REMEDIAL_COMPLETED', ownerRole: 'STUDENT', done: state.remedialAssignments.some((item) => item.learnerId === learnerId && item.status === 'COMPLETED') },
      { status: 'MODERATED', ownerRole: 'ACADEMIC_MANAGER', done: state.moderationCases.some((item) => item.learnerId === learnerId && item.status === 'APPROVED') },
      { status: 'PROGRESS_PUBLISHED', ownerRole: 'ACADEMIC_MANAGER', done: state.progressReports.some((item) => item.learnerId === learnerId && item.status === 'PUBLISHED') },
      { status: 'PARENT_REVIEWED', ownerRole: 'PARENT', done: state.domainEvents.some((item) => item.type === 'PARENT_PROGRESS_VIEWED' && item.learnerId === learnerId) },
      { status: 'RENEWED', ownerRole: 'ADMISSIONS', done: state.renewals.some((item) => item.learnerId === learnerId && item.status === 'ACCEPTED') },
    ];
    const index = checks.findIndex((item) => !item.done);
    if (index === -1) return { status: 'RENEWED', index: 11, total: checks.length, ownerRole: 'ADMISSIONS' };
    return { status: checks[index].status, index, total: checks.length, ownerRole: checks[index].ownerRole };
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

  root.YC.define('selectors', Object.freeze({ byId, journey, metrics, roleHome }));
})(globalThis);

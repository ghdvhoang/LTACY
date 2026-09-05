(function defineSeed(root) {
  'use strict';

  const { dateAt } = root.YC.utils;

  function createSeed(clock = () => new Date()) {
    const at = (days, hour = 9, minute = 0) => dateAt(clock, days, hour, minute);
    const learners = [
      { id: 'student-canonical', code: 'HS6A001', name: 'Nguyễn Minh Anh', birthDate: '2013-04-18', status: 'PROSPECT', classId: null, branchId: 'branch-q3', goal: 'Giao tiếp tự tin và củng cố nền tảng A2' },
      { id: 'student-02', code: 'HS6A002', name: 'Trần Gia Bảo', birthDate: '2013-07-09', status: 'ACTIVE', classId: 'class-6a', branchId: 'branch-q3', goal: 'Củng cố ngữ pháp' },
      { id: 'student-03', code: 'HS6A003', name: 'Lê Khánh Linh', birthDate: '2013-02-12', status: 'ACTIVE', classId: 'class-6a', branchId: 'branch-q3', goal: 'Phát triển kỹ năng nói' },
      { id: 'student-04', code: 'HS7B001', name: 'Phạm Đức Huy', birthDate: '2012-05-21', status: 'ACTIVE', classId: 'class-7b', branchId: 'branch-td', goal: 'Chuẩn bị B1' },
      { id: 'student-05', code: 'HS7B002', name: 'Vũ Ngọc Hà', birthDate: '2012-11-03', status: 'ACTIVE', classId: 'class-7b', branchId: 'branch-td', goal: 'Nâng kỹ năng viết' },
      { id: 'student-06', code: 'HS5C001', name: 'Đặng Minh Khang', birthDate: '2014-09-14', status: 'ACTIVE', classId: 'class-5c', branchId: 'branch-q3', goal: 'Xây nền A1' },
      { id: 'student-seat', code: 'HS6F001', name: 'Bùi Thanh An', birthDate: '2013-06-06', status: 'ACTIVE', classId: 'class-full', branchId: 'branch-q3', goal: 'Học cuối tuần' },
    ];

    const questions = [
      ['Yesterday, I ___ to school by bus.', ['go', 'went', 'gone', 'going'], 1],
      ['She ___ a new book last night.', ['reads', 'read', 'reading', 'has read'], 1],
      ['They ___ football on Sunday.', ['played', 'play', 'plays', 'playing'], 0],
      ['We ___ not at home yesterday.', ['was', 'were', 'are', 'be'], 1],
      ['___ you visit your grandmother last week?', ['Do', 'Did', 'Does', 'Were'], 1],
      ['Tom ___ breakfast at 7 a.m.', ['have', 'had', 'has', 'having'], 1],
      ['My parents ___ to Da Nang in June.', ['travel', 'traveled', 'travels', 'traveling'], 1],
      ['The movie ___ at nine o’clock.', ['end', 'ended', 'ends', 'ending'], 1],
      ['I ___ my homework before dinner.', ['finish', 'finished', 'finishes', 'finishing'], 1],
      ['Lan ___ happy after the test.', ['is', 'was', 'were', 'be'], 1],
    ].map((item, index) => ({
      id: `question-remedial-${index + 1}`,
      bankVersion: 1,
      type: 'SINGLE_CHOICE',
      prompt: item[0],
      options: item[1],
      correctIndex: item[2],
      competency: index < 6 ? 'LANGUAGE_USE' : 'READING',
      difficulty: index < 4 ? 'EASY' : index < 8 ? 'MEDIUM' : 'HARD',
    }));

    return {
      schemaVersion: 4,
      seededAt: new Date(clock()).toISOString(),
      currentAt: new Date(clock()).toISOString(),
      migrationNotice: null,
      demo: { canonicalLearnerId: 'student-canonical', currentCheckpoint: 'RESET', mode: 'FRONTEND_ONLY' },
      settings: {
        organizationId: 'org-yen',
        correctionWindowHours: 24,
        remedialDeadlineDays: 7,
        minimumVideoProgress: 80,
        defaultPassingScore: 80,
        workloadLimitMinutes: 2400,
        integrationMode: 'MOCK',
      },
      organizations: [{ id: 'org-yen', name: 'Lớp Tiếng Anh Cô Yến', shortName: 'Cô Yến', status: 'ACTIVE', version: 1 }],
      branches: [
        { id: 'branch-q3', organizationId: 'org-yen', code: 'Q3', name: 'Cơ sở Quận 3', address: '120 Võ Văn Tần, Quận 3', status: 'ACTIVE' },
        { id: 'branch-td', organizationId: 'org-yen', code: 'TD', name: 'Cơ sở Thủ Đức', address: '48 Võ Văn Ngân, Thủ Đức', status: 'ACTIVE' },
      ],
      users: [
        { id: 'public-1', role: 'PUBLIC', name: 'Khách truy cập', identifiers: [], secret: '', status: 'ACTIVE', branchIds: [] },
        { id: 'admin-1', role: 'ADMIN', name: 'Nguyễn Minh Quân', identifiers: ['admin@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3', 'branch-td'] },
        { id: 'manager-1', role: 'CENTER_MANAGER', name: 'Lê Thu Trang', identifiers: ['manager@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3', 'branch-td'] },
        { id: 'admissions-1', role: 'ADMISSIONS', name: 'Trần Quỳnh Anh', identifiers: ['admissions@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3'] },
        { id: 'academic-1', role: 'ACADEMIC_MANAGER', name: 'Phạm Hải Yến', identifiers: ['academic@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3', 'branch-td'] },
        { id: 'service-1', role: 'STUDENT_SERVICE', name: 'Vũ Thanh Mai', identifiers: ['service@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3', 'branch-td'] },
        { id: 'finance-1', role: 'FINANCE', name: 'Đỗ Minh Châu', identifiers: ['finance@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3', 'branch-td'] },
        { id: 'teacher-1', role: 'TEACHER', name: 'Hoàng Yến', identifiers: ['teacher@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3'] },
        { id: 'teacher-2', role: 'TEACHER', name: 'Lê Hải Nam', identifiers: ['nam@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-td'] },
        { id: 'teacher-3', role: 'TEACHER', name: 'Phạm Thu Hương', identifiers: ['huong@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3'] },
        { id: 'teacher-ineligible', role: 'TEACHER', name: 'David Trần', identifiers: ['david@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3'] },
        { id: 'ta-1', role: 'TA', name: 'Trần Mai Anh', identifiers: ['ta@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE', branchIds: ['branch-q3'] },
        { id: 'student-login-1', role: 'STUDENT', name: 'Nguyễn Minh Anh', identifiers: ['HS6A001', '0901000001'], secret: '123456', status: 'ACTIVE', linkedLearnerIds: ['student-canonical'] },
        { id: 'parent-1', role: 'PARENT', name: 'Nguyễn Thu Hà', identifiers: ['0901000002'], secret: '123456', status: 'ACTIVE', linkedLearnerIds: ['student-canonical', 'student-03'] },
      ],
      permissionDefinitions: root.YC.permissions.seedDefinitions(),
      rolePermissions: root.YC.permissions.seedRolePermissions(),
      userPermissionOverrides: [],
      changeRequests: [],
      roleScopes: [],
      learners,
      parentRelationships: [
        { id: 'relationship-1', parentUserId: 'parent-1', learnerId: 'student-canonical', type: 'MOTHER', status: 'VERIFIED' },
        { id: 'relationship-2', parentUserId: 'parent-1', learnerId: 'student-03', type: 'GUARDIAN', status: 'VERIFIED' },
      ],
      leads: [
        { id: 'lead-canonical', learnerId: 'student-canonical', code: 'YC-B2C-260901', type: 'B2C', name: 'Nguyễn Minh Anh', parentName: 'Nguyễn Thu Hà', phone: '0901000002', email: 'thuha@example.com', branchId: 'branch-q3', goal: 'Giao tiếp và nền tảng A2', availability: ['TUE_1800', 'THU_1800'], status: 'NEW', ownerId: 'admissions-1', createdAt: at(-2, 10) },
        { id: 'lead-no-seat', learnerId: null, code: 'YC-B2C-260902', type: 'B2C', name: 'Lâm Gia Huy', parentName: 'Lâm Ngọc Lan', phone: '0902000001', email: '', branchId: 'branch-q3', goal: 'Lớp cuối tuần', availability: ['SAT_0900'], status: 'PLACED', ownerId: 'admissions-1', createdAt: at(-4, 9) },
        { id: 'lead-b2b', learnerId: null, code: 'YC-B2B-260801', type: 'B2B', name: 'Ngô Quốc Việt', organization: 'Trường Ánh Dương', phone: '0903000001', email: 'viet@anhduong.demo', branchId: 'branch-td', goal: 'Demo cho 300 học viên', availability: [], status: 'CONTACTED', ownerId: 'admissions-1', createdAt: at(-7, 14) },
      ],
      consultations: [],
      placementBookings: [],
      placementResults: [
        { id: 'placement-no-seat', leadId: 'lead-no-seat', learnerId: null, status: 'RELEASED', frameworkLevel: 'A2', centerLevelId: 'level-a2-1', skills: { listening: 72, reading: 75, spokenInteraction: 68, spokenProduction: 66, writing: 70, language: 71 }, recommendation: 'Tiếng Anh nền tảng 6 · A2.1', reviewedBy: 'academic-1', releasedAt: at(-3, 15) },
      ],
      programs: [
        { id: 'program-foundation', name: 'Tiếng Anh nền tảng', audience: 'Thiếu nhi', outcome: 'Nền tảng giao tiếp và học thuật theo CEFR', status: 'PUBLISHED' },
        { id: 'program-ielts', name: 'Lộ trình IELTS', audience: 'Thiếu niên và người lớn', outcome: 'Lộ trình học thuật và luyện thi', status: 'PUBLISHED' },
        { id: 'program-speaking', name: 'Phòng luyện nói', audience: 'Mọi học viên', outcome: 'Tăng tương tác và phát âm', status: 'PUBLISHED' },
      ],
      levels: [
        { id: 'level-a1', programId: 'program-foundation', code: 'A1', name: 'Foundation A1', sequence: 1 },
        { id: 'level-a2-1', programId: 'program-foundation', code: 'A2.1', name: 'Foundation A2.1', sequence: 2 },
        { id: 'level-a2-2', programId: 'program-foundation', code: 'A2.2', name: 'Foundation A2.2', sequence: 3 },
      ],
      courses: [
        { id: 'course-6', programId: 'program-foundation', levelId: 'level-a2-1', code: 'ENG-FND-6', name: 'Tiếng Anh nền tảng 6', status: 'PUBLISHED', version: 1 },
        { id: 'course-7', programId: 'program-foundation', levelId: 'level-a2-2', code: 'ENG-FND-7', name: 'Tiếng Anh nền tảng 7', status: 'PUBLISHED', version: 1 },
        { id: 'course-5', programId: 'program-foundation', levelId: 'level-a1', code: 'ENG-FND-5', name: 'Tiếng Anh nền tảng 5', status: 'PUBLISHED', version: 1 },
      ],
      courseVersions: [
        { id: 'course-v6', courseId: 'course-6', version: 3, recordVersion: 1, title: 'Tiếng Anh nền tảng 6 · A2.1', status: 'PUBLISHED', immutable: true, totalHours: 48, completionRule: { attendanceMinimum: 75, finalScoreMinimum: 70, skillMinimum: 60 }, remedialPolicy: { triggerStatuses: ['ABSENT'], requiredModes: ['ONLINE'], deadlineDays: 7, passingScore: 80, minimumVideoProgress: 80 }, publishedAt: at(-90) },
        { id: 'course-v7', courseId: 'course-7', version: 2, recordVersion: 1, title: 'Tiếng Anh nền tảng 7 · A2.2', status: 'PUBLISHED', immutable: true, totalHours: 48, completionRule: { attendanceMinimum: 75, finalScoreMinimum: 72, skillMinimum: 62 }, remedialPolicy: { triggerStatuses: ['ABSENT'], requiredModes: ['ONLINE'], deadlineDays: 7, passingScore: 80, minimumVideoProgress: 80 }, publishedAt: at(-80) },
        { id: 'course-v5', courseId: 'course-5', version: 4, recordVersion: 1, title: 'Tiếng Anh nền tảng 5 · A1', status: 'PUBLISHED', immutable: true, totalHours: 42, completionRule: { attendanceMinimum: 70, finalScoreMinimum: 65, skillMinimum: 55 }, remedialPolicy: { triggerStatuses: ['ABSENT'], requiredModes: ['ONLINE'], deadlineDays: 7, passingScore: 75, minimumVideoProgress: 80 }, publishedAt: at(-75) },
      ],
      units: [
        { id: 'unit-v6-4', courseVersionId: 'course-v6', order: 4, title: 'Trải nghiệm trong quá khứ', outcome: 'Kể lại trải nghiệm đã xảy ra' },
        { id: 'unit-v7-3', courseVersionId: 'course-v7', order: 3, title: 'Lựa chọn trong tương lai', outcome: 'Thảo luận kế hoạch và lựa chọn' },
        { id: 'unit-v5-2', courseVersionId: 'course-v5', order: 2, title: 'Sinh hoạt hằng ngày', outcome: 'Mô tả thói quen hằng ngày' },
      ],
      lessonTemplates: [
        { id: 'lesson-past-simple', unitId: 'unit-v6-4', version: 2, title: 'Học phần 4 · Bài 2: Thì quá khứ đơn', durationMinutes: 90, objectives: ['Dùng thì quá khứ đơn chính xác', 'Kể lại một trải nghiệm ngắn'], status: 'PUBLISHED' },
        { id: 'lesson-future', unitId: 'unit-v7-3', version: 1, title: 'Học phần 3 · Bài 1: Lựa chọn trong tương lai', durationMinutes: 90, objectives: ['So sánh lựa chọn tương lai'], status: 'PUBLISHED' },
        { id: 'lesson-routines', unitId: 'unit-v5-2', version: 1, title: 'Học phần 2 · Bài 1: Sinh hoạt hằng ngày', durationMinutes: 90, objectives: ['Mô tả lịch sinh hoạt'], status: 'PUBLISHED' },
      ],
      learningItems: [
        { id: 'item-past-simple-video', lessonTemplateId: 'lesson-past-simple', type: 'VIDEO', title: 'Thì quá khứ đơn trong ngữ cảnh', required: true, durationMinutes: 18, order: 1 },
        { id: 'item-speaking-pairs', lessonTemplateId: 'lesson-past-simple', type: 'LIVE_ACTIVITY', title: 'Kể chuyện theo cặp', required: true, durationMinutes: 22, order: 2 },
        { id: 'item-pronunciation', lessonTemplateId: 'lesson-past-simple', type: 'PRACTICE', title: 'Phát âm đuôi -ed', required: true, durationMinutes: 15, order: 3 },
        { id: 'item-remedial-quiz', lessonTemplateId: 'lesson-past-simple', type: 'QUIZ', title: 'Kiểm tra thì quá khứ đơn', required: true, durationMinutes: 15, order: 4 },
      ],
      contentDrafts: [],
      teacherProfiles: [
        { id: 'teacher-profile-1', userId: 'teacher-1', teacherCode: 'GV001', status: 'ACTIVE', branchIds: ['branch-q3'], ageBands: ['YOUNG_LEARNER', 'TEEN'], levels: ['A1', 'A2', 'B1'], modes: ['OFFLINE', 'ONLINE'] },
        { id: 'teacher-profile-2', userId: 'teacher-2', teacherCode: 'GV002', status: 'ACTIVE', branchIds: ['branch-td'], ageBands: ['TEEN', 'ADULT'], levels: ['A2', 'B1', 'B2'], modes: ['OFFLINE', 'ONLINE'] },
        { id: 'teacher-profile-3', userId: 'teacher-3', teacherCode: 'GV003', status: 'ACTIVE', branchIds: ['branch-q3'], ageBands: ['YOUNG_LEARNER', 'TEEN'], levels: ['A1', 'A2', 'B1'], modes: ['OFFLINE', 'HYBRID'] },
        { id: 'teacher-profile-ineligible', userId: 'teacher-ineligible', teacherCode: 'GV004', status: 'ACTIVE', branchIds: ['branch-q3'], ageBands: ['ADULT'], levels: ['B2', 'C1'], modes: ['ONLINE'] },
      ],
      qualifications: [
        { id: 'qualification-1', teacherProfileId: 'teacher-profile-1', type: 'TESOL', level: 'ALL', issuedAt: at(-500), expiresAt: at(300), status: 'VALID' },
        { id: 'qualification-2', teacherProfileId: 'teacher-profile-2', type: 'CELTA', level: 'ALL', issuedAt: at(-800), expiresAt: at(180), status: 'VALID' },
        { id: 'qualification-4', teacherProfileId: 'teacher-profile-3', type: 'TESOL', level: 'ALL', issuedAt: at(-450), expiresAt: at(240), status: 'VALID' },
        { id: 'qualification-3', teacherProfileId: 'teacher-profile-ineligible', type: 'BUSINESS_ENGLISH', level: 'ADULT', issuedAt: at(-300), expiresAt: at(120), status: 'VALID' },
      ],
      availabilitySlots: [
        { id: 'availability-1', teacherProfileId: 'teacher-profile-1', day: 'TUE', start: '17:30', end: '21:00', branchId: 'branch-q3', mode: 'OFFLINE', effectiveFrom: at(-30), effectiveTo: at(120) },
        { id: 'availability-2', teacherProfileId: 'teacher-profile-1', day: 'THU', start: '17:30', end: '21:00', branchId: 'branch-q3', mode: 'OFFLINE', effectiveFrom: at(-30), effectiveTo: at(120) },
        { id: 'availability-3', teacherProfileId: 'teacher-profile-2', day: 'MON', start: '18:00', end: '21:00', branchId: 'branch-td', mode: 'OFFLINE', effectiveFrom: at(-30), effectiveTo: at(120) },
        { id: 'availability-4', teacherProfileId: 'teacher-profile-3', day: 'TUE', start: '17:00', end: '21:00', branchId: 'branch-q3', mode: 'OFFLINE', effectiveFrom: at(-30), effectiveTo: at(120) },
      ],
      teacherAssignments: [
        { id: 'teacher-assignment-7b', teacherProfileId: 'teacher-profile-2', classId: 'class-7b', role: 'PRIMARY', startsAt: at(-30), endsAt: at(120), workloadMinutes: 720, status: 'ACTIVE', acceptedAt: at(-35), assignedBy: 'academic-1' },
      ],
      sessionAssignments: [],
      classes: [
        { id: 'class-6a', code: 'ENG6A-T3T5-1800', name: 'Tiếng Anh nền tảng 6A', branchId: 'branch-q3', courseVersionId: 'course-v6', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', capacity: 14, room: 'P.302', scheduleLabel: 'Thứ 3 & 5 · 18:00', status: 'OPEN', version: 1 },
        { id: 'class-6b', code: 'ENG6B-T2T4-1830', name: 'Tiếng Anh nền tảng 6B', branchId: 'branch-q3', courseVersionId: 'course-v6', ageBand: 'YOUNG_LEARNER', mode: 'HYBRID', capacity: 12, room: 'P.204', scheduleLabel: 'Thứ 2 & 4 · 18:30', status: 'OPEN', version: 1 },
        { id: 'class-7b', code: 'ENG7B-T2T4-1900', name: 'Tiếng Anh nền tảng 7B', branchId: 'branch-td', courseVersionId: 'course-v7', ageBand: 'TEEN', mode: 'OFFLINE', capacity: 12, room: 'P.105', scheduleLabel: 'Thứ 2 & 4 · 19:00', status: 'ACTIVE', version: 1 },
        { id: 'class-5c', code: 'ENG5C-T7CN-0900', name: 'Tiếng Anh nền tảng 5C', branchId: 'branch-q3', courseVersionId: 'course-v5', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', capacity: 10, room: 'P.101', scheduleLabel: 'Thứ 7 & CN · 09:00', status: 'ACTIVE', version: 1 },
        { id: 'class-full', code: 'ENG6F-T7-0900', name: 'Tiếng Anh nền tảng 6 cuối tuần', branchId: 'branch-q3', courseVersionId: 'course-v6', ageBand: 'YOUNG_LEARNER', mode: 'OFFLINE', capacity: 1, room: 'P.305', scheduleLabel: 'Thứ 7 · 09:00', status: 'FULL', version: 1 },
      ],
      enrollments: learners.filter((item) => item.classId).map((learner, index) => ({ id: `enrollment-seed-${index + 1}`, learnerId: learner.id, classId: learner.classId, courseVersionId: learner.classId === 'class-7b' ? 'course-v7' : learner.classId === 'class-5c' ? 'course-v5' : 'course-v6', status: 'ACTIVE', startsAt: at(-25), endsAt: null })),
      timetableRules: [
        { id: 'timetable-6a', classId: 'class-6a', recurrence: ['TUE_1800', 'THU_1800'], durationMinutes: 90, room: 'P.302', branchId: 'branch-q3' },
        { id: 'timetable-7b', classId: 'class-7b', recurrence: ['MON_1900', 'WED_1900'], durationMinutes: 90, room: 'P.105', branchId: 'branch-td' },
      ],
      sessions: [
        { id: 'session-canonical', classId: 'class-6a', lessonTemplateId: 'lesson-past-simple', startsAt: at(0, 18), endsAt: at(0, 19, 30), room: 'P.302', mode: 'OFFLINE', status: 'CONFIRMED', attendanceFinalized: false, version: 1 },
        { id: 'session-7b', classId: 'class-7b', lessonTemplateId: 'lesson-future', startsAt: at(1, 19), endsAt: at(1, 20, 30), room: 'P.105', mode: 'OFFLINE', status: 'CONFIRMED', attendanceFinalized: false, version: 1 },
      ],
      attendanceRecords: [],
      lessonPlans: [{ id: 'lesson-plan-canonical', sessionId: 'session-canonical', lessonTemplateId: 'lesson-past-simple', adaptations: ['Thêm dòng thời gian trực quan cho thì quá khứ đơn'], readiness: 'DRAFT', ownerId: 'teacher-1' }],
      deliveryRecords: [],
      homeworkAssignments: [],
      homeworkSubmissions: [],
      assessments: [
        { id: 'assessment-remedial', lessonTemplateId: 'lesson-past-simple', purpose: 'FORMATIVE', title: 'Kiểm tra thì quá khứ đơn', questionIds: questions.map((item) => item.id), passingScore: 80, maxAttempts: 3, gradingMode: 'AUTO', status: 'PUBLISHED' },
        { id: 'assessment-final-canonical', courseVersionId: 'course-v6', purpose: 'FINAL', title: 'Hồ sơ cuối khóa A2.1', questionIds: [], passingScore: 70, maxAttempts: 1, gradingMode: 'MANUAL', status: 'PUBLISHED' },
      ],
      questions,
      attempts: [],
      gradingRecords: [],
      moderationCases: [],
      skillResults: [],
      packages: [
        { id: 'package-a2-1', courseVersionId: 'course-v6', name: 'Tiếng Anh nền tảng A2.1 · Trọn khóa', price: 6800000, currency: 'VND', validityDays: 120, status: 'ACTIVE' },
        { id: 'package-a2-2', courseVersionId: 'course-v7', name: 'Tiếng Anh nền tảng A2.2 · Trọn khóa', price: 7200000, currency: 'VND', validityDays: 120, status: 'ACTIVE' },
      ],
      offers: [],
      invoices: [],
      payments: [],
      refunds: [],
      renewals: [],
      remedialCases: [],
      remedialAssignments: [],
      videoProgressRecords: [],
      progressReports: [],
      promotionDecisions: [],
      interventionCases: [
        { id: 'intervention-seed', learnerId: 'student-03', signal: 'HOMEWORK_BELOW_50', ownerRole: 'TEACHER', ownerId: 'teacher-1', status: 'OPEN', plan: 'Phòng luyện nói và lịch thực hành 2 buổi/tuần', followUpAt: at(5), outcome: null },
      ],
      serviceCases: [
        { id: 'service-no-seat', learnerId: null, leadId: 'lead-no-seat', type: 'NO_SEAT', ownerId: 'service-1', status: 'OPEN', reason: 'Lớp cuối tuần đã đủ chỗ', createdAt: at(-2) },
      ],
      makeUpBookings: [],
      substitutions: [
        { id: 'substitution-seed', sessionId: 'session-7b', originalTeacherProfileId: 'teacher-profile-2', replacementTeacherProfileId: null, reason: 'Giáo viên chính bận công tác', status: 'REQUESTED', handover: null, accessStartsAt: null, accessEndsAt: null },
      ],
      feedbackRecords: [
        { id: 'feedback-parent', learnerId: 'student-03', authorId: 'teacher-1', type: 'ACADEMIC', visibility: 'LEARNER_PARENT', body: 'Linh có tiến bộ tốt ở phần tương tác nói.', createdAt: at(-1) },
        { id: 'feedback-internal', learnerId: 'student-03', authorId: 'academic-1', type: 'COACHING', visibility: 'ACADEMIC_ONLY', body: 'Cần quan sát thêm cách phân nhóm hoạt động.', createdAt: at(-1) },
        { id: 'feedback-safeguarding', learnerId: 'student-canonical', authorId: 'teacher-1', type: 'SAFEGUARDING', visibility: 'RESTRICTED', body: 'Restricted demonstration record.', createdAt: at(-1) },
      ],
      notifications: [],
      outboundMessages: [],
      domainEvents: [],
      auditLogs: [{ id: 'audit-seed', actorId: 'admin-1', action: 'DEMO_DATA_SEEDED', resourceType: 'SYSTEM', resourceId: 'org-yen', detail: 'Khởi tạo dữ liệu demo v3.', occurredAt: at(0, 8) }],
      analyticsSnapshots: [],
      publicContent: {
        news: [{ id: 'news-1', title: 'Khai giảng lộ trình tiếng Anh tháng 9', category: 'Thông báo', publishedAt: at(-2), status: 'PUBLISHED' }],
        events: [{ id: 'event-1', title: 'Kiểm tra đầu vào miễn phí', startsAt: at(4, 9), location: 'Cơ sở Quận 3', status: 'PUBLISHED' }],
        documents: [{ id: 'document-1', title: 'Hướng dẫn cổng học tập', audience: 'Phụ huynh & Học viên', type: 'PDF', status: 'PUBLISHED' }],
      },
    };
  }

  root.YC.define('seed', Object.freeze({ createSeed }));
})(globalThis);

/*
 * Yen Center LMS — frontend prototype v2.0 · International Minimal UI
 * Zero-dependency hash-routed SPA using localStorage as a mock persistence layer.
 * Built to demonstrate the core cross-role remedial-learning workflow.
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'yen-center-lms-fe-state-v2';
  const SESSION_KEY = 'yen-center-lms-fe-session-v2';
  const app = document.getElementById('app');
  const toastRoot = document.getElementById('toast-root');

  function createStorageAdapter(storageName) {
    const memory = new Map();
    const getNative = () => {
      try { return window[storageName]; } catch { return null; }
    };
    return {
      getItem(key) {
        const native = getNative();
        if (native) { try { return native.getItem(key); } catch {} }
        return memory.has(key) ? memory.get(key) : null;
      },
      setItem(key, value) {
        const text = String(value);
        const native = getNative();
        if (native) { try { native.setItem(key, text); return; } catch {} }
        memory.set(key, text);
      },
      removeItem(key) {
        const native = getNative();
        if (native) { try { native.removeItem(key); } catch {} }
        memory.delete(key);
      },
    };
  }

  const persistentStore = createStorageAdapter('localStorage');
  const ephemeralStore = createStorageAdapter('sessionStorage');

  const runtime = {
    sidebarOpen: false,
    publicMenuOpen: false,
    attendanceDraft: {},
    videoTimer: null,
    quizStartedAt: null,
    supportOpen: false,
  };

  const pad = (value) => String(value).padStart(2, '0');
  const now = () => new Date();
  const dateOnly = (offsetDays = 0) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const isoAt = (dayOffset = 0, hour = 9, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const deepClone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const formatDate = (value, withTime = false) => {
    if (!value) return '—';
    const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', withTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }
    ).format(d);
  };
  const formatTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(d);
  };
  const relativeDate = (value) => {
    const target = new Date(value);
    const diff = Math.ceil((target - now()) / 86400000);
    if (diff < 0) return `Quá hạn ${Math.abs(diff)} ngày`;
    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Ngày mai';
    return `Còn ${diff} ngày`;
  };
  const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const percent = (value, total) => total ? Math.round((value / total) * 100) : 0;
  const maskPhone = (value = '') => {
    const text = String(value);
    if (text.length < 7) return text;
    return `${text.slice(0, 3)}••••${text.slice(-3)}`;
  };
  const maskContact = (value = '') => {
    const text = String(value);
    if (!text.includes('@')) return maskPhone(text);
    const [local, domain] = text.split('@');
    return `${local.slice(0, 2)}••@${domain}`;
  };
  const demoShareUrl = (assignment) => `${state?.settings?.demoBaseUrl || 'https://demo.yencenter.vn'}/hoc-bu/${assignment.accessToken}`;
  const sessionStatusLabel = (status) => ({ SCHEDULED: 'Sắp tới', OPEN: 'Đang mở', COMPLETED: 'Đã hoàn tất', CANCELLED: 'Đã hủy' }[status] || status);
  const roleLabel = (role) => ({ ADMIN: 'Quản trị viên', TEACHER: 'Giáo viên', TA: 'Trợ giảng', STUDENT: 'Học sinh' }[role] || role);

  function icon(name, size = 18) {
    const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
    const paths = {
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
      login: '<path d="M10 17l5-5-5-5M15 12H3m12-8h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/>',
      logout: '<path d="m14 8 4 4-4 4m4-4H8m2 8H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
      download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
      grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/>',
      repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
      chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
      trend: '<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
      clipboard: '<rect x="4" y="4" width="16" height="18" rx="2"/><path d="M9 4V2h6v2M8 11h8M8 15h8"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
      person: '<circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/>',
      layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
      plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8H6v4a6 6 0 0 0 12 0V8Z"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.88L4.2 6.06l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 16 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.18.36.5.7.9.9.34.17.72.27 1.1.27h.1v4h-.1c-.38 0-.76.1-1.1.27-.4.2-.72.54-.9.9Z"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
      route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h5a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H9a4 4 0 0 0-4 4"/>',
    };
    return `<svg ${common}>${paths[name] || paths.chevron}</svg>`;
  }

  function buildSeed() {
    const familyNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
    const middleNames = ['Minh', 'Khánh', 'Ngọc', 'Thu', 'Gia', 'Đức', 'Hải', 'Thanh', 'Quang', 'Mai'];
    const givenNames = ['Anh', 'An', 'Bảo', 'Bình', 'Chi', 'Dương', 'Giang', 'Hà', 'Hân', 'Huy', 'Khang', 'Linh', 'Long', 'Nam', 'Ngân', 'Phúc', 'Quân', 'Trang', 'Vy', 'Yến'];
    const classPlan = [
      { id: 'class-6a', code: 'ENG6A-T3T5-1800', name: 'English Foundation 6A', courseId: 'course-6', teacherId: 'teacher-1', taId: 'ta-1', count: 28, capacity: 30, schedule: 'Thứ 3, 5 · 18:00–19:30', room: 'Phòng 302' },
      { id: 'class-7b', code: 'ENG7B-T2T4-1900', name: 'English Foundation 7B', courseId: 'course-7', teacherId: 'teacher-2', taId: 'ta-2', count: 24, capacity: 26, schedule: 'Thứ 2, 4 · 19:00–20:30', room: 'Phòng 204' },
      { id: 'class-5c', code: 'ENG5C-T7CN-0900', name: 'English Foundation 5C', courseId: 'course-5', teacherId: 'teacher-3', taId: 'ta-3', count: 22, capacity: 24, schedule: 'Thứ 7, CN · 09:00–10:30', room: 'Phòng 101' },
    ];

    const students = [];
    let sequence = 1;
    classPlan.forEach((cls, classIndex) => {
      for (let i = 0; i < cls.count; i += 1) {
        const isCanonical = classIndex === 0 && i === 0;
        const name = isCanonical
          ? 'Nguyễn Minh Anh'
          : `${familyNames[(sequence + classIndex) % familyNames.length]} ${middleNames[(sequence * 3) % middleNames.length]} ${givenNames[(sequence * 7) % givenNames.length]}`;
        students.push({
          id: `student-${pad(sequence)}`,
          code: `HS${classIndex === 0 ? '6A' : classIndex === 1 ? '7B' : '5C'}${String(i + 1).padStart(3, '0')}`,
          name,
          phone: isCanonical ? '0901000001' : `09${String(10000000 + sequence).slice(-8)}`,
          dateOfBirth: `${2012 + classIndex}-${pad((i % 12) + 1)}-${pad((i % 25) + 1)}`,
          classId: cls.id,
          status: 'ACTIVE',
          avatar: initials(name),
        });
        sequence += 1;
      }
    });
    // Một số điện thoại được liên kết với hai hồ sơ để demo flow phụ huynh có nhiều con.
    students[1].phone = '0901000002';
    students[28].phone = '0901000002';

    const courses = [5, 6, 7].map((level) => ({
      id: `course-${level}`,
      code: `ENG-FND-${level}`,
      title: `English Foundation ${level}`,
      level: `Khối ${level}`,
      description: `Chương trình củng cố từ vựng, ngữ pháp và kỹ năng giao tiếp nền tảng dành cho học sinh khối ${level}.`,
      status: 'PUBLISHED',
      public: true,
    }));

    const courseQuizIds = {
      'course-5': 'quiz-course-5',
      'course-6': 'quiz-past-simple',
      'course-7': 'quiz-course-7',
    };
    const lessons = [];
    [5, 6, 7].forEach((level) => {
      for (let unit = 1; unit <= 4; unit += 1) {
        for (let lessonOrder = 1; lessonOrder <= 2; lessonOrder += 1) {
          const canonical = level === 6 && unit === 4 && lessonOrder === 2;
          const id = canonical ? 'lesson-past-simple' : `lesson-${level}-${unit}-${lessonOrder}`;
          lessons.push({
            id,
            courseId: `course-${level}`,
            unit,
            order: lessonOrder,
            title: canonical ? 'Unit 4 – Lesson 2: Past Simple' : `Unit ${unit} – Lesson ${lessonOrder}`,
            summary: canonical ? 'Ôn tập thì quá khứ đơn qua video, ví dụ và bài kiểm tra 10 câu.' : `Bài học thực hành tiếng Anh khối ${level}, Unit ${unit}.`,
            duration: 32 + unit * 4 + lessonOrder * 3,
            videoId: canonical ? 'video-canonical' : `video-${level}-${unit}-${lessonOrder}`,
            quizId: courseQuizIds[`course-${level}`],
            status: 'PUBLISHED',
          });
        }
      }
    });

    // Tất cả lesson đều trỏ tới một VideoAsset tồn tại. Phần còn lại là metadata kho video.
    const lessonVideos = lessons.map((lesson, index) => ({
      id: lesson.videoId,
      title: lesson.id === 'lesson-past-simple' ? 'Past Simple — Lesson Video' : `${lesson.title} — Video`,
      duration: 720 + (index % 12) * 65,
      provider: index < 5 ? 'LOCAL_DEMO' : 'BUNNY_METADATA',
      status: index < 5 ? 'READY' : 'METADATA_ONLY',
      lessonId: lesson.id,
    }));
    const extraVideos = Array.from({ length: 128 - lessonVideos.length }, (_, index) => ({
      id: `video-library-${index + 1}`,
      title: `Video thư viện ${index + 1}`,
      duration: 780 + (index % 10) * 58,
      provider: 'BUNNY_METADATA',
      status: 'METADATA_ONLY',
      lessonId: null,
    }));
    const videos = [...lessonVideos, ...extraVideos];

    const makeCourseQuestions = (level, courseId, prefix) => Array.from({ length: 10 }, (_, index) => {
      const correctIndex = (index + level) % 4;
      const options = ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'];
      return {
        id: `question-${prefix}-${index + 1}`,
        type: 'SINGLE_CHOICE',
        prompt: `Khối ${level} · Câu ôn tập số ${index + 1}: chọn phương án phù hợp.`,
        options,
        correctIndex,
        explanation: `Đáp án mẫu là “${options[correctIndex]}”. Nội dung này dùng cho dữ liệu demo, giáo viên có thể thay bằng câu hỏi thật.`,
        difficulty: index < 4 ? 'EASY' : index < 8 ? 'MEDIUM' : 'HARD',
        courseId,
      };
    });
    const course5Questions = makeCourseQuestions(5, 'course-5', '5');
    const canonicalQuestions = [
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
      id: `question-canonical-${index + 1}`,
      type: 'SINGLE_CHOICE',
      prompt: item[0],
      options: item[1],
      correctIndex: item[2],
      explanation: `Đáp án đúng là “${item[1][item[2]]}” vì câu mô tả một hành động hoặc trạng thái trong quá khứ.`,
      difficulty: index < 4 ? 'EASY' : index < 8 ? 'MEDIUM' : 'HARD',
      courseId: 'course-6',
    }));
    const course7Questions = makeCourseQuestions(7, 'course-7', '7');
    const questionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_BLANK', 'AUDIO', 'ORDERING', 'TRUE_FALSE', 'MATCHING', 'SHORT_ANSWER', 'ESSAY', 'FILE'];
    const questions = [...course5Questions, ...canonicalQuestions, ...course7Questions];
    for (let i = questions.length; i < 80; i += 1) {
      questions.push({
        id: `question-library-${i + 1}`,
        type: questionTypes[i % questionTypes.length],
        prompt: `Câu hỏi thư viện số ${i + 1} thuộc ngân hàng câu hỏi Yen Center.`,
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        correctIndex: i % 4,
        explanation: 'Lời giải mẫu được cấu hình bởi giáo viên.',
        difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        courseId: `course-${[5, 6, 7][i % 3]}`,
      });
    }

    const quizzes = [
      { id: 'quiz-course-5', lessonId: null, title: 'English Foundation 5 — Kiểm tra cuối bài', questionIds: course5Questions.map((q) => q.id), passingScore: 80, maxAttempts: 3, timeLimitMinutes: 12, status: 'PUBLISHED', showExplanation: 'AFTER_ATTEMPT' },
      { id: 'quiz-past-simple', lessonId: 'lesson-past-simple', title: 'Unit 4 – Lesson 2 Check', questionIds: canonicalQuestions.map((q) => q.id), passingScore: 80, maxAttempts: 3, timeLimitMinutes: 15, status: 'PUBLISHED', showExplanation: 'AFTER_ATTEMPT' },
      { id: 'quiz-course-7', lessonId: null, title: 'English Foundation 7 — Kiểm tra cuối bài', questionIds: course7Questions.map((q) => q.id), passingScore: 80, maxAttempts: 3, timeLimitMinutes: 15, status: 'PUBLISHED', showExplanation: 'AFTER_ATTEMPT' },
    ];

    const canonicalSession = {
      id: 'session-canonical',
      classId: 'class-6a',
      lessonId: 'lesson-past-simple',
      startsAt: isoAt(0, 18, 0),
      endsAt: isoAt(0, 19, 30),
      status: 'OPEN',
      attendanceFinalized: false,
      note: 'Buổi demo canonical — dùng để chạy luồng học bù E2E.',
    };
    const sessions = [canonicalSession];
    classPlan.forEach((cls, classIndex) => {
      const courseLessons = lessons.filter((lesson) => lesson.courseId === cls.courseId);
      [-12, -9, -7, -5, -3, 2].forEach((offset, index) => {
        sessions.push({
          id: `session-${cls.id}-${index + 1}`,
          classId: cls.id,
          lessonId: courseLessons[index % courseLessons.length].id,
          startsAt: isoAt(offset, classIndex === 2 ? 9 : 18 + classIndex, 0),
          endsAt: isoAt(offset, classIndex === 2 ? 10 : 19 + classIndex, 30),
          status: offset > 0 ? 'SCHEDULED' : 'COMPLETED',
          attendanceFinalized: offset < 0,
          note: '',
        });
      });
    });

    // Canonical session bắt đầu sạch: giáo viên chọn tất cả có mặt rồi đổi một học sinh sang Vắng.
    const attendance = students
      .filter((student) => student.classId === 'class-6a')
      .map((student) => ({
        id: `att-canonical-${student.id}`,
        sessionId: 'session-canonical',
        studentId: student.id,
        status: 'UNMARKED',
        markedBy: null,
        markedAt: null,
      }));

    // Các buổi quá khứ mặc định Có mặt; 12 cặp student-session phía dưới được đổi sang Vắng.
    sessions.filter((session) => session.status === 'COMPLETED').forEach((session) => {
      students.filter((student) => student.classId === session.classId).forEach((student) => {
        attendance.push({
          id: `att-${session.id}-${student.id}`,
          sessionId: session.id,
          studentId: student.id,
          status: 'PRESENT',
          markedBy: classPlan.find((c) => c.id === session.classId)?.teacherId,
          markedAt: session.startsAt,
        });
      });
    });

    const assignmentStatuses = ['ASSIGNED', 'ASSIGNED', 'IN_PROGRESS', 'IN_PROGRESS', 'IN_PROGRESS', 'NOT_PASSED', 'NOT_PASSED', 'PENDING_REVIEW', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'ASSIGNED'];
    const assignments = assignmentStatuses.map((status, index) => {
      const cls = classPlan[index % classPlan.length];
      const classSessions = sessions.filter((session) => session.classId === cls.id && session.status === 'COMPLETED');
      const session = classSessions[index % classSessions.length];
      const classStudents = students.filter((student) => student.classId === cls.id);
      const student = classStudents[(Math.floor(index / classPlan.length) + 2) % classStudents.length];
      const lesson = lessons.find((item) => item.id === session.lessonId);
      const quizId = courseQuizIds[cls.courseId];
      const dueOffset = status === 'COMPLETED' ? -2 : index > 9 ? -1 : 3 + (index % 5);
      const dueAt = isoAt(dueOffset, 23, 59);
      const record = attendance.find((item) => item.sessionId === session.id && item.studentId === student.id);
      if (record) record.status = 'ABSENT';
      return {
        id: `assignment-seed-${index + 1}`,
        studentId: student.id,
        sessionId: session.id,
        lessonId: lesson.id,
        quizId,
        lifecycleStatus: status,
        assignedAt: isoAt(-5 - (index % 5), 20, 0),
        dueAt,
        videoProgress: status === 'ASSIGNED' ? 0 : status === 'IN_PROGRESS' ? Math.min(95, 35 + index * 4) : status === 'NOT_PASSED' ? 92 : 100,
        score: status === 'COMPLETED' ? 90 : status === 'NOT_PASSED' ? 60 : null,
        completionMode: status === 'COMPLETED' ? 'AUTO' : null,
        completedAt: status === 'COMPLETED' ? isoAt(-2, 20, 0) : null,
        accessToken: `demo-${index + 1}-token`,
        accessStatus: 'ACTIVE',
        accessExpiresAt: dueAt,
        linkVersion: 1,
      };
    });

    const news = Array.from({ length: 6 }, (_, index) => ({
      id: `news-${index + 1}`,
      title: ['Khai giảng chương trình tiếng Anh tháng 9', '5 cách giúp con tự học hiệu quả', 'Lịch nghỉ lễ và kế hoạch học bù', 'Workshop dành cho phụ huynh', 'Cập nhật kho bài giảng số', 'Hoạt động ngoại khóa cuối tuần'][index],
      excerpt: 'Thông tin minh họa dành cho bản frontend prototype. Nội dung chính thức sẽ do Yen Center cung cấp.',
      publishedAt: isoAt(-index * 3, 8, 0),
      status: 'PUBLISHED',
      category: index % 2 ? 'Hướng dẫn' : 'Thông báo',
    }));
    const events = Array.from({ length: 4 }, (_, index) => ({
      id: `event-${index + 1}`,
      title: ['Kiểm tra đầu vào miễn phí', 'Demo nền tảng dành cho trung tâm', 'Ngày hội trải nghiệm học tập', 'Q&A cùng giáo viên'][index],
      startsAt: isoAt(index + 2, 9 + index, 0),
      status: 'PUBLISHED',
      location: index === 1 ? 'Online' : 'Yen Center · Cơ sở demo',
    }));
    const publicDocuments = [
      { id: 'doc-1', title: 'Lịch học tháng 9', type: 'PDF', audience: 'Phụ huynh & Học sinh', publishedAt: isoAt(-1, 9, 0) },
      { id: 'doc-2', title: 'Hướng dẫn truy cập cổng học tập', type: 'PDF', audience: 'Học sinh', publishedAt: isoAt(-3, 9, 0) },
      { id: 'doc-3', title: 'Quy định hoàn thành bài học bù', type: 'DOC', audience: 'Tất cả', publishedAt: isoAt(-5, 9, 0) },
      { id: 'doc-4', title: 'Mẫu báo cáo điểm danh', type: 'XLSX', audience: 'Trung tâm', publishedAt: isoAt(-7, 9, 0) },
    ];

    const leads = [
      { id: 'lead-1', code: 'YC-B2C-2401', type: 'B2C', name: 'Trần Thu Hà', organization: '', phone: '0909123456', email: 'hatr@example.com', message: 'Tư vấn chương trình khối 6.', details: { studentName: 'Trần Gia Bảo', grade: 'Khối 6', preferredTime: 'Buổi tối' }, status: 'NEW', createdAt: isoAt(-1, 10, 15) },
      { id: 'lead-2', code: 'YC-B2B-2402', type: 'B2B', name: 'Nguyễn Quốc Dũng', organization: 'Trung tâm Ánh Dương', phone: '0988123456', email: 'dung@nang.edu.vn', message: 'Cần demo giải pháp cho 450 học sinh.', details: { title: 'Giám đốc vận hành', scale: '200–500', centers: '2', preferredTime: 'Chiều thứ 5' }, status: 'CONTACTED', createdAt: isoAt(-2, 15, 0) },
      { id: 'lead-3', code: 'YC-B2C-2403', type: 'B2C', name: 'Phạm Ngọc Mai', organization: '', phone: '0912345678', email: '', message: 'Quan tâm lịch học cuối tuần.', details: { studentName: 'Phạm Hải Anh', grade: 'Khối 5', preferredTime: 'Cuối tuần' }, status: 'QUALIFIED', createdAt: isoAt(-4, 9, 30) },
    ];

    return {
      version: 2,
      seededAt: new Date().toISOString(),
      settings: {
        centerName: 'Yen Center',
        passingScore: 80,
        maxAttempts: 3,
        remedialDeadlineDays: 7,
        minimumVideoProgress: 0,
        manualMinutesPerAssignment: 5,
        integrationMode: 'MOCK',
        demoBaseUrl: 'https://demo.yencenter.vn',
      },
      users: [
        { id: 'admin-1', role: 'ADMIN', name: 'Nguyễn Minh Quân', email: 'admin@yencenter.demo', identifiers: ['admin@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'teacher-1', role: 'TEACHER', name: 'Hoàng Yến', email: 'teacher@yencenter.demo', identifiers: ['teacher@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'teacher-2', role: 'TEACHER', name: 'Lê Hải Nam', email: 'nam@yencenter.demo', identifiers: ['nam@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'teacher-3', role: 'TEACHER', name: 'Phạm Thu Hương', email: 'huong@yencenter.demo', identifiers: ['huong@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'teacher-4', role: 'TEACHER', name: 'Nguyễn Quốc Minh', email: 'minh@yencenter.demo', identifiers: ['minh@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'ta-1', role: 'TA', name: 'Trần Mai Anh', email: 'ta@yencenter.demo', identifiers: ['ta@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'ta-2', role: 'TA', name: 'Vũ Đức Long', email: 'long@yencenter.demo', identifiers: ['long@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'ta-3', role: 'TA', name: 'Nguyễn Ngọc Hà', email: 'ha@yencenter.demo', identifiers: ['ha@yencenter.demo'], secret: 'Demo@123', status: 'ACTIVE' },
        { id: 'student-login-1', role: 'STUDENT', name: 'Nguyễn Minh Anh', identifiers: ['HS6A001', '0901000001'], secret: '123456', studentIds: ['student-01'], status: 'ACTIVE' },
        { id: 'guardian-login', role: 'STUDENT', name: 'Tài khoản phụ huynh demo', identifiers: ['0901000002'], secret: '123456', studentIds: ['student-02', 'student-29'], status: 'ACTIVE' },
      ],
      students,
      classes: classPlan.map((cls) => ({ ...cls, status: 'ACTIVE', startDate: dateOnly(-55), endDate: dateOnly(90) })),
      courses,
      lessons,
      videos,
      questions,
      quizzes,
      sessions,
      attendance,
      assignments,
      attempts: [],
      notifications: [
        { id: 'notif-1', userId: 'teacher-1', title: 'Có bài học bù cần theo dõi', body: 'Mở danh sách học bù để kiểm tra deadline và tiến độ học sinh.', read: false, createdAt: isoAt(0, 8, 0) },
      ],
      outboundMessages: [
        { id: 'outbound-1', channel: 'EMAIL', recipient: 'parent.demo@example.com', template: 'REMEDIAL_ASSIGNED', status: 'MOCKED', createdAt: isoAt(-1, 10, 0) },
        { id: 'outbound-2', channel: 'ZALO', recipient: '0901000002', template: 'DEADLINE_REMINDER', status: 'MOCKED', createdAt: isoAt(-1, 15, 0) },
      ],
      audit: [
        { id: 'audit-1', actorId: 'admin-1', action: 'DEMO_DATA_SEEDED', resource: 'System', detail: 'Khởi tạo bộ dữ liệu frontend demo v2.0.', createdAt: new Date().toISOString() },
      ],
      leads,
      news,
      events,
      publicDocuments,
    };
  }

  function loadState() {
    try {
      const value = persistentStore.getItem(STORAGE_KEY);
      if (value) return JSON.parse(value);
    } catch (error) {
      console.warn('Cannot read local state', error);
    }
    const seed = buildSeed();
    persistentStore.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  let state = loadState();

  function saveState() {
    persistentStore.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getSession() {
    try { return JSON.parse(ephemeralStore.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }

  function setSession(value) {
    if (!value) ephemeralStore.removeItem(SESSION_KEY);
    else ephemeralStore.setItem(SESSION_KEY, JSON.stringify(value));
  }

  function currentUser() {
    const session = getSession();
    return session ? state.users.find((user) => user.id === session.userId) || null : null;
  }

  function currentStudent() {
    const session = getSession();
    return session?.selectedStudentId ? state.students.find((student) => student.id === session.selectedStudentId) || null : null;
  }

  function addAudit(action, resource, detail, actorId = currentUser()?.id || 'PUBLIC') {
    state.audit.unshift({ id: uid('audit'), actorId, action, resource, detail, createdAt: new Date().toISOString() });
  }

  function addNotification(userId, title, body) {
    state.notifications.unshift({ id: uid('notif'), userId, title, body, read: false, createdAt: new Date().toISOString() });
  }

  function showToast(title, message = '', type = 'info') {
    const node = document.createElement('div');
    node.className = `toast ${type}`;
    node.innerHTML = `<div>${type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}</div><div><strong>${escapeHtml(title)}</strong>${message ? `<p>${escapeHtml(message)}</p>` : ''}</div><button aria-label="Đóng">×</button>`;
    node.querySelector('button').addEventListener('click', () => node.remove());
    toastRoot.appendChild(node);
    setTimeout(() => node.remove(), 4800);
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, queryString = ''] = raw.split('?');
    return { path: path || '/', query: new URLSearchParams(queryString) };
  }

  function navigate(path) {
    runtime.sidebarOpen = false;
    runtime.publicMenuOpen = false;
    if (location.hash === `#${path}`) render();
    else location.hash = path;
  }

  function routeForRole(role) {
    if (role === 'STUDENT') return '/app/student/dashboard';
    if (role === 'TEACHER' || role === 'TA') return '/app/teacher/dashboard';
    return '/app/admin/dashboard';
  }

  function roleAllowsPath(role, path) {
    if (!path.startsWith('/app/')) return true;
    if (path.startsWith('/app/student')) return role === 'STUDENT';
    if (path.startsWith('/app/teacher')) return role === 'TEACHER' || role === 'TA';
    if (path.startsWith('/app/admin')) return role === 'ADMIN';
    return false;
  }

  function brandMarkup(compact = false) {
    return `<span class="brand"><span class="brand-mark" aria-hidden="true"></span><span class="brand-copy"><strong>YEN Center</strong>${compact ? '' : '<small>LEARNING PLATFORM</small>'}</span></span>`;
  }

  function publicHeader(active = '') {
    const primaryHref = active === 'b2b' ? '#/giai-phap-trung-tam' : '#/phu-huynh-hoc-sinh';
    return `
      <header class="public-header">
        <div class="container public-header-inner">
          <a href="#/" aria-label="Yen Center — Trang chủ">${brandMarkup()}</a>
          <nav class="public-nav ${runtime.publicMenuOpen ? 'open' : ''}" aria-label="Điều hướng chính">
            <a class="${active === 'home' ? 'active' : ''}" href="#/">Trang chủ</a>
            <a class="${active === 'programs' ? 'active' : ''}" href="#/chuong-trinh">Chương trình</a>
            <a class="${active === 'schedule' ? 'active' : ''}" href="#/lich-hoc">Lịch học</a>
            <a href="#/" data-action="go-workflow">Cách học bù hoạt động</a>
            <a class="${active === 'b2c' ? 'active' : ''}" href="#/phu-huynh-hoc-sinh">Phụ huynh & Học sinh</a>
            <a class="${active === 'b2b' ? 'active' : ''}" href="#/giai-phap-trung-tam">Giải pháp trung tâm</a>
          </nav>
          <div class="public-actions">
            <a class="btn btn-secondary btn-sm" href="#/login">Đăng nhập</a>
            <a class="btn btn-primary btn-sm" href="${primaryHref}">${active === 'b2b' ? 'Đặt lịch demo' : 'Đăng ký tư vấn'}</a>
          </div>
          <button class="icon-btn mobile-menu-btn" data-action="toggle-public-menu" aria-label="Mở menu">${runtime.publicMenuOpen ? icon('close') : icon('menu')}</button>
        </div>
      </header>`;
  }

  function publicFooter() {
    return `
      <footer class="public-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-col">
              ${brandMarkup()}
              <p class="text-small" style="max-width:300px;color:#9eb0c7">Nền tảng học tập và vận hành lớp học, giúp quá trình học bù rõ ràng, đo được và ít thao tác thủ công hơn.</p>
              <span class="badge badge-neutral" style="width:max-content;background:rgba(255,255,255,.08);color:#cbd5e1;border-color:rgba(255,255,255,.14)">Bản prototype v2.0</span>
            </div>
            <div class="footer-col"><h3>Khám phá</h3><a href="#/chuong-trinh">Chương trình</a><a href="#/lich-hoc">Lịch học</a><a href="#/phu-huynh-hoc-sinh">Dành cho học sinh</a><a href="#/giai-phap-trung-tam">Dành cho trung tâm</a></div>
            <div class="footer-col"><h3>Thông tin</h3><a href="#/tin-tuc">Tin tức</a><a href="#/su-kien">Sự kiện</a><a href="#/tai-lieu">Tài liệu / Thông báo</a><a href="#/faq">Câu hỏi thường gặp</a></div>
            <div class="footer-col"><h3>Liên hệ demo</h3><span>Hotline: 0900 000 000</span><span>demo@yencenter.local</span><span>Địa chỉ minh họa · TP.HCM</span><a href="#/login">Đăng nhập hệ thống</a></div>
          </div>
          <div class="footer-bottom"><span>© ${new Date().getFullYear()} Yen Center · Dữ liệu và thông tin liên hệ đều là minh họa.</span><span><a href="#/dieu-khoan-su-dung">Điều khoản sử dụng</a> · <a href="#/chinh-sach-bao-mat">Chính sách bảo mật</a></span></div>
        </div>
      </footer>`;
  }

  function supportWidget() {
    return `<div class="support-widget ${runtime.supportOpen ? 'open' : ''}">
      <button class="support-trigger" data-action="toggle-support" aria-expanded="${runtime.supportOpen ? 'true' : 'false'}" aria-controls="support-panel"><span>?</span><strong>Hỗ trợ</strong></button>
      <section class="support-panel" id="support-panel" aria-hidden="${runtime.supportOpen ? 'false' : 'true'}">
        <div class="between"><div><strong>Gửi yêu cầu hỗ trợ</strong><span class="cell-sub">Phản hồi bất đồng bộ · Không phải live chat</span></div><button class="icon-btn" data-action="toggle-support" aria-label="Đóng hỗ trợ">${icon('close',16)}</button></div>
        <form class="stack" data-form="support" novalidate>
          <div class="field"><label for="support-topic">Nhu cầu</label><select class="select" id="support-topic" name="topic" required><option value="">Chọn nhu cầu</option><option>Tư vấn khóa học</option><option>Hỗ trợ đăng nhập</option><option>Giải pháp cho trung tâm</option><option>Khác</option></select></div>
          <div class="field"><label for="support-name">Họ tên</label><input class="input" id="support-name" name="name" required></div>
          <div class="field"><label for="support-contact">Số điện thoại hoặc email</label><input class="input" id="support-contact" name="contact" required></div>
          <div class="field"><label for="support-message">Nội dung</label><textarea class="textarea" id="support-message" name="message" required></textarea></div>
          <button class="btn btn-primary btn-block" type="submit">Gửi yêu cầu</button>
        </form>
      </section>
    </div>`;
  }

  function publicLayout(content, active = '') {
    return `<div class="public-page">${publicHeader(active)}<main id="main-content">${content}</main>${publicFooter()}${supportWidget()}</div>`;
  }

  function homepage() {
    const completed = state.assignments.filter((a) => a.lifecycleStatus === 'COMPLETED').length;
    const activeClasses = state.classes.filter((c) => c.status === 'ACTIVE').length;
    const latestNews = state.news.slice().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 3);
    const upcomingEvents = state.events.slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)).slice(0, 2);
    return publicLayout(`
      <section class="hero">
        <div class="container hero-grid">
          <div>
            <span class="eyebrow">Learning operations, simplified</span>
            <h1>Học bù, từ điểm danh<br><span>đến kết quả.</span></h1>
            <p>Một luồng dữ liệu thống nhất cho học sinh, giáo viên và trung tâm — rõ trách nhiệm, rõ tiến độ, rõ kết quả.</p>
            <div class="inline">
              <a class="btn btn-primary btn-lg" href="#/phu-huynh-hoc-sinh">Dành cho phụ huynh & học sinh ${icon('arrow', 17)}</a>
              <a class="btn btn-secondary btn-lg" href="#/giai-phap-trung-tam">Giải pháp cho trung tâm</a>
            </div>
            <div class="hero-proof"><span><i class="check-dot">✓</i> Học đúng bài đã vắng</span><span><i class="check-dot">✓</i> Quiz tự chấm</span><span><i class="check-dot">✓</i> Dữ liệu minh bạch</span></div>
          </div>
          <div class="product-preview product-console" aria-label="Dòng hoạt động xuyên vai trò Yen Center">
            <div class="console-top"><span>YEN / OPERATIONS</span><span class="console-live"><i></i> LIVE DATA</span></div>
            <div class="console-headline"><small>HỌC BÙ · DÒNG HOẠT ĐỘNG</small><strong>Một quy trình. Ba vai trò. Một nguồn dữ liệu.</strong></div>
            <div class="console-rows">
              <article class="console-row"><span class="console-index">01</span><div><strong>Giáo viên ghi nhận vắng</strong><small>Nguyễn Minh Anh · English Foundation 6A</small></div><span class="console-state">Recorded</span></article>
              <article class="console-row"><span class="console-index">02</span><div><strong>Hệ thống tạo bài học bù</strong><small>Unit 4 — Lesson 2 · Deadline +7 ngày</small></div><span class="console-state">Assigned</span></article>
              <article class="console-row"><span class="console-index">03</span><div><strong>Học sinh hoàn tất bài kiểm tra</strong><small>8/10 câu đúng · 80/100 điểm</small></div><span class="console-state success">Completed</span></article>
            </div>
            <div class="console-footer"><div><strong>${state.students.length}</strong><span>học sinh</span></div><div><strong>${activeClasses}</strong><span>lớp hoạt động</span></div><div><strong>${completed}</strong><span>đã bù xong</span></div></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head center"><span class="eyebrow">Hai hành trình, một nền tảng</span><h2>Bắt đầu từ nhu cầu của bạn</h2><p>Thông điệp và luồng chuyển đổi được tách rõ cho phụ huynh/học sinh và đơn vị giáo dục.</p></div>
          <div class="audience-grid">
            <article class="audience-card">
              <div class="audience-icon">HS</div><h3>Phụ huynh & Học sinh</h3><p>Học sinh nghỉ học vẫn nhận đúng bài, học video, làm bài kiểm tra và theo dõi kết quả rõ ràng.</p>
              <ul><li><i class="check-dot">✓</i> Không bỏ lỡ nội dung quan trọng</li><li><i class="check-dot">✓</i> Học trên điện thoại, tablet hoặc máy tính</li><li><i class="check-dot">✓</i> Có điểm số và lời giải sau mỗi lần làm</li></ul>
              <a class="btn btn-blue" href="#/phu-huynh-hoc-sinh">Khám phá chương trình ${icon('arrow',16)}</a>
            </article>
            <article class="audience-card b2b">
              <div class="audience-icon">B2B</div><h3>Trung tâm & Trường học</h3><p>Quản lý lớp, giáo viên, điểm danh và toàn bộ luồng học bù trên một hệ thống có báo cáo.</p>
              <ul><li><i class="check-dot">✓</i> Điểm danh một chạm theo ca học</li><li><i class="check-dot">✓</i> Vắng là tự động giao đúng bài</li><li><i class="check-dot">✓</i> Theo dõi và xuất dữ liệu theo lớp/buổi</li></ul>
              <a class="btn btn-secondary" href="#/giai-phap-trung-tam">Xem giải pháp ${icon('arrow',16)}</a>
            </article>
          </div>
        </div>
      </section>

      <section class="section section-soft" id="workflow">
        <div class="container">
          <div class="section-head center"><span class="eyebrow">Workflow cốt lõi</span><h2>Học bù tự động trong 5 bước</h2><p>Từ một thao tác điểm danh, dữ liệu được nối xuyên suốt tới kết quả học tập.</p></div>
          <div class="workflow">
            ${[
              ['01','Điểm danh','Giáo viên đánh dấu Có mặt hoặc Vắng.'],
              ['02','Tự gắn bài','Hệ thống chọn bài tương ứng với buổi học.'],
              ['03','Học video','Học sinh mở bài và lưu tiến độ xem.'],
              ['04','Làm quiz','Bài được chấm tự động theo cấu hình.'],
              ['05','Đã bù xong','Đạt từ 80% thì báo cáo tự cập nhật.'],
            ].map(([n,t,d]) => `<article class="workflow-step"><div class="workflow-number">${n}</div><div><h3>${t}</h3><p>${d}</p></div></article>`).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head"><span class="eyebrow">Capability tổng quan</span><h2>Đủ các khối để vận hành một luồng học bù có thể truy vết</h2></div>
          <div class="feature-grid">
            ${[
              ['IAM','Đăng nhập & phân quyền','Student, Teacher, TA và Admin được điều hướng theo đúng vai trò.'],
              ['CLS','Quản lý lớp','Học sinh, giáo viên, enrollment, ca học, buổi học và điểm danh.'],
              ['LMS','Nội dung học','Course, lesson, video, tài liệu và mapping nội dung theo buổi học.'],
              ['QZ','Quiz & tự chấm','Question Bank, quiz, điểm đạt, số lần làm và lời giải.'],
              ['WF','Học bù tự động','Vắng → giao bài → học → đạt chuẩn → hoàn tất.'],
              ['RP','Báo cáo','Theo dõi theo lớp, buổi học, học sinh và xuất dữ liệu.'],
            ].map(([i,t,d]) => `<article class="feature-card"><div class="feature-icon">${i}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}
          </div>
        </div>
      </section>

      <section class="section section-warm">
        <div class="container">
          <div class="section-head center"><span class="eyebrow">Dữ liệu prototype</span><h2>Mọi con số đều lấy từ cùng một bộ mock data</h2></div>
          <div class="metric-row">
            <div class="metric"><strong>${state.videos.length}+</strong><small>Video metadata</small><span class="data-label">Dữ liệu minh họa</span></div>
            <div class="metric"><strong>${state.lessons.length}</strong><small>Bài học</small><span class="data-label">Dữ liệu minh họa</span></div>
            <div class="metric"><strong>${state.questions.length}</strong><small>Câu hỏi mẫu</small><span class="data-label">Dữ liệu minh họa</span></div>
            <div class="metric"><strong>${activeClasses}</strong><small>Lớp đang hoạt động</small><span class="data-label">Dữ liệu minh họa</span></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head"><span class="eyebrow">Chương trình học</span><h2>Thiết kế theo từng khối lớp</h2></div>
          ${programCards()}
        </div>
      </section>

      <section class="section section-soft">
        <div class="container">
          <div class="section-head"><span class="eyebrow">Tin tức & hoạt động</span><h2>Thông tin gần đây</h2><p>Nội dung lấy từ cùng dữ liệu CMS minh họa và có trang danh sách riêng.</p></div>
          <div class="resource-grid">
            ${latestNews.map((item) => `<article class="resource-card"><span class="badge badge-blue">${escapeHtml(item.category)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt)}</p><div class="between"><span class="text-small muted">${formatDate(item.publishedAt)}</span><a class="text-small" href="#/tin-tuc">Xem tin tức</a></div></article>`).join('')}
            ${upcomingEvents.map((item) => `<article class="resource-card event-card"><span class="event-date"><strong>${new Date(item.startsAt).getDate()}</strong><small>TH${new Date(item.startsAt).getMonth() + 1}</small></span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.location)}</p><a class="text-small" href="#/su-kien">Xem sự kiện</a></article>`).join('')}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container public-cta">
          <div><h2>Sẵn sàng xem hệ thống chạy xuyên vai trò?</h2><p>Dùng tài khoản demo để đi từ điểm danh vắng tới hoàn thành bài học bù.</p></div>
          <div class="inline"><a class="btn btn-blue btn-lg" href="#/login">Mở bản demo ${icon('arrow',17)}</a><a class="btn btn-secondary btn-lg" href="#/giai-phap-trung-tam">Đặt lịch demo</a></div>
        </div>
      </section>
    `, 'home');
  }

  function programCards() {
    return `<div class="program-grid">${state.courses.map((course) => {
      const lessonCount = state.lessons.filter((lesson) => lesson.courseId === course.id).length;
      return `<article class="program-card"><div class="program-cover"><strong>${escapeHtml(course.title)}</strong></div><div class="program-body"><div class="program-meta"><span>${escapeHtml(course.level)}</span><span>${lessonCount} bài học</span></div><p>${escapeHtml(course.description)}</p><a class="btn btn-secondary btn-sm" href="#/chuong-trinh/${course.id}">Xem chi tiết ${icon('arrow',14)}</a></div></article>`;
    }).join('')}</div>`;
  }

  function leadForm(type) {
    const b2b = type === 'B2B';
    const prefix = type.toLowerCase();
    return `<form class="form-card" data-form="lead" data-type="${type}" id="form-${type}" novalidate>
      <h2>${b2b ? 'Đặt lịch demo giải pháp' : 'Đăng ký tư vấn chương trình'}</h2>
      <p class="muted text-small">Thông tin được lưu vào Contact Inbox của Admin trong bản demo. Không gửi ra dịch vụ bên ngoài.</p>
      <div class="form-grid">
        ${b2b ? `
          <div class="field full"><label for="${prefix}-organization">Tên tổ chức *</label><input class="input" id="${prefix}-organization" name="organization" required placeholder="Trung tâm / Trường học"></div>
          <div class="field"><label for="${prefix}-name">Người liên hệ *</label><input class="input" id="${prefix}-name" name="name" required placeholder="Nguyễn Văn A"></div>
          <div class="field"><label for="${prefix}-title">Chức danh</label><input class="input" id="${prefix}-title" name="title" placeholder="Giám đốc / Quản lý vận hành"></div>
          <div class="field"><label for="${prefix}-phone">Số điện thoại *</label><input class="input" id="${prefix}-phone" name="phone" required inputmode="tel" pattern="[0-9+ ]{9,15}" placeholder="09xxxxxxxx"></div>
          <div class="field"><label for="${prefix}-email">Email *</label><input class="input" id="${prefix}-email" name="email" type="email" required placeholder="email@organization.vn"></div>
          <div class="field"><label for="${prefix}-scale">Quy mô học sinh</label><select class="select" id="${prefix}-scale" name="scale"><option value="">Chọn quy mô</option><option>Dưới 200</option><option>200–500</option><option>Trên 500</option></select></div>
          <div class="field"><label for="${prefix}-centers">Số cơ sở</label><input class="input" id="${prefix}-centers" name="centers" type="number" min="1" max="100" placeholder="1"></div>
          <div class="field full"><label for="${prefix}-preferred-time">Thời gian mong muốn demo</label><input class="input" id="${prefix}-preferred-time" name="preferredTime" placeholder="Ví dụ: chiều thứ 5 tuần tới"></div>
        ` : `
          <div class="field"><label for="${prefix}-name">Họ tên phụ huynh *</label><input class="input" id="${prefix}-name" name="name" required placeholder="Nguyễn Văn A"></div>
          <div class="field"><label for="${prefix}-phone">Số điện thoại *</label><input class="input" id="${prefix}-phone" name="phone" required inputmode="tel" pattern="[0-9+ ]{9,15}" placeholder="09xxxxxxxx"></div>
          <div class="field"><label for="${prefix}-student-name">Tên học sinh *</label><input class="input" id="${prefix}-student-name" name="studentName" required placeholder="Nguyễn Minh Anh"></div>
          <div class="field"><label for="${prefix}-grade">Khối/lớp quan tâm *</label><select class="select" id="${prefix}-grade" name="grade" required><option value="">Chọn khối</option><option>Khối 5</option><option>Khối 6</option><option>Khối 7</option></select></div>
          <div class="field"><label for="${prefix}-email">Email</label><input class="input" id="${prefix}-email" name="email" type="email" placeholder="email@example.com"></div>
          <div class="field"><label for="${prefix}-preferred-time">Thời gian tiện liên hệ</label><select class="select" id="${prefix}-preferred-time" name="preferredTime"><option value="">Chọn thời gian</option><option>Buổi sáng</option><option>Buổi chiều</option><option>Buổi tối</option><option>Cuối tuần</option></select></div>
        `}
        <div class="field full"><label for="${prefix}-message">Nhu cầu *</label><textarea class="textarea" id="${prefix}-message" name="message" required placeholder="Mô tả ngắn nhu cầu của bạn"></textarea></div>
        <label class="checkbox full"><input type="checkbox" name="consent" required><span>Tôi đồng ý để Yen Center xử lý thông tin nhằm liên hệ tư vấn.</span></label>
        <div class="field full"><button class="btn btn-primary btn-block btn-lg" type="submit">${b2b ? 'Gửi yêu cầu đặt demo' : 'Gửi yêu cầu tư vấn'}</button></div>
      </div>
    </form>`;
  }

  function b2cPage() {
    return publicLayout(`
      <section class="page-hero"><div class="container"><span class="eyebrow">Dành cho phụ huynh & học sinh</span><h1>Nghỉ một buổi, không bỏ lỡ cả chặng học.</h1><p>Học sinh nhận đúng bài đã vắng, xem video, làm bài kiểm tra và biết rõ mình đã hoàn thành đến đâu.</p></div></section>
      <section class="section"><div class="container split-layout"><div class="stack-lg">
        <div class="section-head"><h2>Học bù không còn là một link rời rạc</h2><p>Toàn bộ nội dung, hạn hoàn thành, tiến độ và kết quả được đặt trong một nhiệm vụ duy nhất.</p></div>
        <div class="feature-grid" style="grid-template-columns:1fr 1fr">
          <article class="feature-card"><div class="feature-icon">01</div><h3>Đúng bài đã vắng</h3><p>Hệ thống gắn lesson từ chính buổi học mà học sinh không tham gia.</p></article>
          <article class="feature-card"><div class="feature-icon">02</div><h3>Học mọi thiết bị</h3><p>Giao diện responsive cho điện thoại, tablet và máy tính.</p></article>
          <article class="feature-card"><div class="feature-icon">03</div><h3>Có lời giải</h3><p>Bài kiểm tra hiển thị điểm và giải thích theo cấu hình giáo viên.</p></article>
          <article class="feature-card"><div class="feature-icon">04</div><h3>Tiến độ rõ ràng</h3><p>Biết bài nào chưa bắt đầu, đang học, chưa đạt hoặc đã bù xong.</p></article>
        </div>
        <div class="panel"><div class="panel-head"><h2>Chương trình đang mở</h2></div><div class="panel-body">${programCards()}</div></div>
      </div>${leadForm('B2C')}</div></section>
    `, 'b2c');
  }

  function b2bPage() {
    return publicLayout(`
      <section class="page-hero"><div class="container"><span class="eyebrow">Giải pháp cho trung tâm & trường học</span><h1>Từ điểm danh đến học bù — một luồng, một nguồn dữ liệu.</h1><p>Giảm thao tác giao bài thủ công, theo dõi được kết quả từng học sinh và xuất báo cáo theo lớp, buổi học.</p></div></section>
      <section class="section"><div class="container">
        <div class="section-head center"><h2>Năm khối vận hành chính</h2><p>Frontend prototype mô phỏng đầy đủ dữ liệu xuyên module và xuyên role.</p></div>
        <div class="feature-grid">
          ${[
            ['CLS','Classroom','Học sinh, giáo viên, lớp, ca học, buổi học và điểm danh.'],
            ['LMS','Learning','Khóa học, bài học, video, tài liệu và learning progress.'],
            ['QZ','Assessment','Question Bank, quiz builder, auto grading và passing rule.'],
            ['WF','Automation','Trigger vắng, tạo assignment, deadline và completion.'],
            ['RP','Reporting','Attendance, remedial, quiz và progress report.'],
            ['API','Integration-ready','Adapter cho Bunny, Google Sheets, Email/SMS/Zalo.'],
          ].map(([i,t,d]) => `<article class="feature-card"><div class="feature-icon">${i}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}
        </div>
      </div></section>
      <section class="section section-soft"><div class="container split-layout"><div class="stack-lg">
        <div class="section-head"><span class="eyebrow">Core flow</span><h2>Workflow học bù là phần khác biệt chính</h2><p>Giáo viên chỉ thao tác điểm danh; hệ thống xử lý phần giao bài, theo dõi và cập nhật trạng thái.</p></div>
        <div class="panel"><div class="panel-body"><div class="workflow">${[['1','Vắng','Trigger'],['2','Giao bài','Tự động'],['3','Xem video','Tracking'],['4','Làm quiz','Auto grade'],['5','Hoàn tất','Report']].map(([n,t,d]) => `<article class="workflow-step"><div class="workflow-number">${n}</div><div><h3>${t}</h3><p>${d}</p></div></article>`).join('')}</div></div></div>
        <div class="alert alert-info"><strong>Phạm vi minh bạch:</strong><span>Prototype không bao gồm CRM đầy đủ, thanh toán học phí, live class, native mobile app, multi-tenant hoặc SSO live.</span></div>
      </div>${leadForm('B2B')}</div></section>
    `, 'b2b');
  }

  function programsPage(detailId = null) {
    if (detailId) {
      const course = state.courses.find((item) => item.id === detailId);
      if (!course) return notFoundPage();
      const lessons = state.lessons.filter((lesson) => lesson.courseId === course.id);
      return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">${escapeHtml(course.level)}</span><h1>${escapeHtml(course.title)}</h1><p>${escapeHtml(course.description)}</p></div></section><section class="section"><div class="container split-layout"><div class="panel"><div class="panel-head"><h2>Cấu trúc chương trình</h2><span class="badge badge-blue">${lessons.length} bài học</span></div><div class="panel-body stack">${lessons.map((lesson) => `<div class="between" style="padding:12px 0;border-bottom:1px solid var(--line-100)"><div><strong>${escapeHtml(lesson.title)}</strong><span class="cell-sub">${escapeHtml(lesson.summary)}</span></div><span class="badge badge-neutral">${lesson.duration} phút</span></div>`).join('')}</div></div>${leadForm('B2C')}</div></section>`, 'programs');
    }
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Chương trình học</span><h1>Lộ trình rõ ràng cho từng khối lớp</h1><p>Dữ liệu chương trình trong prototype được lấy trực tiếp từ cùng một mock database với khu vực Admin và LMS.</p></div></section><section class="section"><div class="container">${programCards()}</div></section>`, 'programs');
  }

  function contactPage() {
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Liên hệ</span><h1>Trao đổi nhu cầu với Yen Center</h1><p>Chọn form phù hợp; yêu cầu sẽ xuất hiện ngay trong Contact Inbox của Admin.</p></div></section><section class="section"><div class="container audience-grid">${leadForm('B2C')}${leadForm('B2B')}</div></section>`);
  }

  function faqPage() {
    const faqs = [
      ['Học sinh vắng sẽ nhận bài như thế nào?', 'Khi giáo viên lưu trạng thái Vắng, hệ thống tạo nhiệm vụ học bù từ lesson đã gắn với buổi học.'],
      ['Điểm bao nhiêu được tính là hoàn thành?', 'Mặc định 80%, Admin có thể cấu hình theo quiz hoặc quy tắc chung.'],
      ['Giáo viên có xem được lớp khác không?', 'Không. Teacher và TA chỉ truy cập lớp được phân công; route và dữ liệu đều phải kiểm tra quyền.'],
      ['Bản demo có gửi SMS/Zalo thật không?', 'Không. Prototype tạo outbound log ở mock mode để demo trạng thái gửi mà không cần credential ngoài.'],
    ];
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">FAQ</span><h1>Câu hỏi thường gặp</h1></div></section><section class="section"><div class="container" style="max-width:850px"><div class="stack">${faqs.map(([q,a]) => `<details class="form-card"><summary style="font-weight:800;cursor:pointer;color:var(--brand-950)">${q}</summary><p class="muted">${a}</p></details>`).join('')}</div></div></section>`);
  }

  function publicSchedulePage() {
    const visible = state.sessions
      .filter((session) => ['OPEN', 'SCHEDULED'].includes(session.status))
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Lịch học minh họa</span><h1>Các ca học đang mở</h1><p>Lịch dưới đây lấy từ cùng dữ liệu lớp và buổi học của khu vực vận hành. Không hiển thị thông tin cá nhân học sinh.</p></div></section>
      <section class="section"><div class="container"><div class="toolbar"><div><strong>${visible.length} buổi sắp tới</strong><span class="cell-sub">Múi giờ Asia/Ho_Chi_Minh</span></div><a class="btn btn-primary" href="#/phu-huynh-hoc-sinh">Đăng ký tư vấn</a></div>
      <div class="resource-grid">${visible.map((session) => { const cls = classById(session.classId); const course = state.courses.find((item) => item.id === cls?.courseId); return `<article class="resource-card"><div class="between"><span class="badge ${session.status === 'OPEN' ? 'badge-blue' : 'badge-neutral'}">${sessionStatusLabel(session.status)}</span><span class="text-xs muted">${escapeHtml(cls?.room || '')}</span></div><h2>${escapeHtml(cls?.name || '')}</h2><p>${escapeHtml(course?.description || '')}</p><div class="resource-meta"><span><strong>${formatDate(session.startsAt)}</strong></span><span>${formatTime(session.startsAt)}–${formatTime(session.endsAt)}</span><span>${escapeHtml(cls?.schedule || '')}</span></div></article>`; }).join('')}</div></div></section>`, 'schedule');
  }

  function publicNewsPage() {
    const items = state.news.slice().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Tin tức</span><h1>Cập nhật từ Yen Center</h1><p>Nội dung minh họa phục vụ review cấu trúc public website và CMS.</p></div></section><section class="section"><div class="container"><div class="resource-grid">${items.map((item) => `<article class="resource-card"><span class="badge badge-blue">${escapeHtml(item.category || 'Tin tức')}</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.excerpt)}</p><div class="between"><span class="text-small muted">${formatDate(item.publishedAt)}</span><span class="text-small muted">Dữ liệu minh họa</span></div></article>`).join('')}</div></div></section>`, 'news');
  }

  function publicEventsPage() {
    const items = state.events.slice().sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Sự kiện</span><h1>Hoạt động sắp diễn ra</h1><p>Người quan tâm có thể xem lịch và gửi yêu cầu tư vấn hoặc đặt demo.</p></div></section><section class="section"><div class="container"><div class="resource-grid">${items.map((item) => `<article class="resource-card"><span class="event-date"><strong>${new Date(item.startsAt).getDate()}</strong><small>TH${new Date(item.startsAt).getMonth() + 1}</small></span><h2>${escapeHtml(item.title)}</h2><div class="resource-meta"><span>${formatDate(item.startsAt, true)}</span><span>${escapeHtml(item.location)}</span></div><a class="btn btn-secondary btn-sm" href="#/lien-he">Đăng ký quan tâm</a></article>`).join('')}</div></div></section>`, 'events');
  }

  function publicDocumentsPage() {
    const items = state.publicDocuments || [];
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Tài liệu & thông báo</span><h1>Thông tin dùng chung</h1><p>Các record bên dưới là dữ liệu mẫu. Production cần object storage và chính sách public/private rõ ràng.</p></div></section><section class="section"><div class="container"><section class="panel"><div class="table-wrap"><table class="data-table mobile-cards"><thead><tr><th>Tài liệu</th><th>Đối tượng</th><th>Loại</th><th>Ngày đăng</th><th></th></tr></thead><tbody>${items.map((item) => `<tr><td data-label="Tài liệu"><span class="cell-primary">${escapeHtml(item.title)}</span></td><td data-label="Đối tượng">${escapeHtml(item.audience)}</td><td data-label="Loại"><span class="badge badge-neutral">${escapeHtml(item.type)}</span></td><td data-label="Ngày đăng">${formatDate(item.publishedAt)}</td><td><button class="btn btn-secondary btn-sm" data-action="download-demo-document" data-document-id="${item.id}">Tải bản mô phỏng</button></td></tr>`).join('')}</tbody></table></div></section></div></section>`, 'documents');
  }

  function legalPage(type) {
    const privacy = type === 'privacy';
    return publicLayout(`<section class="page-hero"><div class="container"><span class="eyebrow">Thông tin pháp lý mẫu</span><h1>${privacy ? 'Chính sách bảo mật' : 'Điều khoản sử dụng'}</h1><p>Nội dung bên dưới là cấu trúc mẫu cho frontend prototype, cần được pháp chế rà soát trước khi sử dụng thật.</p></div></section><section class="section"><div class="container" style="max-width:850px"><div class="form-card stack-lg">
      ${privacy ? `
        <section><h2>1. Dữ liệu được thu thập</h2><p>Thông tin tài khoản, lớp học, điểm danh, tiến độ học, kết quả quiz và dữ liệu liên hệ tự nguyện cung cấp.</p></section>
        <section><h2>2. Mục đích xử lý</h2><p>Vận hành lớp, cung cấp bài học bù, hỗ trợ người dùng, lập báo cáo và bảo vệ an toàn hệ thống.</p></section>
        <section><h2>3. Dữ liệu trẻ em</h2><p>Việc thu thập và sử dụng dữ liệu học sinh cần có căn cứ và sự đồng ý phù hợp từ phụ huynh/người giám hộ.</p></section>
        <section><h2>4. Quyền của người dùng</h2><p>Người dùng có thể yêu cầu truy cập, cập nhật hoặc xử lý dữ liệu theo chính sách chính thức của trung tâm.</p></section>` : `
        <section><h2>1. Phạm vi sử dụng</h2><p>Người dùng chỉ sử dụng tài khoản cho mục đích học tập và vận hành được phân quyền.</p></section>
        <section><h2>2. Tài khoản</h2><p>Không chia sẻ thông tin đăng nhập và không truy cập dữ liệu của người dùng khác.</p></section>
        <section><h2>3. Nội dung học tập</h2><p>Video, tài liệu và câu hỏi thuộc phạm vi sử dụng được trung tâm cấp; watermark không được tuyên bố là DRM tuyệt đối.</p></section>
        <section><h2>4. Giới hạn prototype</h2><p>Đây là bản demo frontend, không phải hệ thống production hoặc cam kết dịch vụ chính thức.</p></section>`}
    </div></div></section>`);
  }

  function loginPage() {
    return `<main class="auth-page" id="main-content">
      <section class="auth-side">
        <a href="#/">${brandMarkup()}</a>
        <div>
          <span class="eyebrow" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#dbeafe">Frontend prototype</span>
          <h1>Đi đủ luồng học bù trên cùng một bộ dữ liệu.</h1>
          <p>Đăng nhập bằng từng vai trò để demo: giáo viên điểm danh vắng, học sinh hoàn thành bài và admin xem báo cáo cập nhật.</p>
        </div>
        <div class="auth-workflow"><span>Điểm danh</span><i>→</i><span>Giao bài</span><i>→</i><span>Video</span><i>→</i><span>Quiz</span><i>→</i><span>Đã bù xong</span></div>
      </section>
      <section class="auth-main">
        <div class="auth-card">
          <a class="text-small muted" href="#/">← Quay lại trang chủ</a>
          <h2>Đăng nhập hệ thống</h2>
          <p>Hệ thống tự xác định vai trò từ tài khoản.</p>
          <form data-form="login" class="stack" novalidate>
            <div class="field"><label for="identifier">Email, mã học sinh hoặc số điện thoại</label><input class="input" id="identifier" name="identifier" autocomplete="username" required placeholder="teacher@yencenter.demo"></div>
            <div class="field"><label for="password">Mật khẩu / PIN</label><input class="input" id="password" name="secret" type="password" autocomplete="current-password" required placeholder="••••••••"></div>
            <div class="between"><label class="checkbox"><input type="checkbox" name="remember"><span>Ghi nhớ đăng nhập</span></label><a class="text-small" style="color:var(--primary-700)" href="#/forgot-password">Quên mật khẩu?</a></div>
            <button class="btn btn-primary btn-lg btn-block" type="submit">Đăng nhập ${icon('login', 17)}</button>
          </form>
          <div class="demo-accounts">
            <h3>Tài khoản demo — bấm để đăng nhập nhanh</h3>
            <div class="demo-grid">
              <button class="demo-account" data-action="quick-login" data-user-id="teacher-1"><strong>Giáo viên</strong><small>teacher@yencenter.demo</small></button>
              <button class="demo-account" data-action="quick-login" data-user-id="student-login-1"><strong>Học sinh</strong><small>HS6A001 · PIN 123456</small></button>
              <button class="demo-account" data-action="quick-login" data-user-id="admin-1"><strong>Admin</strong><small>admin@yencenter.demo</small></button>
              <button class="demo-account" data-action="quick-login" data-user-id="ta-1"><strong>Trợ giảng</strong><small>ta@yencenter.demo</small></button>
            </div>
            <div class="alert alert-info" style="margin-top:10px"><span><strong>Demo nhiều con:</strong> dùng số <code>0901000002</code> và PIN <code>123456</code>.</span></div>
          </div>
        </div>
      </section>
    </main>`;
  }

  function forgotPasswordPage() {
    return `<main class="auth-page"><section class="auth-side"><a href="#/">${brandMarkup()}</a><div><h1>Khôi phục tài khoản demo.</h1><p>OTP được mô phỏng trong frontend; không gửi SMS hoặc email thật.</p></div><div></div></section><section class="auth-main"><div class="auth-card"><a class="text-small muted" href="#/login">← Quay lại đăng nhập</a><h2>Quên mật khẩu</h2><p>Nhập email hoặc số điện thoại để tạo OTP demo.</p><form data-form="forgot" class="stack"><div class="field"><label for="recovery">Email / Số điện thoại</label><input class="input" id="recovery" name="identifier" required></div><button class="btn btn-primary btn-block" type="submit">Tạo mã OTP demo</button></form></div></section></main>`;
  }

  function verifyOtpPage() {
    const code = ephemeralStore.getItem('yen-demo-otp') || '123456';
    return `<main class="auth-page"><section class="auth-side"><a href="#/">${brandMarkup()}</a><div><h1>Xác thực OTP.</h1><p>Ở mock mode, mã được hiển thị để luồng demo không phụ thuộc provider ngoài.</p></div><div></div></section><section class="auth-main"><div class="auth-card"><a class="text-small muted" href="#/login">← Quay lại đăng nhập</a><h2>Nhập mã xác thực</h2><div class="alert alert-info" style="margin-bottom:18px">Mã OTP demo: <strong>${escapeHtml(code)}</strong></div><form data-form="otp" class="stack"><div class="field"><label for="otp">Mã gồm 6 số</label><input class="input" id="otp" name="otp" inputmode="numeric" maxlength="6" required></div><button class="btn btn-primary btn-block" type="submit">Xác thực</button></form></div></section></main>`;
  }

  function profileChooserPage() {
    const session = getSession();
    const user = currentUser();
    if (!user || user.role !== 'STUDENT' || !session?.pendingStudentIds?.length) return loginPage();
    const profiles = state.students.filter((student) => session.pendingStudentIds.includes(student.id));
    return `<main class="auth-page"><section class="auth-side"><a href="#/">${brandMarkup()}</a><div><h1>Chọn hồ sơ học sinh.</h1><p>Số điện thoại này được liên kết với nhiều học sinh. Chọn hồ sơ cần truy cập.</p></div><div></div></section><section class="auth-main"><div class="auth-card"><h2>Hồ sơ liên kết</h2><p>Tài khoản: ${escapeHtml(user.name)}</p><div class="stack">${profiles.map((student) => {
      const cls = state.classes.find((item) => item.id === student.classId);
      return `<button class="form-card between" style="text-align:left" data-action="select-student-profile" data-student-id="${student.id}"><span class="inline"><span class="avatar">${student.avatar}</span><span><strong>${escapeHtml(student.name)}</strong><span class="cell-sub">${escapeHtml(student.code)} · ${escapeHtml(cls?.name || '')}</span></span></span>${icon('chevron')}</button>`;
    }).join('')}</div><button class="btn btn-ghost btn-block" data-action="logout" style="margin-top:14px">Đăng xuất</button></div></section></main>`;
  }

  const roleNames = { ADMIN: 'Quản trị viên', TEACHER: 'Giáo viên', TA: 'Trợ giảng', STUDENT: 'Học sinh' };

  function navForRole(role) {
    if (role === 'STUDENT') return [
      ['Tổng quan', '/app/student/dashboard', 'DB'],
      ['Bài học của tôi', '/app/student/lessons', 'BH'],
      ['Bài học bù', '/app/student/remedial', 'HB'],
      ['Kết quả', '/app/student/results', 'KQ'],
      ['Tiến độ', '/app/student/progress', 'TD'],
      ['Thông báo', '/app/student/notifications', 'TB'],
    ];
    if (role === 'TEACHER' || role === 'TA') return [
      ['Tổng quan', '/app/teacher/dashboard', 'DB'],
      ['Lớp của tôi', '/app/teacher/classes', 'LH'],
      ['Lịch & điểm danh', '/app/teacher/sessions', 'DD'],
      ['Theo dõi học bù', '/app/teacher/remedial', 'HB'],
      ['Nội dung & Quiz', '/app/teacher/content', 'ND'],
      ['Báo cáo lớp', '/app/teacher/reports', 'BC'],
      ['Thông báo', '/app/teacher/notifications', 'TB'],
    ];
    return [
      ['Tổng quan', '/app/admin/dashboard', 'DB'],
      ['Tài khoản & RBAC', '/app/admin/users', 'RB'],
      ['Học sinh', '/app/admin/students', 'HS'],
      ['Lớp & Ca học', '/app/admin/classes', 'LH'],
      ['Nội dung LMS', '/app/admin/courses', 'ND'],
      ['Quản lý học bù', '/app/admin/remedial', 'HB'],
      ['Yêu cầu liên hệ', '/app/admin/contacts', 'YC'],
      ['Báo cáo', '/app/admin/reports', 'BC'],
      ['Tích hợp', '/app/admin/integrations', 'API'],
      ['Audit Log', '/app/admin/audit-logs', 'AL'],
      ['Cấu hình', '/app/admin/settings', 'CF'],
    ];
  }

  const navGlyphMap = {
    DB: 'grid', BH: 'book', HB: 'repeat', KQ: 'chart', TD: 'trend', TB: 'bell',
    LH: 'users', DD: 'calendar', ND: 'layers', BC: 'chart', RB: 'shield', HS: 'person',
    YC: 'clipboard', API: 'plug', AL: 'history', CF: 'settings', WEB: 'globe', E2E: 'route',
  };

  function navIcon(glyph) {
    return icon(navGlyphMap[glyph] || 'grid', 17);
  }

  function appShell(content, title, subtitle = '', activePath = '') {
    const user = currentUser();
    if (!user) return loginPage();
    const nav = navForRole(user.role);
    const notificationCount = state.notifications.filter((item) => item.userId === user.id && !item.read).length;
    return `<div class="app-layout role-${user.role.toLowerCase()}" data-role="${user.role}">
      <aside class="sidebar ${runtime.sidebarOpen ? 'open' : ''}" aria-label="Điều hướng ứng dụng">
        <div class="sidebar-head"><a href="#${routeForRole(user.role)}">${brandMarkup(true)}</a><span class="sidebar-context">${roleNames[user.role]}</span></div>
        <nav class="sidebar-nav">
          <div class="nav-group-label">Không gian làm việc</div>
          ${nav.map(([label, path, glyph]) => `<a class="sidebar-link ${activePath === path || (path !== routeForRole(user.role) && activePath.startsWith(path)) ? 'active' : ''}" href="#${path}"><span class="nav-glyph">${navIcon(glyph)}</span><span>${label}</span>${label === 'Thông báo' && notificationCount ? `<span class="badge badge-red" style="margin-left:auto">${notificationCount}</span>` : ''}</a>`).join('')}
          <div class="nav-group-label">Liên kết</div>
          <a class="sidebar-link" href="#/"><span class="nav-glyph">${navIcon('WEB')}</span><span>Website public</span></a>
          <a class="sidebar-link" href="#/demo-guide"><span class="nav-glyph">${navIcon('E2E')}</span><span>Hướng dẫn demo</span></a>
        </nav>
        <div class="sidebar-foot"><div class="sidebar-user"><span class="avatar">${initials(user.name)}</span><span class="truncate"><strong class="truncate">${escapeHtml(user.name)}</strong><small>${roleNames[user.role]}</small></span><button class="icon-btn" data-action="logout" title="Đăng xuất" aria-label="Đăng xuất">${icon('logout',16)}</button></div></div>
      </aside>
      <div class="app-column">
        <header class="topbar">
          <button class="icon-btn mobile-sidebar-toggle" data-action="toggle-sidebar" aria-label="Mở menu">${icon('menu')}</button>
          <div class="topbar-title"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(subtitle)}</small></div>
          <div class="topbar-actions"><span class="role-chip"><i></i>${roleNames[user.role]}</span><span class="environment-label">Prototype</span><button class="icon-btn" data-action="mark-notifications-read" title="Thông báo" aria-label="Thông báo">${icon('bell',17)}${notificationCount ? `<span class="notification-pulse"></span>` : ''}</button></div>
        </header>
        <main class="app-main" id="main-content"><div class="app-container">${content}</div></main>
      </div>
    </div>`;
  }

  function pageHeading(title, description, actions = '') {
    return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="inline">${actions}</div>` : ''}</div>`;
  }

  function statusMeta(assignment) {
    const isOverdue = assignment.lifecycleStatus !== 'COMPLETED' && assignment.lifecycleStatus !== 'CANCELLED' && new Date(assignment.dueAt) < now();
    const map = {
      ASSIGNED: ['Chưa bắt đầu', 'badge-neutral'],
      IN_PROGRESS: ['Đang học', 'badge-blue'],
      PENDING_REVIEW: ['Chờ chấm', 'badge-amber'],
      NOT_PASSED: ['Chưa đạt', 'badge-red'],
      COMPLETED: ['Đã bù xong', 'badge-green'],
      CANCELLED: ['Đã hủy', 'badge-neutral'],
    };
    const base = map[assignment.lifecycleStatus] || [assignment.lifecycleStatus, 'badge-neutral'];
    return { label: base[0], className: base[1], overdue: isOverdue };
  }

  function statusBadge(assignment) {
    const meta = statusMeta(assignment);
    return `<span class="badge ${meta.overdue ? 'badge-red' : meta.className}"><i class="dot"></i>${meta.overdue ? `Quá hạn · ${meta.label}` : meta.label}</span>`;
  }

  function attendanceBadge(status) {
    const map = { PRESENT: ['Có mặt', 'badge-green'], ABSENT: ['Vắng', 'badge-red'], UNMARKED: ['Chưa điểm danh', 'badge-neutral'] };
    const item = map[status] || [status, 'badge-neutral'];
    return `<span class="badge ${item[1]}"><i class="dot"></i>${item[0]}</span>`;
  }

  function classById(id) { return state.classes.find((item) => item.id === id); }
  function studentById(id) { return state.students.find((item) => item.id === id); }
  function userById(id) { return state.users.find((item) => item.id === id); }
  function lessonById(id) { return state.lessons.find((item) => item.id === id); }
  function sessionById(id) { return state.sessions.find((item) => item.id === id); }
  function assignmentById(id) { return state.assignments.find((item) => item.id === id); }

  function miniBarChart() {
    const values = [58, 72, 64, 82, 76, 91, 86];
    return `<div class="bar-chart">${values.map((value, index) => `<div class="bar-item"><div class="bar-stack" style="height:${value}%"><span class="bar-a" style="height:${Math.max(20, value - 20)}%"></span><span class="bar-b" style="height:${Math.min(35, value / 3)}%"></span></div><span class="bar-label">${['T2','T3','T4','T5','T6','T7','CN'][index]}</span></div>`).join('')}</div>`;
  }

  function activityList(limit = 5) {
    const items = state.audit.slice(0, limit);
    if (!items.length) return '<div class="panel-blank"><strong>Chưa có hoạt động</strong><span>Dữ liệu sẽ xuất hiện sau khi thao tác.</span></div>';
    return `<div class="activity-list">${items.map((item) => `<div class="activity-item"><span class="activity-icon">LOG</span><div><strong>${escapeHtml(item.action.replaceAll('_',' '))}</strong><p>${escapeHtml(item.detail)}</p></div><time>${formatTime(item.createdAt)}</time></div>`).join('')}</div>`;
  }

  function studentAssignments(studentId) {
    return state.assignments.filter((item) => item.studentId === studentId).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  }

  function studentDashboard() {
    const student = currentStudent();
    if (!student) return permissionPage(403, 'Chưa chọn hồ sơ học sinh', 'Hãy đăng nhập lại và chọn hồ sơ cần truy cập.');
    const assignments = studentAssignments(student.id);
    const pending = assignments.filter((a) => !['COMPLETED', 'CANCELLED'].includes(a.lifecycleStatus));
    const completed = assignments.filter((a) => a.lifecycleStatus === 'COMPLETED');
    const nearest = pending[0];
    const attempts = state.attempts.filter((a) => a.studentId === student.id);
    const avgScore = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length) : 0;
    const notifications = state.notifications.filter((n) => n.userId === currentUser().id).slice(0, 4);
    const content = `
      ${pageHeading(`Xin chào, ${escapeHtml(student.name.split(' ').slice(-2).join(' '))}`, 'Tiếp tục bài học và theo dõi các nhiệm vụ học bù của bạn.', nearest ? `<a class="btn btn-primary" href="#/app/student/remedial/${nearest.id}">Tiếp tục học ${icon('arrow',16)}</a>` : '')}
      <div class="kpi-grid">
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Bài học bù cần làm</span><span class="kpi-icon">HB</span></div><strong class="kpi-value">${pending.length}</strong><span class="kpi-caption">${nearest ? `Gần nhất: ${relativeDate(nearest.dueAt)}` : 'Không còn nhiệm vụ'}</span></article>
        <article class="kpi-card success"><div class="kpi-top"><span class="kpi-label">Đã bù xong</span><span class="kpi-icon">✓</span></div><strong class="kpi-value">${completed.length}</strong><span class="kpi-caption">Tính trên dữ liệu hiện tại</span></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Điểm trung bình</span><span class="kpi-icon">Đ</span></div><strong class="kpi-value">${avgScore || '—'}</strong><span class="kpi-caption">${attempts.length} lượt làm đã ghi nhận</span></article>
        <article class="kpi-card warning"><div class="kpi-top"><span class="kpi-label">Thông báo chưa đọc</span><span class="kpi-icon">TB</span></div><strong class="kpi-value">${state.notifications.filter((n) => n.userId === currentUser().id && !n.read).length}</strong><span class="kpi-caption">Nhiệm vụ, kết quả và deadline</span></article>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><h2>Bài học bù gần đây</h2><a class="text-small" style="color:var(--primary-700)" href="#/app/student/remedial">Xem tất cả</a></div><div class="panel-body">${assignments.length ? assignmentCards(assignments.slice(0, 4)) : emptyStudentAssignment()}</div></section>
        <section class="panel"><div class="panel-head"><h2>Thông báo</h2></div><div class="panel-body">${notifications.length ? `<div class="activity-list">${notifications.map((n) => `<div class="activity-item"><span class="activity-icon">TB</span><div><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.body)}</p></div><time>${formatTime(n.createdAt)}</time></div>`).join('')}</div>` : '<div class="panel-blank"><strong>Chưa có thông báo</strong></div>'}</div></section>
      </div>`;
    return appShell(content, 'Tổng quan học sinh', `${classById(student.classId)?.name || ''} · ${student.code}`, '/app/student/dashboard');
  }

  function assignmentCards(assignments) {
    return `<div class="assignment-grid">${assignments.map((assignment) => {
      const lesson = lessonById(assignment.lessonId);
      const session = sessionById(assignment.sessionId);
      const meta = statusMeta(assignment);
      return `<article class="assignment-card ${assignment.lifecycleStatus === 'COMPLETED' ? 'completed' : meta.overdue ? 'overdue' : ''}" data-status="${meta.overdue ? 'OVERDUE' : assignment.lifecycleStatus}">
        <div class="between">${statusBadge(assignment)}<span class="text-xs muted">${relativeDate(assignment.dueAt)}</span></div>
        <h3>${escapeHtml(lesson?.title || 'Bài học bù')}</h3>
        <div class="assignment-meta"><span>Buổi vắng: ${formatDate(session?.startsAt)}</span><span>Hạn: ${formatDate(assignment.dueAt, true)}</span></div>
        <div class="stack" style="margin-top:16px"><div class="between text-xs"><span class="muted">Tiến độ video</span><strong>${Math.min(100, Math.round(assignment.videoProgress || 0))}%</strong></div><div class="progress-track"><div class="progress-fill ${assignment.lifecycleStatus === 'COMPLETED' ? 'success' : ''}" style="width:${Math.min(100, assignment.videoProgress || 0)}%"></div></div></div>
        <div class="between" style="margin-top:16px"><span class="text-small muted">${assignment.score != null ? `Điểm: ${assignment.score}/100` : 'Chưa có kết quả'}</span><a class="btn btn-secondary btn-sm" href="#/app/student/remedial/${assignment.id}">${assignment.lifecycleStatus === 'COMPLETED' ? 'Xem lại' : assignment.lifecycleStatus === 'ASSIGNED' ? 'Bắt đầu' : 'Tiếp tục'} ${icon('chevron',14)}</a></div>
      </article>`;
    }).join('')}</div>`;
  }

  function emptyStudentAssignment() {
    return `<div class="empty-state"><div class="empty-icon">✓</div><h3>Chưa có bài học bù</h3><p>Khi giáo viên đánh dấu bạn vắng, nhiệm vụ mới sẽ xuất hiện tại đây.</p><a class="btn btn-secondary btn-sm" href="#/demo-guide">Xem cách chạy demo</a></div>`;
  }

  function studentLessons() {
    const student = currentStudent();
    if (!student) return permissionPage(403, 'Chưa chọn hồ sơ học sinh', 'Hãy đăng nhập lại và chọn hồ sơ cần truy cập.');
    const cls = classById(student.classId);
    const course = state.courses.find((item) => item.id === cls?.courseId);
    const lessons = state.lessons.filter((item) => item.courseId === course?.id).sort((a, b) => a.unit - b.unit || a.order - b.order);
    const assignments = studentAssignments(student.id);
    const content = `${pageHeading('Bài học của tôi', `${course?.title || 'Chương trình học'} · Nội dung được cấp theo lớp đang theo học.`)}
      <div class="course-overview"><div><span class="eyebrow">${escapeHtml(course?.level || '')}</span><h2>${escapeHtml(course?.title || '')}</h2><p>${escapeHtml(course?.description || '')}</p></div><div class="course-stat"><strong>${lessons.length}</strong><span>bài học</span></div></div>
      <div class="lesson-list">${lessons.map((lesson) => {
        const assignment = assignments.find((item) => item.lessonId === lesson.id && item.lifecycleStatus !== 'CANCELLED');
        const video = state.videos.find((item) => item.id === lesson.videoId);
        return `<article class="lesson-row"><div class="lesson-order">${lesson.unit}.${lesson.order}</div><div class="lesson-copy"><strong>${escapeHtml(lesson.title)}</strong><span>${escapeHtml(lesson.summary)}</span><div class="inline text-xs muted"><span>${lesson.duration} phút</span><span>•</span><span>Video ${video?.status === 'READY' ? 'sẵn sàng' : 'metadata'}</span><span>•</span><span>Có quiz</span></div></div><div class="lesson-action">${assignment ? `${statusBadge(assignment)}<a class="btn btn-secondary btn-sm" href="#/app/student/remedial/${assignment.id}">${assignment.lifecycleStatus === 'COMPLETED' ? 'Xem lại' : 'Tiếp tục'}</a>` : '<span class="badge badge-neutral">Theo lộ trình lớp</span>'}</div></article>`;
      }).join('')}</div>`;
    return appShell(content, 'Bài học của tôi', student.name, '/app/student/lessons');
  }

  function studentRemedialList() {
    const student = currentStudent();
    const assignments = studentAssignments(student.id);
    const content = `${pageHeading('Bài học bù', 'Theo dõi trạng thái, deadline, video và kết quả bài kiểm tra.')}
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="student-assignment-list" placeholder="Tìm theo tên bài học"></div><select class="select" data-assignment-filter style="width:auto"><option value="ALL">Tất cả trạng thái</option><option value="ASSIGNED">Chưa bắt đầu</option><option value="IN_PROGRESS">Đang học</option><option value="NOT_PASSED">Chưa đạt</option><option value="COMPLETED">Đã bù xong</option></select></div><div class="toolbar-right"><span class="text-small muted">${assignments.length} nhiệm vụ</span></div></div>
      <div data-search-group="student-assignment-list">${assignments.length ? assignmentCards(assignments) : emptyStudentAssignment()}</div>`;
    return appShell(content, 'Bài học bù', student.name, '/app/student/remedial');
  }

  function studentAssignmentDetail(id) {
    const student = currentStudent();
    const assignment = assignmentById(id);
    if (!assignment || assignment.studentId !== student.id) return permissionPage(403, 'Không có quyền truy cập', 'Bài học bù này không thuộc hồ sơ hiện tại.');
    const lesson = lessonById(assignment.lessonId);
    const session = sessionById(assignment.sessionId);
    const quiz = state.quizzes.find((item) => item.id === assignment.quizId);
    const lastAttempt = state.attempts.filter((item) => item.assignmentId === assignment.id).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0];
    const content = `${pageHeading(escapeHtml(lesson.title), `Bài học bù từ buổi ${formatDate(session.startsAt, true)}`, `<button class="btn btn-secondary" data-action="copy-assignment-link" data-assignment-id="${assignment.id}">${icon('copy',15)} Sao chép link</button>`)}
      ${assignment.lifecycleStatus === 'COMPLETED' ? `<div class="alert alert-success" style="margin-bottom:18px"><strong>Đã bù xong.</strong><span>Kết quả ${assignment.score}/100 được cập nhật vào báo cáo giáo viên và admin.</span></div>` : statusMeta(assignment).overdue ? `<div class="alert alert-danger" style="margin-bottom:18px"><strong>Nhiệm vụ đã quá hạn.</strong><span>Bạn vẫn có thể tiếp tục trong chế độ demo.</span></div>` : ''}
      <div class="lesson-layout">
        <div class="stack-lg">
          <section class="video-player">
            <div class="video-screen" data-video-screen="${assignment.id}">
              <button class="play-button" data-action="toggle-video" data-assignment-id="${assignment.id}" aria-label="Phát video">▶</button>
              <span class="watermark">${escapeHtml(student.code)} · ${escapeHtml(initials(student.name))}</span>
              <div class="video-caption"><strong>${escapeHtml(lesson.title)}</strong><small>Video bài giảng demo · Full HD</small></div>
            </div>
            <div class="video-controls"><div class="between"><small>Tiến độ xem</small><strong data-video-percent="${assignment.id}">${Math.round(assignment.videoProgress || 0)}%</strong></div><div class="progress-track"><div class="progress-fill" data-video-fill="${assignment.id}" style="width:${assignment.videoProgress || 0}%"></div></div><div class="video-control-row"><button class="btn btn-secondary btn-sm" data-action="video-progress" data-value="50" data-assignment-id="${assignment.id}">Xem tới 50%</button><button class="btn btn-secondary btn-sm" data-action="video-progress" data-value="85" data-assignment-id="${assignment.id}">Xem tới 85%</button><button class="btn btn-success btn-sm" data-action="video-progress" data-value="100" data-assignment-id="${assignment.id}">Hoàn tất video demo</button><span style="margin-left:auto">Tốc độ 1.0x</span></div></div>
          </section>
          <section class="panel"><div class="panel-head"><h2>Tóm tắt bài học</h2></div><div class="panel-body"><p>${escapeHtml(lesson.summary)}</p><div class="alert alert-info"><span>Điều kiện mặc định: đạt ít nhất <strong>${quiz?.passingScore || state.settings.passingScore}%</strong>. Video được tracking nhưng không chặn completion ở cấu hình hiện tại.</span></div></div></section>
          ${lastAttempt ? `<section class="panel"><div class="panel-head"><h2>Kết quả gần nhất</h2>${lastAttempt.score >= (quiz?.passingScore || 80) ? '<span class="badge badge-green">Đạt</span>' : '<span class="badge badge-red">Chưa đạt</span>'}</div><div class="panel-body between"><div><strong style="font-size:26px;color:var(--brand-950)">${lastAttempt.score}/100</strong><span class="cell-sub">Lần làm ${lastAttempt.attemptNo} · ${formatDate(lastAttempt.submittedAt, true)}</span></div><a class="btn btn-secondary" href="#/app/student/results">Xem chi tiết</a></div></section>` : ''}
        </div>
        <aside class="panel lesson-outline"><div class="panel-head"><h2>Nội dung bài học</h2></div><div class="panel-body"><div class="outline-item"><span class="outline-index">1</span><div><strong>Video bài giảng</strong><span class="cell-sub">${Math.round(assignment.videoProgress || 0)}% đã xem</span></div></div><div class="outline-item"><span class="outline-index">2</span><div><strong>Tài liệu ôn tập</strong><span class="cell-sub">Past Simple Notes.pdf</span></div></div><div class="outline-item"><span class="outline-index">3</span><div><strong>Bài kiểm tra</strong><span class="cell-sub">10 câu · ${quiz?.timeLimitMinutes || 15} phút</span></div></div><a class="btn btn-primary btn-block" style="margin-top:16px" href="#/app/student/quiz/${quiz.id}?assignment=${assignment.id}">${assignment.lifecycleStatus === 'COMPLETED' ? 'Làm lại để ôn tập' : 'Làm bài kiểm tra'} ${icon('arrow',15)}</a><div class="text-xs muted" style="margin-top:10px;text-align:center">Còn ${Math.max(0, (quiz?.maxAttempts || 3) - state.attempts.filter((a) => a.assignmentId === assignment.id).length)} lượt làm</div></div></aside>
      </div>`;
    return appShell(content, 'Chi tiết bài học bù', `${student.name} · Hạn ${formatDate(assignment.dueAt, true)}`, '/app/student/remedial');
  }

  function quizPage(quizId, assignmentId) {
    const student = currentStudent();
    const quiz = state.quizzes.find((item) => item.id === quizId);
    const assignment = assignmentById(assignmentId);
    if (!quiz || !assignment || assignment.studentId !== student.id) return permissionPage(403, 'Không thể mở bài kiểm tra', 'Dữ liệu quiz hoặc assignment không hợp lệ.');
    const existingAttempts = state.attempts.filter((item) => item.assignmentId === assignment.id);
    if (existingAttempts.length >= quiz.maxAttempts) return appShell(`${pageHeading('Đã hết lượt làm', 'Bạn đã sử dụng toàn bộ số lần làm được cấu hình.')}<div class="alert alert-warning"><span>Liên hệ giáo viên nếu cần mở thêm lượt làm.</span></div>`, 'Bài kiểm tra', quiz.title, '/app/student/remedial');
    const questions = quiz.questionIds.map((id) => state.questions.find((q) => q.id === id)).filter(Boolean);
    if (!runtime.quizStartedAt) runtime.quizStartedAt = Date.now();
    const content = `<div class="quiz-shell">
      ${pageHeading(escapeHtml(quiz.title), `Lần làm ${existingAttempts.length + 1}/${quiz.maxAttempts} · Điểm đạt ${quiz.passingScore}%`, `<button class="btn btn-secondary" data-action="fill-demo-quiz">Điền đáp án demo 8/10</button>`)}
      <form data-form="quiz" data-quiz-id="${quiz.id}" data-assignment-id="${assignment.id}" data-time-limit="${quiz.timeLimitMinutes || 15}">
        <div class="quiz-header"><div class="quiz-progress"><strong class="text-small">${questions.length} câu hỏi</strong><div class="progress-track"><div class="progress-fill" style="width:0" data-quiz-progress></div></div><span class="text-xs muted" data-quiz-answered>0/${questions.length} đã trả lời</span></div><span class="timer" data-quiz-timer>${pad(quiz.timeLimitMinutes || 15)}:00</span></div>
        ${questions.map((question, index) => `<section class="question-card" data-question-card="${question.id}"><h3><span class="question-index">Câu ${index + 1}.</span> ${escapeHtml(question.prompt)}</h3><div class="option-list">${question.options.map((option, optionIndex) => `<label class="option"><input type="radio" name="${question.id}" value="${optionIndex}"><span>${escapeHtml(option)}</span></label>`).join('')}</div></section>`).join('')}
        <div class="sticky-save"><div><strong>Kiểm tra trước khi nộp</strong><span class="cell-sub">Bài sẽ được chấm tự động và lưu vào mock database.</span></div><div class="inline"><a class="btn btn-secondary" href="#/app/student/remedial/${assignment.id}">Thoát</a><button class="btn btn-primary" type="submit">Nộp bài</button></div></div>
      </form>
    </div>`;
    return appShell(content, 'Làm bài kiểm tra', quiz.title, '/app/student/remedial');
  }

  function studentResults() {
    const student = currentStudent();
    const attempts = state.attempts.filter((item) => item.studentId === student.id).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    const content = `${pageHeading('Kết quả học tập', 'Điểm quiz, số lần làm và trạng thái hoàn thành.')}
      <section class="panel"><div class="panel-head"><h2>Lịch sử làm bài</h2><span class="badge badge-neutral">${attempts.length} lượt</span></div>${attempts.length ? `<div class="table-wrap"><table class="data-table mobile-cards"><thead><tr><th>Bài kiểm tra</th><th>Lần làm</th><th>Điểm</th><th>Kết quả</th><th>Thời gian</th></tr></thead><tbody>${attempts.map((attempt) => { const quiz = state.quizzes.find((q) => q.id === attempt.quizId); return `<tr><td data-label="Bài kiểm tra"><span class="cell-primary">${escapeHtml(quiz?.title || '')}</span></td><td data-label="Lần làm">${attempt.attemptNo}</td><td data-label="Điểm"><strong>${attempt.score}/100</strong></td><td data-label="Kết quả"><span class="badge ${attempt.score >= (quiz?.passingScore || 80) ? 'badge-green' : 'badge-red'}">${attempt.score >= (quiz?.passingScore || 80) ? 'Đạt' : 'Chưa đạt'}</span></td><td data-label="Thời gian">${formatDate(attempt.submittedAt, true)}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state"><div class="empty-icon">KQ</div><h3>Chưa có kết quả</h3><p>Hãy hoàn thành bài kiểm tra trong một nhiệm vụ học bù.</p></div>'}</section>`;
    return appShell(content, 'Kết quả', student.name, '/app/student/results');
  }

  function studentProgress() {
    const student = currentStudent();
    const assignments = studentAssignments(student.id);
    const completed = assignments.filter((a) => a.lifecycleStatus === 'COMPLETED').length;
    const avgVideo = assignments.length ? Math.round(assignments.reduce((s, a) => s + (a.videoProgress || 0), 0) / assignments.length) : 0;
    const content = `${pageHeading('Tiến độ của tôi', 'Tổng hợp video, quiz và học bù trên dữ liệu hiện tại.')}
      <div class="kpi-grid"><article class="kpi-card success"><span class="kpi-label">Tỷ lệ học bù hoàn tất</span><strong class="kpi-value">${percent(completed, assignments.length)}%</strong><span class="kpi-caption">${completed}/${assignments.length} nhiệm vụ</span></article><article class="kpi-card"><span class="kpi-label">Tiến độ video trung bình</span><strong class="kpi-value">${avgVideo}%</strong><span class="kpi-caption">Theo watched seconds mock</span></article></div>
      <section class="panel"><div class="panel-head"><h2>Tiến độ theo nhiệm vụ</h2></div><div class="panel-body">${assignments.length ? assignmentCards(assignments) : emptyStudentAssignment()}</div></section>`;
    return appShell(content, 'Tiến độ', student.name, '/app/student/progress');
  }

  function notificationPage(rolePath) {
    const user = currentUser();
    const notifications = state.notifications.filter((item) => item.userId === user.id);
    const content = `${pageHeading('Thông báo', 'Nhiệm vụ, deadline và kết quả học tập.', `<button class="btn btn-secondary" data-action="mark-notifications-read">Đánh dấu đã đọc</button>`)}<section class="panel"><div class="panel-body">${notifications.length ? `<div class="activity-list">${notifications.map((n) => `<div class="activity-item"><span class="activity-icon">TB</span><div><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.body)}</p></div><span class="badge ${n.read ? 'badge-neutral' : 'badge-blue'}">${n.read ? 'Đã đọc' : 'Mới'}</span></div>`).join('')}</div>` : '<div class="empty-state"><div class="empty-icon">TB</div><h3>Không có thông báo</h3></div>'}</div></section>`;
    return appShell(content, 'Thông báo', roleNames[user.role], rolePath);
  }

  function classesForCurrentStaff() {
    const user = currentUser();
    if (user.role === 'ADMIN') return state.classes;
    return state.classes.filter((cls) => cls.teacherId === user.id || cls.taId === user.id);
  }

  function teacherDashboard() {
    const user = currentUser();
    const classes = classesForCurrentStaff();
    const classIds = classes.map((c) => c.id);
    const sessions = state.sessions.filter((s) => classIds.includes(s.classId));
    const todaySessions = sessions.filter((s) => new Date(s.startsAt).toDateString() === now().toDateString());
    const assignments = state.assignments.filter((a) => classIds.includes(sessionById(a.sessionId)?.classId));
    const overdue = assignments.filter((a) => statusMeta(a).overdue).length;
    const absentToday = state.attendance.filter((a) => {
      const session = sessionById(a.sessionId);
      return a.status === 'ABSENT' && session && classIds.includes(session.classId) && new Date(session.startsAt).toDateString() === now().toDateString();
    }).length;
    const pendingGrading = assignments.filter((a) => a.lifecycleStatus === 'PENDING_REVIEW').length;
    const content = `
      ${pageHeading(`Chào ${escapeHtml(user.name.split(' ').slice(-2).join(' '))}`, 'Theo dõi lớp học, điểm danh và tiến độ học bù.', `<a class="btn btn-primary" href="#/app/teacher/sessions">Mở lịch & điểm danh</a>`)}
      <div class="kpi-grid">
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Lớp được phân công</span><span class="kpi-icon">LH</span></div><strong class="kpi-value">${classes.length}</strong><span class="kpi-caption">Đang hoạt động</span></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Buổi học hôm nay</span><span class="kpi-icon">BH</span></div><strong class="kpi-value">${todaySessions.length}</strong><span class="kpi-caption">${todaySessions[0] ? `${formatTime(todaySessions[0].startsAt)} · ${classById(todaySessions[0].classId)?.name}` : 'Không có lịch'}</span></article>
        <article class="kpi-card danger"><div class="kpi-top"><span class="kpi-label">Học sinh vắng hôm nay</span><span class="kpi-icon">V</span></div><strong class="kpi-value">${absentToday}</strong><span class="kpi-caption">Từ dữ liệu điểm danh</span></article>
        <article class="kpi-card warning"><div class="kpi-top"><span class="kpi-label">Cần xử lý</span><span class="kpi-icon">!</span></div><strong class="kpi-value">${overdue + pendingGrading}</strong><span class="kpi-caption">${overdue} quá hạn · ${pendingGrading} chờ chấm</span></article>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><h2>Lịch và lớp hôm nay</h2><a class="text-small" style="color:var(--primary-700)" href="#/app/teacher/sessions">Xem tất cả buổi học</a></div><div class="panel-body">${todaySessions.length ? todaySessions.map((session) => { const cls = classById(session.classId); return `<div class="between" style="padding:13px 0;border-bottom:1px solid var(--line-100)"><div class="inline"><span class="avatar">${cls.name.split(' ').slice(-1)[0]}</span><div><strong>${escapeHtml(cls.name)}</strong><span class="cell-sub">${formatTime(session.startsAt)}–${formatTime(session.endsAt)} · ${escapeHtml(cls.room)}</span></div></div><a class="btn btn-secondary btn-sm" href="#/app/teacher/sessions/${session.id}/attendance">Mở điểm danh</a></div>`; }).join('') : '<div class="panel-blank"><strong>Không có buổi học hôm nay</strong><span>Dùng trang Lịch & điểm danh để mở buổi demo.</span></div>'}</div></section>
        <section class="panel"><div class="panel-head"><h2>Hoạt động gần đây</h2></div><div class="panel-body">${activityList(5)}</div></section>
      </div>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Tình trạng học bù</h2><a class="text-small" style="color:var(--primary-700)" href="#/app/teacher/remedial">Xem chi tiết</a></div><div class="panel-body">${remedialSummary(assignments)}</div></section>`;
    return appShell(content, 'Tổng quan giáo viên', roleNames[user.role], '/app/teacher/dashboard');
  }

  function remedialSummary(assignments) {
    const groups = [
      ['Chưa bắt đầu', assignments.filter((a) => a.lifecycleStatus === 'ASSIGNED').length, 'badge-neutral'],
      ['Đang học', assignments.filter((a) => a.lifecycleStatus === 'IN_PROGRESS').length, 'badge-blue'],
      ['Chưa đạt', assignments.filter((a) => a.lifecycleStatus === 'NOT_PASSED').length, 'badge-red'],
      ['Đã bù xong', assignments.filter((a) => a.lifecycleStatus === 'COMPLETED').length, 'badge-green'],
      ['Quá hạn', assignments.filter((a) => statusMeta(a).overdue).length, 'badge-red'],
    ];
    return `<div class="metric-row">${groups.map(([label, count, cls], index) => `<div class="metric" ${index === 4 ? 'style="grid-column:auto"' : ''}><strong>${count}</strong><span class="badge ${cls}">${label}</span></div>`).join('')}</div>`;
  }

  function teacherClasses() {
    const classes = classesForCurrentStaff();
    const content = `${pageHeading('Lớp của tôi', 'Danh sách lớp, lịch học, học sinh và tình trạng điểm danh.')}
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="teacher-class-table" placeholder="Tìm theo tên hoặc mã lớp"></div></div><div class="toolbar-right"><span class="badge badge-neutral">${classes.length} lớp</span></div></div>
      <section class="panel"><div class="table-wrap"><table class="data-table mobile-cards" data-search-group="teacher-class-table"><thead><tr><th>Lớp</th><th>Chương trình</th><th>Lịch học</th><th>Học sinh</th><th>Học bù</th><th></th></tr></thead><tbody>${classes.map((cls) => {
        const count = state.students.filter((s) => s.classId === cls.id && s.status === 'ACTIVE').length;
        const assignments = state.assignments.filter((a) => sessionById(a.sessionId)?.classId === cls.id);
        return `<tr><td data-label="Lớp"><span class="cell-primary">${escapeHtml(cls.name)}</span><span class="cell-sub">${escapeHtml(cls.code)}</span></td><td data-label="Chương trình">${escapeHtml(state.courses.find((c) => c.id === cls.courseId)?.title || '')}</td><td data-label="Lịch học">${escapeHtml(cls.schedule)}<span class="cell-sub">${escapeHtml(cls.room)}</span></td><td data-label="Học sinh">${count}</td><td data-label="Học bù"><span class="badge badge-blue">${assignments.filter((a) => !['COMPLETED','CANCELLED'].includes(a.lifecycleStatus)).length} đang mở</span></td><td><div class="table-actions"><a class="btn btn-secondary btn-sm" href="#/app/teacher/classes/${cls.id}">Chi tiết</a></div></td></tr>`;
      }).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Lớp của tôi', currentUser().name, '/app/teacher/classes');
  }

  function teacherClassDetail(classId) {
    const cls = classById(classId);
    if (!cls || !classesForCurrentStaff().some((item) => item.id === cls.id)) return permissionPage(403, 'Không có quyền xem lớp', 'Tài khoản hiện tại không được phân công vào lớp này.');
    const students = state.students.filter((s) => s.classId === cls.id && s.status === 'ACTIVE');
    const sessions = state.sessions.filter((s) => s.classId === cls.id).sort((a,b) => new Date(b.startsAt)-new Date(a.startsAt));
    const assignments = state.assignments.filter((a) => sessionById(a.sessionId)?.classId === cls.id);
    const attendanceRecords = state.attendance.filter((a) => sessionById(a.sessionId)?.classId === cls.id);
    const absent = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
    const openSession = sessions.find((s) => s.status === 'OPEN') || sessions[0];
    const content = `${pageHeading(escapeHtml(cls.name), `${cls.code} · ${cls.schedule}`, openSession ? `<a class="btn btn-primary" href="#/app/teacher/sessions/${openSession.id}/attendance">Mở điểm danh</a>` : '')}
      <div class="kpi-grid"><article class="kpi-card"><span class="kpi-label">Học sinh active</span><strong class="kpi-value">${students.length}</strong></article><article class="kpi-card"><span class="kpi-label">Buổi học</span><strong class="kpi-value">${sessions.length}</strong></article><article class="kpi-card danger"><span class="kpi-label">Lượt vắng</span><strong class="kpi-value">${absent}</strong></article><article class="kpi-card success"><span class="kpi-label">Đã bù xong</span><strong class="kpi-value">${assignments.filter((a) => a.lifecycleStatus === 'COMPLETED').length}</strong></article></div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Danh sách học sinh</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Học sinh</th><th>Mã</th><th>Điện thoại</th><th>Học bù</th></tr></thead><tbody>${students.slice(0, 12).map((student) => { const sa = assignments.filter((a) => a.studentId === student.id); return `<tr><td><span class="cell-primary">${escapeHtml(student.name)}</span></td><td>${student.code}</td><td>${maskPhone(student.phone)}</td><td>${sa.length ? `<span class="badge badge-blue">${sa.length} nhiệm vụ</span>` : '<span class="muted">—</span>'}</td></tr>`; }).join('')}</tbody></table></div></section><section class="panel"><div class="panel-head"><h2>Thông tin lớp</h2></div><div class="panel-body stack"><div class="between"><span class="muted">Giáo viên</span><strong>${escapeHtml(userById(cls.teacherId)?.name || '')}</strong></div><div class="between"><span class="muted">Trợ giảng</span><strong>${escapeHtml(userById(cls.taId)?.name || '')}</strong></div><div class="between"><span class="muted">Phòng học</span><strong>${escapeHtml(cls.room)}</strong></div><div class="between"><span class="muted">Trạng thái</span><span class="badge badge-green">Đang hoạt động</span></div></div></section></div>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Buổi học</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Ngày giờ</th><th>Bài học</th><th>Trạng thái</th><th>Điểm danh</th><th></th></tr></thead><tbody>${sessions.map((session) => `<tr><td>${formatDate(session.startsAt, true)}</td><td>${escapeHtml(lessonById(session.lessonId)?.title || 'Chưa gắn bài')}</td><td><span class="badge ${session.status === 'OPEN' ? 'badge-blue' : session.status === 'COMPLETED' ? 'badge-green' : 'badge-neutral'}">${sessionStatusLabel(session.status)}</span></td><td>${state.attendance.filter((a) => a.sessionId === session.id && a.status !== 'UNMARKED').length}/${students.length}</td><td><a class="btn btn-secondary btn-sm" href="#/app/teacher/sessions/${session.id}/attendance">${session.status === 'COMPLETED' ? 'Xem lại' : 'Mở'}</a></td></tr>`).join('')}</tbody></table></div></section>`;
    return appShell(content, cls.name, currentUser().name, '/app/teacher/classes');
  }

  function attendancePage(sessionId) {
    const session = sessionById(sessionId);
    if (!session) return notFoundPage();
    const cls = classById(session.classId);
    if (!classesForCurrentStaff().some((item) => item.id === cls.id)) return permissionPage(403, 'Không có quyền điểm danh', 'Bạn không được phân công vào lớp của buổi học này.');
    const students = state.students.filter((student) => student.classId === cls.id && student.status === 'ACTIVE');
    if (!runtime.attendanceDraft[sessionId]) {
      runtime.attendanceDraft[sessionId] = Object.fromEntries(students.map((student) => [student.id, state.attendance.find((a) => a.sessionId === sessionId && a.studentId === student.id)?.status || 'UNMARKED']));
    }
    const draft = runtime.attendanceDraft[sessionId];
    const counts = { PRESENT: 0, ABSENT: 0, UNMARKED: 0 };
    Object.values(draft).forEach((status) => { counts[status] = (counts[status] || 0) + 1; });
    const content = `${pageHeading(`Điểm danh · ${escapeHtml(cls.name)}`, `${formatDate(session.startsAt, true)} · ${escapeHtml(lessonById(session.lessonId)?.title || 'Chưa gắn bài')}`, `<button class="btn btn-secondary" data-action="attendance-all-present" data-session-id="${sessionId}">Tất cả có mặt</button>`)}
      <div class="attendance-summary"><span class="summary-chip"><strong>${students.length}</strong> học sinh</span><span class="summary-chip" style="color:var(--success-700)"><strong data-att-count="PRESENT">${counts.PRESENT}</strong> Có mặt</span><span class="summary-chip" style="color:var(--danger-700)"><strong data-att-count="ABSENT">${counts.ABSENT}</strong> Vắng</span><span class="summary-chip"><strong data-att-count="UNMARKED">${counts.UNMARKED}</strong> Chưa chọn</span></div>
      <div class="alert alert-info" style="margin-bottom:14px"><span>Khi lưu một học sinh là <strong>Vắng</strong>, hệ thống sẽ tự tạo bài học bù từ lesson của buổi học. Trigger được kiểm tra để không sinh trùng assignment.</span></div>
      <section class="panel"><div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="attendance-table" placeholder="Tìm tên hoặc mã học sinh"></div><select class="select" data-row-filter="attendance-table" data-filter-attribute="att-status" style="width:auto"><option value="ALL">Tất cả trạng thái</option><option value="UNMARKED">Chưa chọn</option><option value="PRESENT">Có mặt</option><option value="ABSENT">Vắng</option></select></div><span class="badge ${session.attendanceFinalized ? 'badge-green' : 'badge-blue'}">${session.attendanceFinalized ? 'Đã chốt' : 'Đang mở'}</span></div><div class="table-wrap"><table class="data-table mobile-cards attendance-table" data-search-group="attendance-table"><thead><tr><th>Học sinh</th><th>Mã học sinh</th><th>Trạng thái hiện tại</th><th class="text-right">Điểm danh</th></tr></thead><tbody>${students.map((student) => {
        const status = draft[student.id];
        return `<tr data-att-row="${student.id}" data-att-status="${status}"><td data-label="Học sinh"><span class="inline"><span class="avatar">${student.avatar}</span><span><strong class="cell-primary">${escapeHtml(student.name)}</strong><span class="cell-sub">${escapeHtml(cls.name)}</span></span></span></td><td data-label="Mã học sinh">${student.code}</td><td data-label="Trạng thái" data-att-badge="${student.id}">${attendanceBadge(status)}</td><td data-label="Điểm danh" class="text-right"><div class="attendance-control"><button type="button" class="${status === 'PRESENT' ? 'active-present' : ''}" data-action="set-attendance" data-session-id="${sessionId}" data-student-id="${student.id}" data-status="PRESENT">Có mặt</button><button type="button" class="${status === 'ABSENT' ? 'active-absent' : ''}" data-action="set-attendance" data-session-id="${sessionId}" data-student-id="${student.id}" data-status="ABSENT">Vắng</button></div></td></tr>`;
      }).join('')}</tbody></table></div></section>
      <div class="sticky-save"><div><strong>Đã chọn ${students.length - counts.UNMARKED}/${students.length} học sinh</strong><span class="cell-sub">Không thể hoàn tất khi còn trạng thái chưa chọn.</span></div><div class="inline"><button class="btn btn-secondary" data-action="reset-attendance-draft" data-session-id="${sessionId}">Hoàn tác</button><button class="btn btn-primary" data-action="save-attendance" data-session-id="${sessionId}">Lưu điểm danh</button></div></div>`;
    return appShell(content, 'Điểm danh', `${cls.name} · ${formatDate(session.startsAt, true)}`, `/app/teacher/sessions/${sessionId}/attendance`);
  }

  function teacherSessions() {
    const classes = classesForCurrentStaff();
    const classIds = classes.map((item) => item.id);
    const rank = { OPEN: 0, SCHEDULED: 1, COMPLETED: 2, CANCELLED: 3 };
    const sessions = state.sessions.filter((item) => classIds.includes(item.classId)).sort((a, b) => { const r = (rank[a.status] ?? 9) - (rank[b.status] ?? 9); if (r) return r; return a.status === 'COMPLETED' ? new Date(b.startsAt) - new Date(a.startsAt) : new Date(a.startsAt) - new Date(b.startsAt); });
    const content = `${pageHeading('Lịch & điểm danh', 'Chọn đúng buổi học trước khi mở danh sách điểm danh.', `<a class="btn btn-primary" href="#/app/teacher/sessions/session-canonical/attendance">Mở buổi demo hôm nay</a>`)}
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="teacher-session-table" placeholder="Tìm lớp hoặc bài học"></div><select class="select" data-row-filter="teacher-session-table" data-filter-attribute="session-status" style="width:auto"><option value="ALL">Tất cả trạng thái</option><option value="OPEN">Đang mở</option><option value="SCHEDULED">Sắp tới</option><option value="COMPLETED">Đã hoàn tất</option></select></div><span class="badge badge-neutral">${sessions.length} buổi</span></div>
      <section class="panel"><div class="table-wrap"><table class="data-table mobile-cards" data-search-group="teacher-session-table"><thead><tr><th>Ngày giờ</th><th>Lớp</th><th>Bài học</th><th>Trạng thái</th><th>Điểm danh</th><th></th></tr></thead><tbody>${sessions.map((session) => { const cls = classById(session.classId); const studentCount = state.students.filter((item) => item.classId === cls?.id && item.status === 'ACTIVE').length; const marked = state.attendance.filter((item) => item.sessionId === session.id && item.status !== 'UNMARKED').length; return `<tr data-session-status="${session.status}"><td data-label="Ngày giờ"><span class="cell-primary">${formatDate(session.startsAt, true)}</span><span class="cell-sub">${formatTime(session.startsAt)}–${formatTime(session.endsAt)}</span></td><td data-label="Lớp"><span class="cell-primary">${escapeHtml(cls?.name || '')}</span><span class="cell-sub">${escapeHtml(cls?.room || '')}</span></td><td data-label="Bài học">${escapeHtml(lessonById(session.lessonId)?.title || 'Chưa gắn bài')}</td><td data-label="Trạng thái"><span class="badge ${session.status === 'OPEN' ? 'badge-blue' : session.status === 'COMPLETED' ? 'badge-green' : 'badge-neutral'}">${sessionStatusLabel(session.status)}</span></td><td data-label="Điểm danh">${marked}/${studentCount}</td><td><a class="btn btn-secondary btn-sm" href="#/app/teacher/sessions/${session.id}/attendance">${session.status === 'COMPLETED' ? 'Xem lại' : 'Mở điểm danh'}</a></td></tr>`; }).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Lịch & điểm danh', currentUser().name, '/app/teacher/sessions');
  }

  function remedialTable(assignments, groupId = 'teacher-remedial-table') {
    if (!assignments.length) return `<section class="panel"><div class="empty-state"><div class="empty-icon">HB</div><h3>Chưa có nhiệm vụ học bù</h3><p>Nhiệm vụ sẽ xuất hiện khi một học sinh được lưu trạng thái Vắng.</p></div></section>`;
    return `<section class="panel"><div class="table-wrap"><table class="data-table" data-search-group="${groupId}"><thead><tr><th>Học sinh</th><th>Buổi vắng / Bài học</th><th>Deadline</th><th>Video</th><th>Điểm</th><th>Trạng thái</th><th>Link</th><th></th></tr></thead><tbody>${assignments.map((assignment) => {
      const student = studentById(assignment.studentId);
      const session = sessionById(assignment.sessionId);
      const cls = classById(session?.classId);
      const lesson = lessonById(assignment.lessonId);
      const meta = statusMeta(assignment);
      const accessStatus = assignment.accessStatus || 'ACTIVE';
      return `<tr data-status="${meta.overdue ? 'OVERDUE' : assignment.lifecycleStatus}"><td><span class="cell-primary">${escapeHtml(student?.name || '')}</span><span class="cell-sub">${student?.code || ''} · ${escapeHtml(cls?.name || '')}</span></td><td><span class="cell-primary">${formatDate(session?.startsAt)}</span><span class="cell-sub">${escapeHtml(lesson?.title || '')}</span></td><td>${formatDate(assignment.dueAt)}<span class="cell-sub">${relativeDate(assignment.dueAt)}</span></td><td><div style="min-width:90px"><div class="between text-xs"><span></span><strong>${Math.round(assignment.videoProgress || 0)}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${assignment.videoProgress || 0}%"></div></div></div></td><td>${assignment.score != null ? `<strong>${assignment.score}</strong>/100` : '—'}</td><td>${statusBadge(assignment)}</td><td><span class="badge ${accessStatus === 'ACTIVE' ? 'badge-green' : 'badge-neutral'}">${accessStatus === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã thu hồi'}</span><span class="cell-sub">v${assignment.linkVersion || 1}</span></td><td><div class="table-actions"><button class="icon-btn" data-action="copy-assignment-link" data-assignment-id="${assignment.id}" title="Sao chép link" ${accessStatus !== 'ACTIVE' ? 'disabled' : ''}>${icon('copy',15)}</button><button class="btn btn-secondary btn-sm" data-action="open-link-manager" data-assignment-id="${assignment.id}">Quản lý link</button><button class="btn btn-secondary btn-sm" data-action="extend-deadline" data-assignment-id="${assignment.id}">Gia hạn</button></div></td></tr>`;
    }).join('')}</tbody></table></div></section>`;
  }

  function assignmentLinkModal(assignmentId) {
    const assignment = assignmentById(assignmentId);
    if (!assignment) return;
    const student = studentById(assignment.studentId);
    const lesson = lessonById(assignment.lessonId);
    const overlay = document.createElement('div');
    overlay.className = 'permission-page';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(8,27,57,.55);place-items:center;overflow:auto';
    const link = demoShareUrl(assignment);
    overlay.innerHTML = `<section class="form-card" style="width:min(680px,calc(100% - 28px));margin:30px"><div class="between"><div><h2>Quản lý link học bù</h2><p class="muted text-small">${escapeHtml(student?.name || '')} · ${escapeHtml(lesson?.title || '')}</p></div><button type="button" class="icon-btn" data-action="close-modal">${icon('close')}</button></div><div class="stack"><div class="field"><label>Link cá nhân hóa</label><div class="copy-field"><input class="input" readonly value="${escapeHtml(link)}"><button class="btn btn-secondary" data-action="copy-assignment-link" data-assignment-id="${assignment.id}" ${assignment.accessStatus === 'REVOKED' ? 'disabled' : ''}>${icon('copy',15)} Sao chép</button></div></div><div class="form-grid"><div class="field"><label>Trạng thái</label><span class="badge ${assignment.accessStatus === 'REVOKED' ? 'badge-neutral' : 'badge-green'}">${assignment.accessStatus === 'REVOKED' ? 'Đã thu hồi' : 'Đang hiệu lực'}</span></div><div class="field"><label>Phiên bản link</label><strong>v${assignment.linkVersion || 1}</strong></div><div class="field full"><label>Hết hạn truy cập</label><strong>${formatDate(assignment.accessExpiresAt || assignment.dueAt, true)}</strong></div></div><div class="alert alert-info"><span>Đây là URL minh họa để gửi cho học sinh. Hệ thống production phải kiểm tra token và quyền ở backend.</span></div><div class="inline" style="justify-content:flex-end"><button class="btn btn-secondary" data-action="regenerate-assignment-link" data-assignment-id="${assignment.id}">Tạo lại link</button>${assignment.accessStatus !== 'REVOKED' ? `<button class="btn btn-danger" data-action="revoke-assignment-link" data-assignment-id="${assignment.id}">Thu hồi link</button>` : ''}</div></div></section>`;
    document.body.appendChild(overlay);
  }

  function teacherRemedial() {
    const classes = classesForCurrentStaff();
    const classIds = classes.map((c) => c.id);
    const assignments = state.assignments.filter((a) => classIds.includes(sessionById(a.sessionId)?.classId)).sort((a,b) => new Date(b.assignedAt)-new Date(a.assignedAt));
    const content = `${pageHeading('Theo dõi học bù', 'Xem tiến độ video, điểm quiz, deadline và link cá nhân hóa.', `<button class="btn btn-secondary" data-action="export-remedial">${icon('download',15)} Xuất CSV</button>`)}
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="teacher-remedial-table" placeholder="Tìm học sinh, lớp hoặc bài học"></div><select class="select" data-row-filter="teacher-remedial-table" data-filter-attribute="status" style="width:auto"><option value="ALL">Tất cả trạng thái</option><option value="ASSIGNED">Chưa bắt đầu</option><option value="IN_PROGRESS">Đang học</option><option value="NOT_PASSED">Chưa đạt</option><option value="COMPLETED">Đã bù xong</option><option value="OVERDUE">Quá hạn</option></select></div><div class="toolbar-right"><span class="badge badge-neutral">${assignments.length} nhiệm vụ</span></div></div>
      ${remedialTable(assignments, 'teacher-remedial-table')}`;
    return appShell(content, 'Theo dõi học bù', currentUser().name, '/app/teacher/remedial');
  }

  function contentStudio() {
    const user = currentUser();
    const canAuthor = user.role === 'TEACHER' || user.role === 'ADMIN';
    const questions = state.questions.slice(0, 12);
    const action = canAuthor ? `<button class="btn btn-primary" data-action="demo-publish-content">${icon('plus',15)} Tạo nội dung mẫu</button>` : `<button class="btn btn-secondary" disabled title="Trợ giảng không có quyền tạo/publish mặc định">Chỉ xem</button>`;
    const content = `${pageHeading('Nội dung & Quiz', canAuthor ? 'Mô phỏng cấu trúc course, lesson, question bank và quiz builder.' : 'Trợ giảng được xem nội dung; tạo và publish bị giới hạn theo RBAC.', action)}
      ${!canAuthor ? '<div class="alert alert-warning" style="margin-bottom:18px"><span><strong>Quyền Trợ giảng:</strong> có thể xem cấu trúc và hỗ trợ lớp, nhưng không tạo hoặc publish nội dung theo cấu hình mặc định.</span></div>' : ''}
      <div class="content-grid">
        <aside class="course-tree"><div class="between" style="margin-bottom:10px"><strong>Cấu trúc khóa học</strong><span class="badge badge-neutral">24 bài</span></div><div class="tree-item level-1">English Foundation 6</div><div class="tree-item level-2">Unit 4</div><div class="tree-item level-3">Lesson 1</div><div class="tree-item level-3 active">Unit 4 – Lesson 2</div><div class="tree-item level-2">Unit 3</div><div class="tree-item level-3">Lesson 1</div></aside>
        <div class="stack-lg">
          <section class="editor-canvas"><div class="between"><div><span class="badge badge-green">Published</span><h2 style="margin:10px 0 4px;color:var(--brand-950)">Unit 4 – Lesson 2: Past Simple</h2><p class="muted">Video + tài liệu + quiz 10 câu</p></div><button class="btn btn-secondary" type="button" data-action="preview-canonical-lesson">Xem trước</button></div><div class="stack"><div class="editor-block"><strong>Video bài giảng</strong><span class="cell-sub">Past Simple — Lesson Video · READY</span></div><div class="editor-block"><strong>Tài liệu PDF</strong><span class="cell-sub">Past Simple Notes.pdf</span></div><div class="editor-block"><strong>Quiz cuối bài</strong><span class="cell-sub">Unit 4 – Lesson 2 Check · Điểm đạt 80%</span></div></div></section>
          <section class="panel"><div class="panel-head"><h2>Question Bank</h2><span class="badge badge-blue">${state.questions.length} câu hỏi</span></div><div class="toolbar"><div class="search-box"><input class="input" data-table-search="question-table" placeholder="Tìm câu hỏi"></div><select class="select" style="width:auto"><option>Tất cả loại</option><option>Single choice</option><option>Fill blank</option><option>Audio</option></select></div><div class="table-wrap"><table class="data-table" data-search-group="question-table"><thead><tr><th>Câu hỏi</th><th>Loại</th><th>Độ khó</th><th>Khóa học</th></tr></thead><tbody>${questions.map((q) => `<tr><td><span class="cell-primary">${escapeHtml(q.prompt)}</span></td><td><span class="badge badge-neutral">${q.type}</span></td><td>${q.difficulty}</td><td>${escapeHtml(state.courses.find((c) => c.id === q.courseId)?.title || '')}</td></tr>`).join('')}</tbody></table></div></section>
          <section class="panel"><div class="panel-head"><h2>Các loại câu hỏi trong scope</h2></div><div class="panel-body"><div class="question-type-grid">${['Trắc nghiệm 1 đáp án','Trắc nghiệm nhiều đáp án','Điền từ','Audio','Sắp xếp câu','Đúng / Sai','Ghép cặp','Câu trả lời ngắn','Tự luận','Đính kèm file'].map((item) => `<div class="question-type">${item}</div>`).join('')}</div><p class="text-xs muted" style="margin-bottom:0">Luồng E2E hiện thực thi quiz single-choice; các loại còn lại thể hiện phạm vi authoring để tiếp tục phát triển.</p></div></section>
        </div>
      </div>`;
    return appShell(content, 'Nội dung & Quiz', user.name, '/app/teacher/content');
  }

  function teacherReports() {
    const classes = classesForCurrentStaff();
    const classIds = classes.map((c) => c.id);
    const sessions = state.sessions.filter((s) => classIds.includes(s.classId)).sort((a,b) => new Date(b.startsAt)-new Date(a.startsAt));
    const content = `${pageHeading('Báo cáo lớp', 'Attendance, học bù và kết quả theo từng buổi học.', `<button class="btn btn-secondary" data-action="export-session-report">${icon('download',15)} Xuất CSV</button><button class="btn btn-secondary" data-action="print-page">${icon('print',15)} In / PDF</button>`)}
      <div class="kpi-grid"><article class="kpi-card"><span class="kpi-label">Tổng buổi học</span><strong class="kpi-value">${sessions.length}</strong></article><article class="kpi-card danger"><span class="kpi-label">Lượt vắng</span><strong class="kpi-value">${state.attendance.filter((a) => a.status === 'ABSENT' && classIds.includes(sessionById(a.sessionId)?.classId)).length}</strong></article><article class="kpi-card success"><span class="kpi-label">Đã bù xong</span><strong class="kpi-value">${state.assignments.filter((a) => a.lifecycleStatus === 'COMPLETED' && classIds.includes(sessionById(a.sessionId)?.classId)).length}</strong></article><article class="kpi-card"><span class="kpi-label">Tỷ lệ attendance</span><strong class="kpi-value">${attendanceRate(classIds)}%</strong></article></div>
      ${sessionReportTable(sessions)}`;
    return appShell(content, 'Báo cáo lớp', currentUser().name, '/app/teacher/reports');
  }

  function attendanceRate(classIds = state.classes.map((c) => c.id)) {
    const records = state.attendance.filter((a) => classIds.includes(sessionById(a.sessionId)?.classId) && a.status !== 'UNMARKED');
    return percent(records.filter((a) => a.status === 'PRESENT').length, records.length);
  }

  function sessionReportTable(sessions) {
    return `<section class="panel"><div class="toolbar"><div class="search-box"><input class="input" data-table-search="session-report-table" placeholder="Tìm lớp, buổi hoặc bài học"></div><span class="badge badge-neutral">Theo từng ClassSession</span></div><div class="table-wrap"><table class="data-table" data-search-group="session-report-table"><thead><tr><th>Buổi học</th><th>Lớp / Bài học</th><th>Học sinh</th><th>Có mặt</th><th>Vắng</th><th>Đã giao bù</th><th>Đã bù xong</th></tr></thead><tbody>${sessions.map((session) => {
      const cls = classById(session.classId); const total = state.students.filter((s) => s.classId === cls.id && s.status === 'ACTIVE').length; const records = state.attendance.filter((a) => a.sessionId === session.id); const assignments = state.assignments.filter((a) => a.sessionId === session.id);
      return `<tr><td><span class="cell-primary">${formatDate(session.startsAt, true)}</span><span class="cell-sub">${session.status}</span></td><td><span class="cell-primary">${escapeHtml(cls.name)}</span><span class="cell-sub">${escapeHtml(lessonById(session.lessonId)?.title || '')}</span></td><td>${total}</td><td><span class="badge badge-green">${records.filter((a) => a.status === 'PRESENT').length}</span></td><td><span class="badge badge-red">${records.filter((a) => a.status === 'ABSENT').length}</span></td><td>${assignments.length}</td><td>${assignments.filter((a) => a.lifecycleStatus === 'COMPLETED').length}</td></tr>`;
    }).join('')}</tbody></table></div></section>`;
  }

  function adminDashboard() {
    const todaySessions = state.sessions.filter((s) => new Date(s.startsAt).toDateString() === now().toDateString());
    const activeAssignments = state.assignments.filter((a) => !['COMPLETED','CANCELLED'].includes(a.lifecycleStatus));
    const completed = state.assignments.filter((a) => a.lifecycleStatus === 'COMPLETED').length;
    const overdue = state.assignments.filter((a) => statusMeta(a).overdue).length;
    const minutesSaved = state.assignments.length * state.settings.manualMinutesPerAssignment;
    const content = `${pageHeading('Tổng quan hệ thống', 'Dữ liệu vận hành được tổng hợp từ cùng một mock database.', `<button class="btn btn-secondary" data-action="reset-demo">${icon('reset',15)} Reset dữ liệu demo</button>`)}
      <div class="kpi-grid">
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Học sinh active</span><span class="kpi-icon">HS</span></div><strong class="kpi-value">${state.students.filter((s) => s.status === 'ACTIVE').length}</strong><span class="kpi-caption">Trên ${state.classes.length} lớp</span></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Buổi học hôm nay</span><span class="kpi-icon">BH</span></div><strong class="kpi-value">${todaySessions.length}</strong><span class="kpi-caption">${todaySessions.filter((s) => s.attendanceFinalized).length} đã chốt điểm danh</span></article>
        <article class="kpi-card warning"><div class="kpi-top"><span class="kpi-label">Học bù đang mở</span><span class="kpi-icon">HB</span></div><strong class="kpi-value">${activeAssignments.length}</strong><span class="kpi-caption">${overdue} nhiệm vụ quá hạn</span></article>
        <article class="kpi-card success"><div class="kpi-top"><span class="kpi-label">Giờ công tiết kiệm ước tính</span><span class="kpi-icon">TG</span></div><strong class="kpi-value">${(minutesSaved / 60).toFixed(1)}h</strong><span class="kpi-caption">${state.assignments.length} bài × ${state.settings.manualMinutesPerAssignment} phút</span></article>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><h2>Attendance & học bù trong tuần</h2><span class="badge badge-neutral">Dữ liệu minh họa</span></div><div class="panel-body">${miniBarChart()}<div class="inline text-xs muted" style="justify-content:center"><span class="inline"><i style="width:8px;height:8px;background:#7eb2fb;border-radius:2px"></i>Có mặt</span><span class="inline"><i style="width:8px;height:8px;background:var(--brand-800);border-radius:2px"></i>Học bù hoàn tất</span></div></div></section>
        <section class="panel"><div class="panel-head"><h2>Hoạt động hệ thống</h2><a class="text-small" style="color:var(--primary-700)" href="#/app/admin/audit-logs">Audit log</a></div><div class="panel-body">${activityList(6)}</div></section>
      </div>
      <div class="dashboard-grid" style="margin-top:18px">
        <section class="panel"><div class="panel-head"><h2>Yêu cầu mới</h2><a class="text-small" style="color:var(--primary-700)" href="#/app/admin/contacts">Xem inbox</a></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Người liên hệ</th><th>Loại</th><th>Trạng thái</th><th>Thời gian</th></tr></thead><tbody>${state.leads.slice(0,5).map((lead) => `<tr><td><span class="cell-primary">${escapeHtml(lead.name)}</span><span class="cell-sub">${escapeHtml(lead.organization || lead.phone)}</span></td><td><span class="badge ${lead.type === 'B2B' ? 'badge-violet' : 'badge-blue'}">${lead.type}</span></td><td><span class="badge badge-neutral">${lead.status}</span></td><td>${formatDate(lead.createdAt, true)}</td></tr>`).join('')}</tbody></table></div></section>
        <section class="panel"><div class="panel-head"><h2>Trạng thái học bù</h2></div><div class="panel-body">${remedialSummary(state.assignments)}</div></section>
      </div>`;
    return appShell(content, 'Tổng quan hệ thống', 'Yen Center Learning Platform', '/app/admin/dashboard');
  }

  function adminUsers() {
    const roleCounts = ['ADMIN', 'TEACHER', 'TA', 'STUDENT'].map((role) => [role, state.users.filter((item) => item.role === role).length]);
    const content = `${pageHeading('Tài khoản & phân quyền', 'Quản lý account đăng nhập và kiểm tra quyền theo vai trò.')}
      <div class="kpi-grid">${roleCounts.map(([role, count]) => `<article class="kpi-card"><span class="kpi-label">${roleLabel(role)}</span><strong class="kpi-value">${count}</strong><span class="kpi-caption">Tài khoản demo</span></article>`).join('')}</div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h2>Tài khoản</h2><span class="badge badge-neutral">${state.users.length} accounts</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Người dùng</th><th>Định danh</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>${state.users.map((user) => `<tr><td><span class="cell-primary">${escapeHtml(user.name)}</span></td><td>${escapeHtml(user.identifiers?.[0] || user.email || '')}</td><td><span class="badge ${user.role === 'ADMIN' ? 'badge-violet' : user.role === 'STUDENT' ? 'badge-blue' : 'badge-neutral'}">${roleLabel(user.role)}</span></td><td><span class="badge badge-green">${user.status || 'ACTIVE'}</span></td></tr>`).join('')}</tbody></table></div></section>
      <section class="panel"><div class="panel-head"><h2>RBAC rút gọn</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Capability</th><th>Student</th><th>TA</th><th>Teacher</th><th>Admin</th></tr></thead><tbody>${[
        ['Xem dữ liệu cá nhân','✓','✓','✓','✓'],['Xem lớp được giao','—','✓','✓','✓'],['Điểm danh','—','✓','✓','✓'],['Tạo nội dung','—','Giới hạn','✓','✓'],['Publish nội dung','—','—','✓','✓'],['Quản trị account','—','—','—','✓'],['Xem audit toàn hệ thống','—','—','—','✓']
      ].map((row) => `<tr>${row.map((cell, index) => `<${index ? 'td' : 'td'}>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section></div>`;
    return appShell(content, 'Tài khoản & RBAC', 'Authentication và Authorization', '/app/admin/users');
  }

  function adminRemedial() {
    const assignments = state.assignments.slice().sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
    const content = `${pageHeading('Quản lý học bù', 'Theo dõi toàn trung tâm, xử lý deadline và quản lý link cá nhân hóa.', `<button class="btn btn-secondary" data-action="export-remedial">${icon('download',15)} Xuất CSV</button>`)}
      <div class="kpi-grid"><article class="kpi-card"><span class="kpi-label">Tổng nhiệm vụ</span><strong class="kpi-value">${assignments.length}</strong></article><article class="kpi-card"><span class="kpi-label">Đang học</span><strong class="kpi-value">${assignments.filter((item) => item.lifecycleStatus === 'IN_PROGRESS').length}</strong></article><article class="kpi-card success"><span class="kpi-label">Đã bù xong</span><strong class="kpi-value">${assignments.filter((item) => item.lifecycleStatus === 'COMPLETED').length}</strong></article><article class="kpi-card danger"><span class="kpi-label">Quá hạn</span><strong class="kpi-value">${assignments.filter((item) => statusMeta(item).overdue).length}</strong></article></div>
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="admin-remedial-table" placeholder="Tìm học sinh, lớp hoặc bài học"></div><select class="select" data-row-filter="admin-remedial-table" data-filter-attribute="status" style="width:auto"><option value="ALL">Tất cả trạng thái</option><option value="ASSIGNED">Chưa bắt đầu</option><option value="IN_PROGRESS">Đang học</option><option value="NOT_PASSED">Chưa đạt</option><option value="COMPLETED">Đã bù xong</option><option value="OVERDUE">Quá hạn</option></select></div></div>
      ${remedialTable(assignments, 'admin-remedial-table')}`;
    return appShell(content, 'Quản lý học bù', 'Toàn trung tâm', '/app/admin/remedial');
  }

  function adminIntegrations() {
    const outbox = state.outboundMessages || [];
    const content = `${pageHeading('Tích hợp & Outbox', 'Adapter demo cho Bunny Stream, Google Sheets, Email, SMS và Zalo.', `<button class="btn btn-primary" data-action="mock-sync">Chạy Google Sheets mock sync</button>`)}
      <div class="integration-grid">${[
        ['Bunny Stream','Video local + provider metadata','Mock ready'],['Google Sheets','Preview và sync job giả lập','Mock ready'],['Email','Outbound record, preview, retry','Mock ready'],['SMS / Zalo','Không gửi thật khi thiếu credential','Mock ready']
      ].map(([name, desc, status]) => `<article class="integration-card"><div class="between"><strong>${name}</strong><span class="badge badge-green">${status}</span></div><p>${desc}</p></article>`).join('')}</div>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Outbound message log</h2><span class="badge badge-neutral">${outbox.length} records</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Thời gian</th><th>Kênh</th><th>Người nhận</th><th>Template</th><th>Trạng thái</th></tr></thead><tbody>${outbox.map((item) => `<tr><td>${formatDate(item.createdAt, true)}</td><td>${escapeHtml(item.channel)}</td><td>${escapeHtml(maskContact(item.recipient))}</td><td>${escapeHtml(item.template)}</td><td><span class="badge badge-neutral">${escapeHtml(item.status)}</span></td></tr>`).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Tích hợp', 'Mock adapters', '/app/admin/integrations');
  }

  function adminStudents() {
    const content = `${pageHeading('Quản lý học sinh', 'Tìm kiếm, thêm mới và xem lớp hiện tại.', `<button class="btn btn-primary" data-action="open-add-student">${icon('plus',15)} Thêm học sinh</button>`)}
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="admin-student-table" placeholder="Tìm tên, mã hoặc số điện thoại"></div><select class="select" data-row-filter="admin-student-table" data-filter-attribute="class" style="width:auto"><option value="ALL">Tất cả lớp</option>${state.classes.map((cls) => `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`).join('')}</select></div><div class="toolbar-right"><button class="btn btn-secondary btn-sm" data-action="export-students">${icon('download',14)} CSV</button><span class="badge badge-neutral">${state.students.length} học sinh</span></div></div>
      <section class="panel"><div class="table-wrap"><table class="data-table" data-search-group="admin-student-table"><thead><tr><th>Học sinh</th><th>Mã</th><th>Điện thoại</th><th>Lớp hiện tại</th><th>Trạng thái</th></tr></thead><tbody>${state.students.map((student) => `<tr data-class="${student.classId}"><td><span class="inline"><span class="avatar">${student.avatar}</span><span class="cell-primary">${escapeHtml(student.name)}</span></span></td><td>${student.code}</td><td>${student.phone}</td><td>${escapeHtml(classById(student.classId)?.name || 'Chưa xếp lớp')}</td><td><span class="badge badge-green">${student.status}</span></td></tr>`).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Quản lý học sinh', `${state.students.length} hồ sơ`, '/app/admin/students');
  }

  function addStudentModal() {
    const overlay = document.createElement('div');
    overlay.className = 'permission-page';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(8,27,57,.55);place-items:center;overflow:auto';
    overlay.innerHTML = `<form class="form-card" data-form="add-student" style="width:min(580px,calc(100% - 28px));margin:30px" novalidate><div class="between"><div><h2>Thêm học sinh</h2><p class="muted text-small">Dữ liệu được lưu vào localStorage của prototype.</p></div><button type="button" class="icon-btn" data-action="close-modal">${icon('close')}</button></div><div class="form-grid"><div class="field"><label>Họ tên *</label><input class="input" name="name" required></div><div class="field"><label>Mã học sinh *</label><input class="input" name="code" required></div><div class="field"><label>Số điện thoại *</label><input class="input" name="phone" required></div><div class="field"><label>Lớp *</label><select class="select" name="classId" required>${state.classes.map((cls) => `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`).join('')}</select></div><div class="field full"><button class="btn btn-primary btn-block" type="submit">Lưu học sinh</button></div></div></form>`;
    document.body.appendChild(overlay);
  }

  function adminClasses() {
    const content = `${pageHeading('Lớp & Ca học', 'Quản lý lớp, giáo viên phụ trách, lịch và buổi học.')}
      <div class="assignment-grid">${state.classes.map((cls) => {
        const students = state.students.filter((s) => s.classId === cls.id && s.status === 'ACTIVE');
        const sessions = state.sessions.filter((s) => s.classId === cls.id);
        return `<article class="assignment-card"><div class="between"><span class="badge badge-green">${cls.status}</span><span class="text-xs muted">${cls.code}</span></div><h3>${escapeHtml(cls.name)}</h3><div class="assignment-meta"><span>${escapeHtml(cls.schedule)}</span><span>${escapeHtml(cls.room)}</span></div><div class="stack" style="margin-top:16px"><div class="between"><span class="muted">Học sinh</span><strong>${students.length}</strong></div><div class="between"><span class="muted">Giáo viên</span><strong>${escapeHtml(userById(cls.teacherId)?.name || '')}</strong></div><div class="between"><span class="muted">Buổi học</span><strong>${sessions.length}</strong></div></div></article>`;
      }).join('')}</div>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Buổi học gần nhất</h2></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Ngày giờ</th><th>Lớp</th><th>Bài học</th><th>Trạng thái</th><th>Điểm danh</th></tr></thead><tbody>${state.sessions.slice().sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)).slice(0,12).map((session) => `<tr><td>${formatDate(session.startsAt,true)}</td><td>${escapeHtml(classById(session.classId)?.name || '')}</td><td>${escapeHtml(lessonById(session.lessonId)?.title || 'Chưa gắn')}</td><td><span class="badge badge-neutral">${session.status}</span></td><td>${state.attendance.filter((a)=>a.sessionId===session.id&&a.status!=='UNMARKED').length}</td></tr>`).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Lớp & Ca học', `${state.classes.length} lớp`, '/app/admin/classes');
  }

  function adminCourses() {
    const content = `${pageHeading('Nội dung LMS', 'Khóa học, bài học, video và ngân hàng câu hỏi.')}
      <div class="kpi-grid"><article class="kpi-card"><span class="kpi-label">Khóa học</span><strong class="kpi-value">${state.courses.length}</strong></article><article class="kpi-card"><span class="kpi-label">Bài học</span><strong class="kpi-value">${state.lessons.length}</strong></article><article class="kpi-card"><span class="kpi-label">Video metadata</span><strong class="kpi-value">${state.videos.length}</strong></article><article class="kpi-card"><span class="kpi-label">Question Bank</span><strong class="kpi-value">${state.questions.length}</strong></article></div>
      <section class="panel"><div class="panel-head"><h2>Khóa học</h2><span class="badge badge-neutral">Public + internal</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Khóa học</th><th>Khối</th><th>Bài học</th><th>Trạng thái</th><th>Public</th></tr></thead><tbody>${state.courses.map((course) => `<tr><td><span class="cell-primary">${escapeHtml(course.title)}</span><span class="cell-sub">${course.code}</span></td><td>${course.level}</td><td>${state.lessons.filter((l)=>l.courseId===course.id).length}</td><td><span class="badge badge-green">${course.status}</span></td><td>${course.public ? 'Có' : 'Không'}</td></tr>`).join('')}</tbody></table></div></section>
      <div class="dashboard-grid" style="margin-top:18px"><section class="panel"><div class="panel-head"><h2>Video processing</h2></div><div class="panel-body stack"><div class="between"><div><strong>Past Simple — Lesson Video</strong><span class="cell-sub">LOCAL_DEMO · Full HD</span></div><span class="badge badge-green">READY</span></div><div class="between"><div><strong>Unit 3 Vocabulary</strong><span class="cell-sub">BUNNY_METADATA</span></div><span class="badge badge-amber">PROCESSING</span></div><div class="between"><div><strong>Pronunciation Practice</strong><span class="cell-sub">Upload failed</span></div><span class="badge badge-red">FAILED</span></div></div></section><section class="panel"><div class="panel-head"><h2>Question types</h2></div><div class="panel-body"><div class="question-type-grid">${['Single','Multiple','Fill blank','Audio','Ordering','True/False','Matching','Short','Essay','File'].map((x)=>`<div class="question-type">${x}</div>`).join('')}</div></div></section></div>`;
    return appShell(content, 'Nội dung LMS', 'Course, lesson, video, quiz', '/app/admin/courses');
  }

  function adminContacts() {
    const content = `${pageHeading('Yêu cầu liên hệ', 'Inbox B2C, B2B và Support cơ bản — không mở rộng thành CRM.', `<button class="btn btn-secondary" data-action="export-contacts">${icon('download',15)} Xuất CSV</button>`)}
      <div class="toolbar"><div class="toolbar-left"><div class="search-box"><input class="input" data-table-search="contact-table" placeholder="Tìm tên, tổ chức, email hoặc số điện thoại"></div><select class="select" data-row-filter="contact-table" data-filter-attribute="lead-type" style="width:auto"><option value="ALL">Tất cả loại</option><option value="B2C">B2C</option><option value="B2B">B2B</option><option value="SUPPORT">Hỗ trợ</option></select></div><span class="badge badge-neutral">${state.leads.length} yêu cầu</span></div>
      <section class="panel"><div class="table-wrap"><table class="data-table" data-search-group="contact-table"><thead><tr><th>Mã / Người liên hệ</th><th>Loại</th><th>Thông tin</th><th>Nhu cầu / Chi tiết</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>${state.leads.map((lead) => { const detailText = Object.values(lead.details || {}).filter(Boolean).join(' · '); return `<tr data-lead-type="${lead.type}"><td><span class="cell-primary">${escapeHtml(lead.name)}</span><span class="cell-sub">${lead.code}</span></td><td><span class="badge ${lead.type==='B2B'?'badge-violet':lead.type==='SUPPORT'?'badge-amber':'badge-blue'}">${lead.type}</span></td><td>${escapeHtml(lead.organization || maskPhone(lead.phone))}<span class="cell-sub">${escapeHtml(lead.email || maskPhone(lead.phone))}</span></td><td style="max-width:320px">${escapeHtml(lead.message)}${detailText ? `<span class="cell-sub">${escapeHtml(detailText)}</span>` : ''}</td><td><select class="select" data-action="lead-status" data-lead-id="${lead.id}" style="min-height:34px;padding:5px 8px"><option ${lead.status==='NEW'?'selected':''}>NEW</option><option ${lead.status==='CONTACTED'?'selected':''}>CONTACTED</option><option ${lead.status==='QUALIFIED'?'selected':''}>QUALIFIED</option><option ${lead.status==='CLOSED'?'selected':''}>CLOSED</option></select></td><td>${formatDate(lead.createdAt,true)}</td></tr>`; }).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Yêu cầu liên hệ', 'B2C, B2B & Support Inbox', '/app/admin/contacts');
  }

  function adminReports() {
    const minutesSaved = state.assignments.length * state.settings.manualMinutesPerAssignment;
    const content = `${pageHeading('Báo cáo hệ thống', 'Attendance, học bù, quiz và hiệu quả vận hành.', `<button class="btn btn-secondary" data-action="export-session-report">${icon('download',15)} Xuất CSV</button><button class="btn btn-secondary" data-action="print-page">${icon('print',15)} In / PDF</button>`)}
      <div class="kpi-grid"><article class="kpi-card"><span class="kpi-label">Tỷ lệ có mặt</span><strong class="kpi-value">${attendanceRate()}%</strong></article><article class="kpi-card success"><span class="kpi-label">Học bù hoàn tất</span><strong class="kpi-value">${state.assignments.filter((a)=>a.lifecycleStatus==='COMPLETED').length}</strong></article><article class="kpi-card danger"><span class="kpi-label">Quá hạn</span><strong class="kpi-value">${state.assignments.filter((a)=>statusMeta(a).overdue).length}</strong></article><article class="kpi-card warning"><span class="kpi-label">Giờ tiết kiệm ước tính</span><strong class="kpi-value">${(minutesSaved/60).toFixed(1)}h</strong><span class="kpi-caption">Công thức cấu hình, không phải đo trực tiếp</span></article></div>
      ${sessionReportTable(state.sessions.slice().sort((a,b)=>new Date(b.startsAt)-new Date(a.startsAt)))}`;
    return appShell(content, 'Báo cáo hệ thống', 'Theo lớp và từng buổi học', '/app/admin/reports');
  }

  function auditLogPage() {
    const content = `${pageHeading('Audit Log', 'Lịch sử thao tác có actor, resource và thời gian.', `<button class="btn btn-secondary" data-action="export-audit">${icon('download',15)} Xuất CSV</button>`)}
      <section class="panel"><div class="toolbar"><div class="search-box"><input class="input" data-table-search="audit-table" placeholder="Tìm action hoặc nội dung"></div><span class="badge badge-neutral">${state.audit.length} records</span></div><div class="table-wrap"><table class="data-table" data-search-group="audit-table"><thead><tr><th>Thời gian</th><th>Actor</th><th>Action</th><th>Resource</th><th>Chi tiết</th></tr></thead><tbody>${state.audit.map((item) => `<tr><td>${formatDate(item.createdAt,true)}</td><td>${escapeHtml(userById(item.actorId)?.name || item.actorId)}</td><td><span class="badge badge-blue">${escapeHtml(item.action)}</span></td><td>${escapeHtml(item.resource)}</td><td>${escapeHtml(item.detail)}</td></tr>`).join('')}</tbody></table></div></section>`;
    return appShell(content, 'Audit Log', 'Truy vết thay đổi dữ liệu', '/app/admin/audit-logs');
  }

  function adminSettings() {
    const s = state.settings;
    const content = `${pageHeading('Cấu hình hệ thống', 'Business rule của frontend prototype; tích hợp live không được bật khi chưa có backend và credential.')}
      <form class="form-card" data-form="settings" style="max-width:820px"><h2>Quy tắc học bù</h2><div class="form-grid"><div class="field"><label>Điểm đạt mặc định (%)</label><input class="input" type="number" min="1" max="100" name="passingScore" value="${s.passingScore}"></div><div class="field"><label>Số lượt làm mặc định</label><input class="input" type="number" min="1" max="10" name="maxAttempts" value="${s.maxAttempts}"></div><div class="field"><label>Deadline học bù (ngày)</label><input class="input" type="number" min="1" max="30" name="remedialDeadlineDays" value="${s.remedialDeadlineDays}"></div><div class="field"><label>Video tối thiểu để hoàn thành (%)</label><input class="input" type="number" min="0" max="100" name="minimumVideoProgress" value="${s.minimumVideoProgress}"></div><div class="field"><label>Phút thủ công / bài học bù</label><input class="input" type="number" min="1" max="60" name="manualMinutesPerAssignment" value="${s.manualMinutesPerAssignment}"><span class="field-hint">Dùng tính KPI giờ công tiết kiệm ước tính.</span></div><div class="field"><label>Chế độ tích hợp</label><select class="select" name="integrationMode"><option selected>MOCK</option><option disabled>LIVE — cần backend/credential</option></select><span class="field-hint">Bản FE chỉ vận hành an toàn ở MOCK mode.</span></div><div class="field full"><button class="btn btn-primary" type="submit">Lưu cấu hình</button></div></div></form>
      <section class="panel" style="margin-top:18px;max-width:820px"><div class="panel-head"><h2>Integration adapters</h2><a class="btn btn-secondary btn-sm" href="#/app/admin/integrations">Mở trung tâm tích hợp</a></div><div class="panel-body stack"><div class="between"><div><strong>Bunny Stream</strong><span class="cell-sub">Local video + provider metadata</span></div><span class="badge badge-green">Mock ready</span></div><div class="between"><div><strong>Google Sheets</strong><span class="cell-sub">Preview + sync job giả lập</span></div><button class="btn btn-secondary btn-sm" data-action="mock-sync">Chạy mock sync</button></div><div class="between"><div><strong>Email / SMS / Zalo</strong><span class="cell-sub">Outbound log, preview và retry</span></div><span class="badge badge-green">Mock ready</span></div></div></section>
      <section class="form-card" style="margin-top:18px;max-width:820px"><h2>Dữ liệu demo</h2><p class="muted">Reset sẽ xóa mọi thay đổi đã thực hiện trong localStorage và seed lại bộ dữ liệu chuẩn.</p><button class="btn btn-danger" type="button" data-action="reset-demo">${icon('reset',15)} Reset dữ liệu demo</button></section>`;
    return appShell(content, 'Cấu hình hệ thống', 'Business rules & Demo Management', '/app/admin/settings');
  }

  function demoGuidePage() {
    const user = currentUser();
    const content = `${pageHeading('Hướng dẫn demo E2E', 'Chạy luồng canonical bằng ba vai trò trên cùng một bộ dữ liệu.', `<button class="btn btn-secondary" data-action="reset-demo">${icon('reset',15)} Reset về điểm bắt đầu</button>`)}
      <div class="alert alert-info" style="margin-bottom:18px"><span><strong>Luồng chính:</strong> Teacher mark Nguyễn Minh Anh vắng → Student hoàn thành quiz 8/10 → Teacher/Admin xem dữ liệu cập nhật.</span></div>
      <div class="assignment-grid">
        <article class="assignment-card"><span class="badge badge-blue">Bước 1 · Teacher</span><h3>Điểm danh học sinh Vắng</h3><p class="muted">Đăng nhập giáo viên, mở buổi học canonical và đánh dấu Nguyễn Minh Anh là Vắng.</p><div class="stack"><code>teacher@yencenter.demo</code><code>Demo@123</code></div><button class="btn btn-primary btn-block" style="margin-top:16px" data-action="switch-demo-role" data-user-id="teacher-1" data-target="/app/teacher/sessions/session-canonical/attendance">Vào màn điểm danh</button></article>
        <article class="assignment-card"><span class="badge badge-violet">Bước 2 · Student</span><h3>Học video và làm quiz</h3><p class="muted">Đăng nhập HS6A001, mở bài học bù vừa sinh, dùng đáp án demo để đạt 8/10.</p><div class="stack"><code>HS6A001</code><code>123456</code></div><button class="btn btn-primary btn-block" style="margin-top:16px" data-action="switch-demo-role" data-user-id="student-login-1" data-target="/app/student/remedial">Vào Student Portal</button></article>
        <article class="assignment-card"><span class="badge badge-green">Bước 3 · Admin</span><h3>Kiểm tra báo cáo & audit</h3><p class="muted">Xem assignment đã hoàn tất, báo cáo theo buổi và lịch sử thao tác.</p><div class="stack"><code>admin@yencenter.demo</code><code>Demo@123</code></div><button class="btn btn-primary btn-block" style="margin-top:16px" data-action="switch-demo-role" data-user-id="admin-1" data-target="/app/admin/dashboard">Vào Admin Portal</button></article>
        <article class="assignment-card"><span class="badge badge-neutral">Bước phụ · Public</span><h3>Gửi lead B2C/B2B</h3><p class="muted">Điền form trên website rồi mở Contact Inbox để thấy bản ghi mới.</p><div class="stack"><span class="text-small">Không cần đăng nhập khi submit form</span></div><a class="btn btn-secondary btn-block" style="margin-top:16px" href="#/phu-huynh-hoc-sinh">Mở website public</a></article>
      </div>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Trạng thái canonical hiện tại</h2></div><div class="panel-body">${canonicalStatusPanel()}</div></section>`;
    return user ? appShell(content, 'Hướng dẫn demo', 'Canonical E2E workflow', '/demo-guide') : publicLayout(`<section class="section"><div class="container">${content}</div></section>`);
  }

  function canonicalStatusPanel() {
    const record = state.attendance.find((a) => a.sessionId === 'session-canonical' && a.studentId === 'student-01');
    const assignment = state.assignments.find((a) => a.sessionId === 'session-canonical' && a.studentId === 'student-01');
    return `<div class="workflow"><article class="workflow-step"><div class="workflow-number">1</div><div><h3>Attendance</h3><p>${record?.status || 'UNMARKED'}</p></div></article><article class="workflow-step"><div class="workflow-number">2</div><div><h3>Assignment</h3><p>${assignment ? 'Đã tạo' : 'Chưa tạo'}</p></div></article><article class="workflow-step"><div class="workflow-number">3</div><div><h3>Video</h3><p>${Math.round(assignment?.videoProgress || 0)}%</p></div></article><article class="workflow-step"><div class="workflow-number">4</div><div><h3>Quiz</h3><p>${assignment?.score != null ? `${assignment.score}/100` : 'Chưa làm'}</p></div></article><article class="workflow-step"><div class="workflow-number">5</div><div><h3>Kết quả</h3><p>${assignment ? statusMeta(assignment).label : 'Chờ trigger'}</p></div></article></div>`;
  }

  function permissionPage(code = 403, title = 'Không có quyền truy cập', message = 'Tài khoản hiện tại không được phép mở khu vực này.') {
    const user = currentUser();
    const target = user ? routeForRole(user.role) : '/login';
    return `<main class="permission-page"><section class="permission-card"><div class="permission-code">${code}</div><h1>${escapeHtml(title)}</h1><p class="muted">${escapeHtml(message)}</p><a class="btn btn-primary" href="#${target}">${user ? 'Về dashboard' : 'Đăng nhập'}</a></section></main>`;
  }

  function notFoundPage() {
    return permissionPage(404, 'Không tìm thấy trang', 'Route này chưa tồn tại trong frontend prototype.');
  }

  function simplePlaceholder(title, description, activePath) {
    return appShell(`${pageHeading(title, description)}<section class="panel"><div class="empty-state"><div class="empty-icon">MVP</div><h3>Màn hình đã có route và layout</h3><p>Trong prototype thử nghiệm, chức năng chính được tập trung ở luồng attendance → remedial → quiz → reporting.</p><a class="btn btn-primary" href="#/demo-guide">Đi tới hướng dẫn E2E</a></div></section>`, title, roleNames[currentUser().role], activePath);
  }

  function render() {
    if (runtime.videoTimer) {
      clearInterval(runtime.videoTimer);
      runtime.videoTimer = null;
    }
    runtime.quizStartedAt = null;
    const { path, query } = parseRoute();
    const user = currentUser();

    if (path.startsWith('/app/')) {
      if (!user) { navigate('/login'); return; }
      if (!roleAllowsPath(user.role, path)) { app.innerHTML = permissionPage(); return; }
    }

    let html;
    if (path === '/') html = homepage();
    else if (path === '/phu-huynh-hoc-sinh') html = b2cPage();
    else if (path === '/giai-phap-trung-tam') html = b2bPage();
    else if (path === '/chuong-trinh') html = programsPage();
    else if (path.startsWith('/chuong-trinh/')) html = programsPage(path.split('/').pop());
    else if (path === '/lich-hoc') html = publicSchedulePage();
    else if (path === '/tin-tuc') html = publicNewsPage();
    else if (path === '/su-kien') html = publicEventsPage();
    else if (path === '/tai-lieu') html = publicDocumentsPage();
    else if (path === '/lien-he') html = contactPage();
    else if (path === '/faq') html = faqPage();
    else if (path === '/dieu-khoan-su-dung') html = legalPage('terms');
    else if (path === '/chinh-sach-bao-mat') html = legalPage('privacy');
    else if (path === '/login') html = user ? permissionPage(200, 'Bạn đang đăng nhập', `Tài khoản ${user.name} đang hoạt động.`) : loginPage();
    else if (path === '/forgot-password') html = forgotPasswordPage();
    else if (path === '/verify-otp') html = verifyOtpPage();
    else if (path === '/select-profile') html = profileChooserPage();
    else if (path === '/demo-guide') html = demoGuidePage();
    else if (path === '/403') html = permissionPage();
    else if (path === '/404') html = notFoundPage();

    else if (path === '/app/student/dashboard') html = studentDashboard();
    else if (path === '/app/student/lessons') html = studentLessons();
    else if (path === '/app/student/remedial') html = studentRemedialList();
    else if (/^\/app\/student\/remedial\/[^/]+$/.test(path)) html = studentAssignmentDetail(path.split('/').pop());
    else if (/^\/app\/student\/quiz\/[^/]+$/.test(path)) html = quizPage(path.split('/').pop(), query.get('assignment'));
    else if (path === '/app/student/results') html = studentResults();
    else if (path === '/app/student/progress') html = studentProgress();
    else if (path === '/app/student/notifications') html = notificationPage('/app/student/notifications');

    else if (path === '/app/teacher/dashboard') html = teacherDashboard();
    else if (path === '/app/teacher/classes') html = teacherClasses();
    else if (/^\/app\/teacher\/classes\/[^/]+$/.test(path)) html = teacherClassDetail(path.split('/').pop());
    else if (path === '/app/teacher/sessions') html = teacherSessions();
    else if (/^\/app\/teacher\/sessions\/[^/]+\/attendance$/.test(path)) html = attendancePage(path.split('/')[4]);
    else if (path === '/app/teacher/remedial') html = teacherRemedial();
    else if (path === '/app/teacher/content' || path === '/app/teacher/courses' || path === '/app/teacher/question-bank' || path.startsWith('/app/teacher/quizzes')) html = contentStudio();
    else if (path === '/app/teacher/reports') html = teacherReports();
    else if (path === '/app/teacher/notifications') html = notificationPage('/app/teacher/notifications');

    else if (path === '/app/admin/dashboard') html = adminDashboard();
    else if (path === '/app/admin/users' || path === '/app/admin/teachers') html = adminUsers();
    else if (path === '/app/admin/students') html = adminStudents();
    else if (path === '/app/admin/classes' || path === '/app/admin/enrollments' || path === '/app/admin/schedules' || path === '/app/admin/sessions') html = adminClasses();
    else if (path === '/app/admin/courses' || path === '/app/admin/lessons' || path === '/app/admin/videos' || path === '/app/admin/questions' || path === '/app/admin/quizzes') html = adminCourses();
    else if (path === '/app/admin/remedial') html = adminRemedial();
    else if (path === '/app/admin/contacts') html = adminContacts();
    else if (path === '/app/admin/reports') html = adminReports();
    else if (path === '/app/admin/integrations') html = adminIntegrations();
    else if (path === '/app/admin/audit-logs') html = auditLogPage();
    else if (path === '/app/admin/settings' || path === '/app/admin/demo') html = adminSettings();
    else if (path === '/app/admin/notifications') html = notificationPage('/app/admin/notifications');
    else html = notFoundPage();

    app.innerHTML = html;
    window.scrollTo(0, 0);
    initializeViewBehaviors(path);
  }

  function createRemedialAssignment(studentId, sessionId) {
    const existing = state.assignments.find((item) => item.studentId === studentId && item.sessionId === sessionId && item.lifecycleStatus !== 'CANCELLED');
    if (existing) return { assignment: existing, created: false };
    const session = sessionById(sessionId);
    const lesson = lessonById(session?.lessonId);
    const quiz = state.quizzes.find((item) => item.id === lesson?.quizId);
    if (!session || !lesson || !quiz || quiz.status !== 'PUBLISHED') {
      addAudit('REMEDIAL_NEEDS_CONFIGURATION', 'ClassSession', `Không thể tạo assignment cho ${studentById(studentId)?.name || studentId}: thiếu lesson hoặc quiz published.`);
      return { assignment: null, created: false, issue: true };
    }
    const due = new Date(session.startsAt);
    due.setDate(due.getDate() + Number(state.settings.remedialDeadlineDays || 7));
    due.setHours(23, 59, 0, 0);
    const assignment = {
      id: uid('assignment'), studentId, sessionId, lessonId: lesson.id, quizId: quiz.id,
      lifecycleStatus: 'ASSIGNED', assignedAt: new Date().toISOString(), dueAt: due.toISOString(),
      videoProgress: 0, score: null, completionMode: null, completedAt: null,
      accessToken: uid('access'), accessStatus: 'ACTIVE', accessExpiresAt: due.toISOString(), linkVersion: 1,
    };
    state.assignments.unshift(assignment);
    const studentAccount = state.users.find((user) => user.role === 'STUDENT' && user.studentIds?.includes(studentId));
    if (studentAccount) addNotification(studentAccount.id, 'Bạn có bài học bù mới', `${lesson.title} · Hạn ${formatDate(assignment.dueAt)}.`);
    const teacherId = classById(session.classId)?.teacherId;
    if (teacherId) addNotification(teacherId, 'Đã tự động giao bài học bù', `${studentById(studentId)?.name || 'Học sinh'} nhận bài ${lesson.title}.`);
    state.outboundMessages ||= [];
    state.outboundMessages.unshift({ id: uid('outbound'), channel: 'IN_APP', recipient: studentById(studentId)?.phone || studentId, template: 'REMEDIAL_ASSIGNED', status: 'MOCKED', createdAt: new Date().toISOString() });
    addAudit('REMEDIAL_ASSIGNMENT_CREATED', 'RemedialAssignment', `${studentById(studentId)?.name || studentId} · ${lesson.title}`);
    return { assignment, created: true };
  }

  function saveAttendance(sessionId) {
    const session = sessionById(sessionId);
    const cls = classById(session.classId);
    const students = state.students.filter((student) => student.classId === cls.id && student.status === 'ACTIVE');
    const draft = runtime.attendanceDraft[sessionId] || {};
    if (students.some((student) => !draft[student.id] || draft[student.id] === 'UNMARKED')) {
      showToast('Chưa thể lưu điểm danh', 'Vẫn còn học sinh chưa chọn trạng thái.', 'error');
      return;
    }
    let createdCount = 0;
    students.forEach((student) => {
      let record = state.attendance.find((item) => item.sessionId === sessionId && item.studentId === student.id);
      const previous = record?.status || 'UNMARKED';
      if (!record) {
        record = { id: uid('att'), sessionId, studentId: student.id, status: 'UNMARKED', markedBy: null, markedAt: null };
        state.attendance.push(record);
      }
      record.status = draft[student.id];
      record.markedBy = currentUser().id;
      record.markedAt = new Date().toISOString();
      if (previous !== record.status) addAudit('ATTENDANCE_UPDATED', 'AttendanceRecord', `${student.name}: ${previous} → ${record.status}`);
      if (record.status === 'ABSENT') {
        const result = createRemedialAssignment(student.id, sessionId);
        if (result.created) createdCount += 1;
      }
      if (previous === 'ABSENT' && record.status === 'PRESENT') {
        const assignment = state.assignments.find((item) => item.studentId === student.id && item.sessionId === sessionId && item.lifecycleStatus !== 'CANCELLED');
        if (assignment) {
          const hasAttempt = state.attempts.some((attempt) => attempt.assignmentId === assignment.id);
          const hasActivity = (assignment.videoProgress || 0) > 0 || hasAttempt || ['COMPLETED', 'PENDING_REVIEW'].includes(assignment.lifecycleStatus);
          if (!hasActivity) {
            assignment.lifecycleStatus = 'CANCELLED';
            assignment.accessStatus = 'REVOKED';
            addAudit('REMEDIAL_ASSIGNMENT_CANCELLED', 'RemedialAssignment', `${student.name}: attendance đổi từ Vắng về Có mặt trước khi bắt đầu học.`);
          } else {
            addAudit('ATTENDANCE_CORRECTED_AFTER_LEARNING_STARTED', 'AttendanceRecord', `${student.name}: đổi Vắng → Có mặt nhưng giữ lịch sử assignment đã có hoạt động.`);
          }
        }
      }
    });
    session.attendanceFinalized = true;
    addAudit('ATTENDANCE_FINALIZED', 'ClassSession', `${cls.name} · ${formatDate(session.startsAt, true)} · ${createdCount} assignment mới.`);
    saveState();
    showToast('Đã lưu điểm danh', `${createdCount} bài học bù được tự động tạo.`, 'success');
    render();
  }

  function updateVideoProgress(assignmentId, value, shouldRender = true) {
    const assignment = assignmentById(assignmentId);
    if (!assignment) return;
    assignment.videoProgress = Math.max(0, Math.min(100, Number(value)));
    if (assignment.lifecycleStatus === 'ASSIGNED' && assignment.videoProgress > 0) assignment.lifecycleStatus = 'IN_PROGRESS';
    saveState();
    const fill = document.querySelector(`[data-video-fill="${assignmentId}"]`);
    const label = document.querySelector(`[data-video-percent="${assignmentId}"]`);
    if (fill) fill.style.width = `${assignment.videoProgress}%`;
    if (label) label.textContent = `${Math.round(assignment.videoProgress)}%`;
    if (shouldRender) render();
  }

  function submitQuiz(form, allowIncomplete = false) {
    if (form.dataset.submitted === 'true') return;
    const quizId = form.dataset.quizId;
    const assignmentId = form.dataset.assignmentId;
    const quiz = state.quizzes.find((item) => item.id === quizId);
    const assignment = assignmentById(assignmentId);
    const student = currentStudent();
    if (!quiz || !assignment || !student) return;
    const questions = quiz.questionIds.map((id) => state.questions.find((q) => q.id === id)).filter(Boolean);
    const data = new FormData(form);
    const answered = questions.filter((q) => data.has(q.id)).length;
    if (!allowIncomplete && answered < questions.length) {
      showToast('Chưa thể nộp bài', `Bạn còn ${questions.length - answered} câu chưa trả lời.`, 'error');
      return;
    }
    form.dataset.submitted = 'true';
    const correct = questions.filter((q) => data.has(q.id) && Number(data.get(q.id)) === q.correctIndex).length;
    const score = Math.round((correct / questions.length) * 100);
    const existing = state.attempts.filter((item) => item.assignmentId === assignment.id);
    const attempt = {
      id: uid('attempt'), assignmentId: assignment.id, studentId: student.id, quizId: quiz.id,
      attemptNo: existing.length + 1, score, correct, total: questions.length,
      submittedAt: new Date().toISOString(), timedOut: allowIncomplete && answered < questions.length,
      answers: Object.fromEntries(questions.map((q) => [q.id, data.has(q.id) ? Number(data.get(q.id)) : null])),
    };
    state.attempts.push(attempt);
    assignment.score = Math.max(score, ...existing.map((item) => item.score), 0);
    const passesScore = assignment.score >= quiz.passingScore;
    const passesVideo = (assignment.videoProgress || 0) >= Number(state.settings.minimumVideoProgress || 0);
    if (passesScore && passesVideo) {
      assignment.lifecycleStatus = 'COMPLETED';
      assignment.completionMode = 'AUTO';
      assignment.completedAt = new Date().toISOString();
      addNotification(currentUser().id, 'Bạn đã hoàn thành bài học bù', `${quiz.title}: ${assignment.score}/100.`);
      const cls = classById(sessionById(assignment.sessionId)?.classId);
      if (cls?.teacherId) addNotification(cls.teacherId, 'Học sinh đã bù xong', `${student.name} đạt ${assignment.score}/100.`);
      addAudit('REMEDIAL_COMPLETED_AUTO', 'RemedialAssignment', `${student.name} · ${assignment.score}/100`, currentUser().id);
    } else if (!passesScore) {
      assignment.lifecycleStatus = 'NOT_PASSED';
      addNotification(currentUser().id, 'Bài kiểm tra chưa đạt', `Kết quả ${score}/100. Bạn có thể làm lại nếu còn lượt.`);
      addAudit(allowIncomplete ? 'QUIZ_TIMED_OUT' : 'QUIZ_NOT_PASSED', 'QuizAttempt', `${student.name} · ${score}/100`, currentUser().id);
    } else {
      assignment.lifecycleStatus = 'IN_PROGRESS';
      addNotification(currentUser().id, 'Cần hoàn tất video', `Điểm đã đạt nhưng yêu cầu xem video tối thiểu là ${state.settings.minimumVideoProgress}%.`);
    }
    saveState();
    runtime.quizStartedAt = null;
    navigate(`/app/student/remedial/${assignment.id}`);
    setTimeout(() => showToast(passesScore && passesVideo ? 'Đã bù xong' : allowIncomplete ? 'Hết thời gian — bài đã được nộp' : 'Đã chấm bài', `${correct}/${questions.length} câu đúng · ${score}/100 điểm.`, passesScore && passesVideo ? 'success' : 'info'), 50);
  }

  function login(identifier, secret) {
    const normalized = String(identifier || '').trim().toLowerCase();
    const user = state.users.find((item) => item.identifiers.some((id) => id.toLowerCase() === normalized));
    if (!user || user.secret !== secret) {
      showToast('Đăng nhập thất bại', 'Kiểm tra lại tài khoản và mật khẩu/PIN.', 'error');
      return;
    }
    const session = { userId: user.id, selectedStudentId: null, pendingStudentIds: null };
    if (user.role === 'STUDENT') {
      if ((user.studentIds || []).length > 1) {
        session.pendingStudentIds = user.studentIds;
        setSession(session);
        addAudit('LOGIN_SUCCESS', 'Auth', `${user.name} đăng nhập và cần chọn hồ sơ.`, user.id);
        saveState();
        navigate('/select-profile');
        return;
      }
      session.selectedStudentId = user.studentIds?.[0] || null;
    }
    setSession(session);
    addAudit('LOGIN_SUCCESS', 'Auth', `${user.name} đăng nhập.`, user.id);
    saveState();
    navigate(routeForRole(user.role));
    setTimeout(() => showToast('Đăng nhập thành công', `${user.name} · ${roleNames[user.role]}`, 'success'), 50);
  }

  function downloadCsv(filename, headers, rows) {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = '\uFEFF' + [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast('Đã tạo file CSV', filename, 'success');
  }

  function exportAssignments() {
    const user = currentUser();
    const allowedClassIds = user?.role === 'ADMIN' ? state.classes.map((c) => c.id) : classesForCurrentStaff().map((c) => c.id);
    const assignments = state.assignments.filter((assignment) => allowedClassIds.includes(sessionById(assignment.sessionId)?.classId));
    downloadCsv(`bao-cao-hoc-bu-${dateOnly()}.csv`, ['Học sinh','Mã HS','Lớp','Buổi vắng','Bài học','Deadline','Video %','Điểm','Trạng thái','Link'], assignments.map((a) => {
      const student = studentById(a.studentId); const session = sessionById(a.sessionId); const cls = classById(session?.classId);
      return [student?.name, student?.code, cls?.name, formatDate(session?.startsAt,true), lessonById(a.lessonId)?.title, formatDate(a.dueAt,true), a.videoProgress, a.score ?? '', statusMeta(a).overdue ? `OVERDUE/${a.lifecycleStatus}` : a.lifecycleStatus, a.accessStatus || 'ACTIVE'];
    }));
    addAudit('REMEDIAL_REPORT_EXPORTED', 'Report', `${assignments.length} bản ghi · ${roleLabel(user?.role)}.`);
    saveState();
  }

  function exportSessions() {
    const user = currentUser();
    const allowedClassIds = user?.role === 'ADMIN' ? state.classes.map((c) => c.id) : classesForCurrentStaff().map((c) => c.id);
    const sessions = state.sessions.filter((session) => allowedClassIds.includes(session.classId));
    downloadCsv(`bao-cao-buoi-hoc-${dateOnly()}.csv`, ['Ngày giờ','Lớp','Bài học','Tổng HS','Có mặt','Vắng','Đã giao bù','Đã bù xong'], sessions.map((session) => {
      const cls = classById(session.classId); const records = state.attendance.filter((a)=>a.sessionId===session.id); const assignments = state.assignments.filter((a)=>a.sessionId===session.id);
      return [formatDate(session.startsAt,true), cls?.name, lessonById(session.lessonId)?.title, state.students.filter((s)=>s.classId===cls?.id&&s.status==='ACTIVE').length, records.filter((a)=>a.status==='PRESENT').length, records.filter((a)=>a.status==='ABSENT').length, assignments.length, assignments.filter((a)=>a.lifecycleStatus==='COMPLETED').length];
    }));
    addAudit('SESSION_REPORT_EXPORTED', 'Report', `${sessions.length} buổi · ${roleLabel(user?.role)}.`);
    saveState();
  }

  function initializeViewBehaviors(path) {
    if (path.includes('/quiz/')) {
      const timer = document.querySelector('[data-quiz-timer]');
      const form = document.querySelector('form[data-form="quiz"]');
      if (timer && form) {
        const totalSeconds = Number(form.dataset.timeLimit || 15) * 60;
        runtime.quizStartedAt = Date.now();
        runtime.videoTimer = setInterval(() => {
          const elapsed = Math.floor((Date.now() - runtime.quizStartedAt) / 1000);
          const remain = Math.max(0, totalSeconds - elapsed);
          timer.textContent = `${pad(Math.floor(remain / 60))}:${pad(remain % 60)}`;
          if (remain === 0) {
            clearInterval(runtime.videoTimer);
            runtime.videoTimer = null;
            if (form.dataset.submitted !== 'true') submitQuiz(form, true);
          }
        }, 1000);
      }
    }
  }

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'go-workflow') {
      event.preventDefault();
      if (parseRoute().path !== '/') {
        navigate('/');
        setTimeout(() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' }), 80);
      } else {
        document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    if (action === 'toggle-public-menu') {
      runtime.publicMenuOpen = !runtime.publicMenuOpen;
      render();
      return;
    }
    if (action === 'toggle-support') {
      runtime.supportOpen = !runtime.supportOpen;
      render();
      return;
    }
    if (action === 'toggle-sidebar') {
      runtime.sidebarOpen = !runtime.sidebarOpen;
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.toggle('open', runtime.sidebarOpen);
      return;
    }
    if (action === 'logout') {
      const user = currentUser();
      if (user) {
        addAudit('LOGOUT', 'Auth', `${user.name} đăng xuất.`, user.id);
        saveState();
      }
      setSession(null);
      navigate('/login');
      setTimeout(() => showToast('Đã đăng xuất', 'Phiên demo đã kết thúc.', 'success'), 50);
      return;
    }
    if (action === 'quick-login' || action === 'switch-demo-role') {
      const user = state.users.find((item) => item.id === target.dataset.userId);
      if (!user) return;
      const session = { userId: user.id, selectedStudentId: user.studentIds?.[0] || null, pendingStudentIds: null };
      setSession(session);
      addAudit('LOGIN_SUCCESS', 'Auth', `${user.name} đăng nhập nhanh trong demo.`, user.id);
      saveState();
      navigate(target.dataset.target || routeForRole(user.role));
      setTimeout(() => showToast('Đã chuyển vai trò', `${user.name} · ${roleNames[user.role]}`, 'success'), 40);
      return;
    }
    if (action === 'select-student-profile') {
      const session = getSession();
      session.selectedStudentId = target.dataset.studentId;
      session.pendingStudentIds = null;
      setSession(session);
      addAudit('STUDENT_PROFILE_SELECTED', 'Auth', `${studentById(target.dataset.studentId)?.name} được chọn.`, currentUser().id);
      saveState();
      navigate('/app/student/dashboard');
      return;
    }
    if (action === 'set-attendance') {
      const { sessionId, studentId, status } = target.dataset;
      runtime.attendanceDraft[sessionId] ||= {};
      runtime.attendanceDraft[sessionId][studentId] = status;
      render();
      return;
    }
    if (action === 'attendance-all-present') {
      const sessionId = target.dataset.sessionId;
      const session = sessionById(sessionId);
      const students = state.students.filter((s) => s.classId === session.classId && s.status === 'ACTIVE');
      runtime.attendanceDraft[sessionId] = Object.fromEntries(students.map((student) => [student.id, 'PRESENT']));
      render();
      return;
    }
    if (action === 'reset-attendance-draft') {
      delete runtime.attendanceDraft[target.dataset.sessionId];
      render();
      showToast('Đã hoàn tác', 'Trạng thái trở về dữ liệu đã lưu.', 'info');
      return;
    }
    if (action === 'save-attendance') {
      saveAttendance(target.dataset.sessionId);
      return;
    }
    if (action === 'copy-assignment-link') {
      const assignment = assignmentById(target.dataset.assignmentId);
      if (!assignment) return;
      if ((assignment.accessStatus || 'ACTIVE') !== 'ACTIVE') { showToast('Link đã bị thu hồi', 'Hãy tạo lại link trước khi sao chép.', 'error'); return; }
      const link = demoShareUrl(assignment);
      try {
        await navigator.clipboard.writeText(link);
      } catch {
        const temp = document.createElement('textarea');
        temp.value = link;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      addAudit('REMEDIAL_LINK_COPIED', 'RemedialAssignment', `${studentById(assignment.studentId)?.name} · hạn ${formatDate(assignment.dueAt)}`);
      saveState();
      showToast('Đã sao chép link học bù', `Hạn ${formatDate(assignment.dueAt, true)}.`, 'success');
      return;
    }
    if (action === 'open-link-manager') {
      assignmentLinkModal(target.dataset.assignmentId);
      return;
    }
    if (action === 'regenerate-assignment-link') {
      const assignment = assignmentById(target.dataset.assignmentId);
      if (!assignment) return;
      assignment.accessToken = uid('access');
      assignment.accessStatus = 'ACTIVE';
      assignment.linkVersion = Number(assignment.linkVersion || 1) + 1;
      assignment.accessExpiresAt = assignment.dueAt;
      addAudit('REMEDIAL_LINK_REGENERATED', 'RemedialAssignment', `${studentById(assignment.studentId)?.name}: tạo lại link v${assignment.linkVersion}.`);
      saveState();
      target.closest('.permission-page')?.remove();
      assignmentLinkModal(assignment.id);
      showToast('Đã tạo lại link', `Phiên bản v${assignment.linkVersion} đang có hiệu lực.`, 'success');
      return;
    }
    if (action === 'revoke-assignment-link') {
      const assignment = assignmentById(target.dataset.assignmentId);
      if (!assignment || !window.confirm('Thu hồi link học bù hiện tại? Học sinh sẽ cần link mới để truy cập.')) return;
      assignment.accessStatus = 'REVOKED';
      addAudit('REMEDIAL_LINK_REVOKED', 'RemedialAssignment', `${studentById(assignment.studentId)?.name}: thu hồi link v${assignment.linkVersion || 1}.`);
      saveState();
      target.closest('.permission-page')?.remove();
      render();
      showToast('Đã thu hồi link', 'Có thể tạo lại link từ màn Quản lý link.', 'success');
      return;
    }
    if (action === 'extend-deadline') {
      const assignment = assignmentById(target.dataset.assignmentId);
      if (!assignment) return;
      const reason = window.prompt('Lý do gia hạn deadline:', 'Học sinh cần thêm thời gian hoàn thành');
      if (!reason || !reason.trim()) return;
      const due = new Date(assignment.dueAt);
      due.setDate(due.getDate() + 3);
      assignment.dueAt = due.toISOString();
      if ((assignment.accessStatus || 'ACTIVE') === 'ACTIVE') assignment.accessExpiresAt = assignment.dueAt;
      addAudit('REMEDIAL_DEADLINE_EXTENDED', 'RemedialAssignment', `${studentById(assignment.studentId)?.name}: gia hạn thêm 3 ngày · ${reason.trim()}.`);
      saveState();
      render();
      showToast('Đã gia hạn', 'Deadline và thời hạn link được cộng thêm 3 ngày.', 'success');
      return;
    }
    if (action === 'video-progress') {
      updateVideoProgress(target.dataset.assignmentId, target.dataset.value, true);
      showToast('Đã lưu tiến độ video', `${target.dataset.value}% đã xem.`, 'success');
      return;
    }
    if (action === 'toggle-video') {
      const assignmentId = target.dataset.assignmentId;
      const assignment = assignmentById(assignmentId);
      if (runtime.videoTimer) {
        clearInterval(runtime.videoTimer);
        runtime.videoTimer = null;
        target.textContent = '▶';
        return;
      }
      target.textContent = '❚❚';
      runtime.videoTimer = setInterval(() => {
        const next = Math.min(100, (assignment.videoProgress || 0) + 2);
        updateVideoProgress(assignmentId, next, false);
        if (next >= 100) {
          clearInterval(runtime.videoTimer);
          runtime.videoTimer = null;
          target.textContent = '▶';
          addAudit('VIDEO_COMPLETED', 'VideoProgress', `${studentById(assignment.studentId)?.name} xem hết video demo.`, currentUser().id);
          saveState();
          showToast('Đã xem hết video', 'Tiến độ được lưu 100%.', 'success');
        }
      }, 250);
      return;
    }
    if (action === 'fill-demo-quiz') {
      const form = document.querySelector('[data-form="quiz"]');
      if (!form) return;
      const quiz = state.quizzes.find((q) => q.id === form.dataset.quizId);
      quiz.questionIds.forEach((id, index) => {
        const question = state.questions.find((q) => q.id === id);
        const optionIndex = index < 8 ? question.correctIndex : (question.correctIndex + 1) % question.options.length;
        const input = form.querySelector(`input[name="${id}"][value="${optionIndex}"]`);
        if (input) input.checked = true;
      });
      updateQuizProgress(form);
      showToast('Đã điền đáp án demo', '8 câu đúng và 2 câu sai.', 'info');
      return;
    }
    if (action === 'mark-notifications-read') {
      const user = currentUser();
      state.notifications.filter((n) => n.userId === user.id).forEach((n) => { n.read = true; });
      saveState();
      render();
      showToast('Đã đánh dấu đã đọc', '', 'success');
      return;
    }
    if (action === 'export-remedial') { exportAssignments(); return; }
    if (action === 'export-session-report') { exportSessions(); return; }
    if (action === 'export-students') {
      downloadCsv(`hoc-sinh-${dateOnly()}.csv`, ['Mã','Họ tên','Điện thoại','Lớp','Trạng thái'], state.students.map((s) => [s.code,s.name,s.phone,classById(s.classId)?.name,s.status]));
      return;
    }
    if (action === 'export-contacts') {
      downloadCsv(`contact-leads-${dateOnly()}.csv`, ['Mã','Loại','Tên','Tổ chức','Điện thoại','Email','Nhu cầu','Trạng thái'], state.leads.map((l) => [l.code,l.type,l.name,l.organization,l.phone,l.email,l.message,l.status]));
      return;
    }
    if (action === 'export-audit') {
      downloadCsv(`audit-log-${dateOnly()}.csv`, ['Thời gian','Actor','Action','Resource','Chi tiết'], state.audit.map((a) => [formatDate(a.createdAt,true),userById(a.actorId)?.name||a.actorId,a.action,a.resource,a.detail]));
      return;
    }
    if (action === 'download-demo-document') {
      const item = (state.publicDocuments || []).find((document) => document.id === target.dataset.documentId);
      if (!item) return;
      downloadCsv(`tai-lieu-${item.id}.csv`, ['Thuộc tính','Giá trị'], [['Tên tài liệu', item.title], ['Đối tượng', item.audience], ['Loại gốc', item.type], ['Ngày đăng', formatDate(item.publishedAt)], ['Ghi chú', 'Bản tải mô phỏng trong frontend prototype']]);
      showToast('Đã tạo bản tải mô phỏng', `${item.title} · CSV`, 'success');
      return;
    }
    if (action === 'print-page') { window.print(); return; }
    if (action === 'open-add-student') { addStudentModal(); return; }
    if (action === 'close-modal') { target.closest('.permission-page')?.remove(); return; }
    if (action === 'reset-demo') {
      if (!window.confirm('Reset toàn bộ dữ liệu frontend về trạng thái seed ban đầu?')) return;
      persistentStore.removeItem(STORAGE_KEY);
      state = loadState();
      runtime.attendanceDraft = {};
      setSession(getSession() ? { ...getSession(), selectedStudentId: currentUser()?.studentIds?.[0] || getSession()?.selectedStudentId } : null);
      render();
      showToast('Đã reset dữ liệu demo', 'Luồng canonical trở về trạng thái chưa điểm danh.', 'success');
      return;
    }
    if (action === 'mock-sync') {
      addAudit('GOOGLE_SHEETS_MOCK_SYNC', 'Integration', 'Đồng bộ báo cáo Google Sheets ở mock mode.');
      saveState();
      showToast('Mock sync thành công', 'Job và audit record đã được tạo.', 'success');
      return;
    }
    if (action === 'preview-canonical-lesson') {
      const lesson = lessonById('lesson-past-simple');
      const quiz = state.quizzes.find((item) => item.id === lesson?.quizId);
      const overlay = document.createElement('div');
      overlay.className = 'permission-page';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(8,27,57,.55);place-items:center;overflow:auto';
      overlay.innerHTML = `<section class="form-card" style="width:min(760px,calc(100% - 28px));margin:30px"><div class="between"><div><span class="eyebrow">Student preview</span><h2>${escapeHtml(lesson?.title || 'Bài học')}</h2></div><button type="button" class="icon-btn" data-action="close-modal">${icon('close')}</button></div><div class="video-screen" style="min-height:240px;margin:18px 0"><div class="video-caption"><strong>Video bài giảng mẫu</strong><span>Preview không ghi tiến độ học sinh</span></div></div><div class="dashboard-grid"><div class="panel-body"><strong>Mục tiêu bài học</strong><p class="muted">${escapeHtml(lesson?.summary || '')}</p></div><div class="panel-body"><strong>Quiz cuối bài</strong><p class="muted">${escapeHtml(quiz?.title || '')} · ${quiz?.questionIds?.length || 0} câu · đạt ${quiz?.passingScore || 80}%</p></div></div></section>`;
      document.body.appendChild(overlay);
      return;
    }
    if (action === 'demo-publish-content') {
      if (!['TEACHER', 'ADMIN'].includes(currentUser()?.role)) {
        addAudit('CONTENT_ACTION_DENIED', 'Lesson', 'Trợ giảng thử tạo nội dung nhưng không có quyền.');
        saveState();
        showToast('Không có quyền', 'Trợ giảng chỉ được xem nội dung theo RBAC mặc định.', 'error');
        return;
      }
      addAudit('CONTENT_DRAFT_CREATED', 'Lesson', 'Tạo một bản nháp nội dung mẫu từ Content Studio.');
      saveState();
      showToast('Đã tạo nội dung mẫu', 'Audit log đã ghi nhận thao tác.', 'success');
      return;
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const type = form.dataset.form;
    const data = new FormData(form);

    if (type === 'login') {
      login(data.get('identifier'), data.get('secret'));
      return;
    }
    if (type === 'forgot') {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      ephemeralStore.setItem('yen-demo-otp', code);
      addAudit('OTP_CREATED_MOCK', 'Auth', `Tạo OTP mock cho ${data.get('identifier')}.`, 'PUBLIC');
      saveState();
      navigate('/verify-otp');
      return;
    }
    if (type === 'otp') {
      const expected = ephemeralStore.getItem('yen-demo-otp') || '123456';
      if (data.get('otp') !== expected) {
        showToast('OTP không đúng', 'Dùng mã đang hiển thị trong hộp thông tin.', 'error');
        return;
      }
      showToast('Xác thực thành công', 'Đây là luồng OTP mock cho frontend.', 'success');
      navigate('/login');
      return;
    }
    if (type === 'lead') {
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const leadType = form.dataset.type;
      const details = leadType === 'B2B'
        ? { title: data.get('title') || '', scale: data.get('scale') || '', centers: data.get('centers') || '', preferredTime: data.get('preferredTime') || '' }
        : { studentName: data.get('studentName') || '', grade: data.get('grade') || '', preferredTime: data.get('preferredTime') || '' };
      const lead = {
        id: uid('lead'),
        code: `YC-${leadType}-${String(state.leads.length + 1).padStart(4,'0')}`,
        type: leadType,
        name: String(data.get('name') || '').trim(),
        organization: String(data.get('organization') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        email: String(data.get('email') || '').trim(),
        message: String(data.get('message') || '').trim(),
        details,
        status: 'NEW',
        createdAt: new Date().toISOString(),
      };
      state.leads.unshift(lead);
      addAudit('CONTACT_LEAD_CREATED', 'ContactLead', `${lead.code} · ${lead.type} · ${lead.name}`, 'PUBLIC');
      saveState();
      form.reset();
      form.querySelectorAll('.alert-success').forEach((node) => node.remove());
      const alert = document.createElement('div');
      alert.className = 'alert alert-success';
      alert.style.marginTop = '14px';
      alert.innerHTML = `<span><strong>Đã tiếp nhận yêu cầu ${escapeHtml(lead.code)}.</strong> Admin có thể xem ngay trong Contact Inbox.</span>`;
      form.appendChild(alert);
      showToast('Gửi yêu cầu thành công', lead.code, 'success');
      return;
    }
    if (type === 'support') {
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const contact = String(data.get('contact') || '').trim();
      const lead = {
        id: uid('lead'), code: `YC-SUPPORT-${String(state.leads.length + 1).padStart(4,'0')}`, type: 'SUPPORT',
        name: String(data.get('name') || '').trim(), organization: '',
        phone: contact.includes('@') ? '' : contact, email: contact.includes('@') ? contact : '',
        message: String(data.get('message') || '').trim(), details: { topic: String(data.get('topic') || '') },
        status: 'NEW', createdAt: new Date().toISOString(),
      };
      state.leads.unshift(lead);
      state.outboundMessages ||= [];
      state.outboundMessages.unshift({ id: uid('outbound'), channel: 'IN_APP', recipient: contact, template: 'SUPPORT_ACKNOWLEDGED', status: 'MOCKED', createdAt: new Date().toISOString() });
      addAudit('SUPPORT_REQUEST_CREATED', 'ContactLead', `${lead.code} · ${lead.details.topic}`, 'PUBLIC');
      saveState();
      form.reset();
      runtime.supportOpen = false;
      render();
      setTimeout(() => showToast('Đã tiếp nhận yêu cầu hỗ trợ', `${lead.code} · phản hồi bất đồng bộ.`, 'success'), 40);
      return;
    }
    if (type === 'quiz') {
      submitQuiz(form, false);
      return;
    }
    if (type === 'settings') {
      state.settings.passingScore = Number(data.get('passingScore'));
      state.settings.maxAttempts = Number(data.get('maxAttempts'));
      state.settings.remedialDeadlineDays = Number(data.get('remedialDeadlineDays'));
      state.settings.minimumVideoProgress = Number(data.get('minimumVideoProgress'));
      state.settings.manualMinutesPerAssignment = Number(data.get('manualMinutesPerAssignment'));
      state.settings.integrationMode = data.get('integrationMode') === 'LIVE' ? 'MOCK' : 'MOCK';
      addAudit('SYSTEM_SETTINGS_UPDATED', 'SystemSetting', 'Cập nhật business rule từ Admin Portal.');
      saveState();
      showToast('Đã lưu cấu hình', 'Các KPI và assignment mới sẽ dùng giá trị mới.', 'success');
      render();
      return;
    }
    if (type === 'add-student') {
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const code = String(data.get('code')).trim().toUpperCase();
      if (state.students.some((student) => student.code === code)) {
        showToast('Mã học sinh đã tồn tại', code, 'error');
        return;
      }
      const student = { id: uid('student'), code, name: data.get('name'), phone: data.get('phone'), dateOfBirth: '', classId: data.get('classId'), status: 'ACTIVE', avatar: initials(data.get('name')) };
      state.students.push(student);
      addAudit('STUDENT_CREATED', 'StudentProfile', `${student.name} · ${student.code}`);
      saveState();
      form.closest('.permission-page')?.remove();
      render();
      showToast('Đã thêm học sinh', student.name, 'success');
    }
  });

  function updateQuizProgress(form) {
    const quiz = state.quizzes.find((q) => q.id === form.dataset.quizId);
    if (!quiz) return;
    const answered = quiz.questionIds.filter((id) => form.querySelector(`input[name="${id}"]:checked`)).length;
    const fill = form.querySelector('[data-quiz-progress]');
    const label = form.querySelector('[data-quiz-answered]');
    if (fill) fill.style.width = `${percent(answered, quiz.questionIds.length)}%`;
    if (label) label.textContent = `${answered}/${quiz.questionIds.length} đã trả lời`;
  }

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-table-search]')) {
      const groupId = event.target.dataset.tableSearch;
      const group = document.querySelector(`[data-search-group="${groupId}"]`);
      if (!group) return;
      const query = event.target.value.trim().toLowerCase();
      group.querySelectorAll('tbody tr, .assignment-card').forEach((row) => {
        row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
      });
    }
    if (event.target.closest('form[data-form="quiz"]')) updateQuizProgress(event.target.closest('form[data-form="quiz"]'));
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-row-filter]')) {
      const groupId = event.target.dataset.rowFilter;
      const attribute = event.target.dataset.filterAttribute;
      const value = event.target.value;
      const group = document.querySelector(`[data-search-group="${groupId}"]`);
      group?.querySelectorAll('tbody tr').forEach((row) => {
        row.style.display = value === 'ALL' || row.dataset[attribute] === value ? '' : 'none';
      });
      return;
    }
    if (event.target.matches('[data-assignment-filter]')) {
      const value = event.target.value;
      document.querySelectorAll('.assignment-card[data-status]').forEach((card) => {
        card.style.display = value === 'ALL' || card.dataset.status === value ? '' : 'none';
      });
      return;
    }
    if (event.target.matches('[data-action="lead-status"]')) {
      const lead = state.leads.find((item) => item.id === event.target.dataset.leadId);
      if (!lead) return;
      const previous = lead.status;
      lead.status = event.target.value;
      addAudit('CONTACT_STATUS_UPDATED', 'ContactLead', `${lead.code}: ${previous} → ${lead.status}`);
      saveState();
      showToast('Đã cập nhật trạng thái', `${lead.code} · ${lead.status}`, 'success');
    }
  });

  window.addEventListener('hashchange', () => { runtime.sidebarOpen = false; runtime.publicMenuOpen = false; render(); });
  render();
})();

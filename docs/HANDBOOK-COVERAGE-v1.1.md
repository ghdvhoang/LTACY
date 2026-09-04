# Handbook Coverage — LMS Language Center v1.1

Ngày đối chiếu: 2026-09-05  
Phạm vi: Yen Center Full Journey **frontend demonstrator v3.0**

## Kết luận

Bản demo bao phủ trọn acceptance journey và các capability Release 1/Release 2 cần để kể câu chuyện end-to-end. Nó không phải bản hiện thực toàn bộ reference architecture hoặc Release 3+; backend, security production, provider integration, standards và AI vẫn ngoài phạm vi frontend.

## Golden journey và evidence

| Milestone handbook | Hiện thực trong demo | Evidence/guard |
|---|---|---|
| Lead → Consultation | Tương tác đầy đủ | Lead state, consultation, event, audit |
| Placement booking/result | Tương tác đầy đủ | 6 skill scores, framework/center level, academic release |
| Program/offer/payment | Tương tác đầy đủ, payment mock | Offer, discount, invoice, mock ledger, tách object |
| Class allocation | Tương tác đầy đủ | Level/age/schedule/branch/capacity gates; no-seat case |
| Teacher assignment | Tương tác đầy đủ | Qualification, level, age, mode, branch, availability, workload hard gates |
| Session delivery | Tương tác đầy đủ | Readiness, lesson adaptation, planned vs taught, deferred content |
| Attendance/remedial | Tương tác đầy đủ | Finalize attendance, absence reason, idempotent remedial, deadline |
| Homework | Tương tác đầy đủ | Assign → submit → grade → release → revision → resubmit → accept |
| Assessment/moderation | Tương tác đầy đủ | Six-skill manual grade, independent moderation, result release |
| Progress/promotion | Tương tác đầy đủ | Published snapshot, thresholds, override reason + evidence + audit |
| Parent review | Tương tác đầy đủ | Relationship scope, published data only, internal/restricted feedback filtered |
| Renewal | Tương tác đầy đủ | Learning outcome + next goal → next-level offer → accepted |

## Release coverage

### Release 1 — Must

| Capability | Coverage |
|---|---|
| Identity, branch, role, scope | Interactive frontend policy + route guard; không phải server authorization |
| Program, course version | Normalized data, published/immutable version UI |
| Student, teacher, class | Normalized entities và role workspaces |
| Timetable, session | Recurrence/holiday/conflict data model đại diện; canonical session lifecycle interactive |
| Enrollment, attendance | Interactive command/state transition |
| Teacher workbench | Before/during/after views và session evidence |
| Content, homework | Learner player + complete revision loop |
| Assessment/result | Auto remedial quiz + manual final result |
| Progress report | Published multi-skill report + next actions |
| Package/invoice/payment | Interactive; payment luôn gắn nhãn mock |
| Event contract/dashboard | Domain events, audit, notification và management views |

### Release 2 — Next

| Capability | Coverage |
|---|---|
| Rich homework feedback | Interactive revision loop |
| Rubric, moderation, grade release | Interactive canonical flow |
| Parent portal/notification | Interactive, có visibility policy và multi-learner switcher |
| Placement/class allocation | Interactive canonical flow + seeded no-seat exception |
| Service/intervention | Data model, workspace và intervention command; supporting cases đại diện |
| Availability/workload/substitution | Eligibility/workload interactive; substitution + handover domain command và seeded queue |
| Analytics dashboard | Capacity, quality, retention views từ state demo; không phải analytics warehouse |

### Release 3+ — Later

Không giả lập là đã hoàn thành: advanced CRM automation, AI Tutor/Speaking AI, adaptive learning, LTI/xAPI/QTI/OneRoster, verifiable credentials, external certification và predictive optimization.

## Sáu plane trong handbook

| Plane | Demo proof | Boundary |
|---|---|---|
| Experience | Public, Learner, Parent, Teacher, Admissions, Operations, Management, Admin | UX prototype, không có native mobile app |
| Learning | Catalog, course/version, lesson, player, homework, remedial | Media/proctoring/file upload production chưa có |
| Assessment & Outcome | Attempt, result, moderation, skills, report, promotion | Chỉ scenario đại diện, chưa phải authoring/test engine tổng quát |
| Management | Org, branch, role, scope, enrollment, session, notification | Client-side state, không concurrency/SLA worker |
| Data & Intelligence | Events, audit, metrics, decision evidence | Aggregate demo, không warehouse hoặc predictive model |
| Platform & Integration | Mock adapter registry, export CSV/print | Không API/BFF, database, SSO, queue, object storage |

## Exception workflow coverage

- Có command/model/view: no-seat allocation, transfer, substitute/handover, make-up booking, attendance correction window, intervention, promotion override.
- Có representation nhưng chưa phải complete interactive engine: excused absence approval, reservation/resume, withdrawal/settlement, class-wide reschedule/confirmation, refund.
- Boundary đúng handbook: Student Service vận hành exception; Academic giữ quyết định học thuật; Finance giữ settlement; Teacher cung cấp evidence.

## Acceptance scenario v1.1

`Create learner → Placement → Sell package → Allocate class → Assign teacher → Run session → Attendance → Homework → Assessment → Publish progress → Recommend next level`

Toàn bộ chuỗi trên chạy từ seed đến `RENEWED` bằng **Chạy tự động đến cuối** và được bảo vệ bằng automated canonical journey test. Demo bổ sung parent acknowledgement, moderation, remedial learning và renewal để chứng minh handoff xuyên domain.

## Không được suy diễn từ demo

- UI có role scope không đồng nghĩa đã có security baseline production.
- Audit trong `localStorage` không phải immutable audit store.
- Mock payment/message/media không chứng minh provider đã tích hợp.
- Màn hình dashboard không chứng minh data quality pipeline, event bus hoặc analytics store đã vận hành.
- Coverage handbook là coverage của luồng frontend và domain semantics, không phải production readiness.

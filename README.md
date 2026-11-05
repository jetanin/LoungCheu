# LoungCheu — ระบบลงทะเบียนกิจกรรมและเช็กชื่อ

Documentation baseline v0.5 | ปรับปรุง 5 พฤศจิกายน 2026
Deliverable 1: ส่ง 8 พฤศจิกายน 2026 เวลา 23:59 (Asia/Bangkok)

**สถานะ: รอตรวจรับ baseline ก่อนพัฒนา** ยังไม่มีแอป ผลทดสอบ หรือ application release; รายการ PLANNED ในเอกสารเป็นแผนงาน

ระบบกิจกรรมภายในมหาวิทยาลัยสำหรับ Participant และ Organizer ครอบคลุมการเผยแพร่ ลงทะเบียน ยกเลิก เช็กชื่อ และรายงานการเข้าร่วม

## ทีมและ repository

| สมาชิก | ชื่อ / รหัส |
|---|---|
| M1 | Jetanin Naitho — 67070501011 |
| M2 | Paphangkorn Luanseng — 67070501083 |

| ข้อมูลส่งงาน | ค่า |
|---|---|
| Theme | 3 — ใช้สิทธิ์จากรหัส M2 ที่ลงท้าย 3 |
| Repository | https://github.com/jetanin/LoungCheu |
| Submitted application tag/commit | ยังไม่มี |

## Stack และ workflow

| Area | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Bootstrap |
| Backend | Node.js + Express + TypeScript; REST JSON |
| Database | PostgreSQL + Prisma |
| Testing | Vitest + Supertest; เสนอ Playwright สำหรับ browser E2E |
| Workflow | GitHub Issues/Projects, feature branches, PRs และ teammate review |

Sprint 1 ใช้ `feature/* → sprint-1-staging → main` ทุก feature PR ต้องมีเพื่อน review และทดสอบรวมก่อน release PR เข้า main ดู Issues #1–4, project board และ baseline integration ใน [Sprint plan](docs/sprints/plan.md)

## เอกสาร Deliverable 1

| Part | คะแนน | เอกสาร |
|---|---:|---|
| A | 10 | [SRS](docs/srs.md) |
| B | 10 | [Features](docs/features.md), [Traceability](docs/traceability.md) |
| C | 15 | [System SDS](docs/system-sds.md) |
| D | 5 | [Three-sprint plan](docs/sprints/plan.md) |
| E | 20 | [Sprint 1 / DoD](docs/sprints/sprint-1/README.md), [Contracts](docs/sprints/sprint-1/contracts.md), [STS](docs/sprints/sprint-1/sts.md) |
| F | 20 | [Evidence register](docs/deliverable-1/evidence-register.md), [Submission checklist](docs/deliverable-1/report-plan.md) |

[Decisions / review record](docs/decisions.md) เก็บเหตุผลและคำถามคงค้าง; [Changelog](docs/changelog.md) เก็บ revision/commit history และ AI-use declaration

## การใช้งานและส่งงาน

1. ทีมตรวจ scope/design/contracts แล้ว version เอกสารก่อน implementation
2. พัฒนาและทดสอบตาม Issue/AC เก็บ TDD red→green สำหรับกฎสำคัญ และ teammate review
3. เติม actual test file/name, command, result และ tested commit ใน traceability/evidence
4. Release บน main พร้อม setup/migration/seed/build/run/test instructions
5. รวมเนื้อหา Parts A–F และหลักฐานลง PDF เดียว พร้อมสารบัญ/เลขหน้า ส่งผ่าน LEB2

ตอนนี้ยังไม่มีคำสั่งติดตั้งหรือรันแอป; เติมเมื่อมี executable project Docker/CI/CD/GCP ต้องเสร็จใน Lab 5 ส่วน D1 ต้องมี local release และแผน deployment

## เอกสารอ้างอิง

- `group_work_specs_v1.pdf` (15 หน้า): Theme assignment หน้า 4, Theme 3 หน้า 5, Sprint/workflow หน้า 9–11, checkpoints/Labs หน้า 12–15
- `project_deliverable_1_v1.pdf` (8 หน้า): Parts A–E หน้า 1–4, working Sprint 1 และ submission/evidence หน้า 5–8

ใช้ master กำหนดขอบเขต และ handout D1 กำหนดเนื้อหา PDF ไฟล์ต้นทางแจกแยกจาก repository; รายละเอียด handout D2/Final/Labs ให้ตรวจเพิ่มเมื่อได้รับ

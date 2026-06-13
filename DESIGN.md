# BSIINK Physics Exam — System Design

ระบบสอบฟิสิกส์ออนไลน์สำหรับนักเรียน ~30 คน · 2 บทบาท (Tutor/Admin + Student) ·
ข้อสอบปรนัย 30 ข้อ (ตัวเลือก 1–5) · **ทำได้คนละ 1 ครั้ง/ชุด**

Stack: **Next.js (App Router, TypeScript, Tailwind)** + **Supabase (Auth + Postgres + Storage)** · deploy บน Vercel

---

## 1. รูปแบบข้อสอบ (ยืนยันจากไฟล์จริง 8 ชุดใน `exams/`)

ทุกไฟล์โครงสร้างเดียวกัน:

- `.sheet > .head` (หัวกระดาษ) + `30 × .q[data-n="1..30"]` + `.note`
- แต่ละข้อ: `.choices li[data-v="1..5"]` (คลิก = ใส่ class `.sel`), `.ansBtn` (ปุ่มเฉลย), `.sol.hidden` (เฉลยละเอียด)
- engine `<script>` มี `const ANS=[30 ตัว ค่า 1..5]`, `reveal(q,n)`, `HOOKS[]`
- บางข้อมี `.anim` (SVG interactive figure) ที่ status text **โชว์คำตอบตรงๆ**

### เฉลยฝังอยู่ใน HTML 3 จุด → ต้องลอกออกตอนสอบ
1. `const ANS=[...]` — ถอดเก็บฝั่งเซิร์ฟเวอร์
2. `.sol` 30 บล็อก (มีข้อความ "ตอบ N)" + วิธีทำ) — ลบออก
3. `.anim` (figure ที่สปอยล์คำตอบ) — **ลบออกทั้งหมดตอนสอบ** (ตามที่ตกลง)

### 2 ฉบับต่อ 1 ชุด (สร้างโดย build pipeline)
| ฉบับ | ใช้ตอน | เนื้อหา |
|------|--------|---------|
| **exam** | นักเรียนกำลังทำ | ถอด ANS + ลบ `.sol` + ลบ `.ansBtn` + ลบ `.anim` + ฉีด exam-client shim |
| **review** | หน้า result หลังส่ง | ไฟล์เดิมเต็ม + ระบายถูก/ผิดจากคำตอบที่เลือก (ใช้ key จากเซิร์ฟเวอร์) |

---

## 2. สถาปัตยกรรม

```
Next.js (Vercel)
├─ /login                      เข้าระบบ username+password
├─ /student                    รายการชุดที่ถูก assign + สถานะ
├─ /student/exam/[examId]      ทำข้อสอบ (1 attempt, timer, watermark)
├─ /student/result/[examId]    คะแนน + ฉบับเฉลย
├─ /tutor                      dashboard ผลรวม
├─ /tutor/exams                อัปโหลด/จัดการชุดสอบ
├─ /tutor/students             สร้าง/จัดการบัญชีนักเรียน (ทีละคน/CSV)
├─ /tutor/assign               มอบหมายชุดสอบ
├─ /tutor/results              ตารางผล + export CSV
└─ server actions / route handlers (service-role) → ตรวจคะแนน, สร้าง user
        │ @supabase/ssr (cookie session)
        ▼
Supabase: Auth · Postgres(+RLS) · Storage(html ฉบับสอบ/เฉลย)
```

---

## 3. Data model (Postgres)

```
profiles(id→auth.users, role[tutor|student], username unique, full_name, created_at)
exams(id, title, exam_code, description, duration_minutes=180, total_questions=30,
      exam_html_path, review_html_path, status[draft|published], created_by, created_at)
exam_answer_keys(exam_id PK→exams, answers jsonb[30])   -- RLS ปิดสนิท
assignments(id, exam_id, student_id, unique(exam_id,student_id))
attempts(id, exam_id, student_id, status[in_progress|submitted|expired],
         started_at, submitted_at, score, total, answers jsonb,
         unique(exam_id, student_id))   -- ★ บังคับ 1 คน/ชุด/ครั้ง
```

**"ทำได้ครั้งเดียว"** = `UNIQUE(exam_id, student_id)` ที่ระดับ DB (กัน race/2 แท็บ) + ตรวจ `status`.

---

## 4. ความปลอดภัย (RLS)

| ตาราง | student | tutor |
|------|---------|-------|
| exams | อ่านเฉพาะ published ที่ถูก assign | full |
| exam_answer_keys | **ไม่มี policy → ใครก็ select ไม่ได้** | ผ่าน RPC เท่านั้น |
| assignments | อ่านของตัวเอง | full |
| attempts | อ่าน/สร้างเฉพาะ student_id=auth.uid() | อ่านทั้งหมด |

- ตรวจคะแนนใน Postgres function `submit_attempt(exam_id, answers)` แบบ **SECURITY DEFINER**
  → function เท่านั้นแตะ answer key → คืนเฉพาะ score/total (+ key ตอน review) → เฉลยไม่หลุดก่อนส่ง
- สร้างบัญชีนักเรียนผ่าน Supabase Admin API ด้วย **service-role key ฝั่งเซิร์ฟเวอร์เท่านั้น**
- หน้าสอบ: ลายน้ำชื่อนักเรียนทับทั้งหน้า (กันแคปไฟล์หลุด), timer auto-submit เมื่อหมดเวลา

---

## 5. Flow end-to-end

**Tutor:** login → อัปโหลด HTML (build pipeline แยกฉบับสอบ/เฉลย + เก็บ key) → publish →
สร้างนักเรียน (username/password, ทีละคน/CSV) → assign ชุดให้นักเรียน → ดูผล realtime + export CSV + reset attempt รายคน

**Student:** login (username/password) → เห็นชุดที่ถูก assign + สถานะ → กด "เริ่มทำ"
(สร้าง attempt in_progress, จับเวลา; ถ้ามี attempt แล้วเข้าไม่ได้) → ทำ+ส่ง → server grade → ล็อก →
เห็นคะแนนทันที + ฉบับเฉลย (ถ้า tutor เปิดให้)

---

## 6. Auth: username → Supabase email

Supabase Auth ใช้ email; map ให้ล็อกอินด้วย username:
- ตอนสร้างบัญชี ระบบสร้าง user ด้วย email สังเคราะห์ `<username>@students.bsiink.local` + password
- หน้า login กรอก username+password → frontend ต่อ domain → `signInWithPassword`
- tutor คนแรกสร้างมือใน Supabase dashboard (ตั้ง role=tutor ใน profiles)

---

## 7. ลำดับการสร้าง

1. `scripts/build.mjs` (ใหม่): HTML → ฉบับสอบ + ฉบับเฉลย + answer key
2. Next.js scaffold + Supabase SSR + middleware
3. SQL migration: schema + RLS + RPC
4. หน้า Login
5. หน้า Student (list / exam / result)
6. หน้า Tutor (exams / students / assign / results)

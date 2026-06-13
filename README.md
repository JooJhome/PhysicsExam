# BSIINK Physics Exam — ระบบสอบฟิสิกส์ออนไลน์

Next.js (App Router) + Supabase · 2 บทบาท **Tutor/Admin** กับ **Student** · ข้อสอบปรนัย 30 ข้อ
**ทำได้คนละ 1 ครั้ง/ชุด** · ตรวจคะแนนฝั่งเซิร์ฟเวอร์ (เฉลยไม่รั่ว) · ลายน้ำกันไฟล์หลุด

> รายละเอียดดีไซน์ทั้งหมดอยู่ใน [DESIGN.md](DESIGN.md)

## โครงสร้าง
```
src/
  app/login                    เข้าระบบ username + password
  app/student/                 รายการชุด · ทำข้อสอบ · ผล/เฉลย
  app/tutor/                   ภาพรวม · ข้อสอบ · นักเรียน · มอบหมาย · ผลสอบ
  app/api/results/export       export CSV (tutor)
  lib/examTransform.ts         แปลง HTML → ฉบับสอบ/เฉลย + ถอดเฉลย
  lib/supabase/                client / server / admin
  lib/actions/                 server actions (auth, tutor)
supabase/migrations/0001_init.sql   schema + RLS + RPC
scripts/seed.mjs               อัปโหลดข้อสอบ + สร้างบัญชี (service-role)
scripts/process-exams.mjs      dry-run แปลงไฟล์ลง dist/ เพื่อตรวจสอบ
exams/                         ไฟล์ข้อสอบต้นฉบับ (มีเฉลย — ไม่อัปขึ้นหน้าเว็บ)
```

## ติดตั้ง (ครั้งแรก)

### 1. สร้าง Supabase project
- ที่ [supabase.com](https://supabase.com) → New project
- ไปที่ **SQL Editor** → วางทั้งไฟล์ [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run

### 2. ตั้งค่า env
```bash
cp .env.local.example .env.local
```
ใส่ค่าจาก Supabase → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (ความลับ — ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น)

### 3. ติดตั้ง dependencies + seed
```bash
npm install

# สร้าง tutor + อัปโหลดข้อสอบทั้ง 8 ชุด (published)
npm run seed -- --tutor-user=tutor --tutor-pass=YourStrongPass123

# (ตัวเลือก) สร้างนักเรียนจำนวนมาก: วางไฟล์ scripts/students.csv
#   รูปแบบบรรทัดละคน:  username,password,ชื่อ-สกุล
# แล้วรัน npm run seed อีกครั้ง (idempotent — ของเดิมจะถูกข้าม)
```

### 4. รัน
```bash
npm run dev        # http://localhost:3000
```
เข้า `/login` ด้วย tutor ที่สร้างไว้ → จัดการได้ทั้งระบบ

## ขั้นตอนใช้งาน (Tutor)
1. **ข้อสอบ** → อัปโหลด HTML (ระบบถอดเฉลย/ปุ่มเฉลย/แอนิเมชันออกจากฉบับสอบอัตโนมัติ) → กดให้ “เผยแพร่แล้ว”
2. **นักเรียน** → เพิ่มทีละคนหรือวาง CSV
3. **มอบหมาย** → ติ๊กชุดให้นักเรียน (หรือปุ่ม “ทั้งหมด”)
4. **ผลสอบ** → ดูคะแนนเรียลไทม์ · ดาวน์โหลด CSV · ปุ่ม “รีเซ็ต” ให้ทำใหม่ได้ (เช่น เน็ตหลุด)

## Deploy (Vercel)
1. push โค้ดขึ้น GitHub
2. Vercel → Import project → ใส่ env 4 ตัวเดียวกับ `.env.local`
3. Deploy — เสร็จ

## ความปลอดภัย
- เฉลยเก็บในตาราง `exam_answer_keys` ที่ **RLS ปิดสำหรับนักเรียน** — ตรวจคะแนนผ่าน RPC `submit_attempt` (SECURITY DEFINER) เท่านั้น
- ฉบับสอบไม่มี `ANS`/`.sol`/`.anim` → เปิด DevTools ก็ไม่เจอเฉลย
- 1 คน/ชุด ทำได้ครั้งเดียว บังคับด้วย `UNIQUE(exam_id, student_id)` + state machine
- ไฟล์ต้นฉบับใน `exams/` และ `dist/` เป็นความลับ (อยู่ใน `.gitignore`)

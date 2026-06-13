# Deploy Checklist — BSIINK Physics Exam

> **แนวคิด:** Supabase = backend (DB + Auth + RPC) ที่รันบน cloud อยู่แล้ว ·
> Vercel โฮสต์แค่ Next.js แล้วเชื่อมไปหา Supabase ผ่าน env vars ·
> "deploy backend" จริงๆ คือ **เตรียม Supabase project + ใส่ env ใน Vercel**

---

## 0. เตรียม Supabase project (production)

สร้าง project ใหม่ที่ [supabase.com](https://supabase.com) (หรือใช้ตัวที่มี) แล้วเก็บค่า 3 ตัวนี้จาก
**Settings → API**: Project URL, `anon` key, `service_role` key

---

## 1. รัน migrations (schema + RLS + RPC) — ครบทั้ง 4 ไฟล์ ตามลำดับ

SQL Editor → วางทีละไฟล์ → Run:

1. `supabase/migrations/0001_init.sql`
2. `supabase/migrations/0002_fix_start_attempt_race.sql`
3. `supabase/migrations/0003_exam_surveys.sql`
4. `supabase/migrations/0004_review_once.sql`

(หรือถ้าใช้ Supabase CLI: `supabase link` แล้ว `supabase db push`)

> ✅ ไม่ต้องสร้าง Storage bucket — HTML ข้อสอบเก็บใน DB column (`exams.exam_html`, `review_html`)

---

## 2. ตั้งค่า Auth (Authentication)

- **ปิด** "Allow new users to sign up" (Sign In / Providers) — เปิดบัญชีผ่าน service-role เท่านั้น
- ไม่ต้องเปิด email confirmation / magic link (อีเมลเป็นโดเมนสังเคราะห์ ไม่มีกล่องจริง;
  สคริปต์สร้าง user ด้วย `email_confirm: true` อยู่แล้ว)
- (ตัวเลือก) **URL Configuration → Site URL** = โดเมน Vercel ของคุณ

---

## 3. Environment Variables ใน Vercel

Project → Settings → Environment Variables → ใส่ 4 ตัว (ติ๊ก **Production + Preview + Development**):

| Key | ค่า | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon key>` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service_role key>` | 🔒 **Sensitive** — ห้ามมี `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN` | `students.bsiink.local` | โดเมนสังเคราะห์ map username→email |

> ⚡ ทางลัด: กด **Import .env** แล้ววางเนื้อหา `.env.local` ที่ใช้ตอน dev ทั้งไฟล์
> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypass RLS ทั้งหมด — ถ้าหลุดขึ้น client = ใครก็แก้ DB ได้

Build/Output ใช้ค่า default ของ Next.js preset ได้เลย → **Deploy**

---

## 4. Seed ข้อมูล production (รันจากเครื่อง local ชี้ไป project production)

สร้างไฟล์ env แยกสำหรับ production (อย่า commit):

```bash
cp .env.local .env.production.local   # แล้วแก้ค่าเป็นของ project production
```

> ต้องมี `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN`
> ใช้ Node 20+ (รองรับ `--env-file`)

### 4.1 สร้าง tutor (ต้องมีอย่างน้อย 1 เพื่อ login เข้าจัดการ)
```bash
node --env-file=.env.production.local scripts/seed-tutor.mjs <username> <password> "ชื่อ-สกุล"
```

### 4.2 สร้างนักเรียน
```bash
# ทีละคน
node --env-file=.env.production.local scripts/seed-students.mjs <username> <password> "ชื่อ-สกุล"
# หรือจาก CSV (บรรทัดละ: username,password,ชื่อ-สกุล)
node --env-file=.env.production.local scripts/seed-students.mjs --csv students.csv
```

### 4.3 อัปโหลดข้อสอบจากโฟลเดอร์ `exams/` (ถอดเฉลย + แยกฉบับสอบ/เฉลยอัตโนมัติ)
```bash
node --env-file=.env.production.local scripts/seed-exams.mjs          # publish เลย
node --env-file=.env.production.local scripts/seed-exams.mjs --draft  # เก็บเป็นร่างก่อน
```
> หรือข้ามขั้นนี้แล้วอัปโหลด HTML ผ่านหน้า **ติวเตอร์ → ข้อสอบ** บนเว็บแทนได้

### 4.4 มอบหมายชุดให้นักเรียน
```bash
node --env-file=.env.production.local scripts/assign.mjs <exam_code> --all      # ให้ทุกคน
node --env-file=.env.production.local scripts/assign.mjs <exam_code> user1 user2 # เฉพาะบางคน
```
> หรือทำผ่านหน้า **ติวเตอร์ → มอบหมาย** บนเว็บ

---

## 5. Smoke test หลัง deploy

- [ ] เปิด `https://<domain>/login` → ใส่ tutor → เข้า `/tutor` ได้
- [ ] หน้า ภาพรวม/ข้อสอบ/นักเรียน/มอบหมาย/ผลสอบ โหลดข้อมูลขึ้น (RLS ผ่าน)
- [ ] login ด้วยนักเรียน → เห็นชุดที่ถูก assign → เริ่มทำ → ส่ง → เห็นคะแนน
- [ ] เฉลยไม่โผล่ใน DevTools ก่อนส่ง (answer key อยู่หลัง RPC `SECURITY DEFINER`)

---

## หมายเหตุความปลอดภัย
- `.env.production.local` และ `service_role` key **ห้าม commit** (เช็กว่าอยู่ใน `.gitignore`)
- service-role ใช้เฉพาะ server actions / seed scripts — ไม่เคยส่งไป client
- ทุก query ฝั่ง client ผ่าน RLS + การตรวจคะแนนผ่าน Postgres function (เฉลยไม่รั่ว)

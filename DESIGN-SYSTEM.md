---
name: BSIINK Physics Exam
description: ระบบสอบฟิสิกส์ออนไลน์ที่อบอุ่น เป็นมิตร และน่าเชื่อถือ สำหรับนักเรียน ม.ปลาย
colors:
  brand: "#16695b"
  brand-strong: "#0f5447"
  brand-tint: "#e9f3f0"
  accent: "#efa520"
  accent-strong: "#c27d12"
  accent-tint: "#fdf4e3"
  ink: "#1f211d"
  ink-soft: "#524c3e"
  muted: "#6f6857"
  surface: "#ffffff"
  canvas: "#faf6ec"
  hairline: "#e7dcc6"
  success: "#236321"
  success-tint: "#edf6ec"
  danger: "#9e3424"
  danger-tint: "#fcebe8"
typography:
  display:
    fontFamily: '"Plus Jakarta Sans", "Noto Sans Thai", system-ui, sans-serif'
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  numeric:
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: '"Noto Sans Thai", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: '"Noto Sans Thai", system-ui, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  lg: "12px"
  xl: "16px"
  "2xl": "24px"
  "3xl": "28px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "12px 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-strong}"
    textColor: "{colors.surface}"
  button-cta:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.3xl}"
    padding: "20px"
  stat-block:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.3xl}"
    padding: "24px"
---

# Design System: BSIINK Physics Exam

> ระบบดีไซน์เชิงภาพ (สี/ฟอนต์/คอมโพเนนต์) คู่กับ [PRODUCT.md](PRODUCT.md)
> สถาปัตยกรรมระบบ (data model, RLS, flow) อยู่ใน [DESIGN.md](DESIGN.md)
>
> **ทิศทาง:** EduLearn-inspired — เทียลเข้ม + อำพันอุ่น + พื้นครีม + ตัวอักษรหนาเป็นมิตร + ลูกเล่นวาดมือ
> token ทั้งหมดอยู่ที่ [tailwind.config.ts](tailwind.config.ts), ฟอนต์โหลดที่ [layout.tsx](src/app/layout.tsx),
> ลูกเล่นที่ [Decor.tsx](src/components/Decor.tsx)

## 1. Overview

**Creative North Star: "ห้องเรียนติวที่อบอุ่น" (The Warm Tutoring Room)**

ระบบให้ความรู้สึกเหมือนห้องติวที่ครูใส่ใจ: เป็นมิตร เข้าถึงง่าย ให้กำลังใจ แต่ยังเอาจริงเรื่องการสอบ
พื้นครีมอุ่นเป็นผืนผ้าใบ บล็อกเทียลเข้มให้ความหนักแน่นน่าเชื่อถือ อำพันเป็นประกายความอบอุ่นและพลังบวก
ลูกเล่นวาดมือ (เส้นใต้ ดาว เส้นหยึกหยัก) เติมความเป็นมนุษย์โดยไม่ทำให้ดูเล่นเกินไป

ระบบ **ปฏิเสธ** (ตาม [PRODUCT.md](PRODUCT.md) anti-references):
ความเป็นระบบราชการ/e-learning เก่า, การ์ดเหมือนกันเรียงเป็นกริดไร้ชีวิต, ความฉูดฉาด/เกมเกินไป, และความจืดชืดไร้เอกลักษณ์

**กฎทอง — ความเข้มต่างกันตามหน้า (calm gradient):**
- **หน้าพักผ่อนสายตา/low-stakes** (login, รายการชุด, ผลคะแนน, dashboard, empty states): แสดงออกเต็ม — บล็อกสี ดูเดิล เส้นใต้ ดาว ลูกศร
- **หน้าทำข้อสอบ + ตารางข้อมูลหนาแน่น**: เอาแค่ **สี + ฟอนต์** ตัดลูกเล่นออกหมด เงียบ สงบ ไม่กวนสมาธิ (หลักการ "โฟกัสคือความเมตตา")

**Key Characteristics:**
- พื้นครีมอุ่น + การ์ดขาวมุมโค้งใหญ่ (24–28px) เงานุ่ม
- เทียล = เสียงหลัก/action/structural ; อำพัน = accent/highlight/CTA เด่น
- ไทย humanist (Noto Sans Thai) + Latin/ตัวเลขหนา (Plus Jakarta Sans) — คู่ตัดบนแกน contrast
- ลูกเล่นวาดมือใช้อย่างพอดี เฉพาะหน้า low-stakes

## 2. Colors

พาเลตต์ "เทียลเข้ม + อำพันอุ่น + ครีม" — อบอุ่น เป็นมิตร แต่หนักแน่นพอสำหรับการสอบ
ramp เดิมของ Tailwind (`blue`→teal, `gray`→sand, `amber`, `green`, `red`) ถูก override คลาสเดิมจึงอัปเกรดทั้งแอป

### Primary
- **Teal** (#16695b / `brand-600` = `blue-600`): การกระทำหลัก ลิงก์ บล็อก stat แผงแบรนด์ focus
  ตัวอักษรขาวบนเทียลผ่าน AA (~5.7:1) — เป็น "เสียงน่าเชื่อถือ/สงบ"
- **Teal Strong** (#0f5447 / `brand-700`): hover/active

### Secondary
- **Amber** (#efa520 / `accent-400`): CTA เด่น (เช่น "เริ่มทำ"), เส้นใต้วาดมือ, ดาวประกาย, progress fill
  **ใช้ตัวอักษรเข้ม (ink) บนพื้นอำพันเสมอ** เพื่อคอนทราสต์ — เป็น "เสียงอบอุ่น/เป็นกันเอง"

### Neutral (warm sand — ครีมอุ่น chroma ต่ำ)
- **Ink** (#1f211d / `gray-900`): ตัวอักษรหลัก หัวข้อ ตัวข้อสอบ
- **Ink Soft** (#524c3e / `gray-600`): ข้อความรอง
- **Muted** (#6f6857 / `gray-500`): metadata — คอนทราสต์ ~4.6:1 บนครีม ผ่าน AA
- **Surface** (#ffffff): พื้นการ์ด/แผง
- **Canvas** (#faf6ec / `gray-50`): พื้นหลังครีมอุ่นของทั้งแอป
- **Hairline** (#e7dcc6 / `gray-200`): เส้นขอบ/ตัวคั่น

### Tertiary (Semantic — สื่อสถานะเท่านั้น คู่กับไอคอน/ข้อความ)
- **Success** (#236321 บนพื้น #edf6ec): คะแนน/คำตอบถูก — เขียวใบไม้ harmonize
- **Danger** (#9e3424 บนพื้น #fcebe8): error/คำตอบผิด/ย้อนไม่ได้ — แดงอบอุ่น

### Named Rules
**The Two-Voice Rule.** เทียล = น่าเชื่อถือ/โครงสร้าง ; อำพัน = อบอุ่น/highlight ห้ามสลับบทบาท
อำพันคือ accent ที่หายาก (≤1 CTA เด่นต่อหน้า) ความหายากคือสิ่งที่ทำให้มันดึงดูด

**The Dark-on-Amber Rule.** พื้นอำพันใช้ตัวอักษรเข้ม (ink) เท่านั้น ห้ามขาวบนอำพัน (คอนทราสต์ไม่ผ่าน)

**The Semantic-Only Color Rule.** เขียว/แดง สื่อสถานะเท่านั้น คู่ไอคอน/ข้อความ ไม่พึ่งสีอย่างเดียว

## 3. Typography

**Heading / Numeric Font:** Plus Jakarta Sans (Latin/ตัวเลข) — หนา เป็นมิตร geometric
**Body Font:** Noto Sans Thai (เนื้อหาไทยทั้งหมด)

**Character:** คู่ฟอนต์ตัดกันบนแกน contrast — Jakarta หนาเป็นมิตรสำหรับหัวข้อ+ตัวเลข, Noto Thai อ่านสบายสำหรับเนื้อหา
หัวข้อไทยที่ Jakarta ไม่รองรับจะ fallback เป็น Noto Sans Thai 700 อัตโนมัติ

### Hierarchy
- **Display** (Jakarta 800, clamp 1.875–2.25rem, line-height 1.12, tracking -0.01em): หัวหน้าหลัก — `text-wrap: balance`
- **Title** (Jakarta/Noto 700, 1.125–1.25rem): หัวข้อ section, ชื่อชุดข้อสอบ
- **Body** (Noto 400, 1rem, 1.7): ตัวข้อสอบ/เฉลย — จำกัด 65–75ch
- **Numeric** (Jakarta 700, `tabular-nums`): timer, คะแนน, จำนวนข้อ, ตัวเลข stat
- **Label** (Noto 600, 0.875rem): ป้าย ปุ่ม metadata, รหัสชุด (`brand-700` บน `brand-50`)

### Named Rules
**The Readable-Ink Rule.** เนื้อหาที่ต้องอ่านจริงใช้ Ink (#1f211d) / Ink Soft (#524c3e) — Muted สงวนไว้สำหรับ metadata
**The Hand-Underline Rule.** เน้นคำสำคัญในหัวข้อด้วย `<Underline>` วาดมือสีอำพัน แทนการขีดเส้นตรงหรือ highlight สี
**The Tabular-Numeral Rule.** ตัวเลขที่เปลี่ยนค่าได้ใช้ `font-display tabular-nums` เสมอ

## 4. Elevation

**แบนเป็นค่าเริ่มต้น** ความลึกมาจากการวางชั้นสี (การ์ดขาว/บล็อกเทียล บนครีม) + เส้น hairline + เงานุ่มระดับเดียว

### Shadow Vocabulary
- **card** (`0 1px 3px rgb(31 33 29 / 0.06)`): เงานิ่งของการ์ด
- **lift** (`0 10px 30px -12px rgb(31 33 29 / 0.18)`): การ์ดลอยเด่น (login panel)

### Named Rules
**The Hover-Lift Rule.** การ์ดที่กดได้ยกตัว `-translate-y-0.5` ตอน hover (เคารพ reduced-motion) — แสดงว่าโต้ตอบได้ ไม่ใช้เงาหนักซ้อน

## 5. Components

### Buttons
- **Shape:** มุมโค้ง 16px (`rounded-xl`)
- **Primary (teal):** พื้น `brand-600` ตัวอักษรขาว — การกระทำหลักทั่วไป (เข้าสู่ระบบ, ส่งคำตอบ, อัปโหลด)
- **CTA (amber):** พื้น `accent-400` ตัวอักษร **ink** + ลูกศร ↗ — การกระทำเด่นที่สุดของหน้า (เริ่มทำ)
- **Secondary/Outline:** เส้น `brand-600` ตัวอักษร `brand-700` (ทำต่อ)
- **Ghost:** พื้นขาว เส้น hairline ตัวอักษร ink-soft (ออกจากระบบ)

### Cards
- มุมโค้ง 24–28px (`rounded-3xl`) พื้นขาว เส้น hairline + `shadow-card` ; hover ยกตัว
- **Stat block:** การ์ดสีทึบ (เทียล/อำพัน) ตัวเลขใหญ่ `font-display` — สำหรับ dashboard/progress

### Status Pills
- **Score Pill:** พื้น `success` tint + ring ตัวเลข `font-display tabular-nums`
- **รหัสชุด chip:** พื้น `brand-50` ตัวอักษร `brand-700` `font-display`

### Timer (หน้าสอบ — โหมดสงบ)
`font-display tabular-nums` + ไอคอนนาฬิกา 3 ระดับ (สี + ข้อความ ไม่พึ่งสีอย่างเดียว):
normal = พื้น ink ขาว ; caution ≤10น = amber-100/amber-800 + "ใกล้หมดเวลา" ; danger ≤2น = red ขาว + "ใกล้หมดเวลามาก"

### Confirm Dialog
`<dialog>` จริง (focus-trap, Esc, ::backdrop เบลอ) — แทน native confirm/alert ทั้งระบบ
ยืนยันการกระทำที่ย้อนไม่ได้ทุกครั้ง tone `brand` (teal) หรือ `danger` (red)

### Decorative Motifs ([Decor.tsx](src/components/Decor.tsx))
`Underline` (เส้นใต้วาดมือ), `Sparkle` (ดาว), `Squiggle` (เส้นหยึกหยัก), `ArrowUpRight` (ลูกศรลิงก์),
`ChalkDoodles` (ดูเดิลบนพื้นเทียล), `Wordmark` (โลโก้) — **ห้ามใช้บนหน้าทำข้อสอบ**

## 6. Do's and Don'ts

### Do:
- **Do** ใช้เทียลเป็นเสียงหลัก + อำพันเป็น accent เด่นที่หายาก (The Two-Voice Rule)
- **Do** ใช้ตัวอักษรเข้มบนพื้นอำพันเสมอ (The Dark-on-Amber Rule)
- **Do** เน้นคำสำคัญด้วยเส้นใต้วาดมืออำพัน (The Hand-Underline Rule)
- **Do** ใช้ Ink / Ink Soft กับเนื้อหาที่ต้องอ่านจริง คอนทราสต์ ≥ 4.5:1
- **Do** ใช้ `font-display tabular-nums` กับตัวเลขที่มีความหมาย
- **Do** ยืนยันด้วย ConfirmDialog แบรนด์ก่อนการกระทำที่ย้อนไม่ได้ — ไม่ใช้ native confirm/alert
- **Do** เก็บหน้าทำข้อสอบให้สงบ — สี+ฟอนต์เท่านั้น ไม่มีลูกเล่น

### Don't:
- **Don't** ทำให้เป็น **ระบบราชการ/e-learning เก่า** — ตารางแน่น ฟอนต์เล็ก กรอบหนา
- **Don't** เรียง **การ์ดเหมือนกันเป็นกริดไร้ชีวิต** — ใช้จังหวะ สถานะ และความสำคัญที่ต่างกัน
- **Don't** **ฉูดฉาด/เกมเกินไป** — ไม่มี gamification badge/แต้ม, ลูกเล่นต้องพอดี, ห้ามดูเดิลบนหน้าสอบ
- **Don't** ปล่อยให้ **จืดชืดไร้เอกลักษณ์**
- **Don't** ใช้ตัวอักษรขาวบนพื้นอำพัน (คอนทราสต์ไม่ผ่าน)
- **Don't** วางเนื้อหาสำคัญด้วย Muted บนพื้นครีม
- **Don't** ใช้ border-left/right > 1px เป็นแถบสี, gradient text, หรือ glassmorphism ตกแต่ง
- **Don't** ใส่แอนิเมชันที่ไม่มี fallback สำหรับ `prefers-reduced-motion`

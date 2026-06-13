# โฟลเดอร์ข้อสอบต้นฉบับ (8 ชุด)

วางไฟล์ข้อสอบ HTML ต้นฉบับที่นี่ **1 ไฟล์ = 1 ชุด**

## กติกาการตั้งชื่อไฟล์
ชื่อไฟล์ (ไม่รวม `.html`) จะถูกใช้เป็น **examId** — ใช้ชื่อสั้น ๆ ไม่มีช่องว่าง เช่น

```
exams/
  set1.html
  set2.html
  ...
  set8.html
```

(จะตั้งชื่อสื่อความหมายก็ได้ เช่น `mechanics.html`, `optics.html` — แต่ให้เป็น a-z/0-9/-/_ เท่านั้น)

## แต่ละไฟล์ควรมี
- โครงสร้างตาม BRIEF: `.sheet > .head + 30 × .q[data-n] + .note`
- engine ใน `<script>` ที่มี `const ANS=[...30 ตัว ค่า 1–5]`
  → build step (`scripts/build.mjs`) จะ **ถอด ANS ออก** แล้วเก็บเป็นเฉลยฝั่งเซิร์ฟเวอร์

## หลังวางไฟล์ครบ
```bash
node scripts/build.mjs      # ถอด ANS → dist/master/*.html + dist/answers.json
```

> ⚠️ ไฟล์ในโฟลเดอร์นี้คือ "ต้นฉบับมีเฉลย" — ถูกใส่ใน .gitignore? **ไม่** (ต้นฉบับเก็บได้)
> แต่ `dist/` และ `answers.json` ถูก ignore เพราะเป็นเฉลยที่จะกลายเป็น secret

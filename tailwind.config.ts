import type { Config } from "tailwindcss";

/**
 * BSIINK Physics Exam — token system (EduLearn-inspired)
 * ดูบริบทเต็มที่ DESIGN-SYSTEM.md
 *
 * เรา override ramp ของ Tailwind (blue/gray/green/amber/red) ด้วยพาเลตต์แบรนด์ใหม่
 * คลาสเดิมทั้งหมด (bg-blue-600, text-gray-500, ...) จึงอัปเกรดอัตโนมัติแบบคงโครงสร้างเดิม
 *
 * บุคลิก: เทียลเข้ม (น่าเชื่อถือ/สงบ) เป็นเสียงหลัก + อำพันอุ่น (เป็นกันเอง) เป็น accent/CTA
 * + พื้นครีมอุ่น + ตัวอักษรหนาเป็นมิตร — อบอุ่นแต่ยังจริงจังพอสำหรับการสอบ
 */

// เทียลแบรนด์ — action/link/focus/structural
const teal = {
  50: "#e9f3f0",
  100: "#cfe5df",
  200: "#a3cdc3",
  300: "#6fb0a2",
  400: "#3d9081",
  500: "#1f7a69",
  600: "#16695b",
  700: "#0f5447",
  800: "#0c4439",
  900: "#0a3a31",
};

// อำพัน — accent/highlight/CTA (ใช้ตัวอักษรเข้มบนพื้นอำพัน เพื่อคอนทราสต์)
const amber = {
  50: "#fdf4e3",
  100: "#fbe7bf",
  200: "#f6cf86",
  300: "#f2b84e",
  400: "#efa520",
  500: "#e0941a",
  600: "#c27d12",
  700: "#9a6310",
  800: "#7a4f0f",
  900: "#5e3e0e",
};

// เทาอมครีมอุ่น (sand) — ผิว/ตัวอักษร/เส้น
const sand = {
  50: "#faf6ec",
  100: "#f3ecdd",
  200: "#e7dcc6",
  300: "#cfc0a3",
  400: "#a89b82",
  500: "#6f6857",
  600: "#524c3e",
  700: "#3b362c",
  800: "#292620",
  900: "#1f211d",
};

// success — เขียวใบไม้ harmonize (คำตอบถูก/คะแนน)
const success = {
  50: "#edf6ec",
  100: "#d6ecd4",
  200: "#aedaa9",
  300: "#7cc174",
  400: "#4fa647",
  500: "#368a32",
  600: "#2c7a2a",
  700: "#236321",
  800: "#1d4f1c",
  900: "#173f17",
};

// danger — แดงอบอุ่น (error/คำตอบผิด/ย้อนไม่ได้)
const danger = {
  50: "#fcebe8",
  100: "#f8d7d1",
  200: "#f0b3a8",
  300: "#e58a7b",
  400: "#d8624f",
  500: "#c8492f",
  600: "#c0432f",
  700: "#9e3424",
  800: "#7e2a1e",
  900: "#621f17",
};

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // เสียงแบรนด์ + alias semantic สำหรับงานใหม่
        brand: teal,
        accent: amber,
        ink: sand[900],
        "ink-soft": sand[600],
        muted: sand[500],
        canvas: sand[50],
        line: sand[200],
        // sidebar ฝั่งติวเตอร์ (เขียวเข้มกว่า surface — โทน EduLearn)
        side: {
          bg: "#13402f",
          text: "#d7e6dd",
          muted: "#6f9a86",
          active: "#1f6b4f",
        },
        // override ramp เดิมให้ทั้งแอปอัปเกรดพร้อมกัน
        blue: teal,
        indigo: teal,
        teal,
        sand,
        gray: sand,
        slate: sand,
        neutral: sand,
        stone: sand,
        green: success,
        emerald: success,
        amber,
        yellow: amber,
        orange: amber,
        red: danger,
        rose: danger,
      },
      fontFamily: {
        // Noto Sans Thai = เนื้อหา/ไทย ; Plus Jakarta Sans = หัวข้อ/ตัวเลข Latin (โหลดใน layout)
        sans: ["var(--font-sans)", '"Noto Sans Thai"', "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "var(--font-sans)",
          '"Noto Sans Thai"',
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        // ── Fluid type scale (clamp: มือถือ → เดสก์ท็อป) — ดู DESIGN-SYSTEM.md ──
        // ใช้แทน text-4xl/5xl/6xl/7xl เพื่อให้หัวข้อย่อ-ขยายลื่นตามจอ ไม่ใหญ่เกินบนมือถือ/iPad
        hero: ["clamp(2.25rem, 1.4rem + 3.6vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "-0.01em" }], // 36 → 56
        display: ["clamp(1.9rem, 1.3rem + 2.6vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }], // 30 → 48
        h1: ["clamp(1.6rem, 1.25rem + 1.6vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.005em" }], // 26 → 36
        h2: ["clamp(1.2rem, 1.05rem + 0.7vw, 1.5rem)", { lineHeight: "1.3" }], // 19 → 24
        h3: ["clamp(1.05rem, 1rem + 0.3vw, 1.25rem)", { lineHeight: "1.4" }], // 17 → 20
        // body/label คงค่ามาตรฐาน (Tailwind base) — 16px ฐาน
      },
      borderRadius: {
        lg: "0.75rem", // 12px
        xl: "1rem", // 16px — การ์ดมุมโค้งใหญ่แบบ EduLearn
        "2xl": "1.5rem", // 24px
        "3xl": "1.75rem", // 28px
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(31 33 29 / 0.05)",
        card: "0 1px 3px 0 rgb(31 33 29 / 0.06), 0 1px 2px -1px rgb(31 33 29 / 0.05)",
        lift: "0 10px 30px -12px rgb(31 33 29 / 0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out both",
        "dialog-in": "dialog-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;

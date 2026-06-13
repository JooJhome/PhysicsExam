/**
 * สุ่มรหัสผ่านที่อ่านง่าย/ส่งต่อสะดวก — ตัดอักขระกำกวม (0/O, 1/l/I) ออก
 * ใช้ crypto.getRandomValues (มีทั้งใน browser และ Node 19+) ไม่พึ่ง dependency ใหม่
 */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // ตัด l, o, 0, 1

export function generatePassword(length = 8): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

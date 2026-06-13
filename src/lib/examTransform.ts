import * as cheerio from "cheerio";

/**
 * แปลงไฟล์ข้อสอบ Interactive HTML 1 ชุด → 2 ฉบับ + เฉลย
 *
 *  exam   = ฉบับสอบ : ถอด `const ANS`, ลบ `.sol` + `.ansBtn` + `.anim`, ลบ engine เดิม,
 *                     ฉีด exam-client (เลือกคำตอบ + render KaTeX + postMessage กับ parent)
 *  review = ฉบับเฉลย : ไฟล์เดิมครบทุกอย่าง + ฉีด review-client (เลือกตามคำตอบนักเรียน → reveal)
 *  answers = เฉลย [30 ตัว ค่า 1..5]  (เก็บฝั่งเซิร์ฟเวอร์ ไม่อยู่ในฉบับสอบ)
 *
 * โครงสร้างที่รองรับ (ยืนยันจากไฟล์จริง):
 *   .q[data-n] > .choices li[data-v] · .ansBtn · .sol.hidden
 *   <script> engine มี  const ANS=[...]  + function reveal(q,n){...} (global)
 */

const ANS_RE = /(?:const|let|var)\s+ANS\s*=\s*\[([\s\S]*?)\]/;

export interface TransformResult {
  title: string;
  totalQuestions: number;
  answers: number[];
  examHtml: string;
  reviewHtml: string;
}

export function transformExam(rawHtml: string): TransformResult {
  const answers = extractAnswers(rawHtml);
  const totalQuestions = answers.length;

  // ---------- title ----------
  const $title = cheerio.load(rawHtml);
  const title =
    $title("title").first().text().trim() ||
    $title(".head h1").first().text().trim() ||
    "ข้อสอบ";

  // ---------- ฉบับสอบ ----------
  const $ = cheerio.load(rawHtml);
  $(".sol").remove();
  $(".ansBtn").remove();
  $(".anim").remove();
  // ลบ engine เดิม (ก้อนที่มี ANS / setupQuestions) — กันเฉลยรั่วทาง console
  $("script").each((_, el) => {
    const t = $(el).html() || "";
    if (/const\s+ANS|setupQuestions|function\s+reveal/.test(t)) $(el).remove();
  });
  $("body").append(`<script>${EXAM_CLIENT}</script>`);
  const examHtml = $.html();

  // ---------- ฉบับเฉลย ----------
  // ไม่แตะ HTML เดิม (กัน SVG/MathML เพี้ยน) — แค่ฉีด review-client ต่อท้าย engine
  const reviewClientTag = `<script>${REVIEW_CLIENT}</script>`;
  const reviewHtml = rawHtml.includes("</body>")
    ? rawHtml.replace("</body>", `${reviewClientTag}\n</body>`)
    : rawHtml + reviewClientTag;

  return { title, totalQuestions, answers, examHtml, reviewHtml };
}

export function extractAnswers(rawHtml: string): number[] {
  const m = rawHtml.match(ANS_RE);
  if (!m) throw new Error("หาไม่เจอ const ANS=[...] ในไฟล์ข้อสอบ");
  const arr = m[1]
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => {
      const n = Number(s);
      if (!Number.isInteger(n) || n < 1 || n > 5)
        throw new Error(`ค่าเฉลยไม่ถูกต้อง: "${s}" (ต้องเป็นจำนวนเต็ม 1..5)`);
      return n;
    });
  if (arr.length === 0) throw new Error("ANS ว่าง");
  return arr;
}

/* ============================================================
 * exam-client — ฝังในฉบับสอบ (รันใน iframe)
 *   • คลิกเลือกตัวเลือก (single-select ต่อข้อ)
 *   • render KaTeX (engine เดิมถูกถอดไปแล้ว)
 *   • คุยกับ parent ผ่าน postMessage:
 *       parent → iframe : {type:'EXAM_COLLECT'} | {type:'EXAM_LOCK'}
 *       iframe → parent : {type:'EXAM_READY', total} | {type:'EXAM_PROGRESS', answered}
 *                          {type:'EXAM_ANSWERS', answers:[...]}
 * ============================================================ */
const EXAM_CLIENT = `
(function(){
  'use strict';
  var TOTAL = document.querySelectorAll('.q[data-n]').length;
  var locked = false;

  function post(msg){ try{ parent.postMessage(Object.assign({source:'bsiink-exam'}, msg), '*'); }catch(e){} }

  function answeredCount(){
    var n=0;
    document.querySelectorAll('.q[data-n]').forEach(function(q){
      if(q.querySelector('.choices li.sel')) n++;
    });
    return n;
  }

  function collect(){
    var ans = new Array(TOTAL).fill(null);
    document.querySelectorAll('.q[data-n]').forEach(function(q){
      var n = parseInt(q.getAttribute('data-n'),10);
      var sel = q.querySelector('.choices li.sel');
      if(sel) ans[n-1] = parseInt(sel.getAttribute('data-v'),10);
    });
    return ans;
  }

  document.addEventListener('click', function(e){
    if(locked) return;
    var li = e.target && e.target.closest ? e.target.closest('.choices li[data-v]') : null;
    if(!li) return;
    var ul = li.parentElement;
    ul.querySelectorAll('li[data-v]').forEach(function(x){ x.classList.remove('sel'); });
    li.classList.add('sel');
    updateChip();
    post({type:'EXAM_PROGRESS', answered: answeredCount(), total: TOTAL});
  });

  function updateChip(){
    var chip = document.getElementById('score');
    if(chip) chip.textContent = 'ตอบแล้ว ' + answeredCount() + '/' + TOTAL;
  }

  function lock(){
    locked = true;
    document.querySelectorAll('.choices li[data-v]').forEach(function(el){ el.style.pointerEvents='none'; });
  }

  window.addEventListener('message', function(e){
    var d = e.data || {};
    if(d.type === 'EXAM_COLLECT') post({type:'EXAM_ANSWERS', answers: collect()});
    else if(d.type === 'EXAM_LOCK') lock();
  });

  function renderMath(){
    var opts = { delimiters:[{left:'\\\\(',right:'\\\\)',display:false},{left:'$$',right:'$$',display:true}], throwOnError:false };
    if(window.renderMathInElement) renderMathInElement(document.body, opts);
    else window.addEventListener('load', function(){ if(window.renderMathInElement) renderMathInElement(document.body, opts); });
  }

  function init(){
    updateChip();
    renderMath();
    post({type:'EXAM_READY', total: TOTAL});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
`;

/* ============================================================
 * review-client — ฝังในฉบับเฉลย (รันใน iframe, ต่อท้าย engine เดิม)
 *   parent → iframe : {type:'REVIEW_APPLY', answers:[...]}
 *   ใช้ reveal()/ANS ของ engine เดิม (global) เพื่อระบายถูก/ผิด + เปิด .sol
 * ============================================================ */
const REVIEW_CLIENT = `
(function(){
  'use strict';
  function apply(answers){
    document.querySelectorAll('.q[data-n]').forEach(function(q){
      var n = parseInt(q.getAttribute('data-n'),10);
      var v = answers ? answers[n-1] : null;
      if(v != null){
        var li = q.querySelector('.choices li[data-v="'+v+'"]');
        if(li) li.classList.add('sel');
      }
      if(typeof reveal === 'function'){ try{ reveal(q, n); }catch(e){} }
    });
    document.querySelectorAll('.choices li[data-v], .ansBtn').forEach(function(el){ el.style.pointerEvents='none'; });
  }
  window.addEventListener('message', function(e){
    var d = e.data || {};
    if(d.type === 'REVIEW_APPLY') apply(d.answers || []);
  });
  try{ parent.postMessage({source:'bsiink-exam', type:'REVIEW_READY'}, '*'); }catch(e){}
})();
`;

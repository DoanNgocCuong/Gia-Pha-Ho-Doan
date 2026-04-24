/**
 * Gia Phả Họ Đoàn — "Đền Thờ Tổ" Design
 * Vietnamese ancestral temple aesthetic
 * Grouped sub-branch layout for ~2.5m wide × 1.5m tall print
 */
import { familyTree, type Person } from "@/data/familyTree";
import { useRef, useState, useCallback } from "react";

const USER_BANNER = "/manus-storage/user_header_banner_c81cff5a.png";
const LOTUS_LEFT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663221839594/JPL7J3WhJQJUtLA62VSm8T/lotus_left-iYN7FWgqB4DGGCV4zBJvPA.webp";
const LOTUS_RIGHT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663221839594/JPL7J3WhJQJUtLA62VSm8T/lotus_right-dxs3UdKakeD83TBatg95mk.webp";
const SCROLL_BANNER = "https://d2xsxph8kpxj0f.cloudfront.net/310519663221839594/JPL7J3WhJQJUtLA62VSm8T/scroll_banner-4whRGJ6cPc4tj6t3e495hV.webp";

/* ========== TREE NODE ========== */
function TreeNode({ person, depth }: { person: Person; depth: number }) {
  const cls = nodeClass(person.gender, depth);
  return (
    <li className="tli">
      <div className={`tn ${cls}`} style={nodeStyle(depth)}>
        <span className="nm-txt">{person.name}</span>
      </div>
      {person.children && person.children.length > 0 && (
        <ul className="tul">
          {person.children.map((c, i) => (
            <TreeNode key={`${depth}-${i}`} person={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function nodeClass(g: string, d: number) {
  const base = `d${Math.min(d, 10)}`;
  if (g === "ancestor") return `na ${base}`;
  if (g === "female") return `nf ${base}`;
  if (g === "other") return `no ${base}`;
  return `nm-c ${base}`;
}

function nodeStyle(d: number): React.CSSProperties {
  // Compact sizes for 598-node tree
  const fs = [16, 14, 12, 11, 10, 9.5, 9, 8.5, 8, 7.5, 7];
  const pd = [
    "6px 10px", "5px 8px", "4px 6px", "3px 5px", "3px 4px",
    "2px 4px", "2px 3px", "2px 3px", "1.5px 3px", "1.5px 2px", "1px 2px"
  ];
  const mw = [
    "none", "none", "160px", "140px", "120px",
    "105px", "95px", "88px", "82px", "76px", "70px"
  ];
  const mnw = [
    "80px", "60px", "48px", "40px", "34px",
    "30px", "26px", "24px", "22px", "20px", "18px"
  ];
  const i = Math.min(d, 10);
  return { fontSize: `${fs[i]}px`, padding: pd[i], maxWidth: mw[i], minWidth: mnw[i] };
}

/* ========== SUB-BRANCH ROW (for grouping) ========== */
function SubBranchRow({ children, label }: { children: Person[]; label: string }) {
  return (
    <div className="sub-row">
      <div className="sub-row-label">{label}</div>
      <div className="sub-row-trees">
        {children.map((child, i) => (
          <div key={i} className="sub-tree-wrap">
            <ul className="tul root-ul">
              <TreeNode person={child} depth={3} />
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== BRANCH SECTION ========== */
function BranchSection({ branch, index }: { branch: Person; index: number }) {
  const labels = ["NHÁNH I", "NHÁNH II", "NHÁNH III"];
  const children = branch.children || [];

  // For Nhánh I (index 0), group the 18 sub-branches into rows
  if (index === 0 && children.length > 8) {
    // Group into rows of ~4-6 branches each
    const groups: { label: string; items: Person[] }[] = [];
    // Row 1: B.Tọa, Bà CB1s, B Tiếp (6 items - the "bà" branches)
    groups.push({ label: "Các bà CB1 & CB2", items: children.slice(0, 6) });
    // Row 2: ô Thiệu (1 massive branch - needs its own row)
    groups.push({ label: "1. Ô Thiệu CB2", items: children.slice(6, 7) });
    // Row 3: ô Mậu, ô Ngọan, ô Thụy, ô Rao (4 smaller branches)
    groups.push({ label: "2-5. Ô Mậu, Ô Ngọan, Ô Thụy, Ô Rao", items: children.slice(7, 11) });
    // Row 4: ô Nhại (1 large branch)
    groups.push({ label: "6. Ô Nhại CB3", items: children.slice(11, 12) });
    // Row 5: ô Triết, ô Đồ Quyến (2 medium branches)
    groups.push({ label: "7-8. Ô Triết, Ô Đồ Quyến", items: children.slice(12, 14) });
    // Row 6: ô Riễn, ô Kiền, ô Phổ, b Rỹ (4 items)
    groups.push({ label: "9-11. Ô Riễn, Ô Kiền, Ô Phổ", items: children.slice(14) });

    return (
      <div className="branch-section">
        <div className="branch-header">
          <div className="branch-ornament-l" />
          <div className="branch-label">{labels[0]}</div>
          <div className="branch-ornament-r" />
        </div>
        {/* Ancestor node for this branch */}
        <div className="branch-ancestor">
          <div className={`tn na d2`} style={nodeStyle(2)}>
            <span className="nm-txt">{branch.name}</span>
          </div>
        </div>
        {groups.map((group, gi) => (
          <SubBranchRow key={gi} children={group.items} label={group.label} />
        ))}
      </div>
    );
  }

  return (
    <div className="branch-section">
      <div className="branch-header">
        <div className="branch-ornament-l" />
        <div className="branch-label">{labels[index] || `NHÁNH ${index + 1}`}</div>
        <div className="branch-ornament-r" />
      </div>
      <div className="branch-tree">
        <ul className="tul root-ul">
          <TreeNode person={branch} depth={2} />
        </ul>
      </div>
    </div>
  );
}

/* ========== MAIN COMPONENT ========== */
export default function Home() {
  const posterRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const drag = useRef({ x: 0, y: 0, sl: 0, st: 0 });

  const onDown = useCallback((e: React.MouseEvent) => {
    const w = wrapRef.current; if (!w) return;
    setDragging(true);
    drag.current = { x: e.pageX, y: e.pageY, sl: w.scrollLeft, st: w.scrollTop };
    e.preventDefault();
  }, []);
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const w = wrapRef.current; if (!w) return;
    w.scrollLeft = drag.current.sl - (e.pageX - drag.current.x);
    w.scrollTop = drag.current.st - (e.pageY - drag.current.y);
  }, [dragging]);
  const onUp = useCallback(() => setDragging(false), []);

  const doExport = useCallback(async () => {
    const el = posterRef.current; if (!el) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      if (wrapRef.current) { wrapRef.current.scrollLeft = 0; wrapRef.current.scrollTop = 0; }
      const rW = el.scrollWidth, rH = el.scrollHeight;
      const targetWidthPx = Math.round(250 / 2.54 * 150);
      const scale = Math.min(targetWidthPx / rW, 4);
      const canvas = await html2canvas(el, {
        backgroundColor: "#FDF5E6", scale, useCORS: true, logging: false, width: rW, height: rH,
      });
      const a = document.createElement("a");
      const wCm = Math.round(canvas.width / 150 * 2.54);
      const hCm = Math.round(canvas.height / 150 * 2.54);
      a.download = `Gia-Pha-Ho-Doan_${wCm}x${hCm}cm.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (err) {
      console.error(err);
      alert("Xuất ảnh thất bại.");
    } finally { setExporting(false); }
  }, []);

  const root = familyTree;
  const cuRung = root.children?.[0];
  const branches = cuRung?.children || [];

  return (
    <div className="page-root">
      <div className="toolbar">
        <button onClick={doExport} disabled={exporting} className="exp-btn">
          {exporting ? "Đang xuất..." : "Xuất Ảnh Poster (150 DPI)"}
        </button>
        <span className="hint">Kéo chuột để di chuyển • Cuộn để xem toàn bộ gia phả</span>
      </div>

      <div ref={wrapRef} className="scroll-wrap" style={{ cursor: dragging ? "grabbing" : "grab" }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>

        <div ref={posterRef} className="poster">
          <div className="border-outer">
            <div className="border-inner">

              {/* HEADER */}
              <div className="hdr">
                <img src={USER_BANNER} alt="" className="hdr-img" />
                <div className="hdr-txt">
                  <div className="hdr-sub">PHẢ ĐỒ HOÀNG TỘC</div>
                  <div className="hdr-main">HỌ ĐOÀN</div>
                  <div className="hdr-loc">HOÀNG CƠ — MINH TƯỜNG — TÂY PHONG</div>
                </div>
              </div>

              {/* Ancestor info */}
              <div className="ancestor-row">
                <div className="anc-group">
                  <div className="anc-label">Thượng Thủy Tổ Khảo</div>
                  <div className="anc-box">
                    <div className="anc-name">CỤ Ô LIỄU</div>
                    <div className="anc-detail">Mất ngày 20 tháng 10</div>
                  </div>
                </div>
                <div className="anc-connector"><div className="anc-vline" /></div>
                <div className="anc-group">
                  <div className="anc-label">Thượng Thủy Tổ Tỷ</div>
                  <div className="anc-box anc-f">
                    <div className="anc-name">CỤ B. HÀNG</div>
                    <div className="anc-detail">(Hiệu Từ Cần) — Mất ngày 4 tháng 7</div>
                  </div>
                </div>
              </div>

              <div className="ancestor-row sub-anc">
                <div className="anc-group">
                  <div className="anc-box na-box">
                    <div className="anc-name">CỤ RŨNG</div>
                    <div className="anc-detail">Mất ngày 16 tháng 10</div>
                  </div>
                </div>
                <div className="anc-connector"><div className="anc-vline" /></div>
                <div className="anc-group">
                  <div className="anc-box anc-f">
                    <div className="anc-name">CỤ B. HÀNG</div>
                    <div className="anc-detail">(Hiệu Từ Tâm) — Mất ngày 25 tháng 10</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="legend">
                <span className="lg"><span className="ld na-d" /> Cụ Tổ</span>
                <span className="lg"><span className="ld nm-d" /> Nam</span>
                <span className="lg"><span className="ld nf-d" /> Nữ</span>
                <span className="lg"><span className="ld no-d" /> Ghi chú</span>
              </div>

              {/* Main content */}
              <div className="content">
                {/* Left câu đối */}
                <div className="cau-doi">
                  <div className="cd-bg"><img src={SCROLL_BANNER} alt="" className="cd-img" /></div>
                  <div className="cd-text">
                    {"Phúc Đức Tổ Tiên Gieo Trồng Từ Thuở Trước".split(" ").map((w, i) => <span key={i}>{w}</span>)}
                  </div>
                </div>

                {/* Branches stacked vertically */}
                <div className="branches-area">
                  {branches.map((branch, i) => (
                    <BranchSection key={i} branch={branch} index={i} />
                  ))}
                </div>

                {/* Right câu đối */}
                <div className="cau-doi">
                  <div className="cd-bg"><img src={SCROLL_BANNER} alt="" className="cd-img" /></div>
                  <div className="cd-text">
                    {"Nhân Tâm Con Cháu Bồi Đắp Mãi Về Sau".split(" ").map((w, i) => <span key={i}>{w}</span>)}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="ftr">
                <img src={LOTUS_LEFT} alt="" className="lotus" />
                <div className="ftr-mid">
                  <div className="ftr-line" />
                  <div className="ftr-txt">Gia Phả Họ Đoàn — Lưu giữ và phát huy truyền thống gia tộc</div>
                  <div className="ftr-date">Cập nhật ngày 12 tháng 3 năm 2025</div>
                  <div className="ftr-line" />
                </div>
                <img src={LOTUS_RIGHT} alt="" className="lotus" />
              </div>

            </div>
          </div>
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.page-root {
  background: #E8D5B0; min-height: 100vh;
  font-family: 'Noto Serif', 'Times New Roman', serif;
}

/* Toolbar */
.toolbar {
  position: sticky; top: 0; z-index: 100;
  background: linear-gradient(135deg, #5A0000, #8B1A1A);
  padding: 8px 20px; display: flex; justify-content: center; gap: 16px; align-items: center;
  border-bottom: 3px solid #DAA520;
}
.exp-btn {
  background: linear-gradient(135deg, #DAA520, #B8860B);
  color: #2C1810; border: 1px solid #FFD700; border-radius: 4px;
  padding: 6px 18px; font-size: 13px; font-weight: 700;
  font-family: 'Noto Serif', serif;
}
.exp-btn:disabled { opacity: .5; }
.hint { color: #FFEEBB; font-size: 12px; }

/* Scroll wrapper */
.scroll-wrap { width: 100%; overflow: auto; }
.scroll-wrap::-webkit-scrollbar { height: 10px; width: 10px; }
.scroll-wrap::-webkit-scrollbar-track { background: #E8D5B0; }
.scroll-wrap::-webkit-scrollbar-thumb { background: #DAA520; border-radius: 5px; }

/* Poster */
.poster { background: #FDF5E6; min-width: max-content; margin: 0 auto; }

/* Double border */
.border-outer {
  border: 5px solid #DAA520; margin: 6px; padding: 4px;
  background: #FDF5E6; box-shadow: inset 0 0 0 2px #B8860B;
}
.border-inner {
  border: 2px solid #B8860B; padding: 10px;
  background: linear-gradient(180deg, #FDF5E6 0%, #F5E6C8 50%, #FDF5E6 100%);
}

/* ===== HEADER ===== */
.hdr {
  position: relative; text-align: center; margin-bottom: 10px;
  max-width: 100%; margin-left: auto; margin-right: auto;
  overflow: hidden; border-radius: 4px;
}
.hdr-img {
  width: 100%; height: auto; display: block;
  max-height: 350px; object-fit: cover; object-position: center 35%;
}
.hdr-txt {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center; z-index: 2;
}
.hdr-sub {
  font-size: 18px; color: #FFD700; letter-spacing: 6px; font-weight: 700;
  text-shadow: 2px 2px 5px rgba(0,0,0,0.8);
}
.hdr-main {
  font-size: 52px; color: #FFD700; font-weight: 700; letter-spacing: 16px;
  text-shadow: 3px 3px 8px rgba(0,0,0,0.9); margin: 4px 0;
}
.hdr-loc {
  font-size: 14px; color: #FFEEBB; letter-spacing: 5px;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
}

/* ===== ANCESTOR ROW ===== */
.ancestor-row {
  display: flex; justify-content: center; align-items: center; gap: 16px;
  margin: 10px auto; max-width: 700px;
}
.sub-anc { margin-top: 6px; }
.anc-group { text-align: center; }
.anc-label { font-size: 10px; color: #8B4513; font-style: italic; margin-bottom: 3px; }
.anc-connector { display: flex; align-items: center; }
.anc-vline { width: 20px; height: 2px; background: #DAA520; }
.anc-box {
  background: linear-gradient(135deg, #1a3a5c, #2a5580);
  color: #FFF; border: 2px solid #4a90c4; border-radius: 4px;
  padding: 6px 14px; text-align: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.12);
}
.anc-box.anc-f {
  background: linear-gradient(135deg, #8B2252, #B83070);
  border-color: #FF69B4;
}
.na-box {
  background: linear-gradient(135deg, #6B0000, #9B1B1B) !important;
  border-color: #DAA520 !important; color: #FFD700 !important;
}
.anc-name { font-size: 18px; font-weight: 700; }
.anc-detail { font-size: 11px; opacity: .85; margin-top: 2px; }

/* ===== LEGEND ===== */
.legend {
  display: flex; justify-content: center; gap: 24px;
  margin: 8px 0 10px 0; font-size: 12px; color: #2C1810;
}
.lg { display: flex; align-items: center; gap: 4px; }
.ld { width: 12px; height: 12px; border-radius: 2px; display: inline-block; border: 1.5px solid; }
.na-d { background: linear-gradient(135deg, #6B0000, #9B1B1B); border-color: #DAA520; }
.nm-d { background: linear-gradient(145deg, #1a3a5c, #2a5580); border-color: #4a90c4; }
.nf-d { background: linear-gradient(145deg, #8B2252, #B83070); border-color: #FF69B4; }
.no-d { background: linear-gradient(145deg, #4a6020, #6B8E23); border-color: #9ACD32; }

/* ===== CONTENT AREA ===== */
.content { display: flex; align-items: stretch; gap: 4px; }

/* ===== CÂU ĐỐI ===== */
.cau-doi { position: relative; width: 60px; flex-shrink: 0; }
.cd-bg { width: 100%; height: 100%; }
.cd-img { width: 100%; height: 100%; object-fit: cover; border-radius: 3px; display: block; }
.cd-text {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 2;
}
.cd-text span {
  color: #FFD700; font-size: 18px; font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.85);
}

/* ===== BRANCHES AREA ===== */
.branches-area {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 12px;
  padding: 6px 0;
}

/* ===== BRANCH SECTION ===== */
.branch-section {
  border: 1.5px solid #DEB887;
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(253,245,230,0.6), rgba(245,230,200,0.3));
  padding: 4px 3px;
}
.branch-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 4px; padding: 0 8px;
}
.branch-ornament-l, .branch-ornament-r {
  flex: 1; height: 1.5px;
  background: linear-gradient(90deg, transparent, #DAA520, #B8860B, #DAA520, transparent);
}
.branch-label {
  font-size: 14px; font-weight: 700; color: #8B0000;
  letter-spacing: 4px; white-space: nowrap;
  padding: 3px 14px;
  background: linear-gradient(135deg, #FDF5E6, #F5E6C8);
  border: 1.5px solid #DAA520; border-radius: 3px;
}
.branch-tree { overflow: visible; }
.branch-ancestor {
  display: flex; justify-content: center; margin: 4px 0;
}

/* ===== SUB-BRANCH ROW ===== */
.sub-row {
  border-top: 1px dashed #DEB887;
  padding: 4px 2px 2px 2px;
  margin-top: 4px;
}
.sub-row:first-of-type { border-top: none; margin-top: 0; }
.sub-row-label {
  font-size: 9px; color: #A0522D; font-style: italic;
  text-align: center; margin-bottom: 2px; letter-spacing: 1px;
}
.sub-row-trees {
  display: flex; justify-content: center; gap: 3px;
  flex-wrap: nowrap;
}
.sub-tree-wrap {
  flex-shrink: 0;
}

/* ===== TREE LAYOUT ===== */
.tul {
  position: relative; padding-top: 20px;
  display: flex; justify-content: center;
  list-style: none; margin: 0; padding-left: 0;
}
.root-ul { padding-top: 0; }

.tli {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: 0 1px;
}

.tli::before {
  content: ''; position: absolute; top: 0;
  width: 1px; height: 20px; background: #8B4513;
}
.tul > .tli::after {
  content: ''; position: absolute; top: 0;
  width: 100%; height: 1px; background: #8B4513;
}
.tul > .tli:first-child::after { left: 50%; width: 50%; }
.tul > .tli:last-child::after { right: 50%; width: 50%; }
.tul > .tli:only-child::after { display: none; }
.root-ul > .tli::before, .root-ul > .tli::after { display: none; }

.tli > .tul::before {
  content: ''; position: absolute; top: 0; left: 50%;
  width: 1px; height: 20px; background: #8B4513;
  transform: translateX(-50%);
}

/* ===== NODES ===== */
.tn {
  display: inline-block; border-radius: 2px; text-align: center;
  position: relative; z-index: 1; border-style: solid;
  word-wrap: break-word; line-height: 1.15;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.nm-txt { font-weight: 600; display: block; }

.na {
  background: linear-gradient(135deg, #6B0000, #9B1B1B);
  color: #FFD700; border-color: #DAA520; font-weight: 700;
}
.nm-c {
  background: linear-gradient(145deg, #1a3a5c, #2a5580);
  color: #FFF; border-color: #4a90c4;
}
.nf {
  background: linear-gradient(145deg, #8B2252, #B83070);
  color: #FFF; border-color: #FF69B4;
}
.no {
  background: linear-gradient(145deg, #4a6020, #6B8E23);
  color: #FFF; border-color: #9ACD32;
}

.d0 { border-width: 2.5px; border-radius: 4px; }
.d1 { border-width: 2px; border-radius: 3px; }
.d2 { border-width: 1.5px; border-radius: 3px; }
.d3, .d4 { border-width: 1px; }
.d5, .d6, .d7, .d8, .d9, .d10 { border-width: 1px; }

/* ===== FOOTER ===== */
.ftr {
  display: flex; align-items: flex-end; justify-content: center;
  gap: 20px; margin-top: 10px; padding: 8px 0;
}
.lotus { width: 120px; height: auto; opacity: .85; }
.ftr-mid { text-align: center; }
.ftr-line { height: 1.5px; background: linear-gradient(90deg, transparent, #DEB887, transparent); margin: 3px 0; width: 400px; }
.ftr-txt { color: #8B4513; font-style: italic; font-size: 14px; padding: 4px 0; }
.ftr-date { color: #A0522D; font-size: 10px; }
`;

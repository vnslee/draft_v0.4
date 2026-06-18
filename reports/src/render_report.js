/**
 * 보고서 렌더러 (render_report.js)
 * 입력: 보고서 정의 JSON + country JSON + 엔진 결과(viz_data)
 * 출력: HTML
 * 사용: node reports/src/render_report.js <정의JSON> <출력HTML>
 */
const fs = require("fs");
const path = require("path");
const ENGINE = path.join(__dirname, "..", "..", "engine");
const DATA = path.join(__dirname, "..", "..", "data");
const TEMPLATES = path.join(__dirname, "..", "templates");
const mat = require(path.join(ENGINE, "semantic_matrix.js"));
globalThis.SEMANTIC_MATRIX = mat.SEMANTIC_MATRIX;
const eng = fs.readFileSync(path.join(ENGINE, "similarity.js"),"utf8").replace(/if \(typeof module[\s\S]*$/,"");
eval(eng);

const defFile = process.argv[2] || path.join(TEMPLATES, "report_def_executive.json");
const outFile = process.argv[3] || "out_report.html";

const def = JSON.parse(fs.readFileSync(defFile,"utf8"));
// 국가 데이터는 코드별 파일(GB.json/PL.json)로 분리 저장 → countries 배열로 조립
const data = { countries: [
  JSON.parse(fs.readFileSync(path.join(DATA, "GB.json"),"utf8")),
  JSON.parse(fs.readFileSync(path.join(DATA, "PL.json"),"utf8")),
] };
const byCode = {}; data.countries.forEach(c=>byCode[c.country_code]=c);
const target = byCode[def.target], base = byCode[def.base];
const result = compareCountries(target, base);

// viz 데이터 (엔진 결과 + 시계열 + 항목유사도)
const simMap={}; result.itemDetails.forEach(d=>simMap[d.id]=d.sim);
const itemSims={}; result.itemDetails.forEach(d=>{ if(d.sim!=null)(itemSims[d.category]=itemSims[d.category]||[]).push({name:d.name,sim:d.sim}); });
const ts={}; [target,base].forEach(c=>c.items.forEach(it=>{ if(it.timeseries) ts[c.country_code+"_"+it.catalog_item_id]={data:it.timeseries.data,cagr:it.timeseries.cagr,fc:it.timeseries.forecast_2030,unit:it.timeseries.unit}; }));
const itemMap={}; target.items.forEach(it=>itemMap[it.catalog_item_id]=it);

const VIZ = { result:{total:result.total,verdict:result.verdict,cats:result.categoryScores,gate:result.gatePassed,eff:result.effConf}, itemSims, ts };

function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
const verdictKo = v => v==="DEEP_RESEARCH"?"심층조사 권고":v==="TRANSPLANTABLE"?"이식 가능":v==="BLOCKED"?"진출 차단":v;

// ===== 블록 렌더러 =====
const SUB={"1-1 시장일반":"시장 일반","1-2 딜러채널":"딜러·채널","2-1 인허가":"인허가","2-2 정책세금":"정책·세금","2-3 정보보호":"정보보호","2-4 리스크":"리스크","2-5 추심회수":"추심·회수","2-6 의무보험":"의무보험","3 금융환경":"금융환경","4-1 시스템환경":"시스템 환경","4-2 경쟁사":"경쟁사"};
const TIER={TIER1:["공식 1차","t1"],TIER2:["준공식","t2"],TIER3:["참고","t3"],GAP:["미확보","gap"]};

function renderBlock(b){
  switch(b.type){
    case "verdict_banner": {
      const r=result;
      const cells=[
        ["종합 유사도",r.total,"/ 100","warn"],
        ["판정",verdictKo(r.verdict),"임계 70 근접","warn"],
        ["시스템 게이트",r.gatePassed?"통과":"미달","이식 가능 수준",r.gatePassed?"ok":"block"],
        ["킬스위치",r.killswitchHits.length?"작동":"통과","5개 전부",r.killswitchHits.length?"block":"ok"],
        ["데이터 신뢰도",r.effConf,"유효신뢰도",""],
      ];
      return `<div class="verdict">`+cells.map(c=>`<div class="vc"><div class="k">${c[0]}</div><div class="v ${c[3]||''}">${c[1]}</div><div class="sub">${c[2]}</div></div>`).join("")+`</div>`;
    }
    case "exec_summary":
      return `<div class="insight"><b>${b.label||"요약"}.</b> ${esc(target.exec_summary||"")}</div>`;
    case "part":
      return `<div class="sec"><span class="sec-num">${b.num}</span><h2>${esc(b.title)}</h2><p class="lead">${esc(b.lead||"")}</p>`
        + (b.blocks||[]).map(renderBlock).join("") + `</div>`;
    case "kpi_cards":
      return `<div class="cards">`+b.items.map(c=>{
        let big=c.fmt;
        if(!big && c.ref){
          const refParts=c.ref.split(".");
          const it=itemMap[refParts[0]];
          if(it){
            const vn=it.value_normalized;
            if(refParts.length>1 && vn && typeof vn==="object"){
              const sub=vn[refParts[1]];
              big=sub!=null?Number(sub).toLocaleString():"";
            } else if(vn && typeof vn==="object"){
              if(vn.value_pln_bn) big=vn.value_pln_bn+" bn PLN";
              else if(vn.value_gbp_bn) big="£"+vn.value_gbp_bn+"bn";
              else if(vn.value_usd_bn) big="$"+vn.value_usd_bn+"bn";
              else if(vn.new) big=Number(vn.new).toLocaleString();
              else big=it.value_raw||"";
            } else if(typeof vn==="number"){
              if(it.data_type==="PERCENT") big=vn+"%";
              else big=Number(vn).toLocaleString();
            } else big=it.value_raw||"";
          }
        }
        return `<div class="card"><div class="label">${esc(c.label)}</div><div class="big">${esc(big||"")}</div>`
          +(c.trend?`<div class="trend ${c.trendCls||''}">${esc(c.trend)}</div>`:"")
          +(c.note?`<div class="note">${esc(c.note)}</div>`:"")+`</div>`;
      }).join("")+`</div>`;
    case "chart_grid":
      return `<div style="display:grid;grid-template-columns:repeat(${b.cols},1fr);gap:16px;margin:18px 0">`
        + b.charts.map((c,i)=>`<div class="chart-box" style="margin:0"><div class="ct">${esc(c.title)}</div><div class="cs">${esc(c.sub||"")}</div><svg class="rchart" data-spec='${JSON.stringify(c)}' style="width:100%;height:auto"></svg></div>`).join("")
        + `</div>`;
    case "chart":
      return `<div class="chart-box"><div class="ct">${esc(b.title)}</div><div class="cs">${esc(b.sub||"")}</div><svg class="rchart" data-spec='${esc(JSON.stringify(b))}' style="width:100%;height:auto"></svg></div>`;
    case "detail_table":
      return `<table><thead><tr><th>항목</th><th>내용</th><th>출처</th></tr></thead><tbody>`
        + b.rows.map(r=>`<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td><span class="tag ${r[3]}">${esc(r[2])}</span></td></tr>`).join("")
        + `</tbody></table>`;
    case "compare_table":
      return `<h3>${esc(b.title)}</h3><table><thead><tr><th>지표</th><th class="num">영국 🇬🇧</th><th class="num">폴란드 🇵🇱</th><th>해석</th></tr></thead><tbody>`
        + b.rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td class="num">${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join("")
        + `</tbody></table>`;
    case "insights":
      return `<h3>${esc(b.title)}</h3>`+(target[b.source]||[]).map((x,i)=>`<div class="insight"><b>${i+1}. ${esc(x.title)}.</b> ${esc(x.body)}</div>`).join("");
    case "recommendations":
      return `<h3>${esc(b.title)}</h3>`+(target[b.source]||[]).map(x=>`<div class="reco"><div class="n">${x.step}</div><div class="rb"><b>${esc(x.title)}</b>${esc(x.body)}</div></div>`).join("");
    case "risks":
      return `<h3>${esc(b.title)}</h3>`+(target[b.source]||[]).map(x=>`<div class="risk"><span class="sev ${x.sev}">${x.sev.toUpperCase()}</span><div><b>${esc(x.title)}</b> — ${esc(x.body)}</div></div>`).join("");
    case "summary_line":
      return `<div class="summary-line">${esc(b.text)}</div>`;
    case "category_full":
      return renderCategoryFull(b);
    case "checklist":
      return renderChecklist(b);
    default: return `<!-- unknown block: ${b.type} -->`;
  }
}

function renderItem(it){
  const sim=simMap[it.catalog_item_id];
  const [tlabel,tcls]=TIER[it.source_tier]||["",""];
  const ks=it.is_killswitch?`<span class="ks">킬스위치</span>`:"";
  const simb=(sim!=null)?`<span class="sim">유사도 ${sim}</span>`:"";
  const hasVal=it.value_raw && !String(it.value_raw).startsWith("조사");
  let h=`<div class="item${it.action_items?" has-action":""}">
    <div class="item-h"><span class="item-name">${esc(it.name)}</span>${ks}${simb}</div>
    <div class="item-val">${hasVal?esc(it.value_raw):'<span class="gap">조사 필요 (현지 실사)</span>'}</div>`;
  if(it.research_detail) h+=`<div class="item-rd">${esc(it.research_detail)}</div>`;
  if(it.timeseries){const t=it.timeseries;
    h+=`<div class="viz"><div class="vt">${esc(it.name)} 추이${t.forecast_2030?" 및 2030 예측":""}</div>
      <div class="vs">CAGR ${t.cagr}%${t.forecast_2030?` · 2030 예측 ${t.forecast_2030.toLocaleString()} ${t.unit}`:" · 비율 지표(예측 제외)"}</div>
      <svg class="ts-chart" data-cid="${it.catalog_item_id}" style="width:100%;height:auto"></svg></div>`;}
  h+=`<div class="item-src"><span class="tag ${tcls}">${tlabel}</span> ${esc(it.source_detail||it.source_name)}${it.official_gap_flag?' <span class="gapflag">공식 미확보</span>':''}</div>`;
  if(it.action_items){h+=`<div class="actions"><div class="actions-t">▶ 진출 준비사항</div><ul>`+it.action_items.map(a=>`<li>${esc(a)}</li>`).join("")+`</ul></div>`;}
  return h+`</div>`;
}

function renderCategoryFull(b){
  const cat=b.category;
  const items=target.items.filter(i=>i.category_id===cat);
  const catScore=result.categoryScores[cat];
  const gate=cat==="SYSTEM"?` · 게이트 ${result.gatePassed?"통과":"미달"}`:"";
  let h=`<section class="cat" id="cat-${cat}"><div class="cat-head"><span class="cat-ic">${b.icon}</span><h2>${b.name}</h2><span class="cat-score">유사도 ${catScore}${gate}</span></div>`;
  // 차트
  if(b.chart){h+=`<div class="viz"><div class="vt">${b.name} 항목별 유사도</div><div class="vs">영국 대비 — 닮은 항목과 다른 항목. 녹색 70+/황색 50+/적색 50미만</div><svg class="hbar-chart" data-cat="${cat}" data-limit="${b.chart.limit}" style="width:100%;height:auto"></svg></div>`;}
  // 서브카테고리별 항목
  const subs={}; items.forEach(it=>(subs[it.sub_category]=subs[it.sub_category]||[]).push(it));
  for(const sub in subs){ h+=`<h3 class="sub">${SUB[sub]||sub}</h3>`; subs[sub].forEach(it=>h+=renderItem(it)); }
  return h+`</section>`;
}

function renderChecklist(b){
  const items=target.items.filter(i=>i.action_items);
  let h=`<section class="checklist" id="checklist"><h2>${esc(b.title)}</h2><div class="cl-sub">규제·라이선스·시스템 항목에서 도출한 실행 준비사항입니다.</div>`;
  items.forEach(it=>{ h+=`<div class="ck-item"><div class="ck-name">${esc(it.name)}</div><ul>`+it.action_items.map(a=>`<li>${esc(a)}</li>`).join("")+`</ul></div>`; });
  return h+`</section>`;
}

// ===== 조립 =====
const body = def.sections.map(renderBlock).join("\n");
const tocHtml = def.toc ? `<nav class="toc"><div class="tt">목차</div>`
  + def.sections.filter(s=>s.type==="category_full").map(s=>`<a href="#cat-${s.category}"><span class="ic">${s.icon}</span>${s.name}</a>`).join("")
  + `<a href="#checklist"><span class="ic" style="background:var(--amber)">✓</span>준비 체크리스트</a></nav>` : "";

const chartsJs = fs.readFileSync(path.join(__dirname, "charts.js"),"utf8").replace(/if\(typeof module[\s\S]*$/,"");
const shell = fs.readFileSync(path.join(TEMPLATES, "report_shell.html"),"utf8");
const html = shell
  .replace(/__TITLE__/g, esc(def.title))
  .replace("__SUBTITLE__", esc(def.subtitle))
  .replace("__TARGET__", target.country_name)
  .replace("__BASE__", base.country_name)
  .replace("__TOTAL__", result.total)
  .replace("__VERDICT__", verdictKo(result.verdict))
  .replace("__TOC__", tocHtml)
  .replace("__LAYOUTCLASS__", def.toc?"layout":"")
  .replace("__BODY__", body)
  .replace("__CHARTS_JS__", chartsJs)
  .replace("__VIZ__", JSON.stringify(VIZ));

fs.writeFileSync(outFile, html);
console.log(`생성: ${outFile} (${html.length} bytes) / 타입 ${def.report_type} / 종합 ${result.total}`);

/* 공용 차트 라이브러리 (charts.js) — 외부 의존성 없는 인라인 SVG */
const ChartLib = (function(){
  const NS="http://www.w3.org/2000/svg";
  const C={accent:"#1f5c4a",accentSoft:"#d9e7e0",amber:"#b88324",signal:"#c5562e",
    line:"#d8d3c6",grid:"#e7e3d8",ink:"#16201c",soft:"#4a5550"};
  function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
  function txt(x,y,s,o={}){const e=el("text",{x,y,"text-anchor":o.anchor||"middle","font-size":o.size||11,fill:o.fill||C.soft,"font-weight":o.weight||400});e.textContent=s;return e;}
  function colorFor(v){return v>=70?C.accent:v>=50?C.amber:C.signal;}

  // 라인 차트 (실적 실선 + 예측 점선)
  function line(svg,series,opts={}){
    const W=opts.W||900,H=opts.H||260,pad={l:52,r:24,t:18,b:34};
    const years=opts.years;
    const vals=series.flatMap(s=>s.data.filter(v=>v!=null));
    const ymax=Math.max(...vals)*1.08, ymin=opts.ymin!=null?opts.ymin:Math.min(...vals)*0.85;
    const X=i=>pad.l+(W-pad.l-pad.r)*i/(years.length-1);
    const Y=v=>H-pad.b-(H-pad.t-pad.b)*(v-ymin)/(ymax-ymin);
    for(let g=0;g<=4;g++){const v=ymin+(ymax-ymin)*g/4,y=Y(v);
      svg.appendChild(el("line",{x1:pad.l,y1:y,x2:W-pad.r,y2:y,stroke:C.grid,"stroke-width":1}));
      svg.appendChild(txt(pad.l-8,y+4,Math.round(v).toLocaleString(),{anchor:"end"}));}
    years.forEach((yr,i)=>svg.appendChild(txt(X(i),H-pad.b+18,yr)));
    series.forEach(s=>{let d="";s.data.forEach((v,i)=>{if(v==null)return;d+=(d?"L":"M")+X(i)+","+Y(v);});
      svg.appendChild(el("path",{d,fill:"none",stroke:s.color,"stroke-width":2.5,"stroke-dasharray":s.dash||"0"}));
      s.data.forEach((v,i)=>{if(v!=null)svg.appendChild(el("circle",{cx:X(i),cy:Y(v),r:3.2,fill:s.color}));});});
  }

  // 막대 차트 (카테고리 유사도, 게이트선)
  function bar(svg,items,opts={}){
    const W=opts.W||900,H=opts.H||240,pad={l:48,r:24,t:18,b:opts.b||48};
    const gap=(W-pad.l-pad.r)/items.length,bw=gap*0.5;
    const Y=v=>H-pad.b-(H-pad.t-pad.b)*v/100;
    for(let g=0;g<=4;g++){const v=25*g,y=Y(v);
      svg.appendChild(el("line",{x1:pad.l,y1:y,x2:W-pad.r,y2:y,stroke:C.grid,"stroke-width":1}));
      svg.appendChild(txt(pad.l-8,y+4,v,{anchor:"end"}));}
    if(opts.gate){const gy=Y(opts.gate);svg.appendChild(el("line",{x1:pad.l,y1:gy,x2:W-pad.r,y2:gy,stroke:C.signal,"stroke-width":1.5,"stroke-dasharray":"5,4"}));
      svg.appendChild(txt(W-pad.r,gy-6,"게이트 "+opts.gate,{anchor:"end",size:10.5,fill:C.signal,weight:600}));}
    if(opts.threshold){const ty=Y(opts.threshold);svg.appendChild(el("line",{x1:pad.l,y1:ty,x2:W-pad.r,y2:ty,stroke:C.accent,"stroke-width":1.5,"stroke-dasharray":"5,4"}));
      svg.appendChild(txt(W-pad.r,ty-6,"임계 "+opts.threshold,{anchor:"end",size:10.5,fill:C.accent,weight:600}));}
    items.forEach((it,i)=>{const cx=pad.l+gap*i+gap/2,bh=H-pad.b-Y(it.v),col=it.color||colorFor(it.v);
      svg.appendChild(el("rect",{x:cx-bw/2,y:Y(it.v),width:bw,height:bh,rx:4,fill:col}));
      svg.appendChild(txt(cx,Y(it.v)-8,it.v,{size:13,weight:700,fill:C.ink}));
      svg.appendChild(txt(cx,H-pad.b+18,it.label,{size:12}));
      if(it.w)svg.appendChild(txt(cx,H-pad.b+34,"가중치 "+it.w,{size:10}));});
  }

  // 가로 막대 (항목별 유사도 분포)
  function hbar(svg,items,opts={}){
    const W=opts.W||900,rowH=26,pad={l:opts.l||160,r:40,t:10};
    const H=pad.t*2+items.length*rowH;svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    const X=v=>pad.l+(W-pad.l-pad.r)*v/100;
    [0,50,70,100].forEach(v=>{svg.appendChild(el("line",{x1:X(v),y1:pad.t,x2:X(v),y2:H-pad.t,stroke:v===50||v===70?C.line:C.grid,"stroke-width":1,"stroke-dasharray":v===50||v===70?"3,3":"0"}));
      svg.appendChild(txt(X(v),H-2,v,{size:9.5}));});
    items.forEach((it,i)=>{const y=pad.t+i*rowH+rowH/2;
      svg.appendChild(txt(pad.l-8,y+4,it.name.length>16?it.name.slice(0,15)+"…":it.name,{anchor:"end",size:11,fill:C.soft}));
      if(it._skip||it.sim==null){svg.appendChild(txt((pad.l+W-pad.r)/2,y+4,"·····",{size:11,fill:C.line}));return;}
      svg.appendChild(el("rect",{x:pad.l,y:y-7,width:X(it.sim)-pad.l,height:14,rx:3,fill:colorFor(it.sim)}));
      svg.appendChild(txt(X(it.sim)+5,y+4,it.sim,{anchor:"start",size:10.5,weight:600,fill:C.soft}));});
  }

  // 도넛 (비율, 예: 개인:법인)
  function donut(svg,segs,opts={}){
    const W=opts.W||220,H=opts.H||220,cx=W/2,cy=H/2,rO=Math.min(W,H)/2-10,rI=rO*0.6;
    svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    const tot=segs.reduce((s,x)=>s+x.v,0);let a=-Math.PI/2;
    segs.forEach(s=>{const ang=s.v/tot*Math.PI*2,a2=a+ang;
      const x1=cx+rO*Math.cos(a),y1=cy+rO*Math.sin(a),x2=cx+rO*Math.cos(a2),y2=cy+rO*Math.sin(a2);
      const xi1=cx+rI*Math.cos(a2),yi1=cy+rI*Math.sin(a2),xi2=cx+rI*Math.cos(a),yi2=cy+rI*Math.sin(a);
      const laf=ang>Math.PI?1:0;
      svg.appendChild(el("path",{d:`M${x1},${y1}A${rO},${rO} 0 ${laf} 1 ${x2},${y2}L${xi1},${yi1}A${rI},${rI} 0 ${laf} 0 ${xi2},${yi2}Z`,fill:s.color}));
      const mid=a+ang/2,lr=(rO+rI)/2;
      svg.appendChild(txt(cx+lr*Math.cos(mid),cy+lr*Math.sin(mid)+4,s.v+"%",{size:13,weight:700,fill:"#fff"}));
      a=a2;});
  }

  // 그룹 막대 (양국 비교, 음수 지원)
  function group(svg,data,opts={}){
    const W=opts.W||900,H=opts.H||200,pad={l:50,r:24,t:18,b:40};
    const gap=(W-pad.l-pad.r)/data.length,bw=gap*0.26;
    const all=data.flatMap(d=>[d.uk,d.pl]);const ymax=Math.max(...all,0)+2,ymin=Math.min(...all,0)-1;
    const Y=v=>H-pad.b-(H-pad.t-pad.b)*(v-ymin)/(ymax-ymin);
    svg.appendChild(el("line",{x1:pad.l,y1:Y(0),x2:W-pad.r,y2:Y(0),stroke:C.ink,"stroke-width":1.5}));
    data.forEach((d,i)=>{const cx=pad.l+gap*i+gap/2;
      [[d.uk,C.soft,-bw*0.6,"UK"],[d.pl,C.accent,bw*0.6,"PL"]].forEach(([v,col,off])=>{
        const top=v>=0?Y(v):Y(0),bh=Math.abs(Y(v)-Y(0));
        svg.appendChild(el("rect",{x:cx+off-bw/2,y:top,width:bw,height:bh,rx:3,fill:col}));
        svg.appendChild(txt(cx+off,v>=0?top-5:top+bh+13,(opts.suffix?v+opts.suffix:v),{size:10.5,weight:700,fill:col}));});
      svg.appendChild(txt(cx,H-pad.b+22,d.label,{size:12}));});
  }

  return {line,bar,hbar,donut,group,C,el,colorFor};
})();
if(typeof module!=="undefined")module.exports=ChartLib;

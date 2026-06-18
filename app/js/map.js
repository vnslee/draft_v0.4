/**
 * map.js — 플랫 세계지도 (D3 geoNaturalEarth1 + world-atlas TopoJSON)
 * - 진출국/진출예정국 마커를 수도 위치에 표시 (data/index.json 기반)
 * - 권역 선택 시 해당 권역만 강조 + 확대(줌) 시뮬레이션, 닫기 시 전체 복귀
 * ui_design_guide.md M1 디자인 요구 반영.
 */
(function () {
  const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  let svg, gMap, gMarkers, projection, path, zoom;
  let width = 0, height = 0;
  let landFeatures = [];
  let opts = {};
  let currentRegion = null;

  async function init(containerId, options) {
    opts = options || {};
    const container = document.getElementById(containerId);
    const rect = container.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    svg = d3.select(container).append("svg")
      .attr("id", "world-map")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    projection = d3.geoNaturalEarth1();
    path = d3.geoPath(projection);

    gMap = svg.append("g").attr("class", "map-layer");
    gMarkers = svg.append("g").attr("class", "marker-layer");

    zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        gMap.attr("transform", event.transform);
        gMarkers.attr("transform", event.transform);
        gMarkers.selectAll(".marker-scale").attr("transform", `scale(${1 / event.transform.k})`);
      });
    svg.call(zoom).on("wheel.zoom", null); // 휠 줌 비활성(권역 버튼으로만 줌)

    const world = await (await fetch(TOPO_URL)).json();
    landFeatures = topojson.feature(world, world.objects.countries).features;

    // 화면에 꽉 차게 투영 보정
    projection.fitSize([width, height], { type: "FeatureCollection", features: landFeatures });

    gMap.selectAll("path.land")
      .data(landFeatures)
      .join("path")
      .attr("class", "land")
      .attr("d", path);
  }

  /** 마커 렌더. markers: [{code, name_ko, name_en, lonlat:[lon,lat], entered:bool, score, onClick}] */
  function renderMarkers(markers) {
    const sel = gMarkers.selectAll(".marker").data(markers, (d) => d.code);
    sel.exit().remove();

    const g = sel.enter().append("g")
      .attr("class", "marker")
      .style("cursor", "pointer");

    g.append("g").attr("class", "marker-scale");

    const merged = g.merge(sel)
      .attr("transform", (d) => {
        const p = projection(d.lonlat);
        return p ? `translate(${p[0]},${p[1]})` : "translate(-999,-999)";
      });

    merged.select(".marker-scale").html((d) => {
      const color = d.entered ? "#004ac6" : "#006242";
      const pulseClass = d.entered ? "pulse-entered" : "pulse-planned";
      return `
        <circle r="12" fill="${color}" opacity="0.18" class="${pulseClass}"></circle>
        <circle r="5" fill="${color}" stroke="#fff" stroke-width="2"></circle>
      `;
    });

    // 툴팁 + 클릭
    merged.on("mouseenter", function (e, d) { showTooltip(this, d); })
      .on("mouseleave", hideTooltip)
      .on("click", (e, d) => { if (d.onClick) d.onClick(d); });
  }

  let tooltipEl;
  function showTooltip(node, d) {
    hideTooltip();
    const t = window.I18n ? window.I18n.t.bind(window.I18n) : (x) => x;
    const name = window.I18n && window.I18n.lang === "en" ? d.name_en : d.name_ko;
    const statusKo = d.entered ? "진출 완료" : "진출 예정";
    const scoreLine = d.score != null ? `<div class="text-[10px] text-secondary">${t("종합 유사도")}: ${d.score}</div>` : "";
    tooltipEl = document.createElement("div");
    tooltipEl.className = "glass-panel rounded-lg px-3 py-2 shadow-xl pointer-events-none fade-in";
    tooltipEl.style.cssText = "position:fixed;z-index:200;white-space:nowrap;";
    tooltipEl.innerHTML = `<div class="text-xs font-bold" style="color:${d.entered ? "#004ac6" : "#006242"}">${name}</div>
      <div class="text-[10px] text-secondary">${t(statusKo)}</div>${scoreLine}`;
    document.body.appendChild(tooltipEl);
    const r = node.getBoundingClientRect();
    tooltipEl.style.left = r.left + r.width / 2 - tooltipEl.offsetWidth / 2 + "px";
    tooltipEl.style.top = r.top - tooltipEl.offsetHeight - 8 + "px";
  }
  function hideTooltip() {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
  }

  /** 권역 확대 + 강조. region: Geo.REGIONS 항목 */
  function focusRegion(region) {
    currentRegion = region;
    const [[minLon, minLat], [maxLon, maxLat]] = region.bbox;
    const p0 = projection([minLon, maxLat]);
    const p1 = projection([maxLon, minLat]);
    const x0 = Math.min(p0[0], p1[0]), x1 = Math.max(p0[0], p1[0]);
    const y0 = Math.min(p0[1], p1[1]), y1 = Math.max(p0[1], p1[1]);
    const dx = x1 - x0, dy = y1 - y0;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const k = Math.min(8, 0.85 / Math.max(dx / width, dy / height));
    const t = d3.zoomIdentity.translate(width / 2 - cx * k, height / 2 - cy * k).scale(k);

    // 권역 내/외 강조
    gMap.selectAll("path.land")
      .classed("region-dim", true)
      .classed("region-active", (d) => inBBox(d3.geoCentroid(d), region.bbox));

    svg.transition().duration(900).call(zoom.transform, t);
  }

  function resetRegion() {
    currentRegion = null;
    gMap.selectAll("path.land").classed("region-dim", false).classed("region-active", false);
    svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity);
  }

  function inBBox(centroid, bbox) {
    const [lon, lat] = centroid;
    const [[minLon, minLat], [maxLon, maxLat]] = bbox;
    return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  }

  window.WorldMap = { init, renderMarkers, focusRegion, resetRegion, get currentRegion() { return currentRegion; } };
})();

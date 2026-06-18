/**
 * geo.js — 지리 설정 (수도 좌표 + 권역 정의)
 * 지도 마커는 data/index.json의 국가 목록으로 생성하되,
 * 좌표·권역 메타데이터는 여기서 코드별로 관리한다(데이터 확장 시 여기에 추가).
 */
(function () {
  // ISO A2 코드 → 수도 [경도, 위도]
  const CAPITALS = {
    KR: [126.978, 37.566], // 서울
    GB: [-0.1276, 51.5074], // 런던
    PL: [21.0122, 52.2297], // 바르샤바
    DE: [13.405, 52.52], // 베를린
    CZ: [14.4378, 50.0755], // 프라하
    HU: [19.0402, 47.4979], // 부다페스트
    FR: [2.3522, 48.8566], // 파리
    US: [-77.0369, 38.9072], // 워싱턴
    BR: [-47.8825, -15.7942], // 브라질리아
    MX: [-99.1332, 19.4326], // 멕시코시티
    ID: [106.8456, -6.2088], // 자카르타
    VN: [105.8342, 21.0278], // 하노이
    TH: [100.5018, 13.7563], // 방콕
    SG: [103.8198, 1.3521], // 싱가포르
    JP: [139.6917, 35.6895], // 도쿄
    IN: [77.209, 28.6139], // 뉴델리
    AE: [54.3773, 24.4539], // 아부다비
  };

  // 권역 정의: id, 한글/영문명, 줌 대상 경위도 박스 [[minLon,minLat],[maxLon,maxLat]]
  const REGIONS = {
    EUROPE: {
      id: "EUROPE",
      name_ko: "유럽",
      name_en: "Europe",
      bbox: [[-11, 35], [31, 60]],
    },
    NORTH_AMERICA: {
      id: "NORTH_AMERICA",
      name_ko: "북미",
      name_en: "North America",
      bbox: [[-130, 15], [-60, 55]],
    },
    SOUTH_AMERICA: {
      id: "SOUTH_AMERICA",
      name_ko: "남미",
      name_en: "South America",
      bbox: [[-82, -40], [-34, 12]],
    },
    APAC: {
      id: "APAC",
      name_ko: "아시아·태평양",
      name_en: "APAC",
      bbox: [[95, -12], [150, 45]],
    },
    MIDDLE_EAST: {
      id: "MIDDLE_EAST",
      name_ko: "중동",
      name_en: "Middle East",
      bbox: [[34, 12], [60, 42]],
    },
  };

  // index.json의 region 값(EUROPE/AMERICAS/APAC) → 표준 권역 id 매핑
  const REGION_ALIAS = {
    EUROPE: "EUROPE",
    AMERICAS: "NORTH_AMERICA",
    APAC: "APAC",
  };

  function capital(code) { return CAPITALS[code] || null; }
  function region(id) { return REGIONS[REGION_ALIAS[id] || id] || null; }
  function regionList() { return Object.values(REGIONS); }

  window.Geo = { CAPITALS, REGIONS, REGION_ALIAS, capital, region, regionList };
})();

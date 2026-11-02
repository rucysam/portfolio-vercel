/* ================================================================
   📌 초기 샘플 데이터
   → 관리자 페이지(/admin)에서 처음 저장하기 전까지만 사용됩니다.
   → 이후 내용 수정은 전부 /admin 에서 하면 되고, 이 파일은 건드릴 필요 없습니다.
   ================================================================ */

window.PORTFOLIO_SAMPLE = {

  /* ---------- 1. 자기소개 ---------- */
  profile: {
    name: "홍길동",
    role: "게임 사업PM 지원자",
    headline: "숫자로 게임을 읽고, 유저의 언어로 사업을 설계합니다.",
    photo: "",           // 없으면 자동으로 기본 이미지 표시
    contact: [
      { label: "Email",  url: "mailto:your@email.com" },
      { label: "GitHub", url: "https://github.com/아이디" },
      { label: "Notion", url: "https://notion.so/..." }
    ],
    skills: [
      { name: "데이터 분석",     desc: "Excel·Google Sheets로 매출/지표 정리 및 리포트 작성" },
      { name: "라이브 운영 이해", desc: "이벤트·업데이트 주기, BM 구조 분석 경험" },
      { name: "커뮤니티 관리",   desc: "디스코드 커뮤니티 운영 및 유저 VOC 수집" },
      { name: "문서화·보고",     desc: "분석 결과를 PPT 보고서로 구조화" }
    ],
    intro: [
      "첫 번째 문단: 나는 어떤 사람인지 2~3문장으로 씁니다.",
      "두 번째 문단: 지금까지의 경험 중 사업PM과 연결되는 것을 씁니다."
    ],
    why: [
      "사업PM을 선택한 이유를 '경험 → 깨달음 → 목표' 순서로 씁니다."
    ]
  },

  /* ---------- 2. 사업PM 취업을 위해 한 활동 ----------
     category: 원하는 분류명 자유롭게 (필터 버튼이 자동 생성됨)
     period:   "2026.03" 또는 "2026.03 ~ 2026.06"  (최신순 자동 정렬)       */
  activities: [
    {
      category: "게임 분석",
      period: "2026.09 ~ 2026.10",
      title: "모바일 수집형 RPG 3종 BM 비교 분석",
      role: "개인 프로젝트",
      desc: "매출 상위 수집형 RPG 3종의 상품 구성, 가격대, 이벤트 주기를 비교했습니다.",
      results: [
        "패키지 상품 40여 종을 가격대별로 분류",
        "신규 유저 첫 결제 유도 구조 차이점 도출"
      ],
      link: ""   // 노션/PDF 주소가 있으면 넣기 (없으면 "" 그대로)
    },
    {
      category: "교육·자격",
      period: "2026.06",
      title: "SQL 기초 / 데이터 분석 온라인 강의 수료",
      role: "수료",
      desc: "게임 지표(DAU, ARPU, 리텐션)를 직접 쿼리로 뽑는 연습을 했습니다.",
      results: [],
      link: ""
    },
    {
      category: "실무 경험",
      period: "2025.01 ~ 2026.10",
      title: "교육 서비스 회사 운영·재무 업무",
      role: "운영 담당",
      desc: "PG사 매출 데이터 정리, 커뮤니티 운영, 고객 분쟁 대응을 맡았습니다.",
      results: [
        "3개년 PG 매출 데이터 정리 → 보고용 PPT 제작"
      ],
      link: ""
    }
  ],

  /* ---------- 3. 내가 플레이한 게임 ----------
     thumb:  카드에 보이는 대표 이미지
     shots:  상세 팝업에 보이는 캡쳐들 (여러 장 가능)
     이미지 파일은 images/games/ 폴더에 넣고 파일명만 맞춰주세요.           */
  games: [
    {
      title: "게임 이름 A",
      platform: "모바일",
      genre: "수집형 RPG",
      company: "개발사/퍼블리셔",
      playTime: "약 300시간",
      period: "2024 ~ 현재",
      thumb: "",
      shots: [],
      oneLine: "한 줄 평: 이 게임에서 사업적으로 인상 깊었던 점",
      bm: "어떻게 돈을 버는 게임인지 (가챠, 월정액, 패스 등)",
      good: ["잘한 점 1", "잘한 점 2"],
      improve: ["사업PM이라면 바꿔보고 싶은 점 1"]
    },
    {
      title: "게임 이름 B",
      platform: "PC",
      genre: "MMORPG",
      company: "개발사/퍼블리셔",
      playTime: "약 1,000시간",
      period: "2021 ~ 2023",
      thumb: "",
      shots: [],
      oneLine: "한 줄 평",
      bm: "BM 구조 설명",
      good: ["잘한 점"],
      improve: ["개선 아이디어"]
    }
  ],

  footer: "© 2026 홍길동 · Game Business PM Portfolio"
};

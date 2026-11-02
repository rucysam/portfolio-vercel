/* ================================================================
   공개 포트폴리오 화면 그리기
   - 데이터 출처: 서버(/api/data) → 미리보기 저장본 → data.js 샘플 순서
   - 화면 구조는 index.html, 모양은 css/style.css 에서 수정
   ================================================================ */
(function () {
  const site = document.getElementById("site");
  if (!site) return;
  const $ = (sel) => site.querySelector(sel);
  const $$ = (sel) => site.querySelectorAll(sel);
  let D = null;           // 현재 화면에 그려진 데이터
  let shownGames = [];
  let activityFilter = "전체";
  let gameFilter = "전체";

  /* ---------- 도구 ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const placeholder = (text) =>
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
        <rect width="100%" height="100%" fill="#222634"/>
        <text x="50%" y="50%" fill="#6b7287" font-family="sans-serif" font-size="22"
          text-anchor="middle" dominant-baseline="middle">${esc(text)}</text></svg>`);
  const img = (src, alt, cls = "") =>
    `<img class="${cls}" src="${esc(src || placeholder(alt))}" alt="${esc(alt)}" loading="lazy"
      onerror="this.onerror=null;this.src='${placeholder(alt).replace(/'/g, "%27")}'">`;

  /* ---------- 데이터 불러오기 ---------- */
  async function loadPortfolio() {
    try {
      const res = await fetch("/api/data", { cache: "no-store" });
      if (res.ok) return { data: (await res.json()).data, fromServer: true };
    } catch (e) { /* 서버 없음 */ }
    try {
      const preview = localStorage.getItem("portfolio-preview");
      if (preview) return { data: JSON.parse(preview), fromServer: false };
    } catch (e) { /* 브라우저 저장소 사용 불가 */ }
    return { data: window.PORTFOLIO_SAMPLE, fromServer: false };
  }

  /* ---------- 탭 ---------- */
  function setTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
    $$(".panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === name));
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
    window.scrollTo({ top: 0 });
  }

  /* ---------- 1. 자기소개 ---------- */
  function renderProfile() {
    const p = D.profile || {};
    if (!document.body.dataset.keepTitle) document.title = `${p.name} | ${p.role}`;
    $("#profile-name").textContent = p.name || "";
    $("#profile-role").textContent = p.role || "";
    $("#profile-headline").textContent = p.headline || "";
    const photo = $("#profile-photo");
    photo.onerror = () => { photo.onerror = null; photo.src = placeholder("PHOTO"); };
    photo.src = p.photo || placeholder("PHOTO");

    $("#profile-contact").innerHTML = (p.contact || []).map((c) =>
      `<li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.label)}</a></li>`).join("");
    $("#profile-skills").innerHTML = (p.skills || []).map((s) =>
      `<div class="skill"><p class="skill__name">${esc(s.name)}</p><p class="skill__desc">${esc(s.desc)}</p></div>`).join("");
    $("#profile-intro").innerHTML = (p.intro || []).map((t) => `<p>${esc(t)}</p>`).join("");
    $("#profile-why").innerHTML = (p.why || []).map((t) => `<p>${esc(t)}</p>`).join("");
  }

  /* ---------- 필터 버튼 ---------- */
  function renderFilters(el, values, current) {
    const all = ["전체", ...new Set(values.filter(Boolean))];
    if (!all.includes(current)) current = "전체";
    el.innerHTML = all.map((v) =>
      `<button class="chip${v === current ? " is-active" : ""}" data-v="${esc(v)}">${esc(v)}</button>`).join("");
    return current;
  }

  /* ---------- 2. 준비 활동 ---------- */
  function renderActivities() {
    const acts = D.activities || [];
    activityFilter = renderFilters($("#activity-filters"), acts.map((a) => a.category), activityFilter);
    const list = [...acts]
      .sort((a, b) => String(b.period).localeCompare(String(a.period)))   // 최신순
      .filter((a) => activityFilter === "전체" || a.category === activityFilter);

    $("#activity-list").innerHTML = list.length ? list.map((a) => `
      <li class="act"><div class="act__card">
        <div class="act__meta"><span class="badge">${esc(a.category)}</span><span>${esc(a.period)}</span></div>
        <h3 class="act__title">${esc(a.title)}</h3>
        ${a.role ? `<p class="act__role">${esc(a.role)}</p>` : ""}
        <p class="act__desc">${esc(a.desc)}</p>
        ${a.results && a.results.length ? `<ul class="act__results">${a.results.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
        ${a.link ? `<a class="act__link" href="${esc(a.link)}" target="_blank" rel="noopener">자세히 보기 →</a>` : ""}
      </div></li>`).join("") : `<p class="empty">해당 활동이 없습니다.</p>`;
  }

  /* ---------- 3. 게임 ---------- */
  function renderGames() {
    const games = D.games || [];
    gameFilter = renderFilters($("#game-filters"), games.map((g) => g.platform), gameFilter);
    shownGames = games.filter((g) => gameFilter === "전체" || g.platform === gameFilter);

    const genres = new Set(games.map((x) => x.genre).filter(Boolean)).size;
    const platforms = new Set(games.map((x) => x.platform).filter(Boolean)).size;
    $("#game-stats").innerHTML = [[games.length, "플레이한 게임"], [genres, "장르"], [platforms, "플랫폼"]]
      .map(([n, l]) => `<div class="stat"><p class="stat__num">${n}</p><p class="stat__label">${l}</p></div>`).join("");

    $("#game-list").innerHTML = shownGames.length ? shownGames.map((g, i) => `
      <button class="game" data-i="${i}">
        ${img(g.thumb || (g.shots || [])[0], g.title, "game__thumb")}
        <div class="game__body">
          <p class="game__title">${esc(g.title)}</p>
          <p class="game__sub">${esc([g.company, g.playTime].filter(Boolean).join(" · "))}</p>
          <div class="game__tags">${[g.platform, g.genre].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          ${g.oneLine ? `<p class="game__oneline">${esc(g.oneLine)}</p>` : ""}
        </div>
      </button>`).join("") : `<p class="empty">해당 게임이 없습니다.</p>`;
  }

  /* ---------- 게임 상세 팝업 ---------- */
  const modal = $("#game-modal");
  function openGame(g) {
    const li = (arr) => (arr || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const rows = [["플랫폼", g.platform], ["장르", g.genre], ["개발/퍼블리셔", g.company],
                  ["플레이 시간", g.playTime], ["플레이 기간", g.period]].filter(([, v]) => v);
    const shots = (g.shots && g.shots.length ? g.shots : [g.thumb]).filter(Boolean);
    $("#modal-body").innerHTML = `
      <h3>${esc(g.title)}</h3>
      ${g.oneLine ? `<p>${esc(g.oneLine)}</p>` : ""}
      ${shots.length ? `<div class="shots">${shots.map((s) => img(s, g.title)).join("")}</div>` : ""}
      <table class="info-table">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join("")}</table>
      ${g.bm ? `<h4>BM(수익 구조)</h4><p>${esc(g.bm)}</p>` : ""}
      ${g.good && g.good.length ? `<h4>사업적으로 잘한 점</h4><ul>${li(g.good)}</ul>` : ""}
      ${g.improve && g.improve.length ? `<h4>내가 PM이라면</h4><ul>${li(g.improve)}</ul>` : ""}`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeGame() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  /* ---------- 이벤트 (한 번만 연결) ---------- */
  $$(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));
  $("#logo").addEventListener("click", (e) => { e.preventDefault(); setTab("about"); });
  $("#activity-filters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) { activityFilter = b.dataset.v; renderActivities(); }
  });
  $("#game-filters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) { gameFilter = b.dataset.v; renderGames(); }
  });
  $("#game-list").addEventListener("click", (e) => {
    const card = e.target.closest(".game");
    if (card) openGame(shownGames[+card.dataset.i]);
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeGame(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeGame(); });

  /* ---------- 전체 그리기 (관리자 미리보기에서도 호출) ---------- */
  function render(data) {
    D = data || {};
    renderProfile();
    renderActivities();
    renderGames();
    $("#footer").textContent = D.footer || "";
  }
  window.renderPortfolio = render;

  loadPortfolio().then(({ data, fromServer }) => {
    render(data);
    document.body.classList.remove("is-loading");
    const bar = document.getElementById("preview-bar");
    if (bar) bar.hidden = fromServer;   // 서버에 저장된 내용이 생기면 안내 띠 숨김
    const start = location.hash.replace("#", "");
    setTab(["about", "activities", "games"].includes(start) ? start : "about");
  });
})();

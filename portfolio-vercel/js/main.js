/* ================================================================
   렌더링 스크립트 — 서버(/api/data)에 저장된 데이터를 화면에 그립니다.
   서버 데이터가 없으면 → 미리보기 데이터 → data.js 샘플 순서로 사용
   ================================================================ */
async function loadPortfolio() {
  try {
    const res = await fetch("/api/data", { cache: "no-store" });
    if (res.ok) return { data: (await res.json()).data, fromServer: true };
  } catch (e) { /* 서버 없음 → 아래로 */ }
  try {
    const preview = localStorage.getItem("portfolio-preview");
    if (preview) return { data: JSON.parse(preview), fromServer: false };
  } catch (e) { /* 저장소 사용 불가 */ }
  return { data: window.PORTFOLIO_SAMPLE, fromServer: false };
}

loadPortfolio().then(function ({ data: D, fromServer }) {
  document.body.classList.remove("is-loading");
  // 아직 서버에 저장된 내용이 없을 때만 보이는 안내 (첫 저장 후 자동으로 사라짐)
  if (!fromServer) {
    document.body.insertAdjacentHTML("afterbegin",
      `<div class="preview-bar">샘플/미리보기 내용입니다 · <a href="admin.html">관리자 페이지에서 내 내용 입력하기 →</a></div>`);
  }
  const $ = (sel) => document.querySelector(sel);

  // 특수문자 안전 처리
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 이미지가 없을 때 보여줄 기본 이미지
  const placeholder = (text) =>
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
        <rect width="100%" height="100%" fill="#222634"/>
        <text x="50%" y="50%" fill="#6b7287" font-family="sans-serif" font-size="22"
          text-anchor="middle" dominant-baseline="middle">${esc(text)}</text></svg>`);
  const img = (src, alt, cls = "") =>
    `<img class="${cls}" src="${esc(src || placeholder(alt))}" alt="${esc(alt)}" loading="lazy"
      onerror="this.onerror=null;this.src='${placeholder(alt).replace(/'/g, "%27")}'">`;

  /* ---------- 탭 ---------- */
  function setTab(name) {
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("is-active", t.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) =>
      p.classList.toggle("is-active", p.dataset.panel === name));
    history.replaceState(null, "", "#" + name);
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => setTab(t.dataset.tab)));
  $("#logo").addEventListener("click", (e) => { e.preventDefault(); setTab("about"); });

  /* ---------- 1. 자기소개 ---------- */
  function renderProfile() {
    const p = D.profile;
    document.title = `${p.name} | ${p.role}`;
    $("#profile-name").textContent = p.name;
    $("#profile-role").textContent = p.role;
    $("#profile-headline").textContent = p.headline;
    const photo = $("#profile-photo");
    photo.src = p.photo || placeholder("PHOTO");
    photo.onerror = () => { photo.onerror = null; photo.src = placeholder("PHOTO"); };

    $("#profile-contact").innerHTML = (p.contact || []).map((c) =>
      `<li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.label)}</a></li>`).join("");
    $("#profile-skills").innerHTML = (p.skills || []).map((s) =>
      `<div class="skill"><p class="skill__name">${esc(s.name)}</p><p class="skill__desc">${esc(s.desc)}</p></div>`).join("");
    $("#profile-intro").innerHTML = (p.intro || []).map((t) => `<p>${esc(t)}</p>`).join("");
    $("#profile-why").innerHTML = (p.why || []).map((t) => `<p>${esc(t)}</p>`).join("");
  }

  /* ---------- 필터 버튼 공통 ---------- */
  function buildFilters(el, values, onChange) {
    const all = ["전체", ...new Set(values.filter(Boolean))];
    el.innerHTML = all.map((v, i) =>
      `<button class="chip${i === 0 ? " is-active" : ""}" data-v="${esc(v)}">${esc(v)}</button>`).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      el.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === b));
      onChange(b.dataset.v);
    });
  }

  /* ---------- 2. 준비 활동 ---------- */
  function renderActivities(filter = "전체") {
    const list = [...(D.activities || [])]
      .sort((a, b) => String(b.period).localeCompare(String(a.period)))   // 최신순
      .filter((a) => filter === "전체" || a.category === filter);

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
  let shownGames = [];
  function renderGames(filter = "전체") {
    shownGames = (D.games || []).filter((g) => filter === "전체" || g.platform === filter);
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

  function renderGameStats() {
    const g = D.games || [];
    const genres = new Set(g.map((x) => x.genre).filter(Boolean)).size;
    const platforms = new Set(g.map((x) => x.platform).filter(Boolean)).size;
    $("#game-stats").innerHTML = [
      [g.length, "플레이한 게임"], [genres, "장르"], [platforms, "플랫폼"]
    ].map(([n, l]) => `<div class="stat"><p class="stat__num">${n}</p><p class="stat__label">${l}</p></div>`).join("");
  }

  /* ---------- 게임 상세 모달 ---------- */
  const modal = $("#game-modal");
  function openGame(g) {
    const li = (arr) => (arr || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const rows = [["플랫폼", g.platform], ["장르", g.genre], ["개발/퍼블리셔", g.company],
                  ["플레이 시간", g.playTime], ["플레이 기간", g.period]].filter(([, v]) => v);
    $("#modal-body").innerHTML = `
      <h3>${esc(g.title)}</h3>
      ${g.oneLine ? `<p>${esc(g.oneLine)}</p>` : ""}
      <div class="shots">${(g.shots || [g.thumb]).map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener">${img(s, g.title)}</a>`).join("")}</div>
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
  $("#game-list").addEventListener("click", (e) => {
    const card = e.target.closest(".game");
    if (card) openGame(shownGames[+card.dataset.i]);
  });
  modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeGame(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeGame(); });

  /* ---------- 실행 ---------- */
  renderProfile();
  buildFilters($("#activity-filters"), (D.activities || []).map((a) => a.category), renderActivities);
  renderActivities();
  buildFilters($("#game-filters"), (D.games || []).map((g) => g.platform), renderGames);
  renderGameStats();
  renderGames();
  $("#footer").textContent = D.footer || "";

  const start = location.hash.replace("#", "");
  setTab(["about", "activities", "games"].includes(start) ? start : "about");
});

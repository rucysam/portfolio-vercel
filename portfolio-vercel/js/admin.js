/* ================================================================
   관리자 페이지 — 입력 → /api/data 로 저장 → 공개 페이지에 즉시 반영
   ================================================================ */
(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const store = {
    get(k, s = sessionStorage) { try { return s.getItem(k); } catch (e) { return null; } },
    set(k, v, s = sessionStorage) { try { s.setItem(k, v); return true; } catch (e) { return false; } },
    del(k, s = sessionStorage) { try { s.removeItem(k); } catch (e) {} },
  };
  const PREVIEW_KEY = "portfolio-preview";

  let state = null;          // 편집 중인 전체 데이터
  let password = "";
  let previewMode = false;   // 서버 없이 체험하는 모드
  let dirty = false;
  let currentTab = "profile";
  const openItems = new WeakSet();

  /* ---------- 입력 항목 정의 (여기에 줄 추가하면 입력칸이 생깁니다) ---------- */
  const PROFILE_FIELDS = [
    { key: "name", label: "이름", type: "text" },
    { key: "role", label: "지원 직무", type: "text", ph: "게임 사업PM 지원자" },
    { key: "headline", label: "한 줄 소개", type: "text", full: true, ph: "면접관이 기억할 한 문장" },
    { key: "photo", label: "프로필 사진", type: "image", round: true, full: true },
    { key: "contact", label: "연락처 · 링크", type: "pairs", a: ["label", "이름 (예: Email)"], b: ["url", "주소 (mailto:… / https://…)"], full: true },
    { key: "skills", label: "핵심 역량", type: "pairs", a: ["name", "역량"], b: ["desc", "근거가 되는 경험 한 줄"], full: true },
    { key: "intro", label: "소개", type: "paras", hint: "빈 줄로 문단 구분", full: true },
    { key: "why", label: "왜 사업PM인가", type: "paras", hint: "빈 줄로 문단 구분", full: true },
  ];
  const ACTIVITY_FIELDS = [
    { key: "category", label: "분류", type: "text", list: "categories", ph: "게임 분석 / 교육·자격 / 실무 경험…" },
    { key: "period", label: "기간", type: "text", ph: "2026.03 ~ 2026.06" },
    { key: "title", label: "활동명", type: "text", full: true },
    { key: "role", label: "역할", type: "text", ph: "개인 프로젝트 / 팀장 / 수료" },
    { key: "link", label: "링크", type: "text", ph: "노션·PDF 주소 (선택)" },
    { key: "desc", label: "설명", type: "textarea", full: true },
    { key: "results", label: "성과", type: "lines", hint: "한 줄에 하나 · 숫자로", full: true },
  ];
  const GAME_FIELDS = [
    { key: "title", label: "게임 이름", type: "text" },
    { key: "company", label: "개발사 / 퍼블리셔", type: "text" },
    { key: "platform", label: "플랫폼", type: "text", list: "platforms", ph: "모바일 / PC / 콘솔" },
    { key: "genre", label: "장르", type: "text", list: "genres" },
    { key: "playTime", label: "플레이 시간", type: "text", ph: "약 300시간" },
    { key: "period", label: "플레이 기간", type: "text", ph: "2024 ~ 현재" },
    { key: "shots", label: "게임 캡쳐", type: "images", hint: "첫 번째 사진이 대표 이미지", full: true },
    { key: "oneLine", label: "한 줄 평", type: "text", full: true },
    { key: "bm", label: "BM (수익 구조)", type: "textarea", full: true },
    { key: "good", label: "사업적으로 잘한 점", type: "lines", hint: "한 줄에 하나", full: true },
    { key: "improve", label: "내가 PM이라면", type: "lines", hint: "한 줄에 하나", full: true },
  ];
  const EMPTY_ACTIVITY = { category: "", period: "", title: "새 활동", role: "", desc: "", results: [], link: "" };
  const EMPTY_GAME = { title: "새 게임", platform: "", genre: "", company: "", playTime: "", period: "", thumb: "", shots: [], oneLine: "", bm: "", good: [], improve: [] };

  /* ---------- 경로로 값 읽기/쓰기 (예: "games.0.title") ---------- */
  const getPath = (path) => path.replace(/^_root\./, "").split(".").reduce((o, k) => (o == null ? o : o[k]), state);
  function setPath(path, value) {
    const keys = path.replace(/^_root\./, "").split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => o[k], state);
    target[last] = value;
  }

  /* ---------- 서버 통신 ---------- */
  async function api(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { "content-type": "application/json", "x-admin-password": password, ...(options.headers || {}) },
    });
    let body = {};
    try { body = await res.json(); } catch (e) {}
    if (res.status === 401) { logout(); throw new Error("비밀번호가 올바르지 않습니다."); }
    if (!res.ok) throw new Error(body.error || `오류 (${res.status})`);
    return body;
  }

  /* ---------- 로그인 ---------- */
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    password = $("#login-pw").value;
    $("#login-msg").textContent = "확인 중…";
    try {
      const res = await fetch("/api/auth", { method: "POST", headers: { "x-admin-password": password } });
      const body = await res.json().catch(() => ({}));
      if (res.ok) { store.set("admin-pw", password); return start(false); }
      if (res.status === 401 || res.status === 500 && body.error) {
        $("#login-msg").textContent = body.error || "로그인 실패";
        return;
      }
      throw new Error("no-api");
    } catch (err) {
      $("#login-msg").textContent = "서버(API)에 연결할 수 없습니다. 아직 Vercel에 배포 전이라면 미리보기 모드로 체험해 보세요.";
      $("#preview-mode").hidden = false;
    }
  });
  $("#preview-mode").addEventListener("click", () => start(true));

  function logout() {
    store.del("admin-pw");
    $("#editor").hidden = true;
    $("#login").hidden = false;
  }

  async function start(isPreview) {
    previewMode = isPreview;
    $("#mode-banner").hidden = !isPreview;
    document.querySelectorAll(".site-link").forEach((a) => {
      if (isPreview) a.removeAttribute("target"); else a.setAttribute("target", "_blank");
    });
    let data = null;
    if (isPreview) {
      const saved = store.get(PREVIEW_KEY, localStorage);
      if (saved) try { data = JSON.parse(saved); } catch (e) {}
    } else {
      try {
        const res = await fetch("/api/data?fresh=" + Date.now(), { cache: "no-store" });
        if (res.ok) data = (await res.json()).data;
      } catch (e) {}
    }
    state = normalize(data || clone(window.PORTFOLIO_SAMPLE));
    $("#login").hidden = true;
    $("#editor").hidden = false;
    setDirty(false);
    render();
  }

  // 빠진 칸 채우기 (예전 데이터와 호환)
  function normalize(d) {
    d.profile = Object.assign({ contact: [], skills: [], intro: [], why: [] }, d.profile || {});
    d.activities = (d.activities || []).map((a) => Object.assign(clone(EMPTY_ACTIVITY), a));
    d.games = (d.games || []).map((g) => {
      const game = Object.assign(clone(EMPTY_GAME), g);
      game.shots = (game.shots || []).filter(Boolean);
      if (!game.shots.length && game.thumb) game.shots = [game.thumb];
      return game;
    });
    d.footer = d.footer || "";
    return d;
  }

  /* ---------- 탭 ---------- */
  document.querySelectorAll(".admin .tab").forEach((t) =>
    t.addEventListener("click", () => {
      currentTab = t.dataset.tab;
      document.querySelectorAll(".admin .tab").forEach((x) => x.classList.toggle("is-active", x === t));
      render();
      window.scrollTo({ top: 0 });
    }));

  /* ---------- 입력칸 그리기 ---------- */
  function fieldHTML(f, base) {
    const path = `${base}.${f.key}`;
    const v = getPath(path);
    const label = `<span class="field__label">${esc(f.label)}${f.hint ? `<span class="field__hint">${esc(f.hint)}</span>` : ""}</span>`;
    const cls = `field${f.full ? " field--full" : ""}`;
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : "";

    switch (f.type) {
      case "text":
        return `<label class="${cls}">${label}<input type="text" data-path="${path}" value="${esc(v)}"${ph}${f.list ? ` list="${f.list}"` : ""} /></label>`;
      case "textarea":
        return `<label class="${cls}">${label}<textarea data-path="${path}"${ph}>${esc(v)}</textarea></label>`;
      case "lines":
        return `<label class="${cls}">${label}<textarea data-path="${path}" data-kind="lines">${esc((v || []).join("\n"))}</textarea></label>`;
      case "paras":
        return `<label class="${cls}">${label}<textarea data-path="${path}" data-kind="paras" style="min-height:140px">${esc((v || []).join("\n\n"))}</textarea></label>`;
      case "pairs":
        return `<div class="${cls}">${label}<div class="pairs">${(v || []).map((row, i) => `
          <div class="pair">
            <input type="text" data-path="${path}.${i}.${f.a[0]}" value="${esc(row[f.a[0]])}" placeholder="${esc(f.a[1])}" />
            <input type="text" data-path="${path}.${i}.${f.b[0]}" value="${esc(row[f.b[0]])}" placeholder="${esc(f.b[1])}" />
            <button class="btn btn--sm btn--danger" data-action="pair-del" data-path="${path}" data-i="${i}">삭제</button>
          </div>`).join("")}
          <div><button class="btn btn--sm" data-action="pair-add" data-path="${path}" data-a="${f.a[0]}" data-b="${f.b[0]}">+ 추가</button></div>
        </div></div>`;
      case "image":
        return `<div class="${cls}">${label}<div class="images">
          ${v ? `<div class="img-item${f.round ? " img-item--round" : ""}"><img src="${esc(v)}" alt="" />
            <div class="img-item__tools"><button data-action="img-clear" data-path="${path}" title="삭제">✕</button></div></div>` : ""}
          <label class="img-add${f.round ? " img-item--round" : ""}">${v ? "사진 바꾸기" : "+ 사진 올리기"}
            <input type="file" accept="image/*" data-upload="single" data-path="${path}" /></label>
        </div></div>`;
      case "images":
        return `<div class="${cls}">${label}<div class="images">
          ${(v || []).map((src, i) => `
            <div class="img-item"><img src="${esc(src)}" alt="" />
              ${i === 0 ? `<span class="img-item__badge">대표</span>` : ""}
              <div class="img-item__tools">
                ${i > 0 ? `<button data-action="img-first" data-path="${path}" data-i="${i}" title="대표로">★</button>` : ""}
                <button data-action="img-del" data-path="${path}" data-i="${i}" title="삭제">✕</button>
              </div></div>`).join("")}
          <label class="img-add">+ 캡쳐 올리기<br/>(여러 장 선택 가능)
            <input type="file" accept="image/*" multiple data-upload="multi" data-path="${path}" /></label>
        </div></div>`;
    }
    return "";
  }

  const fieldsHTML = (fields, base) => `<div class="form-grid">${fields.map((f) => fieldHTML(f, base)).join("")}</div>`;

  function datalists() {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const opts = (arr) => arr.map((x) => `<option value="${esc(x)}"></option>`).join("");
    return `
      <datalist id="categories">${opts(uniq(["게임 분석", "교육·자격", "실무 경험", "대외활동", "공모전", ...state.activities.map((a) => a.category)]))}</datalist>
      <datalist id="platforms">${opts(uniq(["모바일", "PC", "콘솔", "멀티플랫폼", ...state.games.map((g) => g.platform)]))}</datalist>
      <datalist id="genres">${opts(uniq(["RPG", "MMORPG", "수집형 RPG", "FPS", "MOBA", "전략", "캐주얼", "퍼즐", "스포츠", ...state.games.map((g) => g.genre)]))}</datalist>`;
  }

  function itemListHTML(listKey, fields, title, addLabel, summary) {
    const items = state[listKey];
    return `
      <div class="list-head">
        <h2 class="section-title">${title} <span class="field__hint">${items.length}개</span></h2>
        <button class="btn btn--primary" data-action="item-add" data-list="${listKey}">${addLabel}</button>
      </div>
      ${items.length ? items.map((item, i) => {
        const s = summary(item);
        return `
        <div class="item${openItems.has(item) ? " is-open" : ""}">
          <div class="item__head" data-action="item-toggle" data-list="${listKey}" data-i="${i}">
            <span class="caret">▶</span>
            ${s.thumb !== undefined ? `<img class="item__thumb" src="${esc(s.thumb || "")}" alt="" ${s.thumb ? "" : 'style="visibility:hidden"'} />` : ""}
            <div class="item__summary"><p class="item__title">${esc(s.title || "(제목 없음)")}</p><p class="item__sub">${esc(s.sub)}</p></div>
            <div class="item__tools">
              <button class="btn btn--sm" data-action="item-up" data-list="${listKey}" data-i="${i}" ${i === 0 ? "disabled" : ""}>↑</button>
              <button class="btn btn--sm" data-action="item-down" data-list="${listKey}" data-i="${i}" ${i === items.length - 1 ? "disabled" : ""}>↓</button>
              <button class="btn btn--sm btn--danger" data-action="item-del" data-list="${listKey}" data-i="${i}">삭제</button>
            </div>
          </div>
          <div class="item__body">${fieldsHTML(fields, `${listKey}.${i}`)}</div>
        </div>`;
      }).join("") : `<p class="empty">아직 항목이 없습니다. 오른쪽 위 버튼으로 추가하세요.</p>`}`;
  }

  function render() {
    const root = $("#form-root");
    if (currentTab === "profile") {
      root.innerHTML = `<h2 class="section-title">자기소개</h2>${fieldsHTML(PROFILE_FIELDS, "profile")}
        <h2 class="section-title">하단 문구</h2>
        <div class="form-grid">${fieldHTML({ key: "footer", label: "푸터", type: "text", full: true, ph: "© 2026 이름" }, "_root")}</div>`;
    } else if (currentTab === "activities") {
      root.innerHTML = itemListHTML("activities", ACTIVITY_FIELDS, "사업PM 취업을 위해 한 활동", "+ 활동 추가",
        (a) => ({ title: a.title, sub: [a.category, a.period].filter(Boolean).join(" · ") }));
    } else if (currentTab === "games") {
      root.innerHTML = itemListHTML("games", GAME_FIELDS, "내가 플레이한 게임", "+ 게임 추가",
        (g) => ({ title: g.title, sub: [g.platform, g.genre, g.playTime].filter(Boolean).join(" · "), thumb: g.shots[0] || "" }));
    } else {
      root.innerHTML = settingsHTML();
      if (!previewMode) loadVersions();
    }
    root.insertAdjacentHTML("beforeend", datalists());
  }

  function settingsHTML() {
    return `
      <h2 class="section-title">저장 기록</h2>
      <div class="card">
        <p>저장할 때마다 기록이 남습니다(최근 30개). '불러오기'를 누르면 편집기에 그 시점 내용이 열리고, '저장'을 눌러야 사이트에 반영됩니다.</p>
        <div id="versions">${previewMode ? `<p>미리보기 모드에서는 저장 기록이 없습니다.</p>` : "불러오는 중…"}</div>
      </div>
      <h2 class="section-title">백업</h2>
      <div class="card">
        <p>전체 내용을 파일로 내려받거나, 백업 파일로 되돌릴 수 있습니다.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" data-action="export">JSON 내려받기</button>
          <label class="btn">JSON 불러오기<input type="file" accept="application/json" id="import-file" hidden /></label>
          ${previewMode ? `<button class="btn btn--danger" data-action="reset-preview">미리보기 데이터 초기화</button>` : ""}
        </div>
      </div>`;
  }

  async function loadVersions() {
    try {
      const { versions } = await api("/api/versions");
      const el = $("#versions");
      if (!el) return;
      el.innerHTML = versions.length ? versions.map((v, i) => `
        <div class="version">
          <span>${new Date(v.savedAt).toLocaleString("ko-KR")} ${i === 0 ? '<span class="badge">현재</span>' : ""}</span>
          ${i === 0 ? "" : `<button class="btn btn--sm" data-action="version-load" data-version="${esc(v.version)}">불러오기</button>`}
        </div>`).join("") : "<p>아직 저장한 적이 없습니다.</p>";
    } catch (e) {
      const el = $("#versions");
      if (el) el.textContent = e.message;
    }
  }

  /* ---------- 입력 반영 ---------- */
  $("#form-root").addEventListener("input", (e) => {
    const el = e.target;
    if (!el.dataset.path || el.type === "file") return;
    let value = el.value;
    if (el.dataset.kind === "lines") value = value.split("\n").map((s) => s.trim()).filter(Boolean);
    if (el.dataset.kind === "paras") value = value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    setPath(el.dataset.path, value);
    setDirty(true);
    // 카드 제목 실시간 갱신
    const item = el.closest(".item");
    if (item && /\.(title|category|period|platform|genre|playTime)$/.test(el.dataset.path)) {
      const [list, i] = el.dataset.path.split(".");
      const d = state[list][i];
      item.querySelector(".item__title").textContent = d.title || "(제목 없음)";
      item.querySelector(".item__sub").textContent = (list === "games"
        ? [d.platform, d.genre, d.playTime] : [d.category, d.period]).filter(Boolean).join(" · ");
    }
  });

  /* ---------- 버튼 동작 ---------- */
  $("#form-root").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn || btn.disabled) return;
    const { action, path, list } = btn.dataset;
    const i = +btn.dataset.i;
    if (action !== "item-toggle") e.preventDefault();
    if (btn.closest(".item__tools") || btn.closest(".img-item__tools")) e.stopPropagation();

    switch (action) {
      case "item-toggle": {
        if (e.target.closest(".item__tools")) return;
        const item = state[list][i];
        openItems.has(item) ? openItems.delete(item) : openItems.add(item);
        btn.parentElement.classList.toggle("is-open");
        return;
      }
      case "item-add": {
        const item = clone(list === "games" ? EMPTY_GAME : EMPTY_ACTIVITY);
        state[list].unshift(item);
        openItems.add(item);
        break;
      }
      case "item-del":
        if (!confirmTwice(btn, "정말 삭제?")) return;
        state[list].splice(i, 1);
        break;
      case "item-up": case "item-down": {
        const j = action === "item-up" ? i - 1 : i + 1;
        [state[list][i], state[list][j]] = [state[list][j], state[list][i]];
        break;
      }
      case "pair-add": {
        const arr = getPath(path) || [];
        arr.push({ [btn.dataset.a]: "", [btn.dataset.b]: "" });
        setPath(path, arr);
        break;
      }
      case "pair-del": getPath(path).splice(i, 1); break;
      case "img-clear": setPath(path, ""); break;
      case "img-del": getPath(path).splice(i, 1); break;
      case "img-first": { const arr = getPath(path); arr.unshift(arr.splice(i, 1)[0]); break; }
      case "export": return exportJSON();
      case "reset-preview":
        if (!confirmTwice(btn, "한 번 더 누르면 초기화")) return;
        store.del(PREVIEW_KEY, localStorage);
        state = normalize(clone(window.PORTFOLIO_SAMPLE));
        toast("초기화했습니다");
        setDirty(false);
        return render();
      case "version-load":
        try {
          const res = await fetch("/api/data?version=" + encodeURIComponent(btn.dataset.version), { cache: "no-store" });
          if (!res.ok) throw new Error("불러오기 실패");
          state = normalize((await res.json()).data);
          setDirty(true);
          toast("불러왔습니다. 확인 후 '저장'을 누르면 반영됩니다.");
          currentTab = "profile";
          document.querySelectorAll(".admin .tab").forEach((x) => x.classList.toggle("is-active", x.dataset.tab === "profile"));
        } catch (err) { toast(err.message, true); }
        return render();
      default: return;
    }
    setDirty(true);
    render();
  });

  /* ---------- 이미지 업로드 ---------- */
  $("#form-root").addEventListener("change", async (e) => {
    const input = e.target;
    if (input.id === "import-file") return importJSON(input.files[0]);
    if (!input.dataset.upload || !input.files.length) return;
    const box = input.closest(".img-add");
    box.classList.add("is-busy");
    const files = [...input.files];
    try {
      for (let n = 0; n < files.length; n++) {
        box.firstChild.textContent = `올리는 중… ${n + 1}/${files.length}`;
        const url = await uploadImage(files[n]);
        if (input.dataset.upload === "single") setPath(input.dataset.path, url);
        else getPath(input.dataset.path).push(url);
      }
      setDirty(true);
      toast("이미지를 올렸습니다");
    } catch (err) {
      toast(err.message, true);
    }
    render();
  });

  // 브라우저에서 이미지 줄이기 (최대 1600px, JPG) — 업로드 속도·용량 절약
  function compressImage(file, maxSize = 1600) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
      reader.onload = () => {
        if (file.type === "image/gif") {   // 움짤은 그대로
          if (file.size > 3.5 * 1024 * 1024) return reject(new Error("GIF는 3.5MB 이하만 가능합니다."));
          return resolve(reader.result);
        }
        const img = new Image();
        img.onerror = () => reject(new Error("이미지 형식을 읽을 수 없습니다."));
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", previewMode ? 0.7 : 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 올릴 수 있습니다.");
    const dataUrl = await compressImage(file, previewMode ? 960 : 1600);
    if (previewMode) return dataUrl;  // 미리보기: 브라우저 안에만 보관
    const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify({ filename: file.name, dataUrl }) });
    return url;
  }

  /* ---------- 저장 ---------- */
  function prepareForSave() {
    const d = clone(state);
    d.games.forEach((g) => { g.thumb = g.shots[0] || ""; });
    return d;
  }

  async function save() {
    const btn = $("#save");
    btn.disabled = true;
    btn.textContent = "저장 중…";
    try {
      const data = prepareForSave();
      if (previewMode) {
        if (!store.set(PREVIEW_KEY, JSON.stringify(data), localStorage)) {
          throw new Error("브라우저 저장 공간이 부족합니다. 이미지 수를 줄여주세요.");
        }
      } else {
        await api("/api/data", { method: "POST", body: JSON.stringify(data) });
      }
      setDirty(false);
      toast("저장했습니다. '사이트 보기'에서 확인하세요.");
      if (currentTab === "settings") render();
    } catch (err) {
      toast(err.message, true);
    }
    btn.disabled = false;
    btn.textContent = "저장";
  }
  $("#save").addEventListener("click", save);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s" && state) { e.preventDefault(); save(); }
  });

  /* ---------- 백업 ---------- */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(prepareForSave(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.profile) throw new Error();
        state = normalize(data);
        setDirty(true);
        toast("불러왔습니다. '저장'을 누르면 반영됩니다.");
        render();
      } catch (e) { toast("올바른 백업 파일이 아닙니다.", true); }
    };
    reader.readAsText(file);
  }

  /* ---------- 두 번 눌러 확인 (팝업 대신) ---------- */
  function confirmTwice(btn, label) {
    if (btn.dataset.armed) return true;
    const original = btn.textContent;
    btn.dataset.armed = "1";
    btn.textContent = label;
    setTimeout(() => { delete btn.dataset.armed; btn.textContent = original; }, 3000);
    return false;
  }

  /* ---------- 상태 표시 ---------- */
  function setDirty(v) {
    dirty = v;
    const s = $("#status");
    s.textContent = v ? "● 저장 안 된 변경 있음" : "저장됨";
    s.classList.toggle("is-dirty", v);
  }
  window.addEventListener("beforeunload", (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  let toastTimer;
  function toast(msg, isError = false) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("is-error", isError);
    t.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
  }

  /* ---------- 자동 로그인 (같은 탭에서 새로고침 시) ---------- */
  const savedPw = store.get("admin-pw");
  if (savedPw) { $("#login-pw").value = savedPw; $("#login-form").requestSubmit(); }
})();

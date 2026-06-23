const state = {
  homeScore: 0,
  awayScore: 0,
  homeSets: 0,
  awaySets: 0,
  setNumber: 1,
  serving: "home",
  pointsToWin: 25,
  winBy: 2,
  setsToWin: 2,
  history: [],
  lastAlert: ""
};

const $ = (id) => document.getElementById(id);
const els = {
  app: $("app"),
  matchTitle: $("matchTitle"),
  titleInput: $("titleInput"),
  homeName: $("homeName"),
  awayName: $("awayName"),
  homeScoreBtn: $("homeScoreBtn"),
  awayScoreBtn: $("awayScoreBtn"),
  homeSets: $("homeSets"),
  awaySets: $("awaySets"),
  setNumber: $("setNumber"),
  serverName: $("serverName"),
  raceTo: $("raceTo"),
  homeServe: $("homeServe"),
  awayServe: $("awayServe"),
  settingsDialog: $("settingsDialog"),
  pointsToWin: $("pointsToWin"),
  winBy: $("winBy"),
  setsToWin: $("setsToWin"),
  homeColor: $("homeColor"),
  awayColor: $("awayColor"),
  toast: $("toast"),
  homeLogoInput: $("homeLogoInput"),
  awayLogoInput: $("awayLogoInput"),
  homeLogo: $("homeLogo"),
  awayLogo: $("awayLogo"),
  homeInitial: $("homeInitial"),
  awayInitial: $("awayInitial")
};

function teamName(team) {
  return (team === "home" ? els.homeName.value : els.awayName.value).trim() || (team === "home" ? "Home" : "Visitor");
}

function otherTeam(team) {
  return team === "home" ? "away" : "home";
}

function snapshot() {
  state.history.push(JSON.stringify({
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    homeSets: state.homeSets,
    awaySets: state.awaySets,
    setNumber: state.setNumber,
    serving: state.serving,
    lastAlert: state.lastAlert
  }));
  if (state.history.length > 80) state.history.shift();
}

function toast(message, hot = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("hot", hot);
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 1700);
}

function render() {
  els.homeScoreBtn.textContent = state.homeScore;
  els.awayScoreBtn.textContent = state.awayScore;
  els.homeSets.textContent = state.homeSets;
  els.awaySets.textContent = state.awaySets;
  els.setNumber.textContent = state.setNumber;
  els.serverName.textContent = teamName(state.serving);
  els.raceTo.textContent = state.pointsToWin;

  els.homeServe.classList.toggle("active", state.serving === "home");
  els.awayServe.classList.toggle("active", state.serving === "away");
  document.querySelector(".team-panel.home").classList.toggle("server", state.serving === "home");
  document.querySelector(".team-panel.away").classList.toggle("server", state.serving === "away");

  els.homeServe.textContent = state.serving === "home" ? "● Serving" : "Serve";
  els.awayServe.textContent = state.serving === "away" ? "● Serving" : "Serve";
  els.homeInitial.textContent = teamName("home").charAt(0).toUpperCase();
  els.awayInitial.textContent = teamName("away").charAt(0).toUpperCase();
}

function scoreOf(team) {
  return state[`${team}Score`];
}

function setScore(team, value) {
  state[`${team}Score`] = Math.max(0, value);
}

function hasWonSet(team) {
  const own = scoreOf(team);
  const opp = scoreOf(otherTeam(team));
  return own >= state.pointsToWin && own - opp >= state.winBy;
}

function point(team) {
  snapshot();
  setScore(team, scoreOf(team) + 1);
  state.serving = team;
  render();
  checkMilestones(team);
}

function subtract(team) {
  if (scoreOf(team) <= 0) return;
  snapshot();
  setScore(team, scoreOf(team) - 1);
  state.lastAlert = "";
  render();
}

function checkMilestones(team) {
  const own = scoreOf(team);
  const opp = scoreOf(otherTeam(team));
  const pointNeeded = Math.max(state.pointsToWin, opp + state.winBy);

  if (hasWonSet(team)) {
    winSet(team);
    return;
  }

  if (own === pointNeeded - 1) {
    const possibleMatch = state[`${team}Sets`] === state.setsToWin - 1;
    const msg = possibleMatch ? `MATCH POINT — ${teamName(team)}!` : `SET POINT — ${teamName(team)}!`;
    if (state.lastAlert !== msg) {
      state.lastAlert = msg;
      toast(msg, true);
      pulseStatus();
    }
  }
}

function winSet(team) {
  state[`${team}Sets`] += 1;
  const wonMatch = state[`${team}Sets`] >= state.setsToWin;
  render();
  fireConfetti();
  toast(wonMatch ? `${teamName(team)} WINS THE MATCH!` : `${teamName(team)} wins Set ${state.setNumber}!`, true);

  setTimeout(() => {
    if (wonMatch) return;
    state.setNumber += 1;
    state.homeScore = 0;
    state.awayScore = 0;
    state.serving = otherTeam(team);
    state.lastAlert = "";
    render();
  }, 1200);
}

function newSet() {
  snapshot();
  state.homeScore = 0;
  state.awayScore = 0;
  state.setNumber += 1;
  state.lastAlert = "";
  render();
  toast(`Set ${state.setNumber} ready`);
}

function newMatch() {
  const ok = confirm("Start a new match? This clears scores and sets.");
  if (!ok) return;
  snapshot();
  state.homeScore = 0;
  state.awayScore = 0;
  state.homeSets = 0;
  state.awaySets = 0;
  state.setNumber = 1;
  state.serving = "home";
  state.lastAlert = "";
  render();
  toast("New match ready");
}

function undo() {
  const previous = state.history.pop();
  if (!previous) {
    toast("Nothing to undo");
    return;
  }
  Object.assign(state, JSON.parse(previous));
  render();
  toast("Undone");
}

function switchServe() {
  snapshot();
  state.serving = otherTeam(state.serving);
  render();
  toast(`${teamName(state.serving)} serving`);
}

function saveSettings() {
  state.pointsToWin = Math.max(1, Number(els.pointsToWin.value) || 25);
  state.winBy = Math.max(1, Number(els.winBy.value) || 2);
  state.setsToWin = Math.max(1, Number(els.setsToWin.value) || 2);
  els.matchTitle.textContent = els.titleInput.value.trim() || "Game Night";
  document.documentElement.style.setProperty("--home", els.homeColor.value);
  document.documentElement.style.setProperty("--away", els.awayColor.value);
  state.lastAlert = "";
  render();
  toast("Setup saved");
}

function openSettings() {
  els.titleInput.value = els.matchTitle.textContent;
  els.pointsToWin.value = state.pointsToWin;
  els.winBy.value = state.winBy;
  els.setsToWin.value = state.setsToWin;
  els.settingsDialog.showModal();
}

function handleLogo(input, img, picker) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    img.src = reader.result;
    picker.classList.add("has-logo");
  };
  reader.readAsDataURL(file);
}

function toggleFullscreen() {
  document.body.classList.toggle("fullscreen");
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function pulseStatus() {
  const strip = $("statusStrip");
  strip.animate([
    { transform: "scale(1)", filter: "brightness(1)" },
    { transform: "scale(1.035)", filter: "brightness(1.6)" },
    { transform: "scale(1)", filter: "brightness(1)" }
  ], { duration: 550, easing: "ease-out" });
}

function fireConfetti() {
  const canvas = $("confettiCanvas");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.scale(dpr, dpr);

  const colors = [els.homeColor.value, els.awayColor.value, "#ffd166", "#ffffff"];
  const pieces = Array.from({ length: 95 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 80,
    size: 5 + Math.random() * 8,
    speed: 2.2 + Math.random() * 5,
    drift: -2 + Math.random() * 4,
    spin: Math.random() * Math.PI,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  let frame = 0;
  function draw() {
    frame++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces.forEach((p) => {
      p.y += p.speed;
      p.x += p.drift;
      p.spin += 0.12;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      ctx.restore();
    });
    if (frame < 120) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  draw();
}

$("homePlus").addEventListener("click", () => point("home"));
$("awayPlus").addEventListener("click", () => point("away"));
$("homeScoreBtn").addEventListener("click", () => point("home"));
$("awayScoreBtn").addEventListener("click", () => point("away"));
$("homeMinus").addEventListener("click", () => subtract("home"));
$("awayMinus").addEventListener("click", () => subtract("away"));
$("homeServe").addEventListener("click", () => { snapshot(); state.serving = "home"; render(); });
$("awayServe").addEventListener("click", () => { snapshot(); state.serving = "away"; render(); });
$("swapServeBtn").addEventListener("click", switchServe);
$("undoBtn").addEventListener("click", undo);
$("newSetBtn").addEventListener("click", newSet);
$("newMatchBtn").addEventListener("click", newMatch);
$("settingsBtn").addEventListener("click", openSettings);
$("fullscreenBtn").addEventListener("click", toggleFullscreen);
$("saveSettingsBtn").addEventListener("click", saveSettings);
els.homeLogoInput.addEventListener("change", () => handleLogo(els.homeLogoInput, els.homeLogo, els.homeLogoInput.closest(".logo-picker")));
els.awayLogoInput.addEventListener("change", () => handleLogo(els.awayLogoInput, els.awayLogo, els.awayLogoInput.closest(".logo-picker")));
els.homeName.addEventListener("input", render);
els.awayName.addEventListener("input", render);

render();

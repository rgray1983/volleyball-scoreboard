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
  log: []
};

const $ = (id) => document.getElementById(id);

const els = {
  matchTitle: $("matchTitle"),
  titleInput: $("titleInput"),
  homeName: $("homeName"),
  awayName: $("awayName"),
  homeScore: $("homeScore"),
  awayScore: $("awayScore"),
  homeSets: $("homeSets"),
  awaySets: $("awaySets"),
  setNumber: $("setNumber"),
  homeServe: $("homeServe"),
  awayServe: $("awayServe"),
  logList: $("logList"),
  dialog: $("settingsDialog"),
  pointsToWin: $("pointsToWin"),
  winBy: $("winBy"),
  setsToWin: $("setsToWin")
};

function saveSnapshot() {
  state.history.push(JSON.stringify({
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    homeSets: state.homeSets,
    awaySets: state.awaySets,
    setNumber: state.setNumber,
    serving: state.serving,
    log: [...state.log]
  }));
  if (state.history.length > 60) state.history.shift();
}

function teamLabel(team) {
  return team === "home" ? els.homeName.value || "Home" : els.awayName.value || "Away";
}

function addLog(text) {
  const timestamp = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  state.log.unshift(`<strong>${timestamp}</strong> — ${text}`);
  state.log = state.log.slice(0, 12);
}

function render() {
  els.homeScore.textContent = state.homeScore;
  els.awayScore.textContent = state.awayScore;
  els.homeSets.textContent = state.homeSets;
  els.awaySets.textContent = state.awaySets;
  els.setNumber.textContent = state.setNumber;
  els.homeServe.classList.toggle("active", state.serving === "home");
  els.awayServe.classList.toggle("active", state.serving === "away");
  els.logList.innerHTML = state.log.map(item => `<li>${item}</li>`).join("");
}

function setServing(team) {
  saveSnapshot();
  state.serving = team;
  addLog(`${teamLabel(team)} is serving.`);
  render();
}

function point(team) {
  saveSnapshot();
  state[`${team}Score`] += 1;
  state.serving = team;
  addLog(`${teamLabel(team)} scored. ${state.homeScore}-${state.awayScore}`);
  checkSetPoint();
  render();
}

function subtract(team) {
  if (state[`${team}Score`] <= 0) return;
  saveSnapshot();
  state[`${team}Score`] -= 1;
  addLog(`Point removed from ${teamLabel(team)}.`);
  render();
}

function leadingTeam() {
  if (state.homeScore === state.awayScore) return null;
  return state.homeScore > state.awayScore ? "home" : "away";
}

function hasWonSet(team) {
  const own = state[`${team}Score`];
  const other = state[`${team === "home" ? "away" : "home"}Score`];
  return own >= state.pointsToWin && own - other >= state.winBy;
}

function checkSetPoint() {
  const leader = leadingTeam();
  if (!leader) return;
  if (hasWonSet(leader)) {
    addLog(`${teamLabel(leader)} reached set point. Tap “Award Set Winner” to confirm.`);
  }
}

function awardSetWinner() {
  const winner = leadingTeam();
  if (!winner) {
    addLog("No set winner yet — the score is tied.");
    render();
    return;
  }

  saveSnapshot();
  state[`${winner}Sets`] += 1;
  addLog(`${teamLabel(winner)} won Set ${state.setNumber}, ${state.homeScore}-${state.awayScore}.`);

  if (state[`${winner}Sets`] >= state.setsToWin) {
    addLog(`🏆 ${teamLabel(winner)} won the match!`);
  }

  state.homeScore = 0;
  state.awayScore = 0;
  state.setNumber += 1;
  state.serving = winner === "home" ? "away" : "home";
  render();
}

function resetSet() {
  saveSnapshot();
  state.homeScore = 0;
  state.awayScore = 0;
  addLog(`Set ${state.setNumber} was reset.`);
  render();
}

function newMatch() {
  if (!confirm("Start a new match and clear the current score?")) return;
  saveSnapshot();
  state.homeScore = 0;
  state.awayScore = 0;
  state.homeSets = 0;
  state.awaySets = 0;
  state.setNumber = 1;
  state.serving = "home";
  state.log = [];
  addLog("New match started.");
  render();
}

function undo() {
  const last = state.history.pop();
  if (!last) return;
  Object.assign(state, JSON.parse(last));
  render();
}

function toggleBoardMode() {
  document.body.classList.toggle("board-mode");
  if (document.body.classList.contains("board-mode") && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

function saveSettings() {
  state.pointsToWin = Number(els.pointsToWin.value) || 25;
  state.winBy = Number(els.winBy.value) || 2;
  state.setsToWin = Number(els.setsToWin.value) || 2;
  els.matchTitle.textContent = els.titleInput.value || "Game Night";
  addLog("Settings updated.");
  render();
}

$("homePlus").addEventListener("click", () => point("home"));
$("awayPlus").addEventListener("click", () => point("away"));
els.homeScore.addEventListener("click", () => point("home"));
els.awayScore.addEventListener("click", () => point("away"));
$("homeMinus").addEventListener("click", () => subtract("home"));
$("awayMinus").addEventListener("click", () => subtract("away"));
els.homeServe.addEventListener("click", () => setServing("home"));
els.awayServe.addEventListener("click", () => setServing("away"));
$("swapServeBtn").addEventListener("click", () => setServing(state.serving === "home" ? "away" : "home"));
$("setWinnerBtn").addEventListener("click", awardSetWinner);
$("resetSetBtn").addEventListener("click", resetSet);
$("newMatchBtn").addEventListener("click", newMatch);
$("undoBtn").addEventListener("click", undo);
$("fullscreenBtn").addEventListener("click", toggleBoardMode);
$("settingsBtn").addEventListener("click", () => els.dialog.showModal());
$("saveSettingsBtn").addEventListener("click", saveSettings);
$("clearLogBtn").addEventListener("click", () => { state.log = []; render(); });

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") point("home");
  if (event.key === "ArrowRight") point("away");
  if (event.key.toLowerCase() === "u") undo();
  if (event.key.toLowerCase() === "f") toggleBoardMode();
});

addLog("Ready for warmups.");
render();

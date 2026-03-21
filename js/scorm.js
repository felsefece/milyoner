let scormAPI = null;

function findAPI(win) {
  try {
    if (win.API) return win.API;
    if (win.parent && win.parent !== win) return findAPI(win.parent);
  } catch (e) {}
  return null;
}

function scormInit() {
  scormAPI = findAPI(window);
  if (scormAPI) scormAPI.LMSInitialize("");
}

function scormSetScore(score) {
  if (scormAPI) {
    scormAPI.LMSSetValue("cmi.score.raw", score);
  }
}

function scormFinish() {
  if (scormAPI) {
    scormAPI.LMSFinish("");
  }
}

window.onload = function () {
  scormInit();
};
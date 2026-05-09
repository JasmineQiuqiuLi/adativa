export const gameHTML=
`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Data Detective!</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Nunito', 'Comic Sans MS', cursive;
    background: #FFF9F0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .game {
    background: #fff;
    border-radius: 28px;
    border: 3px solid #FFD166;
    padding: 1.75rem 1.5rem;
    max-width: 460px;
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .header {
    text-align: center;
    margin-bottom: 1.25rem;
  }

  .header .big-icon { font-size: 48px; display: block; margin-bottom: 4px; }
  .header h1 { font-size: 26px; font-weight: 900; color: #2D3142; margin-bottom: 4px; }
  .header p { font-size: 14px; color: #6B7280; font-weight: 700; }

  .scorebar {
    display: flex;
    gap: 8px;
    margin-bottom: 1.1rem;
  }

  .score-box {
    flex: 1;
    background: #FFF9F0;
    border: 2px solid #FFD166;
    border-radius: 14px;
    padding: 8px 4px;
    text-align: center;
  }

  .score-box .sicon { font-size: 18px; }
  .score-box .sval { font-size: 22px; font-weight: 900; color: #2D3142; }
  .score-box .slabel { font-size: 10px; color: #9CA3AF; font-weight: 700; text-transform: uppercase; }

  .dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 1.1rem;
  }

  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #E5E7EB;
    transition: background 0.3s, transform 0.3s;
  }
  .dot.done { background: #06D6A0; }
  .dot.active { background: #FFD166; border: 2px solid #F4A300; transform: scale(1.2); }

  .card {
    background: #FFFBF5;
    border: 3px solid #E5E7EB;
    border-radius: 22px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    min-height: 155px;
    transition: border-color 0.25s, background 0.25s;
  }

  .card.flash-good { border-color: #06D6A0; background: #F0FDF4; }
  .card.flash-bad  { border-color: #EF476F; background: #FFF0F3; }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 99px;
  }

  .card-num { font-size: 12px; color: #9CA3AF; font-weight: 700; }

  .card-field { font-size: 13px; color: #6B7280; font-weight: 700; margin-bottom: 6px; }

  .card-value {
    font-size: 21px;
    font-weight: 900;
    color: #2D3142;
    font-family: 'Courier New', monospace;
    word-break: break-all;
    line-height: 1.35;
    margin-bottom: 10px;
  }

  .feedback-box {
    border-radius: 14px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.5;
    display: none;
    animation: popIn 0.3s ease-out;
  }

  .feedback-box.show { display: block; }
  .feedback-box.good { background: #DCFCE7; color: #166534; }
  .feedback-box.bad  { background: #FFE4E6; color: #9F1239; }

  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 0.75rem;
  }

  .btn {
    border: 3px solid;
    border-radius: 20px;
    padding: 1rem 0.5rem;
    font-family: 'Nunito', 'Comic Sans MS', cursive;
    font-weight: 900;
    font-size: 15px;
    cursor: pointer;
    transition: transform 0.12s, opacity 0.2s;
    text-align: center;
  }

  .btn:active { transform: scale(0.94); }
  .btn:disabled { opacity: 0.5; cursor: default; }

  .btn-good {
    background: #DCFCE7;
    border-color: #06D6A0;
    color: #166534;
  }
  .btn-good:not(:disabled):hover { background: #BBF7D0; transform: scale(1.04); }

  .btn-bad {
    background: #FFE4E6;
    border-color: #EF476F;
    color: #9F1239;
  }
  .btn-bad:not(:disabled):hover { background: #FECDD3; transform: scale(1.04); }

  .btn-icon { font-size: 32px; display: block; margin-bottom: 4px; }
  .btn-sub  { font-size: 11px; font-weight: 700; opacity: 0.7; margin-top: 2px; }

  .streak-msg {
    text-align: center;
    font-size: 14px;
    font-weight: 900;
    color: #F4A300;
    min-height: 22px;
    transition: opacity 0.4s;
  }

  /* Done screen */
  .done-screen {
    display: none;
    text-align: center;
    padding: 0.5rem 0;
    animation: popIn 0.4s ease-out;
  }

  .done-medal { font-size: 72px; display: block; margin-bottom: 8px; }
  .done-title { font-size: 24px; font-weight: 900; color: #2D3142; margin-bottom: 6px; }
  .done-sub   { font-size: 14px; color: #6B7280; font-weight: 700; margin-bottom: 1.25rem; }

  .done-stats {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .done-stat {
    background: #FFF9F0;
    border: 2px solid #FFD166;
    border-radius: 16px;
    padding: 12px 18px;
    text-align: center;
    min-width: 80px;
  }
  .done-stat .ds-icon  { font-size: 26px; }
  .done-stat .ds-val   { font-size: 24px; font-weight: 900; color: #2D3142; }
  .done-stat .ds-label { font-size: 11px; color: #9CA3AF; font-weight: 700; }

  .btn-restart {
    background: #06D6A0;
    border: 3px solid #04A07A;
    border-radius: 18px;
    padding: 13px 40px;
    font-family: 'Nunito', 'Comic Sans MS', cursive;
    font-size: 17px;
    font-weight: 900;
    color: #fff;
    cursor: pointer;
    transition: transform 0.12s;
  }
  .btn-restart:hover { transform: scale(1.06); }
  .btn-restart:active { transform: scale(0.96); }

  /* Floating stars */
  .star-pop {
    position: absolute;
    pointer-events: none;
    font-size: 24px;
    animation: flystar 0.85s ease-out forwards;
    z-index: 10;
  }

  @keyframes flystar {
    0%   { opacity: 1; transform: translate(0,0) scale(1); }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.2); }
  }

  @keyframes popIn {
    0%   { opacity: 0; transform: scale(0.75); }
    60%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes wiggle {
    0%,100% { transform: rotate(0); }
    25%     { transform: rotate(-5deg); }
    75%     { transform: rotate(5deg); }
  }

  @keyframes boing {
    0%,100% { transform: scale(1); }
    40%     { transform: scale(1.07); }
  }
</style>
</head>
<body>
<div class="game" id="game">

  <div class="header">
    <span class="big-icon">🕵️</span>
    <h1>Data Detective!</h1>
    <p>Is this data good or bad? You decide!</p>
  </div>

  <div class="scorebar">
    <div class="score-box"><div class="sicon">⭐</div><div class="sval" id="s-score">0</div><div class="slabel">Stars</div></div>
    <div class="score-box"><div class="sicon">✅</div><div class="sval" id="s-correct">0</div><div class="slabel">Right</div></div>
    <div class="score-box"><div class="sicon">❌</div><div class="sval" id="s-wrong">0</div><div class="slabel">Oops</div></div>
    <div class="score-box"><div class="sicon">🔥</div><div class="sval" id="s-streak">0</div><div class="slabel">Streak</div></div>
  </div>

  <div class="dots" id="dots"></div>

  <div id="play-area">
    <div class="card" id="card">
      <div class="card-top">
        <span class="badge" id="card-badge"></span>
        <span class="card-num" id="card-num"></span>
      </div>
      <div class="card-field" id="card-field"></div>
      <div class="card-value" id="card-value"></div>
      <div class="feedback-box" id="feedback"></div>
    </div>

    <div class="buttons">
      <button class="btn btn-good" id="btn-good" onclick="guess(true)">
        <span class="btn-icon">👍</span>
        Good Data!
        <div class="btn-sub">clean &amp; correct</div>
      </button>
      <button class="btn btn-bad" id="btn-bad" onclick="guess(false)">
        <span class="btn-icon">👎</span>
        Bad Data!
        <div class="btn-sub">broken or fake</div>
      </button>
    </div>

    <div class="streak-msg" id="streak-msg"></div>
  </div>

  <div class="done-screen" id="done-screen">
    <span class="done-medal" id="done-medal"></span>
    <div class="done-title" id="done-title"></div>
    <div class="done-sub" id="done-sub"></div>
    <div class="done-stats">
      <div class="done-stat"><div class="ds-icon">⭐</div><div class="ds-val" id="d-score"></div><div class="ds-label">Stars</div></div>
      <div class="done-stat"><div class="ds-icon">✅</div><div class="ds-val" id="d-correct"></div><div class="ds-label">Correct</div></div>
      <div class="done-stat"><div class="ds-icon">❌</div><div class="ds-val" id="d-wrong"></div><div class="ds-label">Wrong</div></div>
    </div>
    <button class="btn-restart" onclick="initGame()">Play again! 🎮</button>
  </div>

</div>

<script>
  var ALL_CARDS = [
    { emoji:"📧", badge:"Email", badgeBg:"#DBEAFE", badgeColor:"#1E40AF", title:"Email address", value:"alice@example.com", good:true, reason:"Great! It has a name, an @ sign, and a proper .com ending." },
    { emoji:"📧", badge:"Email", badgeBg:"#DBEAFE", badgeColor:"#1E40AF", title:"Email address", value:"bob@@gmail..com", good:false, reason:"Oops! Two @ signs and double dots — a real email only has one @!" },
    { emoji:"📧", badge:"Email", badgeBg:"#DBEAFE", badgeColor:"#1E40AF", title:"Email address", value:"user@", good:false, reason:"Something is missing! After the @ there needs to be a website like gmail.com." },
    { emoji:"📧", badge:"Email", badgeBg:"#DBEAFE", badgeColor:"#1E40AF", title:"Email address", value:"sara@school.edu", good:true, reason:"Perfect! A name, an @, and a proper school ending — .edu." },
    { emoji:"🎂", badge:"Age", badgeBg:"#FEF3C7", badgeColor:"#92400E", title:"Person's age", value:"9", good:true, reason:"Nine years old — that's a totally real and possible age!" },
    { emoji:"🎂", badge:"Age", badgeBg:"#FEF3C7", badgeColor:"#92400E", title:"Person's age", value:"-5", good:false, reason:"You can't be negative five years old! Ages can never be less than zero." },
    { emoji:"🎂", badge:"Age", badgeBg:"#FEF3C7", badgeColor:"#92400E", title:"Person's age", value:"999", good:false, reason:"Nobody lives to 999! This number is way too big to be a real age." },
    { emoji:"🎂", badge:"Age", badgeBg:"#FEF3C7", badgeColor:"#92400E", title:"Person's age", value:"34", good:true, reason:"34 years old — perfectly normal and possible!" },
    { emoji:"📅", badge:"Date", badgeBg:"#EDE9FE", badgeColor:"#5B21B6", title:"Birthday", value:"2012-06-15", good:true, reason:"June 15, 2012 — that's a real date that actually exists on a calendar!" },
    { emoji:"📅", badge:"Date", badgeBg:"#EDE9FE", badgeColor:"#5B21B6", title:"Birthday", value:"2024-13-45", good:false, reason:"Month 13 doesn't exist, and no month has 45 days! This date is made up." },
    { emoji:"📅", badge:"Date", badgeBg:"#EDE9FE", badgeColor:"#5B21B6", title:"Birthday", value:"2099-01-01", good:false, reason:"That's in the future! We can't have a birthday that hasn't happened yet." },
    { emoji:"📅", badge:"Date", badgeBg:"#EDE9FE", badgeColor:"#5B21B6", title:"Birthday", value:"2010-03-22", good:true, reason:"March 22, 2010 — a perfectly real birthday on the calendar!" },
    { emoji:"📱", badge:"Phone", badgeBg:"#DCFCE7", badgeColor:"#166534", title:"Phone number", value:"555-867-5309", good:true, reason:"That looks like a real phone number with the right amount of digits!" },
    { emoji:"📱", badge:"Phone", badgeBg:"#DCFCE7", badgeColor:"#166534", title:"Phone number", value:"000-000-0000", good:false, reason:"All zeros? That's a fake placeholder number, not a real one!" },
    { emoji:"📱", badge:"Phone", badgeBg:"#DCFCE7", badgeColor:"#166534", title:"Phone number", value:"12345", good:false, reason:"Too short! A phone number needs 10 digits, not just 5." },
    { emoji:"👤", badge:"Name", badgeBg:"#FCE7F3", badgeColor:"#9D174D", title:"Person's name", value:"Emma Rodriguez", good:true, reason:"A first name and a last name — looks like a real person!" },
    { emoji:"👤", badge:"Name", badgeBg:"#FCE7F3", badgeColor:"#9D174D", title:"Person's name", value:"AAAAAAAAAA", good:false, reason:"Someone just mashed the keyboard! That's definitely not a real name." },
    { emoji:"👤", badge:"Name", badgeBg:"#FCE7F3", badgeColor:"#9D174D", title:"Person's name", value:"1234 Smith", good:false, reason:"Names don't start with numbers! This data is all mixed up." },
    { emoji:"⭐", badge:"Score", badgeBg:"#FEF9C3", badgeColor:"#854D0E", title:"Game score", value:"850", good:true, reason:"850 points — a real game score that totally makes sense!" },
    { emoji:"⭐", badge:"Score", badgeBg:"#FEF9C3", badgeColor:"#854D0E", title:"Game score", value:"-200", good:false, reason:"Scores can't be negative in most games. Something went wrong here!" },
    { emoji:"🏠", badge:"ZIP code", badgeBg:"#FFEDD5", badgeColor:"#9A3412", title:"ZIP code", value:"90210", good:true, reason:"Five digits — that's exactly what a US ZIP code looks like!" },
    { emoji:"🏠", badge:"ZIP code", badgeBg:"#FFEDD5", badgeColor:"#9A3412", title:"ZIP code", value:"ABCDE", good:false, reason:"ZIP codes are made of numbers, not letters!" },
  ];

  var TOTAL = 5;
  var STARS_POP = ["⭐","🌟","✨","💫"];

  var deck, idx, score, correct, wrong, streak, locked;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function sendResult(payload) {
  window.parent.postMessage({
    type: "GAME_RESULT",
    payload
  }, "*");
  }

  function initGame() {
    deck = shuffle(ALL_CARDS).slice(0, TOTAL);
    idx = 0; score = 0; correct = 0; wrong = 0; streak = 0; locked = false;
    document.getElementById("done-screen").style.display = "none";
    document.getElementById("play-area").style.display = "block";
    updateStats();
    buildDots();
    renderCard();
    document.getElementById("streak-msg").textContent = "";
    document.getElementById("feedback").className = "feedback-box";
    document.getElementById("feedback").textContent = "";
  }

  function buildDots() {
    var el = document.getElementById("dots");
    el.innerHTML = "";
    for (var i = 0; i < TOTAL; i++) {
      var d = document.createElement("div");
      d.className = "dot" + (i === 0 ? " active" : "");
      d.id = "dot-" + i;
      el.appendChild(d);
    }
  }

  function updateDots() {
    for (var i = 0; i < TOTAL; i++) {
      var d = document.getElementById("dot-" + i);
      if (!d) continue;
      d.className = "dot" + (i < idx ? " done" : i === idx && !locked ? " active" : "");
    }
  }

  function renderCard() {
    var c = deck[idx];
    var card = document.getElementById("card");
    card.className = "card";
    var badge = document.getElementById("card-badge");
    badge.textContent = c.emoji + " " + c.badge;
    badge.style.background = c.badgeBg;
    badge.style.color = c.badgeColor;
    document.getElementById("card-num").textContent = (idx + 1) + " of " + TOTAL;
    document.getElementById("card-field").textContent = c.title;
    document.getElementById("card-value").textContent = c.value;
    document.getElementById("feedback").className = "feedback-box";
    document.getElementById("feedback").textContent = "";
    document.getElementById("btn-good").disabled = false;
    document.getElementById("btn-bad").disabled = false;
  }

  function updateStats() {
    document.getElementById("s-score").textContent = score;
    document.getElementById("s-correct").textContent = correct;
    document.getElementById("s-wrong").textContent = wrong;
    document.getElementById("s-streak").textContent = streak;
  }

  function spawnStars() {
    var game = document.getElementById("game");
    var rect = game.getBoundingClientRect();
    for (var i = 0; i < 6; i++) {
      (function() {
        var s = document.createElement("div");
        s.className = "star-pop";
        s.textContent = STARS_POP[Math.floor(Math.random() * STARS_POP.length)];
        var x = 20 + Math.random() * 60;
        var y = 30 + Math.random() * 40;
        var dx = (Math.random() - 0.5) * 130;
        var dy = -(50 + Math.random() * 80);
        s.style.left = x + "%";
        s.style.top = y + "%";
        s.style.setProperty("--dx", dx + "px");
        s.style.setProperty("--dy", dy + "px");
        game.appendChild(s);
        setTimeout(function() { s.remove(); }, 900);
      })();
    }
  }

  function guess(isGood) {
    if (locked) return;
    locked = true;

    var c = deck[idx];
    var isCorrect = c.good === isGood;
    var card = document.getElementById("card");
    var fb = document.getElementById("feedback");

    document.getElementById("btn-good").disabled = true;
    document.getElementById("btn-bad").disabled = true;

    if (isCorrect) {
      streak++;
      correct++;
      score += streak >= 3 ? 20 : 10;
      card.className = "card flash-good";
      card.style.animation = "boing 0.35s ease-out";
      fb.className = "feedback-box good show";
      fb.textContent = "🎉 " + c.reason;
      spawnStars();
      var sm = document.getElementById("streak-msg");
      if (streak >= 3) {
        sm.textContent = "🔥 " + streak + " in a row! Amazing!";
      } else {
        sm.textContent = "";
      }
    } else {
      streak = 0;
      wrong++;
      score = Math.max(0, score - 5);
      card.className = "card flash-bad";
      card.style.animation = "wiggle 0.4s ease-out";
      fb.className = "feedback-box bad show";
      fb.textContent = "😅 " + c.reason;
      document.getElementById("streak-msg").textContent = "";
    }

    updateStats();
    updateDots();

    setTimeout(function() {
      card.style.animation = "";
      idx++;
      if (idx >= TOTAL) {
        showDone();
      } else {
        locked = false;
        renderCard();
        updateDots();
      }
    }, 2100);
  }

  function showDone() {
    document.getElementById("play-area").style.display = "none";
    var pct = Math.round((correct / TOTAL) * 100);
    var medal = pct >= 80 ? "🏆" : pct >= 60 ? "🥇" : pct >= 40 ? "🥈" : "🥉";
    var title = pct >= 80 ? "You're a Data Detective!" : pct >= 60 ? "Great job, Detective!" : pct >= 40 ? "Nice try, keep going!" : "Practice makes perfect!";
    document.getElementById("done-medal").textContent = medal;
    document.getElementById("done-title").textContent = title;
    document.getElementById("done-sub").textContent = "You got " + correct + " out of " + TOTAL + " right — " + pct + "%!";
    document.getElementById("d-score").textContent = score;
    document.getElementById("d-correct").textContent = correct;
    document.getElementById("d-wrong").textContent = wrong;
    document.getElementById("done-screen").style.display = "block";
    for (var i = 0; i < TOTAL; i++) {
      var d = document.getElementById("dot-" + i);
      if (d) d.className = "dot done";
    }
    var scoreNormalized = correct / TOTAL;

    sendResult({
      score: scoreNormalized,
      is_correct: scoreNormalized >= 0.8,
      metadata: {
        total: TOTAL,
        correct: correct,
        wrong: wrong,
        raw_score: score
      }
    });
  }

  initGame();
</script>
</body>
</html>
`
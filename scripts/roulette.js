(function () {
  "use strict";

  const numbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  const TAU = Math.PI * 2;
  const arc = TAU / numbers.length;

  const canvas = document.getElementById("roulette-canvas");
  const context = canvas.getContext("2d");
  const spinButton = document.getElementById("spin");
  const resetButton = document.getElementById("reset");
  const resultNumber = document.getElementById("result-number");
  const resultText = document.getElementById("result");
  const spinCount = document.getElementById("spin-count");
  const historyNode = document.getElementById("history");
  const phaseNode = document.getElementById("phase");
  const tensionBar = document.getElementById("tension-bar");

  let size = 600;
  let rotation = 0;
  let highlightedIndex = -1;
  let spinning = false;
  let spins = 0;
  let history = [];

  function setSpinButtonLabel(label) {
    const labelNode = spinButton.querySelector(".spin-label");
    if (labelNode) labelNode.textContent = label;
  }

  function colorName(number) {
    if (number === 0) return "green";
    return number % 2 === 1 ? "red" : "black";
  }

  function colorHex(number) {
    const color = colorName(number);
    if (color === "green") return "#087454";
    if (color === "red") return "#b61726";
    return "#111318";
  }

  function drawWheel(angle, highlight, ballAngle = null) {
    const center = size / 2;
    const outer = size * 0.47;
    const inner = size * 0.275;
    const labelRadius = size * 0.375;
    context.clearRect(0, 0, size, size);

    context.save();
    context.translate(center, center);
    const rim = context.createRadialGradient(0, 0, inner, 0, 0, outer * 1.08);
    rim.addColorStop(0, "#111111");
    rim.addColorStop(.76, "#ad8435");
    rim.addColorStop(.9, "#f3dda2");
    rim.addColorStop(1, "#4d3512");
    context.beginPath();
    context.arc(0, 0, outer * 1.055, 0, TAU);
    context.fillStyle = rim;
    context.fill();

    numbers.forEach((number, index) => {
      const centerAngle = -Math.PI / 2 + angle + index * arc;
      const start = centerAngle - arc / 2;
      const end = centerAngle + arc / 2;
      context.beginPath();
      context.arc(0, 0, outer, start, end);
      context.arc(0, 0, inner, end, start, true);
      context.closePath();
      context.fillStyle = colorHex(number);
      context.fill();
      context.lineWidth = index === highlight ? Math.max(3, size * .009) : Math.max(1, size * .002);
      context.strokeStyle = index === highlight ? "#fff0b4" : "rgba(255,255,255,.28)";
      context.stroke();

      context.save();
      context.rotate(centerAngle + Math.PI / 2);
      context.translate(0, -labelRadius);
      context.fillStyle = "#fff";
      context.font = `900 ${Math.max(10, size * .031)}px Georgia, serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "rgba(0,0,0,.75)";
      context.shadowBlur = 4;
      context.fillText(String(number), 0, 0);
      context.restore();
    });

    context.beginPath();
    context.arc(0, 0, inner * .96, 0, TAU);
    context.fillStyle = "#0b0b0b";
    context.fill();
    context.lineWidth = size * .012;
    context.strokeStyle = "#c99d45";
    context.stroke();

    for (let spoke = 0; spoke < 8; spoke += 1) {
      context.save();
      context.rotate(spoke * TAU / 8);
      context.fillStyle = spoke % 2 ? "#18100f" : "#2a1516";
      context.beginPath();
      context.moveTo(-size * .018, 0);
      context.lineTo(-size * .055, -inner * .83);
      context.lineTo(size * .055, -inner * .83);
      context.lineTo(size * .018, 0);
      context.closePath();
      context.fill();
      context.restore();
    }

    context.beginPath();
    context.arc(0, 0, size * .09, 0, TAU);
    context.fillStyle = "#c89b45";
    context.fill();
    context.beginPath();
    context.arc(0, 0, size * .065, 0, TAU);
    context.fillStyle = "#090909";
    context.fill();
    context.fillStyle = "#efe3c4";
    context.font = `italic 1000 ${Math.max(11, size * .029)}px Impact, Arial Black, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "#b61726";
    context.shadowBlur = size * .012;
    context.fillText("1-5", 0, 0);

    if (Number.isFinite(ballAngle)) {
      const ballRadius = outer * .92;
      const ballX = Math.cos(ballAngle) * ballRadius;
      const ballY = Math.sin(ballAngle) * ballRadius;
      context.save();
      context.shadowColor = "rgba(0,0,0,.8)";
      context.shadowBlur = size * .018;
      context.shadowOffsetY = size * .008;
      context.beginPath();
      context.arc(ballX, ballY, Math.max(6, size * .018), 0, TAU);
      const ballGradient = context.createRadialGradient(
        ballX - size * .006,
        ballY - size * .008,
        1,
        ballX,
        ballY,
        size * .02
      );
      ballGradient.addColorStop(0, "#ffffff");
      ballGradient.addColorStop(.65, "#efe6cc");
      ballGradient.addColorStop(1, "#9e9278");
      context.fillStyle = ballGradient;
      context.fill();
      context.restore();
    }
    context.restore();
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    size = Math.max(320, Math.round(bounds.width));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawWheel(rotation, highlightedIndex, highlightedIndex >= 0 ? -Math.PI / 2 : null);
  }

  function updateHistory() {
    historyNode.replaceChildren(...history.map((number) => {
      const item = document.createElement("span");
      item.className = `history-ball ${colorName(number)}`;
      item.textContent = String(number);
      return item;
    }));
  }

  function finishSpin(index) {
    const number = numbers[index];
    const color = colorName(number);
    highlightedIndex = index;
    spins += 1;
    history = [number, ...history].slice(0, 7);
    resultNumber.textContent = String(number);
    resultNumber.className = `result-number ${color}`;
    if (number === 0) {
      resultText.textContent = "0 — ZERO / GREEN";
    } else {
      const colorLabel = color === "red" ? "RED" : "BLACK";
      const parityLabel = number % 2 === 1 ? "ODD" : "EVEN";
      resultText.textContent = `${number} — ${colorLabel} / ${parityLabel}`;
    }
    spinCount.textContent = `SPIN ${spins}`;
    phaseNode.textContent = "RESULT — PAYOUT";
    phaseNode.className = "roulette-phase";
    updateHistory();
    drawWheel(rotation, highlightedIndex, -Math.PI / 2);
    tensionBar.style.width = "100%";
    document.body.classList.remove("is-spinning");
    spinning = false;
    spinButton.disabled = false;
    setSpinButtonLabel("次の運命を回す");
    spinButton.focus({ preventScroll: true });
  }

  function spin() {
    if (spinning) return;
    FestivalGames.enterKioskFullscreen();
    spinning = true;
    document.body.classList.add("is-spinning");
    highlightedIndex = -1;
    spinButton.disabled = true;
    setSpinButtonLabel("回転中… 目を離すな");
    resultNumber.textContent = "—";
    resultNumber.className = "result-number";
    resultText.textContent = "開始後はチップを動かさない";
    phaseNode.textContent = "NO MORE BETS / ベット終了";
    phaseNode.className = "roulette-phase closed";

    const selectedIndex = FestivalGames.randomInt(numbers.length);
    const normalized = ((rotation % TAU) + TAU) % TAU;
    const target = (TAU - selectedIndex * arc) % TAU;
    const delta = (target - normalized + TAU) % TAU;
    const start = rotation;
    const end = rotation + TAU * 28 + delta;
    const ballStart = -Math.PI / 2;
    const ballEnd = ballStart - TAU * 48;
    const duration = 25000;
    const startedAt = performance.now();
    let phaseLabel = "";

    function showPhase(label, closed = true) {
      if (phaseLabel === label) return;
      phaseLabel = label;
      phaseNode.textContent = label;
      phaseNode.className = `roulette-phase${closed ? " closed" : ""}`;
      resultText.textContent = label;
    }

    function animate(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const wheelEase = 1 - Math.pow(1 - progress, 3.8);
      const ballEase = 1 - Math.pow(1 - progress, 2.7);
      rotation = start + (end - start) * wheelEase;
      const ballAngle = ballStart + (ballEnd - ballStart) * ballEase;
      tensionBar.style.width = `${Math.round(progress * 100)}%`;

      if (progress < .08) showPhase("NO MORE BETS / チップを動かさない");
      else if (progress < .55) showPhase("運命は回り始めた");
      else if (progress < .72) showPhase("ざわ… ざわ…");
      else if (progress < .82) showPhase("ボールが落ちる…");
      else if (progress < .89) showPhase("決着まで — 3");
      else if (progress < .94) showPhase("決着まで — 2");
      else if (progress < .985) showPhase("決着まで — 1");
      else showPhase("決着…！", false);

      drawWheel(rotation, -1, ballAngle);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        rotation = end;
        finishSpin(selectedIndex);
      }
    }
    requestAnimationFrame(animate);
  }

  function reset() {
    if (spinning) return;
    spins = 0;
    history = [];
    highlightedIndex = -1;
    document.body.classList.remove("is-spinning");
    tensionBar.style.width = "0%";
    resultNumber.textContent = "—";
    resultNumber.className = "result-number";
    resultText.textContent = "ベット受付中";
    spinCount.textContent = "SPIN 0";
    phaseNode.textContent = "BETTING OPEN / ベット受付中";
    phaseNode.className = "roulette-phase";
    setSpinButtonLabel("運命を回す");
    updateHistory();
    drawWheel(rotation, highlightedIndex);
  }

  spinButton.addEventListener("click", spin);
  resetButton.addEventListener("click", reset);
  document.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.code === "Numpad5" || event.code === "NumpadEnter" || event.key === "5" || event.key === "Enter") {
      event.preventDefault();
      spin();
    }
  });
  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }
  FestivalGames.setupShell();
  requestAnimationFrame(resize);
})();


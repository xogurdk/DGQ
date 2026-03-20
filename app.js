// =============================================
// GAS 백엔드 웹앱 URL을 여기에 입력하세요.
// =============================================
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzgdGCvl7kDeG4o58WS7x7zCVP9M0MAvqUUJvLjEc2lRvxnRaeH63c4Em83uS1vHc3ZWA/exec";

// =============================================
// DOM 참조
// =============================================
const canvas = document.getElementById('geometryCanvas');
const ctx = canvas.getContext('2d');

const screens = {
    start:   document.getElementById('start-section'),
    ranking: document.getElementById('ranking-section'),
    manager: document.getElementById('manager-section'),
    game:    document.getElementById('game-section'),
    result:  document.getElementById('result-section')
};
const tabs = {
    start:   document.getElementById('tab-start'),
    ranking: document.getElementById('tab-ranking'),
    manager: document.getElementById('tab-manager'),
    nav:     document.getElementById('tab-nav')
};
const els = {
    date:         document.getElementById('date-display'),
    headerName:   document.getElementById('header-name'),
    username:     document.getElementById('username-input'),
    score:        document.getElementById('score'),
    count:        document.getElementById('current-count'),
    progress:     document.getElementById('progress-bar'),
    feedback:     document.getElementById('feedback'),
    nextBtn:      document.getElementById('next-btn'),
    hintBox:      document.getElementById('hint-box'),
    hintText:     document.getElementById('hint-text'),
    questionText: document.getElementById('question-text'),
    inputArea:    document.getElementById('input-area'),
    oxArea:       document.getElementById('ox-area'),
    ansInput:     document.getElementById('answer-input'),
    gameMode:     document.getElementById('game-mode'),
    shapeMode:    document.getElementById('shape-mode')
};

// =============================================
// 게임 상태
// =============================================
let state = {
    score: 0,
    problemCount: 1,
    maxProblems: 15,
    playerName: "",
    currentProblem: {},
    gameActive: false,
    attempts: 0
};

// 오늘 날짜 표시
const today = new Date();
els.date.innerText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

// =============================================
// 탭 / 화면 전환
// =============================================
function switchTab(tab) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    Object.values(tabs).forEach(t => {
        if (t && t.id !== 'tab-nav') {
            t.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600');
            t.classList.add('text-gray-500');
        }
    });

    screens[tab].classList.remove('hidden');
    tabs[tab].classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600');
    tabs[tab].classList.remove('text-gray-500');

    if (tab === 'ranking') {
        document.getElementById('loading-spinner').classList.remove('hidden');
        document.getElementById('podium-area').classList.add('hidden');
        document.getElementById('ranking-list-body').innerHTML = '';

        fetch(GAS_API_URL + '?action=getRanking')
            .then(r => r.json())
            .then(updateRankingUI)
            .catch(() => {
                document.getElementById('loading-spinner').classList.add('hidden');
                document.getElementById('ranking-list-body').innerHTML =
                    '<tr><td colspan="3" class="px-4 py-8 text-center text-red-400">랭킹을 불러오지 못했습니다.</td></tr>';
            });

    } else if (tab === 'manager') {
        document.getElementById('manager-loading').classList.remove('hidden');
        document.getElementById('manager-list-body').innerHTML = '';

        fetch(GAS_API_URL + '?action=getStatus')
            .then(r => r.json())
            .then(updateManagerUI)
            .catch(() => {
                document.getElementById('manager-loading').classList.add('hidden');
                document.getElementById('manager-list-body').innerHTML =
                    '<tr><td colspan="3" class="px-4 py-8 text-center text-red-400">데이터를 불러오지 못했습니다.</td></tr>';
            });
    }
}

// =============================================
// 랭킹 UI 업데이트
// =============================================
function updateRankingUI(list) {
    document.getElementById('loading-spinner').classList.add('hidden');
    document.getElementById('podium-area').classList.remove('hidden');

    ['1', '2', '3'].forEach(r => {
        document.getElementById(`rank-${r}-name`).innerText = '-';
        document.getElementById(`rank-${r}-score`).innerText = '0';
    });
    if (list[0]) { document.getElementById('rank-1-name').innerText = list[0].name; document.getElementById('rank-1-score').innerText = list[0].score; }
    if (list[1]) { document.getElementById('rank-2-name').innerText = list[1].name; document.getElementById('rank-2-score').innerText = list[1].score; }
    if (list[2]) { document.getElementById('rank-3-name').innerText = list[2].name; document.getElementById('rank-3-score').innerText = list[2].score; }

    const tbody = document.getElementById('ranking-list-body');
    tbody.innerHTML = '';
    list.slice(3).forEach((item, idx) => {
        tbody.innerHTML += `<tr class="bg-white border-b hover:bg-gray-50">
            <td class="px-4 py-3 text-center text-gray-500">${idx + 4}</td>
            <td class="px-4 py-3 font-medium text-gray-900">${item.name}</td>
            <td class="px-4 py-3 text-right font-bold text-indigo-600">${item.score}</td>
        </tr>`;
    });
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">도전자가 없습니다.</td></tr>';
    }
}

// =============================================
// 현황 UI 업데이트
// =============================================
function updateManagerUI(list) {
    document.getElementById('manager-loading').classList.add('hidden');
    const tbody = document.getElementById('manager-list-body');
    tbody.innerHTML = '';

    let todayCount = 0;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">등록된 학생 기록이 없습니다.</td></tr>';
    } else {
        list.forEach(item => {
            if (item.isToday) todayCount++;
            const statusTag  = item.isToday ? `<span class="status-o">O</span>` : `<span class="status-x">X</span>`;
            const timeColor  = item.isToday ? 'text-indigo-600 font-bold' : 'text-gray-400';
            tbody.innerHTML += `
                <tr class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">${item.name}</td>
                    <td class="px-4 py-3 text-center">${statusTag}</td>
                    <td class="px-4 py-3 text-right text-xs ${timeColor}">${item.lastTime}</td>
                </tr>`;
        });
    }
    document.getElementById('today-count').innerText = `오늘 참여: ${todayCount}명`;
}

// =============================================
// 게임 시작 / 종료
// =============================================
function startGame() {
    const name = els.username.value.trim();
    if (!name) { alert("이름을 입력해주세요!"); return; }

    state.playerName = name;
    state.score = 0;
    state.problemCount = 1;
    state.gameActive = true;

    els.headerName.innerText = `${name}의 도전`;
    document.getElementById('result-name').innerText = name;

    Object.values(screens).forEach(s => s.classList.add('hidden'));
    tabs.nav.classList.add('hidden');
    screens.game.classList.remove('hidden');
    generateProblem();
}

function handleStartEnter(e) { if (e.key === "Enter") startGame(); }

function finishGame() {
    state.gameActive = false;
    screens.game.classList.add('hidden');
    screens.result.classList.remove('hidden');
    document.getElementById('final-score').innerText = state.score;

    fetch(GAS_API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'saveScore', name: state.playerName, score: state.score })
    })
        .then(r => r.json())
        .then(res => {
            const el = document.getElementById('save-status');
            if (res.success) {
                el.innerText = "✅ 점수 저축 완료!";
                el.className = "text-xs text-green-500 mt-2 font-bold";
                document.getElementById('total-score-display').innerText = res.total;
            } else {
                el.innerText = "❌ 오류 발생";
                el.className = "text-xs text-red-500 mt-2 font-bold";
            }
        })
        .catch(() => {
            const el = document.getElementById('save-status');
            el.innerText = "❌ 서버 연결 실패";
            el.className = "text-xs text-red-500 mt-2 font-bold";
        });
}

function goToRanking() {
    screens.result.classList.add('hidden');
    tabs.nav.classList.remove('hidden');
    switchTab('ranking');
}

// =============================================
// 문제 생성
// =============================================
function resetAndGenerate() { generateProblem(); }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateProblem() {
    if (state.problemCount > state.maxProblems) { finishGame(); return; }

    state.attempts = 0;
    els.count.innerText = state.problemCount;
    els.progress.style.width = `${((state.problemCount - 1) / state.maxProblems) * 100}%`;

    els.ansInput.value = '';
    els.feedback.innerText = '';
    els.nextBtn.classList.add('hidden');
    els.hintBox.classList.add('hidden');
    els.ansInput.disabled = false;
    els.oxArea.querySelectorAll('button').forEach(b => { b.disabled = false; b.classList.remove('opacity-50'); });

    const mode = els.gameMode.value;
    let action = mode === 'all'
        ? (Math.random() < 0.33 ? 'elements' : (Math.random() < 0.5 ? 'concept' : 'reverse'))
        : mode;

    if      (action === 'elements') generateElements();
    else if (action === 'concept')  generateConceptOX();
    else                            generateReverse();
}

function generateElements() {
    setUiMode('input');

    const shapeMode = els.shapeMode.value;
    let isPrism = Math.random() < 0.5;
    if (shapeMode === 'prism')   isPrism = true;
    if (shapeMode === 'pyramid') isPrism = false;

    const n = getRandomInt(3, 8);
    const qType = getRandomInt(0, 2);

    const shapeNames = ["", "", "", "삼", "사", "오", "육", "칠", "팔"];
    const shapeName  = `${shapeNames[n]}각${isPrism ? '기둥' : '뿔'}`;
    const properties = ["면", "모서리", "꼭짓점"];
    const propName   = properties[qType];

    draw3DShape(n, isPrism);

    let ans = 0, hint = "";
    if (isPrism) {
        if      (qType === 0) { ans = n + 2;    hint = `위아래 밑면 2개 + 옆면 ${n}개`; }
        else if (qType === 1) { ans = n * 3;    hint = `화면 속 모서리를 세어보거나, (밑면의 변의 수 × 3)을 해보세요!`; }
        else                  { ans = n * 2;    hint = `위에 ${n}개, 아래에 ${n}개 있어요!`; }
    } else {
        if      (qType === 0) { ans = n + 1;    hint = `바닥의 밑면 1개 + 옆면 ${n}개`; }
        else if (qType === 1) { ans = n * 2;    hint = `화면 속 모서리를 세어보거나, (밑면의 변의 수 × 2)를 해보세요!`; }
        else                  { ans = n + 1;    hint = `바닥에 꼭짓점 ${n}개, 맨 위에 각뿔의 꼭짓점 1개`; }
    }

    els.questionText.innerHTML = `위 <span class="text-indigo-600 font-bold">${shapeName}</span>의 <span class="text-red-600 border-b-2 border-red-400">${propName}의 수</span>는 몇 개일까요?`;
    els.hintText.innerText = hint;
    state.currentProblem = { ans, type: 'input' };
}

function generateConceptOX() {
    setUiMode('ox');

    const shapeMode = els.shapeMode.value;
    let isPrism = Math.random() < 0.5;
    if (shapeMode === 'prism')   isPrism = true;
    if (shapeMode === 'pyramid') isPrism = false;

    const n = getRandomInt(3, 8);
    const shapeNames = ["", "", "", "삼", "사", "오", "육", "칠", "팔"];
    const name = `${shapeNames[n]}각${isPrism ? '기둥' : '뿔'}`;

    draw3DShape(n, isPrism);

    let qList = [];
    if (isPrism) {
        qList.push({ q: `위 도형의 두 밑면은 서로 평행하고 합동입니다.`,                         ans: "O", hint: "각기둥은 위아래의 면이 평행하고 똑같이 생겼어요." });
        qList.push({ q: `위 도형의 옆면은 모두 삼각형입니다.`,                                   ans: "X", hint: "각기둥의 옆면은 직사각형입니다." });
        qList.push({ q: `위 도형의 이름은 '${name}'입니다.`,                                     ans: "O", hint: `밑면의 모양이 ${n}각형인지 화면을 보고 세어보세요.` });
        qList.push({ q: `위 도형은 밑면이 1개입니다.`,                                           ans: "X", hint: "각기둥은 밑면이 위아래로 2개 존재합니다." });
    } else {
        qList.push({ q: `위 도형의 옆면은 모두 직사각형입니다.`,                                 ans: "X", hint: "뾰족하게 모이는 도형의 옆면은 삼각형이에요." });
        qList.push({ q: `위 도형의 밑면은 1개입니다.`,                                           ans: "O", hint: "각뿔은 바닥에 닿는 면이 1개뿐이에요." });
        qList.push({ q: `위 도형의 이름은 '${name}'입니다.`,                                     ans: "O", hint: `바닥에 있는 밑면이 ${n}각형인지 세어보세요.` });
        qList.push({ q: `위 도형에서 옆면이 모두 만나는 점을 '각뿔의 꼭짓점'이라고 합니다.`,   ans: "O", hint: "맨 위에 있는 뾰족한 점의 수학적 이름이에요." });
    }

    const qObj = qList[getRandomInt(0, qList.length - 1)];
    els.questionText.innerHTML = `설명이 맞으면 O, 틀리면 X를 고르세요.<br><br><span class="text-indigo-600 font-bold">"${qObj.q}"</span>`;
    els.hintText.innerText = qObj.hint;
    state.currentProblem = { ans: qObj.ans, type: 'OX' };
}

function generateReverse() {
    setUiMode('input');

    const shapeMode = els.shapeMode.value;
    let isPrism = Math.random() < 0.5;
    if (shapeMode === 'prism')   isPrism = true;
    if (shapeMode === 'pyramid') isPrism = false;

    const n = getRandomInt(4, 10);
    const qType = getRandomInt(0, 2);

    const properties = ["면", "모서리", "꼭짓점"];
    const propName   = properties[qType];

    let givenNum = 0, hint = "";
    if (isPrism) {
        if      (qType === 0) { givenNum = n + 2; hint = "(전체 면의 수 - 2) = 밑면의 변의 수"; }
        else if (qType === 1) { givenNum = n * 3; hint = "(전체 모서리 수 ÷ 3) = 밑면의 변의 수"; }
        else                  { givenNum = n * 2; hint = "(전체 꼭짓점 수 ÷ 2) = 밑면의 변의 수"; }
    } else {
        if      (qType === 0) { givenNum = n + 1; hint = "(전체 면의 수 - 1) = 밑면의 변의 수"; }
        else if (qType === 1) { givenNum = n * 2; hint = "(전체 모서리 수 ÷ 2) = 밑면의 변의 수"; }
        else                  { givenNum = n + 1; hint = "(전체 꼭짓점 수 - 1) = 밑면의 변의 수"; }
    }

    drawCanvasIcon('❓', '무엇일까요?');
    els.questionText.innerHTML = `<span class="text-red-600 border-b-2 border-red-400">${propName}의 수가 ${givenNum}개</span>인 <span class="text-indigo-600 font-bold">${isPrism ? '각기둥' : '각뿔'}</span>이 있습니다. <br>이 도형의 밑면은 몇 각형일까요?`;
    els.hintText.innerText = hint;
    state.currentProblem = { ans: n, type: 'input' };
}

// =============================================
// 정답 확인
// =============================================
function setUiMode(mode) {
    if (mode === 'ox') {
        els.inputArea.classList.add('hidden');
        els.inputArea.classList.remove('flex');
        els.oxArea.classList.remove('hidden');
        els.oxArea.classList.add('flex');
    } else {
        els.inputArea.classList.remove('hidden');
        els.inputArea.classList.add('flex');
        els.oxArea.classList.add('hidden');
        els.oxArea.classList.remove('flex');
        els.ansInput.focus();
    }
}

function checkAnswer(choice) {
    if (!els.nextBtn.classList.contains('hidden')) return;

    let correct = false;
    let uAns = choice;

    if (state.currentProblem.type !== 'OX') {
        uAns = Number(els.ansInput.value);
        if (isNaN(uAns) || els.ansInput.value === '') { alert("숫자를 입력해주세요!"); return; }
    }

    if (uAns === state.currentProblem.ans) correct = true;

    if (correct) {
        // 오답 페널티 로직: 첫 시도 10점, 두 번째 시도 5점
        const points = state.attempts === 0 ? 10 : 5;
        state.score += points;
        els.score.innerText = state.score;

        if (state.attempts === 0) {
            els.feedback.innerHTML = `<span class='text-green-600 animate-bounce font-bold'>🎉 훌륭해요! 정답입니다. (+${points}점)</span>`;
        } else {
            els.feedback.innerHTML = `<span class='text-blue-600 animate-bounce font-bold'>👍 포기하지 않고 맞췄어요! (+${points}점)</span>`;
        }

        fireConfetti();
        endProblem();
    } else {
        state.attempts++;
        if (state.attempts >= 2) {
            els.feedback.innerHTML = `<span class='text-red-600 font-bold'>아쉽네요. 정답은 ${state.currentProblem.ans}입니다! (+0점)</span>`;
            endProblem();
        } else {
            els.feedback.innerHTML = "<span class='text-red-500'>😅 틀려도 괜찮아요! 힌트를 보고 다시 도전해보세요.</span>";
            els.hintBox.classList.remove('hidden');
            els.ansInput.value = '';
        }
    }
}

function endProblem() {
    els.nextBtn.classList.remove('hidden');
    els.ansInput.disabled = true;
    els.oxArea.querySelectorAll('button').forEach(b => b.disabled = true);
}

function nextProblem() {
    state.problemCount++;
    generateProblem();
}

// =============================================
// 3D 겨냥도 렌더링
// =============================================
function draw3DShape(n, isPrism) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + (isPrism ? 0 : 20); // 각뿔은 아래로 살짝 내림
    const r  = 40 + (n * 2.5);
    const h  = 100;

    const hue        = Math.floor(Math.random() * 360);
    const colorSolid = `hsl(${hue}, 70%, 40%)`;
    const colorFill  = `hsla(${hue}, 70%, 60%, 0.15)`;
    const colorDash  = `hsla(${hue}, 70%, 40%, 0.6)`;

    const bottomPts = [];
    const topPts    = [];
    const angles    = [];

    let minX = Infinity, maxX = -Infinity;
    let L = 0, R = 0;

    const offset = Math.PI / 2 + 0.3;

    for (let i = 0; i < n; i++) {
        const angle = offset + (i * 2 * Math.PI / n);
        angles.push(angle);
        const x       = cx + r * Math.cos(angle);
        const yBottom = cy + r * 0.3 * Math.sin(angle) + h / 2;
        const yTop    = cy + r * 0.3 * Math.sin(angle) - h / 2;

        bottomPts.push({ x, y: yBottom });
        topPts.push({ x, y: yTop });

        if (x < minX) { minX = x; L = i; }
        if (x > maxX) { maxX = x; R = i; }
    }
    const apex = { x: cx, y: cy - h / 2 - 20 };

    ctx.lineWidth  = 2.5;
    ctx.lineJoin   = 'round';
    ctx.lineCap    = 'round';

    // 1. 뒤쪽 보이지 않는 선 (점선)
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colorDash;
    ctx.beginPath();

    for (let i = 0; i < n; i++) {
        const nxt  = (i + 1) % n;
        const midZ = Math.sin(angles[i]) + Math.sin(angles[nxt]);
        if (midZ < -0.001) {
            ctx.moveTo(bottomPts[i].x, bottomPts[i].y);
            ctx.lineTo(bottomPts[nxt].x, bottomPts[nxt].y);
        }
    }
    for (let i = 0; i < n; i++) {
        if (Math.sin(angles[i]) < -0.001 && i !== L && i !== R) {
            ctx.moveTo(bottomPts[i].x, bottomPts[i].y);
            if (isPrism) ctx.lineTo(topPts[i].x, topPts[i].y);
            else         ctx.lineTo(apex.x, apex.y);
        }
    }
    ctx.stroke();

    // 위 면 채우기 (각기둥만)
    if (isPrism) {
        ctx.setLineDash([]);
        ctx.fillStyle = colorFill;
        ctx.beginPath();
        ctx.moveTo(topPts[0].x, topPts[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(topPts[i].x, topPts[i].y);
        ctx.closePath();
        ctx.fill();
    }

    // 2. 앞쪽 보이는 실선
    ctx.setLineDash([]);
    ctx.strokeStyle = colorSolid;
    ctx.beginPath();

    for (let i = 0; i < n; i++) {
        const nxt  = (i + 1) % n;
        const midZ = Math.sin(angles[i]) + Math.sin(angles[nxt]);
        if (midZ >= -0.001) {
            ctx.moveTo(bottomPts[i].x, bottomPts[i].y);
            ctx.lineTo(bottomPts[nxt].x, bottomPts[nxt].y);
        }
    }
    for (let i = 0; i < n; i++) {
        if (Math.sin(angles[i]) >= -0.001 || i === L || i === R) {
            ctx.moveTo(bottomPts[i].x, bottomPts[i].y);
            if (isPrism) ctx.lineTo(topPts[i].x, topPts[i].y);
            else         ctx.lineTo(apex.x, apex.y);
        }
    }

    if (isPrism) {
        ctx.moveTo(topPts[0].x, topPts[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(topPts[i].x, topPts[i].y);
        ctx.lineTo(topPts[0].x, topPts[0].y);
    }
    ctx.stroke();
}

function drawCanvasIcon(icon, title) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font          = '60px Arial';
    ctx.textAlign     = 'center';
    ctx.textBaseline  = 'middle';
    ctx.fillText(icon, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle     = '#4f46e5';
    ctx.font          = 'bold 20px "Noto Sans KR"';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 + 50);
}

// =============================================
// 컨페티
// =============================================
function fireConfetti() {
    const myCanvas   = document.getElementById('confetti-canvas');
    const myConfetti = confetti.create(myCanvas, { resize: true });
    myConfetti({ particleCount: 100, spread: 160 });
}

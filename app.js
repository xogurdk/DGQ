// ⭐ [중요] 구글 스크립트 '웹 앱 URL'을 반드시 넣어주세요!
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxrvXlJ_QsTRfjEJph19xzd0S0Ymu52JYnceJxOgLoN6yD9fWHVkCb-t8PciP4Neu7Raw/exec";

const canvas = document.getElementById('geometryCanvas');
const ctx = canvas.getContext('2d');
const screens = { 
    start: document.getElementById('start-section'), ranking: document.getElementById('ranking-section'), 
    manager: document.getElementById('manager-section'), game: document.getElementById('game-section'), 
    result: document.getElementById('result-section') 
};
const tabs = { start: document.getElementById('tab-start'), ranking: document.getElementById('tab-ranking'), manager: document.getElementById('tab-manager'), nav: document.getElementById('tab-nav') };
const els = { 
    date: document.getElementById('date-display'), headerName: document.getElementById('header-name'), 
    username: document.getElementById('username-input'), score: document.getElementById('score'), 
    count: document.getElementById('current-count'), progress: document.getElementById('progress-bar'), 
    feedback: document.getElementById('feedback'), nextBtn: document.getElementById('next-btn'), 
    hintBox: document.getElementById('hint-box'), hintText: document.getElementById('hint-text'), 
    questionText: document.getElementById('question-text'), inputArea: document.getElementById('input-area'), 
    oxArea: document.getElementById('ox-area'), ansInput: document.getElementById('answer-input'), 
    gameMode: document.getElementById('game-mode'), shapeMode: document.getElementById('shape-mode')
};

let state = { score: 0, problemCount: 1, maxProblems: 15, playerName: "", currentProblem: {}, gameActive: false, attempts: 0 };
const today = new Date(); els.date.innerText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

function switchTab(tab) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    Object.values(tabs).forEach(t => { if(t && t.id !== 'tab-nav') { t.classList.remove('border-b-2', 'border-indigo-600', 'text-indigo-600'); t.classList.add('text-gray-500'); } });
    screens[tab].classList.remove('hidden');
    tabs[tab].classList.add('border-b-2', 'border-indigo-600', 'text-indigo-600'); tabs[tab].classList.remove('text-gray-500');
    if (tab === 'ranking') {
        document.getElementById('loading-spinner').classList.remove('hidden'); document.getElementById('podium-area').classList.add('hidden'); document.getElementById('ranking-list-body').innerHTML = '';
        fetch(GAS_API_URL + "?action=getRanking").then(res => res.json()).then(data => updateRankingUI(data)).catch(err => console.error(err));
    } else if (tab === 'manager') {
        document.getElementById('manager-loading').classList.remove('hidden'); document.getElementById('manager-list-body').innerHTML = '';
        fetch(GAS_API_URL + "?action=getStatus").then(res => res.json()).then(data => updateManagerUI(data)).catch(err => console.error(err));
    }
}

function updateRankingUI(list) {
    document.getElementById('loading-spinner').classList.add('hidden'); document.getElementById('podium-area').classList.remove('hidden');
    ['1','2','3'].forEach(r => { document.getElementById(`rank-${r}-name`).innerText = '-'; document.getElementById(`rank-${r}-score`).innerText = '0'; });
    if (list[0]) { document.getElementById('rank-1-name').innerText = list[0].name; document.getElementById('rank-1-score').innerText = list[0].score; }
    if (list[1]) { document.getElementById('rank-2-name').innerText = list[1].name; document.getElementById('rank-2-score').innerText = list[1].score; }
    if (list[2]) { document.getElementById('rank-3-name').innerText = list[2].name; document.getElementById('rank-3-score').innerText = list[2].score; }
    const tbody = document.getElementById('ranking-list-body'); tbody.innerHTML = '';
    list.slice(3).forEach((item, idx) => { tbody.innerHTML += `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-4 py-3 text-center text-gray-500">${idx + 4}</td><td class="px-4 py-3 font-medium text-gray-900">${item.name}</td><td class="px-4 py-3 text-right font-bold text-indigo-600">${item.score}</td></tr>`; });
    if(list.length === 0) tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">도전자가 없습니다.</td></tr>';
}

function updateManagerUI(list) {
    document.getElementById('manager-loading').classList.add('hidden'); const tbody = document.getElementById('manager-list-body'); tbody.innerHTML = ''; let todayCount = 0;
    if (list.length === 0) { tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">등록된 학생 기록이 없습니다.</td></tr>'; } else {
        list.forEach(item => {
            if(item.isToday) todayCount++;
            const statusTag = item.isToday ? `<span class="status-o">O</span>` : `<span class="status-x">X</span>`;
            const timeColor = item.isToday ? 'text-indigo-600 font-bold' : 'text-gray-400';
            tbody.innerHTML += `<tr class="bg-white border-b hover:bg-gray-50"><td class="px-4 py-3 font-medium text-gray-900">${item.name}</td><td class="px-4 py-3 text-center">${statusTag}</td><td class="px-4 py-3 text-right text-xs ${timeColor}">${item.lastTime}</td></tr>`;
        });
    } document.getElementById('today-count').innerText = `오늘 참여: ${todayCount}명`;
}

function startGame() {
    const name = els.username.value.trim(); if (!name) { alert("이름을 입력해주세요!"); return; }
    state.playerName = name; state.score = 0; state.problemCount = 1; state.gameActive = true;
    els.headerName.innerText = `${name}의 도전`; document.getElementById('result-name').innerText = name;
    Object.values(screens).forEach(s => s.classList.add('hidden')); tabs.nav.classList.add('hidden'); screens.game.classList.remove('hidden'); generateProblem();
}

function handleStartEnter(e) { if (e.key === "Enter") startGame(); }

function finishGame() {
    state.gameActive = false; screens.game.classList.add('hidden'); screens.result.classList.remove('hidden');
    document.getElementById('final-score').innerText = state.score;
    fetch(GAS_API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveScore', name: state.playerName, score: state.score }) })
    .then(res => res.json()).then(res => {
        document.getElementById('save-status').innerText = res.success ? "✅ 점수 저축 완료!" : "❌ 오류 발생";
        document.getElementById('save-status').className = res.success ? "text-xs text-green-500 mt-2 font-bold" : "text-xs text-red-500 mt-2 font-bold";
        if(res.success) document.getElementById('total-score-display').innerText = res.total;
    }).catch(err => { document.getElementById('save-status').innerText = "❌ 저장 실패 (네트워크 오류)"; console.error(err); });
}

function goToRanking() { screens.result.classList.add('hidden'); tabs.nav.classList.remove('hidden'); switchTab('ranking'); }

// 각뿔 모드일 때 전개도 선택 시 방어 로직
function resetAndGenerate() { 
    if (els.shapeMode.value === 'pyramid' && els.gameMode.value === 'net') {
        alert("각뿔의 전개도는 현재 버전에서 지원하지 않습니다. 각기둥 모드로 전환됩니다.");
        els.shapeMode.value = 'prism';
    }
    generateProblem(); 
}

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- 1. 3D 입체도형(겨냥도) 그리기 ---
function draw3DShape(n, isPrism) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2 + (isPrism ? 0 : 20), r = 40 + (n * 2.5), h = 100;
    const hue = Math.floor(Math.random() * 360), colorSolid = `hsl(${hue}, 70%, 40%)`, colorFill = `hsla(${hue}, 70%, 60%, 0.15)`, colorDash = `hsla(${hue}, 70%, 40%, 0.6)`;
    const bottomPts = [], topPts = [], angles = []; let minX = Infinity, maxX = -Infinity, L = 0, R = 0; const offset = Math.PI / 2 + 0.3; 

    for(let i=0; i<n; i++) {
        let angle = offset + (i * 2 * Math.PI / n); angles.push(angle);
        let x = cx + r * Math.cos(angle), yBottom = cy + r * 0.3 * Math.sin(angle) + h/2, yTop = cy + r * 0.3 * Math.sin(angle) - h/2;
        bottomPts.push({x, y: yBottom}); topPts.push({x, y: yTop});
        if (x < minX) { minX = x; L = i; } if (x > maxX) { maxX = x; R = i; }
    }
    const apex = {x: cx, y: cy - h/2 - 20}; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.setLineDash([5, 5]); ctx.strokeStyle = colorDash; ctx.beginPath();
    
    for(let i=0; i<n; i++) {
        let nxt = (i+1)%n; if (Math.sin(angles[i]) + Math.sin(angles[nxt]) < -0.001) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); ctx.lineTo(bottomPts[nxt].x, bottomPts[nxt].y); }
    }
    for(let i=0; i<n; i++) {
        if (Math.sin(angles[i]) < -0.001 && i !== L && i !== R) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); if (isPrism) ctx.lineTo(topPts[i].x, topPts[i].y); else ctx.lineTo(apex.x, apex.y); }
    } ctx.stroke();
    
    if (isPrism) { ctx.setLineDash([]); ctx.fillStyle = colorFill; ctx.beginPath(); ctx.moveTo(topPts[0].x, topPts[0].y); for(let i=1; i<n; i++) ctx.lineTo(topPts[i].x, topPts[i].y); ctx.closePath(); ctx.fill(); }
    ctx.setLineDash([]); ctx.strokeStyle = colorSolid; ctx.beginPath();
    for(let i=0; i<n; i++) {
        let nxt = (i+1)%n; if (Math.sin(angles[i]) + Math.sin(angles[nxt]) >= -0.001) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); ctx.lineTo(bottomPts[nxt].x, bottomPts[nxt].y); }
    }
    for(let i=0; i<n; i++) {
        if (Math.sin(angles[i]) >= -0.001 || i === L || i === R) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); if (isPrism) ctx.lineTo(topPts[i].x, topPts[i].y); else ctx.lineTo(apex.x, apex.y); }
    }
    if (isPrism) { ctx.moveTo(topPts[0].x, topPts[0].y); for(let i=1; i<n; i++) { ctx.lineTo(topPts[i].x, topPts[i].y); } ctx.lineTo(topPts[0].x, topPts[0].y); } ctx.stroke();
}

// --- 2. 실제 전개도(Net) 그리기 (오류 수정 및 랜덤화 적용) ---
function drawPrismNet(n) {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,canvas.width,canvas.height);
    let s = Math.min(30, 240 / n); // 캔버스 크기에 맞게 조절
    let h = 80;
    let startX = canvas.width/2 - (n*s)/2; 
    let startY = canvas.height/2 - h/2;

    // 랜덤하게 밑면이 붙을 옆면 위치 지정 (다양한 전개도 패턴 생성)
    let topIdx = getRandomInt(0, n-1);
    let bottomIdx = getRandomInt(0, n-1);

    // 1. 옆면 (직사각형 n개) 그리기
    ctx.beginPath(); ctx.setLineDash([]); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.fillStyle = '#e0e7ff';
    ctx.rect(startX, startY, n*s, h); ctx.fill(); ctx.stroke(); // 외곽선
    
    // 안쪽 접는 선 (점선)
    ctx.beginPath(); ctx.setLineDash([5,5]); 
    for(let i=1; i<n; i++) { ctx.moveTo(startX + i*s, startY); ctx.lineTo(startX + i*s, startY + h); }
    ctx.stroke(); ctx.setLineDash([]);

    // 2. 정확한 수학 계산으로 밑면 다각형 그리기 (벌어짐 현상 해결)
    function drawAttachedPolygon(faceIndex, yEdge, isTop) {
        let x = startX + faceIndex * s;
        let y = yEdge;

        // 정다각형의 중심점 계산
        let rApothem = (s / 2) / Math.tan(Math.PI / n);
        let R = (s / 2) / Math.sin(Math.PI / n);
        let cx = x + s / 2;
        let cy = isTop ? y - rApothem : y + rApothem;

        // 다각형 그리기
        ctx.beginPath();
        for(let i=0; i<n; i++) {
            let theta = isTop ? 
                (Math.PI / 2 - Math.PI / n + i * 2 * Math.PI / n) : 
                (-Math.PI / 2 + Math.PI / n + i * 2 * Math.PI / n);
            let px = cx + R * Math.cos(theta);
            let py = cy + R * Math.sin(theta);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#bfdbfe'; ctx.fill();
        
        // 다각형 외곽 실선
        ctx.setLineDash([]); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

        // 덮어쓰기: 옆면과 맞닿는 부분은 잘리는 선이 아니므로 점선으로 복구
        ctx.beginPath(); ctx.setLineDash([5,5]); 
        ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 4; // 실선 지우기
        ctx.moveTo(x, y); ctx.lineTo(x+s, y); ctx.stroke();
        
        ctx.beginPath(); ctx.setLineDash([5,5]); 
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; // 점선 다시 긋기
        ctx.moveTo(x, y); ctx.lineTo(x+s, y); ctx.stroke();
        ctx.setLineDash([]);
    }

    drawAttachedPolygon(topIdx, startY, true);       // 윗면
    drawAttachedPolygon(bottomIdx, startY + h, false); // 아랫면
}

// --- 3. 다각형 넓이 복습용 도형 그리기 (가독성 극대화) ---
function drawAreaShape(type, p1, p2, p3) {
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 3; ctx.strokeStyle = '#1e3a8a'; ctx.fillStyle = '#dbeafe';

    const cx = canvas.width / 2, cy = canvas.height / 2;
    let scale, bw, hh, tw, offset, w, h;

    // 도형 경로 그리기
    if (type === 'triangle') {
        scale = 100 / Math.max(p1, p2); bw = p1 * scale; hh = p2 * scale;
        ctx.beginPath(); ctx.moveTo(cx - bw/2, cy + hh/2); ctx.lineTo(cx + bw/2, cy + hh/2); ctx.lineTo(cx - bw/4, cy - hh/2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.setLineDash([5,5]); ctx.strokeStyle = '#ef4444'; ctx.moveTo(cx - bw/4, cy - hh/2); ctx.lineTo(cx - bw/4, cy + hh/2); ctx.stroke(); ctx.setLineDash([]);
        drawText(`${p1}cm`, cx, cy + hh/2 + 30, '#000'); drawText(`${p2}cm`, cx - bw/4 - 45, cy, '#ef4444');
    } else if (type === 'rectangle') {
        scale = 100 / Math.max(p1, p2); w = p1 * scale; h = p2 * scale;
        ctx.fillRect(cx - w/2, cy - h/2, w, h); ctx.strokeRect(cx - w/2, cy - h/2, w, h);
        drawText(`${p1}cm`, cx, cy + h/2 + 30, '#000'); drawText(`${p2}cm`, cx - w/2 - 45, cy, '#000');
    } else if (type === 'parallelogram') {
        scale = 100 / Math.max(p1, p2); bw = p1 * scale; hh = p2 * scale; offset = hh / 2;
        ctx.beginPath(); ctx.moveTo(cx - bw/2 - offset/2, cy + hh/2); ctx.lineTo(cx + bw/2 - offset/2, cy + hh/2); ctx.lineTo(cx + bw/2 + offset/2, cy - hh/2); ctx.lineTo(cx - bw/2 + offset/2, cy - hh/2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.setLineDash([5,5]); ctx.strokeStyle = '#ef4444'; ctx.moveTo(cx - bw/2 + offset/2, cy - hh/2); ctx.lineTo(cx - bw/2 + offset/2, cy + hh/2); ctx.stroke(); ctx.setLineDash([]);
        drawText(`${p1}cm`, cx, cy + hh/2 + 30, '#000'); drawText(`${p2}cm`, cx - bw/2 + offset/2 - 45, cy, '#ef4444');
    } else if (type === 'trapezoid') {
        scale = 100 / Math.max(p2, p3); tw = p1 * scale; bw = p2 * scale; hh = p3 * scale;
        ctx.beginPath(); ctx.moveTo(cx - bw/2, cy + hh/2); ctx.lineTo(cx + bw/2, cy + hh/2); ctx.lineTo(cx + tw/2 - 10, cy - hh/2); ctx.lineTo(cx - tw/2 - 10, cy - hh/2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.setLineDash([5,5]); ctx.strokeStyle = '#ef4444'; ctx.moveTo(cx - tw/2 - 10, cy - hh/2); ctx.lineTo(cx - tw/2 - 10, cy + hh/2); ctx.stroke(); ctx.setLineDash([]);
        drawText(`${p2}cm`, cx, cy + hh/2 + 30, '#000'); drawText(`${p1}cm`, cx - 10, cy - hh/2 - 30, '#000'); drawText(`${p3}cm`, cx - tw/2 - 50, cy, '#ef4444');
    } else if (type === 'rhombus') {
        scale = 100 / Math.max(p1, p2); w = p1 * scale; h = p2 * scale;
        ctx.beginPath(); ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx + w/2, cy); ctx.lineTo(cx, cy + h/2); ctx.lineTo(cx - w/2, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.setLineDash([5,5]); ctx.strokeStyle = '#ef4444'; ctx.moveTo(cx, cy - h/2); ctx.lineTo(cx, cy + h/2); ctx.moveTo(cx - w/2, cy); ctx.lineTo(cx + w/2, cy); ctx.stroke(); ctx.setLineDash([]);
        drawText(`${p1}cm`, cx + w/4 + 35, cy - 25, '#ef4444'); drawText(`${p2}cm`, cx - 25, cy + h/4 + 35, '#ef4444');
    }

    // [핵심] 가독성을 위해 흰색 아웃라인이 들어간 큰 폰트 적용
    function drawText(text, x, y, color) {
        ctx.font = 'bold 28px "Noto Sans KR"'; 
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; // 흰색 테두리
        ctx.strokeText(text, x, y); 
        ctx.fillStyle = color; ctx.fillText(text, x, y);
    }
}

// 메인 문제 출제 제어
function generateProblem() {
    if (state.problemCount > state.maxProblems) { finishGame(); return; }
    state.attempts = 0; els.count.innerText = state.problemCount; els.progress.style.width = `${((state.problemCount - 1) / state.maxProblems) * 100}%`;
    els.ansInput.value = ''; els.feedback.innerText = ''; els.nextBtn.classList.add('hidden'); els.hintBox.classList.add('hidden');
    els.ansInput.disabled = false; const oxBtns = els.oxArea.querySelectorAll('button'); oxBtns.forEach(b => {b.disabled=false; b.classList.remove('opacity-50');});

    let mode = els.gameMode.value;
    if (mode === 'all') {
        let pool = ['elements', 'concept', 'reverse', 'area'];
        if (els.shapeMode.value !== 'pyramid') pool.push('net'); // 각뿔이 아닐 때만 전개도 추가
        mode = pool[getRandomInt(0, pool.length - 1)];
    }

    if (mode === 'elements') generateElements();
    else if (mode === 'concept') generateConceptOX();
    else if (mode === 'reverse') generateReverse();
    else if (mode === 'net') generateNet();
    else if (mode === 'area') generateArea();
}

function generateElements() {
    setUiMode('input'); const shapeMode = els.shapeMode.value; let isPrism = Math.random() < 0.5;
    if(shapeMode === 'prism') isPrism = true; if(shapeMode === 'pyramid') isPrism = false;
    const n = getRandomInt(3, 8), qType = getRandomInt(0, 2), shapeNames = ["", "", "", "삼", "사", "오", "육", "칠", "팔"];
    const shapeName = `${shapeNames[n]}각${isPrism ? '기둥' : '뿔'}`, properties = ["면", "모서리", "꼭짓점"], propName = properties[qType];
    
    draw3DShape(n, isPrism);
    let ans = 0, hint = "";
    if (isPrism) {
        if(qType===0){ans=n+2; hint=`위아래 밑면 2개 + 옆면 ${n}개`;}else if(qType===1){ans=n*3; hint=`밑면의 변의 수 × 3`;}else{ans=n*2; hint=`위 ${n}개, 아래 ${n}개`;}
    } else {
        if(qType===0){ans=n+1; hint=`바닥 밑면 1개 + 옆면 ${n}개`;}else if(qType===1){ans=n*2; hint=`밑면의 변의 수 × 2`;}else{ans=n+1; hint=`바닥에 꼭짓점 ${n}개, 맨 위 각뿔의 꼭짓점 1개`;}
    }
    els.questionText.innerHTML = `위 <span class="text-indigo-600 font-bold">${shapeName}</span>의 <span class="text-red-600 border-b-2 border-red-400">${propName}의 수</span>는?`;
    els.hintText.innerText = hint; state.currentProblem = { ans: ans, type: 'input' };
}

function generateConceptOX() {
    setUiMode('ox'); const shapeMode = els.shapeMode.value; let isPrism = Math.random() < 0.5;
    if(shapeMode === 'prism') isPrism = true; if(shapeMode === 'pyramid') isPrism = false;
    const n = getRandomInt(3, 8), shapeNames = ["", "", "", "삼", "사", "오", "육", "칠", "팔"], name = `${shapeNames[n]}각${isPrism ? '기둥' : '뿔'}`;
    draw3DShape(n, isPrism); 
    let qList = [];
    if (isPrism) { qList.push({ q: `위 도형의 두 밑면은 평행하고 합동입니다.`, ans: "O", hint: "각기둥은 위아래 면이 똑같이 생겼어요." }, { q: `위 도형의 옆면은 모두 삼각형입니다.`, ans: "X", hint: "각기둥 옆면은 직사각형입니다." }); } 
    else { qList.push({ q: `위 도형의 옆면은 모두 직사각형입니다.`, ans: "X", hint: "각뿔의 옆면은 삼각형이에요." }, { q: `위 도형의 밑면은 1개입니다.`, ans: "O", hint: "바닥에 닿는 면이 1개뿐입니다." }); }
    const qObj = qList[getRandomInt(0, qList.length - 1)];
    els.questionText.innerHTML = `설명이 맞으면 O, 틀리면 X를 고르세요.<br><span class="text-indigo-600 font-bold">"${qObj.q}"</span>`;
    els.hintText.innerText = qObj.hint; state.currentProblem = { ans: qObj.ans, type: 'OX' };
}

function generateReverse() {
    setUiMode('input'); const shapeMode = els.shapeMode.value; let isPrism = Math.random() < 0.5;
    if(shapeMode === 'prism') isPrism = true; if(shapeMode === 'pyramid') isPrism = false;
    const n = getRandomInt(4, 10), qType = getRandomInt(0, 2), properties = ["면", "모서리", "꼭짓점"], propName = properties[qType];
    let givenNum = 0, hint = "";
    if (isPrism) { if(qType===0){givenNum=n+2;}else if(qType===1){givenNum=n*3;}else{givenNum=n*2;} } 
    else { if(qType===0){givenNum=n+1;}else if(qType===1){givenNum=n*2;}else{givenNum=n+1;} }
    draw3DShape(getRandomInt(3,5), isPrism); // 랜덤 장식
    els.questionText.innerHTML = `<span class="text-red-600 border-b-2 border-red-400">${propName}의 수가 ${givenNum}개</span>인 <span class="text-indigo-600 font-bold">${isPrism ? '각기둥' : '각뿔'}</span>이 있습니다. <br>이 도형의 밑면은 몇 각형일까요?`;
    els.hintText.innerText = "위 그림은 참고용입니다! 규칙을 떠올려보세요."; state.currentProblem = { ans: n, type: 'input' };
}

function generateNet() {
    const isOx = Math.random() < 0.4; 
    if (isOx) {
        setUiMode('ox'); drawPrismNet(getRandomInt(3,6)); // 랜덤 전개도 배경
        const qList = [
            { q: "전개도에서 접히는 모서리 부분은 점선으로 그립니다.", ans: "O", hint: "가위로 자르는 바깥 선은 실선, 접는 선은 점선이에요." },
            { q: "전개도에서 잘린 모서리(바깥쪽 테두리)는 점선으로 그립니다.", ans: "X", hint: "바깥쪽 테두리는 '실선'으로 그려야 해요." },
            { q: "전개도를 접어 입체도형을 만들 때, 서로 맞닿는 모서리의 길이는 같아야 합니다.", ans: "O", hint: "길이가 다르면 틈이 생깁니다." }
        ];
        const qObj = qList[getRandomInt(0, qList.length - 1)];
        els.questionText.innerHTML = `전개도 설명이 맞으면 O, 틀리면 X를 고르세요.<br><span class="text-indigo-600 font-bold">"${qObj.q}"</span>`;
        els.hintText.innerText = qObj.hint; state.currentProblem = { ans: qObj.ans, type: 'OX' };
    } else {
        setUiMode('input'); const n = getRandomInt(3, 8); const shapeNames = ["", "", "", "삼", "사", "오", "육", "칠", "팔"], shapeName = `${shapeNames[n]}각기둥`;
        drawPrismNet(n); // 실제 계산된 완벽한 전개도 그리기!
        const qType = getRandomInt(0, 1); let ans = 0, qHtml = "", hint = "";
        if (qType === 0) {
            ans = n + 2; qHtml = `위 <span class="text-indigo-600 font-bold">${shapeName}의 전개도</span>에서 <span class="text-red-600 border-b-2 border-red-400">전체 면의 수</span>는 몇 개인가요?`;
            hint = `화면의 전개도를 직접 세어보세요!`;
        } else {
            ans = n; qHtml = `위 <span class="text-indigo-600 font-bold">${shapeName}의 전개도</span>에서 <span class="text-red-600 border-b-2 border-red-400">직사각형 모양인 옆면</span>은 모두 몇 개일까요?`;
            hint = `가운데 길게 연결된 직사각형의 개수를 세어보세요.`;
        }
        els.questionText.innerHTML = qHtml; els.hintText.innerText = hint; state.currentProblem = { ans: ans, type: 'input' };
    }
}

// 다각형 넓이 복습 로직
function generateArea() {
    setUiMode('input');
    const types = ['triangle', 'rectangle', 'parallelogram', 'trapezoid', 'rhombus'], type = types[getRandomInt(0, 4)];
    let p1, p2, p3, ans, name, hint;

    if (type === 'triangle') {
        p1 = getRandomInt(4, 12); p2 = getRandomInt(4, 10); if ((p1 * p2) % 2 !== 0) p1 += 1;
        ans = (p1 * p2) / 2; name = "삼각형"; hint = "밑변 × 높이 ÷ 2";
    } else if (type === 'rectangle') {
        p1 = getRandomInt(3, 12); p2 = getRandomInt(3, 12);
        ans = p1 * p2; name = "직사각형"; hint = "가로 × 세로";
    } else if (type === 'parallelogram') {
        p1 = getRandomInt(4, 12); p2 = getRandomInt(4, 10);
        ans = p1 * p2; name = "평행사변형"; hint = "밑변 × 높이";
    } else if (type === 'trapezoid') {
        p1 = getRandomInt(3, 8); p2 = getRandomInt(5, 12); p3 = getRandomInt(4, 10); if ((p1 + p2) * p3 % 2 !== 0) p3 += 1;
        ans = ((p1 + p2) * p3) / 2; name = "사다리꼴"; hint = "(윗변 + 아랫변) × 높이 ÷ 2";
    } else if (type === 'rhombus') {
        p1 = getRandomInt(4, 12); p2 = getRandomInt(4, 12); if ((p1 * p2) % 2 !== 0) p1 += 1;
        ans = (p1 * p2) / 2; name = "마름모"; hint = "한 대각선 × 다른 대각선 ÷ 2";
    }

    drawAreaShape(type, p1, p2, p3);
    els.questionText.innerHTML = `그림에 주어진 <span class="text-indigo-600 font-bold">${name}</span>의 <span class="text-red-600 border-b-2 border-red-400">넓이</span>를 구하세요. (단위 생략)`;
    els.hintText.innerText = hint; state.currentProblem = { ans: ans, type: 'input' };
}

function setUiMode(mode) {
    if(mode === 'ox') { els.inputArea.classList.add('hidden'); els.inputArea.classList.remove('flex'); els.oxArea.classList.remove('hidden'); els.oxArea.classList.add('flex'); } 
    else { els.inputArea.classList.remove('hidden'); els.inputArea.classList.add('flex'); els.oxArea.classList.add('hidden'); els.oxArea.classList.remove('flex'); els.ansInput.focus(); }
}

function checkAnswer(choice) {
    if(!els.nextBtn.classList.contains('hidden')) return;
    let correct = false, uAns = choice;
    
    if(state.currentProblem.type !== 'OX') {
        uAns = Number(els.ansInput.value);
        if(isNaN(uAns) || els.ansInput.value === '') { alert("숫자를 입력해주세요!"); return; }
    }
    
    if(uAns === state.currentProblem.ans) correct = true;
    
    if(correct) { 
        let points = state.attempts === 0 ? 10 : 5; state.score += points; els.score.innerText = state.score; 
        if (state.attempts === 0) els.feedback.innerHTML = `<span class='text-green-600 animate-bounce font-bold'>🎉 훌륭해요! 정답입니다. (+${points}점)</span>`; 
        else els.feedback.innerHTML = `<span class='text-blue-600 animate-bounce font-bold'>👍 포기하지 않고 맞췄어요! (+${points}점)</span>`; 
        fireConfetti(); endProblem(); 
    } else { 
        state.attempts++; 
        if(state.attempts >= 2) { els.feedback.innerHTML = `<span class='text-red-600 font-bold'>아쉽네요. 정답은 ${state.currentProblem.ans}입니다! (+0점)</span>`; endProblem(); } 
        else { els.feedback.innerHTML = "<span class='text-red-500'>😅 힌트를 보고 다시 도전해보세요.</span>"; els.hintBox.classList.remove('hidden'); els.ansInput.value = ''; } 
    }
}

function endProblem() { els.nextBtn.classList.remove('hidden'); els.ansInput.disabled = true; els.oxArea.querySelectorAll('button').forEach(b => b.disabled=true); }
function nextProblem() { state.problemCount++; generateProblem(); }
function fireConfetti() { var myCanvas = document.getElementById('confetti-canvas'); var myConfetti = confetti.create(myCanvas, { resize: true }); myConfetti({ particleCount: 100, spread: 160 }); }

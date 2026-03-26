// ⭐ 선생님의 구글 스크립트 웹 앱 URL (항상 이 주소로 고정됩니다!)
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

function resetAndGenerate() { 
    if (els.shapeMode.value === 'pyramid' && (els.gameMode.value === 'net' || els.gameMode.value === 'hard_net')) {
        alert("각뿔의 전개도는 출제되지 않습니다. 자동으로 각기둥 모드로 전환됩니다.");
        els.shapeMode.value = 'prism';
    }
    generateProblem(); 
}

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- 1. 3D 겨냥도 은선 처리 ---
function draw3DShape(n, isPrism) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 모바일 웹뷰 버그 해결을 위한 안전한 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const cx = canvas.width / 2, cy = canvas.height / 2 + (isPrism ? 0 : 20);
    const r = 40 + (n * 2.5), h = 100;
    const hue = Math.floor(Math.random() * 360);
    const colorSolid = `hsl(${hue}, 70%, 40%)`, colorFill = `hsla(${hue}, 70%, 60%, 0.15)`, colorDash = `hsla(${hue}, 70%, 40%, 0.6)`;

    const bottomPts = [], topPts = [], angles = []; 
    const offset = Math.PI / 2 + 0.3; 

    for(let i=0; i<n; i++) {
        let angle = offset + (i * 2 * Math.PI / n); angles.push(angle);
        let x = cx + r * Math.cos(angle);
        let yBottom = cy + r * 0.3 * Math.sin(angle) + h/2;
        let yTop = cy + r * 0.3 * Math.sin(angle) - h/2;
        bottomPts.push({x, y: yBottom}); topPts.push({x, y: yTop});
    }
    const apex = {x: cx, y: cy - h/2 - 20}; 

    const isFrontFace = [];
    for (let i = 0; i < n; i++) { let nxt = (i + 1) % n; let midY = Math.sin(angles[i]) + Math.sin(angles[nxt]); isFrontFace.push(midY >= -0.001); }
    const isFrontEdge = [];
    for (let i = 0; i < n; i++) { let prev = (i - 1 + n) % n; isFrontEdge.push(isFrontFace[prev] || isFrontFace[i]); }

    ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; 
    
    ctx.setLineDash([5, 5]); ctx.strokeStyle = colorDash; ctx.beginPath();
    for(let i=0; i<n; i++) { if (!isFrontFace[i]) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); ctx.lineTo(bottomPts[(i+1)%n].x, bottomPts[(i+1)%n].y); } }
    for(let i=0; i<n; i++) { if (!isFrontEdge[i]) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); if (isPrism) ctx.lineTo(topPts[i].x, topPts[i].y); else ctx.lineTo(apex.x, apex.y); } } ctx.stroke();
    
    if (isPrism) { ctx.setLineDash([]); ctx.fillStyle = colorFill; ctx.beginPath(); ctx.moveTo(topPts[0].x, topPts[0].y); for(let i=1; i<n; i++) ctx.lineTo(topPts[i].x, topPts[i].y); ctx.closePath(); ctx.fill(); }
    
    ctx.setLineDash([]); ctx.strokeStyle = colorSolid; ctx.beginPath();
    for(let i=0; i<n; i++) { if (isFrontFace[i]) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); ctx.lineTo(bottomPts[(i+1)%n].x, bottomPts[(i+1)%n].y); } }
    for(let i=0; i<n; i++) { if (isFrontEdge[i]) { ctx.moveTo(bottomPts[i].x, bottomPts[i].y); if (isPrism) ctx.lineTo(topPts[i].x, topPts[i].y); else ctx.lineTo(apex.x, apex.y); } }
    if (isPrism) { ctx.moveTo(topPts[0].x, topPts[0].y); for(let i=1; i<n; i++) ctx.lineTo(topPts[i].x, topPts[i].y); ctx.closePath(); } ctx.stroke();
}

// --- 2. 일렬형 전개도 (스케일 자동 조절 방어 추가) ---
function drawOffsetNet(nTop, nBottom, sideCount, topIndices, bottomIndices) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,canvas.width,canvas.height);
    
    let maxN = Math.max(nTop || 3, nBottom || 3, 3);
    let R_factor = 0.5 / Math.sin(Math.PI / maxN);
    let r_factor = 0.5 / Math.tan(Math.PI / maxN);
    
    // 네모칸을 벗어나지 않도록 안전하게 가로/세로 비율 계산
    let requiredW = sideCount + 4 * R_factor;
    let requiredH = 2.5 + 4 * R_factor; 
    
    let s = Math.min((canvas.width * 0.8) / requiredW, (canvas.height * 0.8) / requiredH, 30);
    let h = s * 2.5;

    let startX = canvas.width/2 - (sideCount*s)/2;
    let startY = canvas.height/2 - h/2;

    ctx.translate(startX, startY);

    ctx.beginPath(); ctx.setLineDash([]); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.fillStyle = '#e0e7ff';
    ctx.rect(0, 0, sideCount*s, h); ctx.fill(); ctx.stroke();

    ctx.beginPath(); ctx.setLineDash([5,5]);
    for(let i=1; i<sideCount; i++) { ctx.moveTo(i*s, 0); ctx.lineTo(i*s, h); } ctx.stroke(); ctx.setLineDash([]);

    function drawPoly(idx, isTop, polyN) {
        if(!polyN || polyN < 3) return;
        let cx = idx*s + s/2;
        let R = (s/2) / Math.sin(Math.PI/polyN);
        let r = (s/2) / Math.tan(Math.PI/polyN);
        let cy = isTop ? -r : h + r;

        ctx.beginPath();
        for(let i=0; i<polyN; i++) {
            let startAngle = isTop ? Math.atan2(r, s/2) : Math.atan2(-r, s/2);
            let theta = startAngle + i * (2*Math.PI/polyN);
            let px = cx + R * Math.cos(theta);
            let py = cy + R * Math.sin(theta);
            if(i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        } ctx.closePath();
        ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.stroke();
        
        ctx.beginPath(); ctx.strokeStyle = '#bfdbfe'; ctx.lineWidth = 4;
        ctx.moveTo(idx*s, isTop ? 0 : h); ctx.lineTo(idx*s+s, isTop ? 0 : h); ctx.stroke();
        ctx.beginPath(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.setLineDash([5,5]);
        ctx.moveTo(idx*s, isTop ? 0 : h); ctx.lineTo(idx*s+s, isTop ? 0 : h); ctx.stroke(); ctx.setLineDash([]);
    }

    topIndices.forEach(idx => drawPoly(idx, true, nTop));
    bottomIndices.forEach(idx => drawPoly(idx, false, nBottom));
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 안전한 복구
}

// --- 3. [하드모드 전용] 프로펠러형 복잡 전개도 (자동 축소 기능 완벽 적용) ---
function drawPropellerNet(n, isValid, errType) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,canvas.width,canvas.height);
    
    // 복잡한 모양도 네모칸 밖으로 나가지 않도록 지름 자동 계산
    let R_factor = 0.5 / Math.sin(Math.PI/n);
    let r_factor = 0.5 / Math.tan(Math.PI/n);
    let spanFactor = 2.5 + 4 * (R_factor + r_factor); 
    let s = Math.min((canvas.width * 0.9) / spanFactor, (canvas.height * 0.9) / spanFactor, 25); 
    let h = s * 2.5;
    let R = s * R_factor;
    let apothem = s * r_factor;
    
    ctx.translate(canvas.width/2, canvas.height/2);
    
    // 중앙 밑면 
    ctx.beginPath();
    for(let i=0; i<n; i++) {
        let angle = i * 2*Math.PI/n;
        if(i===0) ctx.moveTo(R * Math.cos(angle), R * Math.sin(angle));
        else ctx.lineTo(R * Math.cos(angle), R * Math.sin(angle));
    } ctx.closePath();
    ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

    let skipIdx = (!isValid && errType === 0) ? getRandomInt(0, n-1) : -1; 
    let base2Idx = getRandomInt(0, n-1); 
    while(base2Idx === skipIdx) { base2Idx = getRandomInt(0, n-1); }

    for(let i=0; i<n; i++) {
        if (i === skipIdx) continue;
        
        ctx.save();
        let angle = i * 2*Math.PI/n + Math.PI/n;
        ctx.translate(apothem * Math.cos(angle), apothem * Math.sin(angle));
        ctx.rotate(angle - Math.PI/2);
        
        // 옆면(직사각형)
        ctx.beginPath(); ctx.rect(-s/2, 0, s, h); ctx.fillStyle = '#e0e7ff'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.setLineDash([5,5]); ctx.moveTo(-s/2, 0); ctx.lineTo(s/2, 0); ctx.stroke(); ctx.setLineDash([]);

        // 두 번째 밑면
        if (i === base2Idx) {
            let n2 = n;
            if (!isValid && errType === 3) n2 = n===3 ? 4 : (Math.random() < 0.5 ? n - 1 : n + 1); 
            if (!isValid && errType === 2) n2 = 0; 
            
            if (n2 > 0) {
                if (!isValid && errType === 4) {
                    // 치명적 오류: 긴 옆구리에 부착
                    ctx.translate(s/2, h/2); ctx.rotate(-Math.PI/2);
                    ctx.beginPath(); ctx.setLineDash([5,5]); ctx.moveTo(-h/2, 0); ctx.lineTo(h/2, 0); ctx.stroke(); ctx.setLineDash([]);
                    
                    let R2 = (s/2) / Math.sin(Math.PI/n2); let apo2 = (s/2) / Math.tan(Math.PI/n2);
                    ctx.translate(0, apo2);
                    ctx.beginPath();
                    for(let j=0; j<n2; j++) {
                        let a2 = -Math.PI/2 - Math.PI/n2 + j * 2*Math.PI/n2;
                        if(j===0) ctx.moveTo(R2 * Math.cos(a2), R2 * Math.sin(a2)); else ctx.lineTo(R2 * Math.cos(a2), R2 * Math.sin(a2));
                    } ctx.closePath(); ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.stroke();
                } else if (!isValid && errType === 5) {
                    // 치명적 오류: 한쪽 날개에 두 개의 밑면이 겹쳐서 다닥다닥 붙음
                    ctx.translate(0, h);
                    ctx.beginPath(); ctx.setLineDash([5,5]); ctx.moveTo(-s/2, 0); ctx.lineTo(s/2, 0); ctx.stroke(); ctx.setLineDash([]);
                    
                    let R2 = (s/2) / Math.sin(Math.PI/n2); let apo2 = (s/2) / Math.tan(Math.PI/n2);
                    ctx.translate(0, apo2);
                    ctx.beginPath();
                    for(let j=0; j<n2; j++) {
                        let a2 = -Math.PI/2 - Math.PI/n2 + j * 2*Math.PI/n2;
                        if(j===0) ctx.moveTo(R2 * Math.cos(a2), R2 * Math.sin(a2)); else ctx.lineTo(R2 * Math.cos(a2), R2 * Math.sin(a2));
                    } ctx.closePath(); ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.stroke();

                    ctx.translate(0, apo2);
                    ctx.beginPath(); ctx.setLineDash([5,5]); ctx.moveTo(-s/2, 0); ctx.lineTo(s/2, 0); ctx.stroke(); ctx.setLineDash([]);
                    ctx.translate(0, apo2);
                    ctx.beginPath();
                    for(let j=0; j<n2; j++) {
                        let a2 = -Math.PI/2 - Math.PI/n2 + j * 2*Math.PI/n2;
                        if(j===0) ctx.moveTo(R2 * Math.cos(a2), R2 * Math.sin(a2)); else ctx.lineTo(R2 * Math.cos(a2), R2 * Math.sin(a2));
                    } ctx.closePath(); ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.stroke();
                } else {
                    // 정상 부착
                    ctx.translate(0, h);
                    ctx.beginPath(); ctx.setLineDash([5,5]); ctx.moveTo(-s/2, 0); ctx.lineTo(s/2, 0); ctx.stroke(); ctx.setLineDash([]);
                    
                    let R2 = (s/2) / Math.sin(Math.PI/n2); let apo2 = (s/2) / Math.tan(Math.PI/n2);
                    ctx.translate(0, apo2);
                    ctx.beginPath();
                    for(let j=0; j<n2; j++) {
                        let a2 = -Math.PI/2 - Math.PI/n2 + j * 2*Math.PI/n2;
                        if(j===0) ctx.moveTo(R2 * Math.cos(a2), R2 * Math.sin(a2)); else ctx.lineTo(R2 * Math.cos(a2), R2 * Math.sin(a2));
                    } ctx.closePath(); ctx.fillStyle = '#bfdbfe'; ctx.fill(); ctx.stroke();
                }
            }
        }
        ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
}

// --- 4. 다각형 넓이 복습 ---
function drawAreaShape(type, p1, p2, p3) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 3; ctx.strokeStyle = '#1e3a8a'; ctx.fillStyle = '#dbeafe';
    const cx = canvas.width / 2, cy = canvas.height / 2;
    let scale, bw, hh, tw, offset, w, h;

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

    function drawText(text, x, y, color) {
        ctx.font = 'bold 28px "Noto Sans KR"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 5; ctx.strokeStyle = '#ffffff'; ctx.strokeText(text, x, y); 
        ctx.fillStyle = color; ctx.fillText(text, x, y);
    }
}

function drawCanvasIcon(icon, title) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#f8fafc'; ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.font = '60px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, canvas.width/2, canvas.height/2 - 10);
    ctx.fillStyle = '#4f46e5'; ctx.font = 'bold 20px "Noto Sans KR"'; ctx.fillText(title, canvas.width/2, canvas.height/2 + 50);
}

// 메인 출제 로직
function generateProblem() {
    if (state.problemCount > state.maxProblems) { finishGame(); return; }
    state.attempts = 0; els.count.innerText = state.problemCount; els.progress.style.width = `${((state.problemCount - 1) / state.maxProblems) * 100}%`;
    els.ansInput.value = ''; els.feedback.innerText = ''; els.nextBtn.classList.add('hidden'); els.hintBox.classList.add('hidden');
    els.ansInput.disabled = false; const oxBtns = els.oxArea.querySelectorAll('button'); oxBtns.forEach(b => {b.disabled=false; b.classList.remove('opacity-50');});

    let mode = els.gameMode.value;
    if (mode === 'all') {
        let pool = ['elements', 'concept', 'reverse', 'area'];
        if (els.shapeMode.value !== 'pyramid') { pool.push('net'); pool.push('hard_net'); } 
        mode = pool[getRandomInt(0, pool.length - 1)];
    }

    if (mode === 'elements') generateElements();
    else if (mode === 'concept') generateConceptOX();
    else if (mode === 'reverse') generateReverse();
    else if (mode === 'net') generateNet(false); 
    else if (mode === 'hard_net') generateNet(true); 
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
        if(qType===0){ans=n+2; hint=`위아래 밑면 2개 + 옆면 ${n}개`;}else if(qType===1){ans=n*3; hint=`화면 속 모서리를 세어보세요!`;}else{ans=n*2; hint=`위에 ${n}개, 아래 ${n}개`;}
    } else {
        if(qType===0){ans=n+1; hint=`바닥 밑면 1개 + 옆면 ${n}개`;}else if(qType===1){ans=n*2; hint=`바닥 변 ${n}개 + 기둥 모서리 ${n}개`;}else{ans=n+1; hint=`바닥에 꼭짓점 ${n}개, 맨 위 꼭짓점 1개`;}
    }
    els.questionText.innerHTML = `위 <span class="text-indigo-600 font-bold">${shapeName}</span>의 <span class="text-red-600 border-b-2 border-red-400">${propName}의 수</span>는 몇 개일까요?`;
    els.hintText.innerText = hint; state.currentProblem = { ans: ans, type: 'input', mode: 'normal' };
}

function generateConceptOX() {
    setUiMode('ox'); const shapeMode = els.shapeMode.value; let isPrism = Math.random() < 0.5;
    if(shapeMode === 'prism') isPrism = true; if(shapeMode === 'pyramid') isPrism = false;
    const n = getRandomInt(3, 8), shapeNames = ["", "", "", "삼", "사", "오", "육", "칠", "팔"], name = `${shapeNames[n]}각${isPrism ? '기둥' : '뿔'}`;
    draw3DShape(n, isPrism); 
    
    let qList = [];
    if (isPrism) {
        qList.push({ q: `위 도형의 두 밑면은 서로 평행하고 합동입니다.`, ans: "O", hint: "위아래 면이 평행하고 크기가 똑같아요." });
        qList.push({ q: `위 도형의 옆면은 모두 삼각형입니다.`, ans: "X", hint: "각기둥의 옆면은 '직사각형'입니다." });
        qList.push({ q: `밑면의 모양이 ${n}각형이므로, 위 도형의 이름은 '${name}'입니다.`, ans: "O", hint: `밑면의 변의 개수를 세어보세요.` });
    } else {
        qList.push({ q: `위 도형의 옆면은 모두 직사각형입니다.`, ans: "X", hint: "뿔처럼 모이는 도형의 옆면은 '삼각형'이에요." });
        qList.push({ q: `위 도형의 밑면은 1개입니다.`, ans: "O", hint: "바닥에 닿는 면이 1개뿐이에요." });
        qList.push({ q: `밑면의 모양이 ${n}각형이므로, 위 도형의 이름은 '${name}'입니다.`, ans: "O", hint: `바닥 다각형의 변의 개수를 세어보세요.` });
    }
    
    const qObj = qList[getRandomInt(0, qList.length - 1)];
    els.questionText.innerHTML = `설명이 맞으면 O, 틀리면 X를 고르세요.<br><br><span class="text-indigo-600 font-bold">"${qObj.q}"</span>`;
    els.hintText.innerText = qObj.hint; state.currentProblem = { ans: qObj.ans, type: 'OX', mode: 'normal' };
}

function generateReverse() {
    setUiMode('input'); const shapeMode = els.shapeMode.value; let isPrism = Math.random() < 0.5;
    if(shapeMode === 'prism') isPrism = true; if(shapeMode === 'pyramid') isPrism = false;
    const n = getRandomInt(4, 10), qType = getRandomInt(0, 2), properties = ["면", "모서리", "꼭짓점"], propName = properties[qType];
    let givenNum = 0, hint = "";
    if (isPrism) { if(qType===0){givenNum=n+2; hint="(전체 면의 수 - 2) = 밑면의 변의 수";}else if(qType===1){givenNum=n*3; hint="(전체 모서 수 ÷ 3) = 밑면의 변의 수";}else{givenNum=n*2; hint="(전체 꼭짓점 수 ÷ 2) = 밑면의 변의 수";} } 
    else { if(qType===0){givenNum=n+1; hint="(전체 면의 수 - 1) = 밑면의 변의 수";}else if(qType===1){givenNum=n*2; hint="(전체 모서리 수 ÷ 2) = 밑면의 변의 수";}else{givenNum=n+1; hint="(전체 꼭짓점 수 - 1) = 밑면의 변의 수";} }
    drawCanvasIcon('❓', '무엇일까요?');
    els.questionText.innerHTML = `<span class="text-red-600 border-b-2 border-red-400">${propName}의 수가 ${givenNum}개</span>인 <span class="text-indigo-600 font-bold">${isPrism ? '각기둥' : '각뿔'}</span>이 있습니다. <br>이 도형의 밑면은 몇 각형일까요?`;
    els.hintText.innerText = hint; state.currentProblem = { ans: n, type: 'input', mode: 'normal' };
}

// ⭐ [전면 개편] 전개도 탐구 100% O/X 모드 및 다양한 함정 출제 (안전 로직 포함)
function generateNet(isHard) {
    setUiMode('ox'); 
    
    // 시각적 구분이 되도록 3각형~6각형 위주로 생성
    const n = getRandomInt(3, 6); 
    const shapeNames = ["", "", "", "삼", "사", "오", "육"];
    const shapeName = `${shapeNames[n]}각기둥`;

    const isValid = Math.random() < 0.5; 

    let nTop = n, nBottom = n, sideCount = n;
    let topIndices = [getRandomInt(0, n-1)];
    let bottomIndices = [getRandomInt(0, n-1)];
    let hint = "";
    
    // 이전에 발생했던 스코프 버그 해결을 위해 미리 선언
    let errType = -1; 

    if (isValid) {
        hint = `밑면의 위치와 모양, 옆면의 개수가 정확해 완벽하게 접히는 ${shapeName}이 됩니다.`;
    } else {
        errType = isHard ? getRandomInt(0, 5) : getRandomInt(0, 3);
        
        if (errType === 0) { 
            sideCount = Math.random() < 0.5 ? n - 1 : n + 1;
            if(sideCount < 3) sideCount = 4;
            topIndices = [getRandomInt(0, sideCount - 1)];
            bottomIndices = [getRandomInt(0, sideCount - 1)];
            hint = `밑면은 ${n}각형인데 연결된 직사각형(옆면)이 ${sideCount}개라 짝이 안 맞아요.`;
        } 
        else if (errType === 1) { 
            bottomIndices = [];
            let t1 = getRandomInt(0, sideCount - 1);
            let t2 = getRandomInt(0, sideCount - 1);
            while(t1 === t2 && sideCount > 1) t2 = getRandomInt(0, sideCount - 1); 
            topIndices = [t1, t2];
            hint = `두 밑면이 같은 쪽에 붙어있어 접으면 겹치고 반대쪽은 뚫려요.`;
        } 
        else if (errType === 2) { 
            bottomIndices = [];
            hint = `밑면이 1개뿐이라 각기둥 뚜껑이 안 닫혀요.`;
        }
        else if (errType === 3) {
            nBottom = n === 3 ? 4 : (Math.random() < 0.5 ? n - 1 : n + 1);
            hint = `윗면은 ${nTop}각형, 아랫면은 ${nBottom}각형이라 모양이 서로 달라요.`;
        }
        else if (errType === 4 && isHard) {
            hint = `밑면이 직사각형의 짧은 변이 아닌 '긴 쪽 가장자리'에 잘못 붙어있어요.`;
        }
        else if (errType === 5 && isHard) {
            hint = `전개도를 접었을 때 두 밑면이 같은 공간에서 겹치게 됩니다.`;
        }
    }

    let usePropeller = false;
    if (isHard) {
        if (!isValid && errType === 4) usePropeller = true;
        else if (!isValid && errType === 5) usePropeller = true;
        else if (!isValid && errType === 1) usePropeller = false; 
        else usePropeller = Math.random() < 0.6;
    }

    if (usePropeller) {
        drawPropellerNet(n, isValid, errType);
        els.questionText.innerHTML = `🔥 하드모드: 이 전개도를 접어 완벽한 <span class="text-indigo-600 font-bold">${shapeName}</span>을(를) 만들 수 있을까요?`;
    } else {
        drawOffsetNet(nTop, nBottom, sideCount, topIndices, bottomIndices);
        if (isHard) els.questionText.innerHTML = `🔥 하드모드: 이 전개도를 접어 완벽한 <span class="text-indigo-600 font-bold">${shapeName}</span>을(를) 만들 수 있을까요?`;
        else els.questionText.innerHTML = `이 전개도를 접어 올바른 <span class="text-indigo-600 font-bold">${shapeName}</span>을(를) 만들 수 있을까요?`;
    }

    els.hintText.innerText = hint; 
    state.currentProblem = { ans: isValid ? "O" : "X", type: 'OX', mode: isHard ? 'hard_net' : 'normal' };
}

function setUiMode(mode) {
    if(mode === 'ox') { els.inputArea.classList.add('hidden'); els.inputArea.classList.remove('flex'); els.oxArea.classList.remove('hidden'); els.oxArea.classList.add('flex'); } 
    else { els.inputArea.classList.remove('hidden'); els.inputArea.classList.add('flex'); els.oxArea.classList.add('hidden'); els.oxArea.classList.remove('flex'); els.ansInput.focus(); }
}

// ⭐ [채점 로직] 단판 승부 및 하드모드 +20/-20점
function checkAnswer(choice) {
    if(!els.nextBtn.classList.contains('hidden')) return;
    let correct = false, uAns = choice;
    
    if(state.currentProblem.type !== 'OX') {
        uAns = Number(els.ansInput.value);
        if(isNaN(uAns) || els.ansInput.value === '') { alert("숫자를 입력해주세요!"); return; }
    }
    
    if(uAns === state.currentProblem.ans) correct = true;
    
    if(state.currentProblem.type === 'OX') {
        let pointValue = (state.currentProblem.mode === 'hard_net') ? 20 : 10;
        
        if(correct) {
            state.score += pointValue; els.score.innerText = state.score; 
            els.feedback.innerHTML = `<span class='text-green-600 animate-bounce font-bold'>🎉 정확합니다! (+${pointValue}점)</span>`; 
            fireConfetti(); endProblem();
        } else {
            state.score -= pointValue; els.score.innerText = state.score; 
            els.feedback.innerHTML = `<span class='text-red-600 font-bold'>아쉽네요. 정답은 '${state.currentProblem.ans}'입니다. (-${pointValue}점 감점)</span>`; 
            els.hintBox.classList.remove('hidden'); endProblem(); 
        }
        return; 
    }

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

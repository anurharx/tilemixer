const fileEl = document.getElementById('file');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasFull = document.getElementById('canvasFull');
const ctxFull = canvasFull.getContext('2d');
const downloadLink = document.getElementById('download');
const actions = document.getElementById('actions');

const colPlus = document.getElementById('colPlus');
const colMinus = document.getElementById('colMinus');
const rowPlus = document.getElementById('rowPlus');
const rowMinus = document.getElementById('rowMinus');
const colsValEl = document.getElementById('colsVal');
const rowsValEl = document.getElementById('rowsVal');
const shuffleBtn = document.getElementById('shuffleBtn');
const clearBtn = document.getElementById('clearBtn');
const toggleNumbers = document.getElementById('toggleNumbers');
const downloadTilesBtn = document.getElementById('downloadTiles');
downloadLink.classList.add('hidden');
downloadTilesBtn.classList.add('hidden');


const mainWrap = document.querySelector('.main-wrap');

let cols = 3, rows = 3;
let currentImg = null, lastTiles = null;
let showNumbers = true;
let userToggleState = true;

let previewLayout = {
  scale: 1,
  colWidths: [],    
  rowHeights: [],  
  colX: [],        
  rowY: []        
};

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function updateButtons() {
  colPlus.disabled = cols >= 20;
  colMinus.disabled = cols <= 1;
  rowMinus.disabled = rows <= 1;
  rowPlus.disabled = rows >= 20;
}

function updateNumberToggle() {
  const disabled = (cols > 10) || (rows > 10);
  if (toggleNumbers) {
    toggleNumbers.disabled = disabled;
    const parent = toggleNumbers.parentElement;
    if (parent) parent.title = disabled ? 'Numbering disabled when columns or rows exceed 10' : 'Show tile numbers';
    if (disabled) {
      toggleNumbers.checked = false;
      showNumbers = false;
    } else {
      toggleNumbers.checked = userToggleState;
      showNumbers = userToggleState;
    }
  }
}

function setCols(n) {
  cols = Math.max(1, Math.min(20, n));
  colsValEl.textContent = cols;
  updateButtons();
  updateNumberToggle();
}

function setRows(n) {
  rows = Math.max(1, Math.min(20, n));
  rowsValEl.textContent = rows;
  updateButtons();
  updateNumberToggle();
}

function drawFromTiles(tiles, colWidths, rowHeights, ctxTarget = ctx, canvasTarget = canvas, showNumbersOpt = showNumbers) {
  ctxTarget.clearRect(0, 0, canvasTarget.width, canvasTarget.height);
  let colX = [0], rowY = [0];
  for (let c = 1; c < colWidths.length; c++) colX[c] = colX[c - 1] + colWidths[c - 1];
  for (let r = 1; r < rowHeights.length; r++) rowY[r] = rowY[r - 1] + rowHeights[r - 1];
  let idx = 0;
  for (let r = 0; r < rowHeights.length; r++) {
    for (let c = 0; c < colWidths.length; c++) {
      const tile = tiles[idx], dx = colX[c], dy = rowY[r];
      ctxTarget.drawImage(tile.canvas, dx, dy);
      if (showNumbersOpt) {
        const padX = Math.max(6, Math.round(Math.min(colWidths[c], rowHeights[r]) * 0.045));
        const rectW = Math.min(72, Math.round(Math.min(colWidths[c], rowHeights[r]) * 0.18));
        const rectH = Math.min(40, Math.round(Math.min(colWidths[c], rowHeights[r]) * 0.12));
        ctxTarget.fillStyle = "rgba(0,0,0,0.55)";
        ctxTarget.fillRect(dx + padX, dy + padX, rectW, rectH);
        ctxTarget.fillStyle = "white";
        ctxTarget.font = `bold ${Math.max(12, Math.round(rectH * 0.6))}px sans-serif`;
        ctxTarget.textBaseline = "middle"; ctxTarget.textAlign = "left";
        ctxTarget.fillText(String(tile.originalIndex), dx + padX + Math.round(rectW * 0.12), dy + padX + rectH / 2);
      }
      idx++;
    }
  }
}

function drawPreview(tiles, colWidths, rowHeights) {
  const srcW = colWidths.reduce((a, b) => a + b, 0);
  const srcH = rowHeights.reduce((a, b) => a + b, 0);
  let scale = 1;
  if (srcW > 400) scale = 400 / srcW;
  canvas.width = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);

  const previewColWidths = colWidths.map(w => Math.round(w * scale));
  const previewRowHeights = rowHeights.map(h => Math.round(h * scale));
  let colX = [0], rowY = [0];
  for (let c = 1; c < previewColWidths.length; c++) colX[c] = colX[c - 1] + previewColWidths[c - 1];
  for (let r = 1; r < previewRowHeights.length; r++) rowY[r] = rowY[r - 1] + previewRowHeights[r - 1];

  previewLayout = {
    scale,
    colWidths: previewColWidths,
    rowHeights: previewRowHeights,
    colX,
    rowY
  };

  let idx = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < previewRowHeights.length; r++) {
    for (let c = 0; c < previewColWidths.length; c++) {
      const tile = tiles[idx], dx = colX[c], dy = rowY[r];
      ctx.drawImage(tile.canvas, 0, 0, tile.canvas.width, tile.canvas.height, dx, dy, previewColWidths[c], previewRowHeights[r]);
      if (showNumbers) {
        const padX = Math.max(6, Math.round(Math.min(previewColWidths[c], previewRowHeights[r]) * 0.045));
        const rectW = Math.min(72, Math.round(Math.min(previewColWidths[c], previewRowHeights[r]) * 0.18));
        const rectH = Math.min(40, Math.round(Math.min(previewColWidths[c], previewRowHeights[r]) * 0.12));
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(dx + padX, dy + padX, rectW, rectH);
        ctx.fillStyle = "white";
        ctx.font = `bold ${Math.max(12, Math.round(rectH * 0.6))}px sans-serif`;
        ctx.textBaseline = "middle"; ctx.textAlign = "left";
        ctx.fillText(String(tile.originalIndex), dx + padX + Math.round(rectW * 0.12), dy + padX + rectH / 2);
      }
      idx++;
    }
  }
}

let dragState = null; 

function getTileIndexAtPreviewPos(px, py) {
  const { colX, rowY, colWidths, rowHeights } = previewLayout;
  if (!colX || !rowY) return -1;
  let col = -1, row = -1;
  for (let c = 0; c < colX.length; c++) {
    const x0 = colX[c], x1 = x0 + colWidths[c];
    if (px >= x0 && px < x1) { col = c; break; }
  }
  for (let r = 0; r < rowY.length; r++) {
    const y0 = rowY[r], y1 = y0 + rowHeights[r];
    if (py >= y0 && py < y1) { row = r; break; }
  }
  if (col === -1 || row === -1) return -1;
  return row * previewLayout.colWidths.length + col;
}

function createGhostCanvas(tileIndex) {
  const tile = lastTiles.tiles[tileIndex];
  if (!tile) return null;

  const s = previewLayout.scale || 1;
  const displayW = Math.max(8, Math.round(tile.canvas.width * s));
  const displayH = Math.max(8, Math.round(tile.canvas.height * s));

  const ghost = document.createElement('canvas');
  ghost.width = displayW;
  ghost.height = displayH;

  ghost.style.width = displayW + 'px';
  ghost.style.height = displayH + 'px';

  const gctx = ghost.getContext('2d');
  gctx.drawImage(tile.canvas, 0, 0, tile.canvas.width, tile.canvas.height, 0, 0, displayW, displayH);

  ghost.className = 'drag-ghost';
  document.body.appendChild(ghost);
  return ghost;
}

canvas.addEventListener('pointerdown', function (ev) {
  if (!lastTiles || !lastTiles.tiles) return;
  if (canvasWrap.classList.contains('loading')) return;
  if (ev.button && ev.button !== 0) return;
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (ev.clientX - rect.left) * scaleX;
  const py = (ev.clientY - rect.top) * scaleY;

  const idx = getTileIndexAtPreviewPos(px, py);
  if (idx < 0 || idx >= lastTiles.tiles.length) return;
  canvas.setPointerCapture(ev.pointerId);
  const ghost = createGhostCanvas(idx);
  if (!ghost) return;
  dragState = {
    startIndex: idx,
    pointerId: ev.pointerId,
    ghost,
    offsetX: ev.clientX,
    offsetY: ev.clientY
  };
  ghost.style.left = `${ev.clientX}px`;
  ghost.style.top = `${ev.clientY}px`;
  canvasWrap.classList.add('dragging');
});

canvas.addEventListener('pointermove', function (ev) {
  if (!dragState || dragState.pointerId !== ev.pointerId) return;
  ev.preventDefault();
  const ghost = dragState.ghost;
  if (!ghost) return;
  ghost.style.left = `${ev.clientX}px`;
  ghost.style.top = `${ev.clientY}px`;
});

async function finishDrag(ev) {
  if (!dragState) return;
  const ghost = dragState.ghost;

  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (ev.clientX - rect.left) * scaleX;
  const py = (ev.clientY - rect.top) * scaleY;

  const targetIdx = getTileIndexAtPreviewPos(px, py);
  const srcIdx = dragState.startIndex;

  if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  canvasWrap.classList.remove('dragging');
  if (targetIdx >= 0 && targetIdx < lastTiles.tiles.length && srcIdx !== targetIdx) {
    const arr = lastTiles.tiles;
    const tmp = arr[srcIdx];
    arr[srcIdx] = arr[targetIdx];
    arr[targetIdx] = tmp;
    
    const srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
    const baseW = Math.floor(srcW / cols), baseH = Math.floor(srcH / rows);
    const cw = new Array(cols).fill(baseW); cw[cols - 1] = srcW - baseW * (cols - 1);
    const rh = new Array(rows).fill(baseH); rh[rows - 1] = srcH - baseH * (rows - 1);
    drawFromTiles(arr, cw, rh, ctxFull, canvasFull, showNumbers);
    drawPreview(arr, cw, rh);
    lastTiles.tiles = arr;
  }
 
  try { canvas.releasePointerCapture(dragState.pointerId); } catch (e) {}
  dragState = null;
}

canvas.addEventListener('pointerup', function (ev) {
  finishDrag(ev);
});
canvas.addEventListener('pointercancel', function (ev) {
  finishDrag(ev);
});

function generate(useCache = false) {
  if (!currentImg) return;
  let srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
  canvasFull.width = srcW; canvasFull.height = srcH;
  let baseTileW = Math.floor(srcW / cols), baseTileH = Math.floor(srcH / rows);
  let colWidths = new Array(cols).fill(baseTileW); colWidths[cols - 1] = srcW - baseTileW * (cols - 1);
  let rowHeights = new Array(rows).fill(baseTileH); rowHeights[rows - 1] = srcH - baseTileH * (rows - 1);

  if (useCache && lastTiles && lastTiles.cols === cols && lastTiles.rows === rows) {
    shuffleArray(lastTiles.tiles);
    drawFromTiles(lastTiles.tiles, colWidths, rowHeights, ctxFull, canvasFull, showNumbers);
    drawPreview(lastTiles.tiles, colWidths, rowHeights);
    downloadLink.classList.remove('hidden');
    downloadTilesBtn.classList.remove('hidden');
    return;
  }

  let tiles = [], origIndex = 1;
  let colX = [0], rowY = [0];
  for (let c = 1; c < cols; c++) colX[c] = colX[c - 1] + colWidths[c - 1];
  for (let r = 1; r < rows; r++) rowY[r] = rowY[r - 1] + rowHeights[r - 1];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sx = colX[c], sy = rowY[r], sw = colWidths[c], sh = rowHeights[r];
      const tileCanvas = document.createElement('canvas'); tileCanvas.width = sw; tileCanvas.height = sh;
      tileCanvas.getContext('2d').drawImage(currentImg, sx, sy, sw, sh, 0, 0, sw, sh);
      tiles.push({ canvas: tileCanvas, originalIndex: origIndex, row: r+1, col: c+1 }); origIndex++;
    }
  }
  shuffleArray(tiles);
  lastTiles = { tiles: tiles.slice(), cols, rows };
  drawFromTiles(tiles, colWidths, rowHeights, ctxFull, canvasFull, showNumbers);
  drawPreview(tiles, colWidths, rowHeights);
  downloadLink.classList.remove('hidden');
  downloadTilesBtn.classList.remove('hidden');
}

downloadLink.onclick = function () {
  if (!currentImg || !lastTiles) return;
  const srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
  const baseTileW = Math.floor(srcW / cols), baseTileH = Math.floor(srcH / rows);
  const colWidths = new Array(cols).fill(baseTileW); colWidths[cols - 1] = srcW - baseTileW * (cols - 1);
  const rowHeights = new Array(rows).fill(baseTileH); rowHeights[rows - 1] = srcH - baseTileH * (rows - 1);
  drawFromTiles(lastTiles.tiles, colWidths, rowHeights, ctxFull, canvasFull, showNumbers);
  downloadLink.href = canvasFull.toDataURL("image/jpeg", 0.95);
};

downloadTilesBtn.onclick = async function() {
  if (!lastTiles || !lastTiles.tiles) return;
  const zip = new JSZip();

  const tasks = lastTiles.tiles.map(async tile => {
    const temp = document.createElement('canvas');
    temp.width = tile.canvas.width;
    temp.height = tile.canvas.height;
    const tctx = temp.getContext('2d');
    tctx.drawImage(tile.canvas, 0, 0);

    if (showNumbers) {
      const sw = temp.width, sh = temp.height;
      const padX = Math.max(6, Math.round(Math.min(sw, sh) * 0.045));
      const rectW = Math.min(72, Math.round(Math.min(sw, sh) * 0.18));
      const rectH = Math.min(40, Math.round(Math.min(sw, sh) * 0.12));
      tctx.fillStyle = "rgba(0,0,0,0.55)";
      tctx.fillRect(padX, padX, rectW, rectH);
      tctx.fillStyle = "white";
      tctx.font = `bold ${Math.max(12, Math.round(rectH * 0.6))}px sans-serif`;
      tctx.textBaseline = "middle"; tctx.textAlign = "left";
      tctx.fillText(String(tile.originalIndex), padX + Math.round(rectW * 0.12), padX + rectH / 2);
    }

    const blob = await new Promise(resolve => {
      try {
        temp.toBlob(resolve, 'image/jpeg', 0.95);
      } catch (e) {
        resolve(null);
      }
    });

    if (blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = `tile_row${tile.row}_col${tile.col}.jpg`;
      zip.file(fileName, arrayBuffer);
    } else {
      const dataUrl = temp.toDataURL('image/jpeg', 0.95);
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const len = binary.length;
      const uint8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) uint8[i] = binary.charCodeAt(i);
      const fileName = `tile_row${tile.row}_col${tile.col}.jpg`;
      zip.file(fileName, uint8);
    }
  });

  await Promise.all(tasks);

  const blobZip = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blobZip);
  a.download = 'tilemixer_tiles.zip';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};

const canvasWrap = document.getElementById('canvasWrap');
const dropArea = document.getElementById('dropArea');

const _allowedExt = ['jpg','jpeg','png','webp','gif'];
function isValidImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  const name = (file.name || '').toLowerCase();
  const idx = name.lastIndexOf('.');
  if (idx === -1) return false;
  const ext = name.slice(idx + 1);
  return _allowedExt.includes(ext);
}

async function loadFileAsImage(file) {
  if (!file || !isValidImageFile(file)) {
    alert('Unsupported file. Please use a JPG or PNG image.');
    return;
  }
  const img = new Image();
  img.src = URL.createObjectURL(file);
  try {
    await img.decode();
  } catch (e) {}
  currentImg = img;
  lastTiles = null;
  generate();
  actions.classList.remove("hidden");
  canvasWrap.classList.add('has-image');
  mainWrap.classList.add('image-loaded');
  updateNumberToggle();
}

fileEl.addEventListener('change', async ev => {
  if (!ev.target.files.length) return;
  const file = ev.target.files[0];
  if (!isValidImageFile(file)) {
    alert('Unsupported file. Please select a JPG or PNG image.');
    fileEl.value = '';
    return;
  }
  await loadFileAsImage(file);
});


['dragenter', 'dragover'].forEach(evName => {
  canvasWrap.addEventListener(evName, e => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentImg) dropArea.classList.add('drop-hover');
  });
});

['dragleave', 'dragend', 'mouseout'].forEach(evName => {
  canvasWrap.addEventListener(evName, e => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('drop-hover');
  });
});

canvasWrap.addEventListener('drop', async e => {
  e.preventDefault();
  e.stopPropagation();
  dropArea.classList.remove('drop-hover');
  if (currentImg) return;
  const dt = e.dataTransfer;
  if (!dt || !dt.files || dt.files.length === 0) return;
  const file = dt.files[0];
  if (!isValidImageFile(file)) {
    alert('Unsupported file dropped. Please drop a JPG or PNG image.');
    return;
  }
  await loadFileAsImage(file);
});

clearBtn.onclick = ()=>{
  currentImg=null; lastTiles=null; fileEl.value="";
  ctx.clearRect(0,0,canvas.width,canvas.height);
  canvas.width=0; canvas.height=0;
  downloadLink.classList.add('hidden');
  downloadTilesBtn.classList.add('hidden');
  actions.classList.add("hidden");
  ctxFull.clearRect(0,0,canvasFull.width,canvasFull.height);
  canvasFull.width=0; canvasFull.height=0;
  canvasWrap.classList.remove('has-image');
  mainWrap.classList.remove('image-loaded');
  
  toggleNumbers.checked = true;
  showNumbers = true;
  userToggleState = true;
  updateNumberToggle();
};

toggleNumbers.addEventListener('change',()=>{
  showNumbers=toggleNumbers.checked;
  userToggleState = toggleNumbers.checked;
  if(lastTiles && currentImg){
    const srcW=currentImg.naturalWidth,srcH=currentImg.naturalHeight;
    const baseW=Math.floor(srcW/cols),baseH=Math.floor(srcH/rows);
    const cw=new Array(cols).fill(baseW); cw[cols-1]=srcW-baseW*(cols-1);
    const rh=new Array(rows).fill(baseH); rh[rows-1]=srcH-baseH*(rows-1);
    drawFromTiles(lastTiles.tiles,cw,rh,ctxFull,canvasFull,showNumbers);
    drawPreview(lastTiles.tiles,cw,rh);
  }
});

setCols(cols); setRows(rows);

function showLoader() {
  if (!canvasWrap) return;
  canvasWrap.classList.add('loading');
  const l = document.getElementById('ctLoader');
  if (l) l.setAttribute('aria-hidden', 'false');

  [colPlus, colMinus, rowPlus, rowMinus].forEach(btn => {
    if (btn) btn.disabled = true;
  });
}
function hideLoader() {
  if (!canvasWrap) return;
  canvasWrap.classList.remove('loading');
  const l = document.getElementById('ctLoader');
  if (l) l.setAttribute('aria-hidden', 'true');

  [colPlus, colMinus, rowPlus, rowMinus].forEach(btn => {
    if (btn) btn.disabled = false;
  });
  
  updateButtons();
}


colPlus.onclick = () => {
  showLoader();
  
  setTimeout(() => {
    setCols(cols + 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};
colMinus.onclick = () => {
  showLoader();
  setTimeout(() => {
    setCols(cols - 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};
rowPlus.onclick = () => {
  showLoader();
  setTimeout(() => {
    setRows(rows + 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};
rowMinus.onclick = () => {
  showLoader();
  setTimeout(() => {
    setRows(rows - 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};


shuffleBtn.onclick = () => {
  if (!lastTiles) {
    showLoader();
    setTimeout(() => { generate(); hideLoader(); }, 60);
    return;
  }
  shuffleArray(lastTiles.tiles);
  const srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
  const baseW = Math.floor(srcW / cols), baseH = Math.floor(srcH / rows);
  const cw = new Array(cols).fill(baseW); cw[cols - 1] = srcW - baseW * (cols - 1);
  const rh = new Array(rows).fill(baseH); rh[rows - 1] = srcH - baseH * (rows - 1);
  drawFromTiles(lastTiles.tiles, cw, rh, ctxFull, canvasFull, showNumbers);
  drawPreview(lastTiles.tiles, cw, rh);
};

const darkModeToggle = document.getElementById('darkModeToggle');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

function updateIcon(isDarkMode) {
  if (isDarkMode) {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  
  updateIcon(isDarkMode);
});

const savedDarkMode = localStorage.getItem('darkMode') === 'true';
if (savedDarkMode) {
  document.body.classList.add('dark-mode');
}
updateIcon(savedDarkMode);


(function () {
    let activeId = null;
    let isActive = false;

    function dispatchMouseEvent(type, touch, target) {
    const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1,
        screenX: touch.screenX,
        screenY: touch.screenY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
    });
    (target || document.elementFromPoint(touch.clientX, touch.clientY) || document.body).dispatchEvent(evt);
    }

    function isInteractiveTarget(node) {
    return !!node && !!node.closest && !!node.closest('.canvas-wrap, .drop-area, #canvas, .tile, [draggable]');
    }

    document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const target = document.elementFromPoint(t.clientX, t.clientY);
    if (!isInteractiveTarget(target)) return;
    activeId = t.identifier;
    isActive = true;
    e.preventDefault(); 
    dispatchMouseEvent('mousemove', t, target);
    dispatchMouseEvent('mousedown', t, target);
    }, { passive: false });

    document.addEventListener('touchmove', function (e) {
    if (!isActive) return;
    for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.identifier === activeId) {
        const target = document.elementFromPoint(t.clientX, t.clientY) || e.target;
        e.preventDefault();
        dispatchMouseEvent('mousemove', t, target);
        break;
        }
    }
    }, { passive: false });

    document.addEventListener('touchend', function (e) {
    if (!isActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === activeId) {
        const target = document.elementFromPoint(t.clientX, t.clientY) || e.target;
        e.preventDefault();
        dispatchMouseEvent('mouseup', t, target);
        
        dispatchMouseEvent('click', t, target);
        activeId = null;
        isActive = false;
        break;
        }
    }
    }, { passive: false });

    document.addEventListener('touchcancel', function () {
    activeId = null;
    isActive = false;
    });
})();

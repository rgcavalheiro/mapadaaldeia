(function () {
  'use strict';

  const MAP_CONFIG = {
    minX: 31744,
    minY: 30976,
    width: 2048,
    height: 2048,
    tileSizePx: 32,
    thaisX: 32369,
    thaisY: 32241,
    thaisZ: 7
  };

  const wrapper = document.getElementById('map-wrapper');
  const container = document.getElementById('map-container');
  const canvas = document.getElementById('map-canvas');
  const mapImage = document.getElementById('map-image');
  const floorSelect = document.getElementById('floor-select');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const centerThaisBtn = document.getElementById('center-thais');
  const coordXEl = document.getElementById('coord-x');
  const coordYEl = document.getElementById('coord-y');
  const coordZEl = document.getElementById('coord-z');

  let scale = 0.5;
  let posX = 0;
  let posY = 0;
  let isDragging = false;
  let startX, startY, startPosX, startPosY;
  let useImage = false;
  let lastMapWidth = 0;
  let lastMapHeight = 0;

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 3;

  function getCanvasSize() {
    var w, h;
    if (useImage) {
      w = mapImage.naturalWidth || lastMapWidth;
      h = mapImage.naturalHeight || lastMapHeight;
    } else {
      w = canvas.width;
      h = canvas.height;
    }
    return { w, h };
  }

  function drawPlaceholder() {
    const ctx = canvas.getContext('2d');
    const { w, h } = getCanvasSize();
    const ts = MAP_CONFIG.tileSizePx;

    ctx.fillStyle = '#1e2a1e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#2a3a2a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += ts) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += ts) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const thaisPixel = worldToPixel(MAP_CONFIG.thaisX, MAP_CONFIG.thaisY);
    ctx.fillStyle = 'rgba(200, 178, 115, 0.4)';
    ctx.beginPath();
    ctx.arc(thaisPixel.x, thaisPixel.y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c8b273';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#c8b273';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thais', thaisPixel.x, thaisPixel.y + 4);

    ctx.fillStyle = '#5a6a5a';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tibia 7.1', w / 2, h / 2 - 20);
    ctx.font = '20px sans-serif';
    ctx.fillText('Exporte o mapa 7.1 do RME e coloque em exportremeres/ (veja GUIA_MAPA_7.1.md)', w / 2, h / 2 + 20);
  }

  function worldToPixel(wx, wy) {
    const relX = (wx - MAP_CONFIG.minX) / MAP_CONFIG.width;
    const relY = (wy - MAP_CONFIG.minY) / MAP_CONFIG.height;
    const { w, h } = getCanvasSize();
    return {
      x: Math.round(relX * w),
      y: Math.round(relY * h)
    };
  }

  function pixelToWorld(px, py) {
    const { w, h } = getCanvasSize();
    const relX = px / w;
    const relY = py / h;
    const wx = MAP_CONFIG.minX + relX * MAP_CONFIG.width;
    const wy = MAP_CONFIG.minY + relY * MAP_CONFIG.height;
    return { x: Math.floor(wx), y: Math.floor(wy) };
  }

  function applyTransform() {
    const { w, h } = getCanvasSize();
    container.style.transform = 'translate(' + posX + 'px, ' + posY + 'px) scale(' + scale + ') translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) translate(' + (w / 2) + 'px, ' + (h / 2) + 'px)';
  }

  function updateCoordDisplay(clientX, clientY) {
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (clientX - centerX - posX) / scale;
    const dy = (clientY - centerY - posY) / scale;
    const { w, h } = getCanvasSize();
    const px = w / 2 + dx;
    const py = h / 2 + dy;
    if (px >= 0 && px <= w && py >= 0 && py <= h) {
      const world = pixelToWorld(px, py);
      coordXEl.textContent = world.x;
      coordYEl.textContent = world.y;
    }
    coordZEl.textContent = parseInt(floorSelect.value, 10);
  }

  function updateHash() {
    const z = parseInt(floorSelect.value, 10);
    const { w, h } = getCanvasSize();
    const centerX = w / 2 - posX / scale;
    const centerY = h / 2 - posY / scale;
    const world = pixelToWorld(centerX, centerY);
    const hash = '#' + world.x + ',' + world.y + ',' + z;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', window.location.pathname + hash);
    }
  }

  function readHash() {
    const hash = window.location.hash.slice(1);
    const match = hash.match(/^(\d+),(\d+),(\d+)$/);
    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      const z = parseInt(match[3], 10);
      floorSelect.value = String(z);
      const p = worldToPixel(x, y);
      const { w, h } = getCanvasSize();
      posX = (w / 2 - p.x) * scale;
      posY = (h / 2 - p.y) * scale;
      applyTransform();
      coordXEl.textContent = x;
      coordYEl.textContent = y;
      coordZEl.textContent = z;
    }
  }

  function centerOnThais() {
    const p = worldToPixel(MAP_CONFIG.thaisX, MAP_CONFIG.thaisY);
    const { w, h } = getCanvasSize();
    posX = (w / 2 - p.x) * scale;
    posY = (h / 2 - p.y) * scale;
    floorSelect.value = String(MAP_CONFIG.thaisZ);
    applyTransform();
    coordXEl.textContent = MAP_CONFIG.thaisX;
    coordYEl.textContent = MAP_CONFIG.thaisY;
    coordZEl.textContent = MAP_CONFIG.thaisZ;
    updateHash();
  }

  wrapper.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startPosX = posX;
    startPosY = posY;
  });

  window.addEventListener('mousemove', function (e) {
    updateCoordDisplay(e.clientX, e.clientY);
    if (isDragging) {
      posX = startPosX + (e.clientX - startX);
      posY = startPosY + (e.clientY - startY);
      applyTransform();
    }
  });

  window.addEventListener('mouseup', function (e) {
    if (e.button === 0) {
      isDragging = false;
      updateHash();
    }
  });

  wrapper.addEventListener('wheel', function (e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
    const rect = wrapper.getBoundingClientRect();
    const vx = e.clientX - rect.left - rect.width / 2;
    const vy = e.clientY - rect.top - rect.height / 2;
    const { w, h } = getCanvasSize();
    const mapX = (vx - posX) / scale + w / 2;
    const mapY = (vy - posY) / scale + h / 2;
    scale = newScale;
    posX = vx - (mapX - w / 2) * scale;
    posY = vy - (mapY - h / 2) * scale;
    applyTransform();
    updateHash();
  }, { passive: false });

  zoomInBtn.addEventListener('click', function () {
    scale = Math.min(MAX_SCALE, scale + 0.15);
    applyTransform();
    updateHash();
  });

  zoomOutBtn.addEventListener('click', function () {
    scale = Math.max(MIN_SCALE, scale - 0.15);
    applyTransform();
    updateHash();
  });

  floorSelect.addEventListener('change', function () {
    coordZEl.textContent = this.value;
    loadFloorMap(this.value);
    updateHash();
  });

  var MAP_FOLDER = 'exportremeres';

  function getFloorFilePath(z) {
    var n = parseInt(z, 10);
    return MAP_FOLDER + '/Tibia71_' + n + '.bmp';
  }

  function loadFloorMap(z) {
    var path = getFloorFilePath(z);
    var img = new Image();
    img.onload = function () {
      lastMapWidth = img.naturalWidth;
      lastMapHeight = img.naturalHeight;
      MAP_CONFIG.width = lastMapWidth;
      MAP_CONFIG.height = lastMapHeight;
      mapImage.src = path;
      mapImage.style.width = lastMapWidth + 'px';
      mapImage.style.height = lastMapHeight + 'px';
      useImage = true;
      mapImage.classList.remove('hidden');
      canvas.classList.add('hidden');
      if (window.location.hash) {
        readHash();
      } else {
        centerOnThais();
      }
      applyTransform();
    };
    img.onerror = function () {
      useImage = false;
      mapImage.classList.add('hidden');
      canvas.classList.remove('hidden');
      drawPlaceholder();
      readHash();
      applyTransform();
    };
    img.src = path;
  }

  centerThaisBtn.addEventListener('click', centerOnThais);

  window.addEventListener('hashchange', readHash);

  window.addEventListener('resize', function () {
    applyTransform();
  });

  var initialZ = 7;
  var hashMatch = window.location.hash.slice(1).match(/^(\d+),(\d+),(\d+)$/);
  if (hashMatch) initialZ = parseInt(hashMatch[3], 10);
  floorSelect.value = String(initialZ);
  loadFloorMap(String(initialZ));

  setTimeout(function () {
    if (!useImage) {
      drawPlaceholder();
      readHash();
      applyTransform();
    }
  }, 3000);
})();

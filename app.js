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

  var SPAWN_OFFSET_PX = { x: -66, y: -392 };

  const wrapper = document.getElementById('map-wrapper');
  const container = document.getElementById('map-container');
  const mapContentWrapper = document.getElementById('map-content-wrapper');
  const spawnsOverlay = document.getElementById('spawns-overlay');
  const spawnsCanvas = document.getElementById('spawns-canvas');
  const spawnTooltip = document.getElementById('spawn-tooltip');
  const canvas = document.getElementById('map-canvas');
  const mapImage = document.getElementById('map-image');
  const floorSelect = document.getElementById('floor-select');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const centerThaisBtn = document.getElementById('center-thais');
  const spawnSearchInput = document.getElementById('spawn-search');
  const spawnsToggle = document.getElementById('spawns-toggle');
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
  var spawnsByFloor = {};
  var spawnsLoaded = false;
  var currentMarkerData = [];
  var lastSpawnScale = null;
  var spawnSearchQuery = '';
  var spawnsVisible = false;

  const MIN_SCALE = 0.1;
  const MAX_SCALE = 15;
  const ZOOM_STEP = 1.2;

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
    ctx.fillText('Exporte o mapa 7.1 do RME e coloque em exportremeres/', w / 2, h / 2 + 20);
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

  function loadSpawns() {
    fetch('tibia71_UI/Tibia74-spawns.xml')
      .then(function (r) { return r.text(); })
      .then(function (xmlText) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlText, 'text/xml');
        var spawns = doc.querySelectorAll('spawns > spawn');
        var byFloor = {};
        spawns.forEach(function (spawnEl) {
          var centerx = parseInt(spawnEl.getAttribute('centerx'), 10);
          var centery = parseInt(spawnEl.getAttribute('centery'), 10);
          var centerz = parseInt(spawnEl.getAttribute('centerz'), 10);
          spawnEl.querySelectorAll('monster').forEach(function (m) {
            var ox = parseInt(m.getAttribute('x'), 10) || 0;
            var oy = parseInt(m.getAttribute('y'), 10) || 0;
            var wx = centerx + ox;
            var wy = centery + oy;
            var name = (m.getAttribute('name') || '').trim();
            if (!name) return;
            var z = centerz;
            if (!byFloor[z]) byFloor[z] = {};
            var key = wx + ',' + wy;
            if (!byFloor[z][key]) byFloor[z][key] = { wx: wx, wy: wy, list: [] };
            byFloor[z][key].list.push({ name: name, type: 'monster' });
          });
          spawnEl.querySelectorAll('npc').forEach(function (n) {
            var ox = parseInt(n.getAttribute('x'), 10) || 0;
            var oy = parseInt(n.getAttribute('y'), 10) || 0;
            var wx = centerx + ox;
            var wy = centery + oy;
            var name = (n.getAttribute('name') || '').trim();
            if (!name) return;
            var z = centerz;
            if (!byFloor[z]) byFloor[z] = {};
            var key = wx + ',' + wy;
            if (!byFloor[z][key]) byFloor[z][key] = { wx: wx, wy: wy, list: [] };
            byFloor[z][key].list.push({ name: name, type: 'npc' });
          });
        });
        spawnsByFloor = byFloor;
        spawnsLoaded = true;
        renderSpawnMarkers(parseInt(floorSelect.value, 10));
      })
      .catch(function () {
        spawnsLoaded = true;
        renderSpawnMarkers(parseInt(floorSelect.value, 10));
      });
  }

  function renderSpawnMarkers(floorZ) {
    currentMarkerData = [];
    if (!mapContentWrapper.style.width || !spawnsCanvas) return;
    if (!spawnsVisible) {
      var cw = parseInt(mapContentWrapper.style.width, 10);
      var ch = parseInt(mapContentWrapper.style.height, 10);
      if (spawnsCanvas.width && spawnsCanvas.height) {
        var ctx = spawnsCanvas.getContext('2d');
        ctx.clearRect(0, 0, spawnsCanvas.width, spawnsCanvas.height);
      }
      return;
    }
    var floor = spawnsByFloor[floorZ];
    if (!floor) return;
    var list = Object.keys(floor).map(function (k) { return floor[k]; });
    if (spawnSearchQuery) {
      var q = spawnSearchQuery.toLowerCase().trim();
      list = list.filter(function (item) {
        return item.list.some(function (x) {
          return x.name.toLowerCase().indexOf(q) >= 0;
        });
      });
    }
    var minX = MAP_CONFIG.minX;
    var minY = MAP_CONFIG.minY;
    var w = MAP_CONFIG.width;
    var h = MAP_CONFIG.height;
    var cw = parseInt(mapContentWrapper.style.width, 10) || w;
    var ch = parseInt(mapContentWrapper.style.height, 10) || h;
    if (spawnsCanvas.width !== cw || spawnsCanvas.height !== ch) {
      spawnsCanvas.width = cw;
      spawnsCanvas.height = ch;
    }
    var ctx = spawnsCanvas.getContext('2d');
    ctx.clearRect(0, 0, cw, ch);
    var radius = Math.max(2, Math.min(60, 7 / scale));
    var monsterFill = 'rgba(220, 80, 80, 0.85)';
    var monsterStroke = 'rgba(0,0,0,0.6)';
    var npcFill = 'rgba(100, 200, 255, 0.85)';
    var npcStroke = 'rgba(0,0,0,0.5)';
    list.forEach(function (item) {
      var wx = item.wx;
      var wy = item.wy;
      if (wx < minX || wx >= minX + w || wy < minY || wy >= minY + h) return;
      var p = worldToPixel(wx, wy);
      p.x += SPAWN_OFFSET_PX.x;
      p.y += SPAWN_OFFSET_PX.y;
      var first = item.list[0];
      var type = first.type;
      var names = [];
      var seen = {};
      item.list.forEach(function (x) {
        if (!seen[x.name]) { seen[x.name] = true; names.push(x.name); }
      });
      var label = names.join(', ');
      if (item.list.length > 1) label = label + ' (' + item.list.length + ')';
      currentMarkerData.push({ px: p.x, py: p.y, label: label, type: type, radius: radius });
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = type === 'npc' ? npcFill : monsterFill;
      ctx.fill();
      ctx.strokeStyle = type === 'npc' ? npcStroke : monsterStroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    lastSpawnScale = scale;
  }

  function applyTransform() {
    const { w, h } = getCanvasSize();
    container.style.transform = 'translate(' + posX + 'px, ' + posY + 'px) scale(' + scale + ') translate(' + (-w / 2) + 'px, ' + (-h / 2) + 'px) translate(' + (w / 2) + 'px, ' + (h / 2) + 'px)';
    if (lastSpawnScale !== scale) {
      renderSpawnMarkers(parseInt(floorSelect.value, 10));
    }
  }

  function getMouseMapPixel(clientX, clientY) {
    var rect = wrapper.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var dx = (clientX - centerX - posX) / scale;
    var dy = (clientY - centerY - posY) / scale;
    var sz = getCanvasSize();
    return { px: sz.w / 2 + dx, py: sz.h / 2 + dy };
  }

  function getMarkerAt(px, py) {
    var hitRadius = Math.max(8, 14 / scale);
    for (var i = 0; i < currentMarkerData.length; i++) {
      var m = currentMarkerData[i];
      var dx = px - m.px;
      var dy = py - m.py;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return m;
    }
    return null;
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
      posY = (w / 2 - p.y) * scale;
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
    posY = (w / 2 - p.y) * scale;
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
    var rect = wrapper.getBoundingClientRect();
    var overMap = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    var mp = overMap ? getMouseMapPixel(e.clientX, e.clientY) : null;
    var marker = mp ? getMarkerAt(mp.px, mp.py) : null;
    if (spawnTooltip) {
      if (marker) {
        spawnTooltip.textContent = marker.label;
        spawnTooltip.style.left = (e.clientX + 14) + 'px';
        spawnTooltip.style.top = (e.clientY + 14) + 'px';
        spawnTooltip.classList.add('visible');
        wrapper.style.cursor = 'pointer';
      } else {
        spawnTooltip.classList.remove('visible');
        spawnTooltip.textContent = '';
        wrapper.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    }
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
    const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
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
    scale = Math.min(MAX_SCALE, scale * ZOOM_STEP);
    applyTransform();
    updateHash();
  });

  zoomOutBtn.addEventListener('click', function () {
    scale = Math.max(MIN_SCALE, scale / ZOOM_STEP);
    applyTransform();
    updateHash();
  });

  floorSelect.addEventListener('change', function () {
    coordZEl.textContent = this.value;
    loadFloorMap(this.value);
    updateHash();
  });

  if (spawnSearchInput) {
    spawnSearchInput.addEventListener('input', function () {
      spawnSearchQuery = this.value;
      renderSpawnMarkers(parseInt(floorSelect.value, 10));
    });
  }

  if (spawnsToggle) {
    spawnsToggle.addEventListener('change', function () {
      spawnsVisible = this.checked;
      renderSpawnMarkers(parseInt(floorSelect.value, 10));
    });
  }

  window.addEventListener('keydown', function (e) {
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      var z = parseInt(floorSelect.value, 10);
      if (e.key === 'PageUp' && z < 15) {
        floorSelect.value = String(z + 1);
        floorSelect.dispatchEvent(new Event('change'));
        e.preventDefault();
      } else if (e.key === 'PageDown' && z > 0) {
        floorSelect.value = String(z - 1);
        floorSelect.dispatchEvent(new Event('change'));
        e.preventDefault();
      }
    }
  });

  loadSpawns();

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
      mapContentWrapper.style.width = lastMapWidth + 'px';
      mapContentWrapper.style.height = lastMapHeight + 'px';
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
      renderSpawnMarkers(parseInt(z, 10));
    };
    img.onerror = function () {
      useImage = false;
      mapImage.classList.add('hidden');
      canvas.classList.remove('hidden');
      MAP_CONFIG.width = canvas.width;
      MAP_CONFIG.height = canvas.height;
      mapContentWrapper.style.width = canvas.width + 'px';
      mapContentWrapper.style.height = canvas.height + 'px';
      drawPlaceholder();
      readHash();
      applyTransform();
      renderSpawnMarkers(parseInt(z, 10));
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

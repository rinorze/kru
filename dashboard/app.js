/* Paneli DMA Kçiq — prototype.
   Real: building positions, elevations, bands (data.js).
   Simulated (seeded, repeatable): customers, readings, flows, pressures. */
(function () {
  var D = window.KCIQ;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (x, d) { return x.toLocaleString('sq-AL', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };

  // ---------- seeded random ----------
  var seed = 20261113;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function gauss() { return Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); }
  function dist(a, b) { var dy = (a[0] - b[0]) * 111320, dx = (a[1] - b[1]) * 81600; return Math.sqrt(dx * dx + dy * dy); }

  // ---------- baseline assumptions (see research report) ----------
  var N_CUST = 552;           // households, census 2024
  var BILLED = 252;           // m3/day, from Mitrovica unit average per customer
  var APPARENT = 90;          // m3/day consumed but not billed (assumption)
  var REAL = 358;             // m3/day leakage (assumption, gives 64% NRW)
  var TARIFF = 0.53;          // EUR/m3 household 2026
  var LEGIT_NIGHT = N_CUST * 1.7 / 1000; // m3/h
  var BAND = ['A', 'B', 'C'];
  var COL = ['#f08c00', '#e3b505', '#d62839'];

  // ---------- customers ----------
  var idx = D.b.map(function (_, i) { return i; });
  for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  var cust = idx.slice(0, N_CUST).map(function (bi, n) {
    var base = Math.exp(Math.log(13) + 0.45 * gauss());
    var m = [];
    for (var k = 0; k < 12; k++) { var season = 1 + 0.25 * Math.sin((k - 2) / 12 * 2 * Math.PI); m.push(Math.max(0.5, base * season * (1 + 0.1 * gauss()))); }
    return { code: 'K-' + (10001 + n), bi: bi, m: m, flag: null };
  });
  var noCustB = idx.slice(N_CUST);

  // injected anomalies
  var pick = function () { return cust[Math.floor(rnd() * cust.length)]; };
  for (i = 0; i < 9; i++) { var c = pick(); if (!c.flag) { c.exp = c.m[11]; c.m[9] = c.m[10] = c.m[11] = 0; c.flag = 'zero'; } }
  for (i = 0; i < 7; i++) { c = pick(); if (!c.flag) { c.exp = c.m[11]; for (var k2 = 8; k2 < 12; k2++) c.m[k2] *= 0.3; c.flag = 'drop'; } }
  cust.forEach(function (c) { c.avg = c.m.reduce(function (a, b) { return a + b; }, 0) / 12; });
  cust.forEach(function (c) {
    if (c.flag) return;
    var near = cust.filter(function (o) { return o !== c; })
      .map(function (o) { return [dist(D.b[c.bi], D.b[o.bi]), o.avg]; })
      .sort(function (a, b) { return a[0] - b[0]; }).slice(0, 8)
      .map(function (x) { return x[1]; }).sort(function (a, b) { return a - b; });
    var med = (near[3] + near[4]) / 2;
    if (c.avg < 0.25 * med) { c.flag = 'low'; c.exp = med; }
  });
  var anomalies = cust.filter(function (c) { return c.flag; }).map(function (c) {
    var last = c.m[11];
    return { c: c, last: last, lost: Math.max(0, c.exp - (c.flag === 'low' ? c.avg : last)) };
  }).sort(function (a, b) { return b.lost - a.lost; });

  // billing <-> GIS mismatches
  var suspects = noCustB.map(function (bi) {
    var dmin = 1e9;
    cust.forEach(function (c) { var d = dist(D.b[bi], D.b[c.bi]); if (d < dmin) dmin = d; });
    return { bi: bi, d: dmin };
  }).filter(function (s) { return s.d > 35; }).sort(function (a, b) { return b.d - a.d; });
  var nNoGis = Math.round(N_CUST * (56536 - 54020) / 56536); // same ratio as the whole company
  var noGis = [];
  for (i = 0; i < nNoGis; i++) noGis.push({ code: 'K-' + (10600 + i), m3: Math.exp(Math.log(13) + 0.4 * gauss()) });

  // ---------- flows: 14 days hourly ----------
  var PAT = [0.14, 0.12, 0.11, 0.11, 0.13, 0.35, 1.0, 1.75, 1.85, 1.5, 1.3, 1.25, 1.35, 1.3, 1.1, 1.0, 1.1, 1.4, 1.75, 1.8, 1.5, 1.0, 0.55, 0.25];
  var ps = PAT.reduce(function (a, b) { return a + b; }, 0) / 24;
  var DAYS = 14, LEAK_AT = 9 * 24 + 14, EXTRA = 3.2;
  var end = new Date(2026, 10, 12); // last full day: 12 Nov 2026
  var dayLab = [], flow = [], hourLab = [];
  for (var d = 0; d < DAYS; d++) {
    var dt = new Date(end); dt.setDate(end.getDate() - (DAYS - 1 - d));
    dayLab.push(dt.getDate() + '.' + (dt.getMonth() + 1));
    for (var h = 0; h < 24; h++) {
      var cons = (BILLED + APPARENT) / 24 * PAT[h] / ps * (1 + 0.06 * gauss());
      var leak = REAL / 24 * (h < 6 ? 1.07 : 0.975) * (1 + 0.015 * gauss());
      if (d * 24 + h >= LEAK_AT) leak += EXTRA;
      flow.push(cons + leak);
      hourLab.push(h === 12 ? dayLab[d] : '');
    }
  }
  var daily = [], mnf = [], billedD = [];
  for (d = 0; d < DAYS; d++) {
    var s = 0; for (h = 0; h < 24; h++) s += flow[d * 24 + h];
    daily.push(s);
    mnf.push((flow[d * 24 + 2] + flow[d * 24 + 3]) / 2);
    billedD.push(BILLED * (1 + 0.02 * gauss()));
  }
  var base = mnf.slice(0, 7).reduce(function (a, b) { return a + b; }, 0) / 7, thr = base * 1.10;
  var alarmDay = -1;
  for (d = 1; d < DAYS; d++) if (mnf[d] > thr && mnf[d - 1] > thr) { alarmDay = d; break; }

  // ---------- KPIs ----------
  var avg7 = function (a) { return a.slice(-7).reduce(function (x, y) { return x + y; }, 0) / 7; };
  var inAvg = avg7(daily), billAvg = avg7(billedD), nrw = inAvg - billAvg;
  $('kIn').textContent = fmt(inAvg);
  $('kBill').textContent = fmt(billAvg);
  $('kNrw').textContent = fmt(nrw);
  $('kNrwPct').textContent = 'm³/ditë · ' + fmt(nrw / inAvg * 100) + '%';
  $('kMnf').textContent = fmt(mnf[DAYS - 1], 1);
  if (alarmDay >= 0) $('kMnfBox').classList.add('alarm');
  $('kCases').textContent = anomalies.length + suspects.length + noGis.length;

  // ---------- map ----------
  var map = L.map('map', { preferCanvas: true }).setView([42.8645, 20.9235], 15);
  var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  var sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri' });
  var gB = L.layerGroup().addTo(map), gS = L.layerGroup().addTo(map), gX = L.layerGroup().addTo(map), gA = L.layerGroup().addTo(map), gP = L.layerGroup().addTo(map);
  L.polygon(D.hull, { color: '#0d3552', weight: 2, dashArray: '6 5', fillOpacity: 0.03, interactive: false }).addTo(map);
  var zmin = Math.min.apply(null, D.b.map(function (b) { return b[2]; }));
  D.b.forEach(function (b) {
    L.circleMarker([b[0], b[1]], { radius: 3.5, weight: 0, fillColor: COL[b[3]], fillOpacity: 0.85 })
      .bindPopup('Brezi ' + BAND[b[3]] + '<br>Lartësia: ' + fmt(b[2]) + ' m<br>' + fmt((b[2] - zmin) / 10.2, 1) + ' bar më pak se pika më e ulët').addTo(gB);
  });
  var SENS = [
    { id: 'DMA01-P-KRIT', v: 2.4 }, { id: 'DMA01-P-ULET', v: 7.1 }, { id: 'DMA01-P-AZP', v: 4.3 }
  ];
  D.sensors.forEach(function (s, k) {
    SENS[k].name = s.n; SENS[k].elev = s.elev; SENS[k].ll = [s.lat, s.lon];
    L.circleMarker([s.lat, s.lon], { radius: 9, color: '#fff', weight: 2, fillColor: '#0b6fb8', fillOpacity: 1 })
      .bindPopup('<b>' + SENS[k].id + '</b><br>' + s.n + '<br>Lartësia: ' + fmt(s.elev) + ' m<br>Presioni (simuluar): ' + SENS[k].v + ' bar').addTo(gS);
  });
  D.pois.forEach(function (p) {
    L.circleMarker([p.lat, p.lon], { radius: 6, color: '#0d3552', weight: 2, fillColor: '#fff', fillOpacity: 1 }).bindPopup('<b>' + p.n + '</b><br>Konsumator i madh: kandidat për ujëmatës smart').addTo(gP);
  });
  suspects.forEach(function (s) {
    var b = D.b[s.bi];
    s.mk = L.circleMarker([b[0], b[1]], { radius: 7, color: '#7b3fc4', weight: 2.5, fillOpacity: 0 }).bindPopup('<b>Objekt pa klient</b><br>' + fmt(s.d) + ' m nga klienti më i afërt').addTo(gX);
  });
  anomalies.forEach(function (a) {
    var b = D.b[a.c.bi];
    a.mk = L.circleMarker([b[0], b[1]], { radius: 7, color: '#111', weight: 2.5, fillOpacity: 0 }).bindPopup('<b>' + a.c.code + '</b><br>' + flagText(a.c.flag)).addTo(gA);
  });
  L.control.layers({ 'Hartë': osm, 'Satelit': sat }, { 'Ndërtesat': gB, 'Sensorët': gS, 'Objekte pa klient': gX, 'Anomali ujëmatësi': gA, 'Konsumatorë të mëdhenj': gP }, { collapsed: true }).addTo(map);
  function fly(mk) { map.setView(mk.getLatLng(), 18); mk.openPopup(); }

  function flagText(f) { return f === 'zero' ? 'Lexim zero 3 muaj rresht' : f === 'drop' ? 'Rënie e papritur rreth 70%' : 'Shumë nën fqinjët'; }
  function flagTag(f) { return '<span class="tag ' + (f === 'zero' ? 'r' : f === 'drop' ? 'o' : 'p') + '">' + flagText(f) + '</span>'; }

  // ---------- tab: balance ----------
  var nrwD = daily.map(function (x, k) { return x - billedD[k]; });
  new Chart($('cBal'), {
    type: 'bar',
    data: { labels: dayLab, datasets: [
      { label: 'I faturuar', data: billedD, backgroundColor: '#0b6fb8' },
      { label: 'I pafaturuar', data: nrwD, backgroundColor: '#f2a65a' }] },
    options: { maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: 'm³/ditë' } } }, plugins: { legend: { position: 'bottom' } } }
  });
  $('balBoxes').innerHTML =
    '<div class="box res"><small>Humbje reale (rrjedhje), vlerësim</small><b>' + fmt(nrw - APPARENT) + ' m³/ditë</b></div>' +
    '<div class="box res"><small>Humbje komerciale, vlerësim</small><b>' + fmt(APPARENT) + ' m³/ditë</b></div>' +
    '<div class="box res"><small>Vlera vjetore e UPF me tarifën 0.53 €/m³</small><b>' + fmt(nrw * 365 * TARIFF) + ' €</b></div>';
  $('tSens').innerHTML = '<tr><th>ID e sensorit</th><th>Pozita</th><th class="num">Lartësia</th><th class="num">Vlera</th><th>Statusi</th></tr>' +
    '<tr><td>DMA01-Q-HYRJA</td><td>Matësi i hyrjes</td><td class="num">–</td><td class="num">' + fmt(flow[flow.length - 1], 1) + ' m³/orë</td><td>ok</td></tr>' +
    SENS.map(function (s, k) {
      return '<tr class="click" data-s="' + k + '"><td>' + s.id + '</td><td>' + s.name.replace(/^P\d /, '').replace(' – logger presioni', '') + '</td><td class="num">' + fmt(s.elev) + ' m</td><td class="num">' + s.v + ' bar</td><td>ok</td></tr>';
    }).join('');
  $('tSens').addEventListener('click', function (e) { var r = e.target.closest('tr[data-s]'); if (r) { map.setView(SENS[+r.dataset.s].ll, 17); } });

  // ---------- tab: night flow ----------
  if (alarmDay >= 0) {
    var extra = mnf[DAYS - 1] - base;
    $('mnfAlert').innerHTML = '<div class="box bad"><b>Alarm: rrjedhje e re e mundshme që nga ' + dayLab[alarmDay - 1] + '.</b><br>Prurja e natës u rrit nga ' + fmt(base, 1) + ' në ' + fmt(mnf[DAYS - 1], 1) + ' m³/orë (+' + fmt(extra, 1) + ' m³/orë, rreth ' + fmt(extra * 24) + ' m³/ditë, ' + fmt(extra * 24 * 365 * 0.25) + ' € në vit me 0.25 €/m³). Veprimi: test me hapa dhe detektim akustik.</div>';
  } else {
    $('mnfAlert').innerHTML = '<div class="box ok"><b>Pa alarm.</b> Prurja e natës është brenda kufirit.</div>';
  }
  new Chart($('cFlow'), {
    type: 'line',
    data: { labels: hourLab, datasets: [{ label: 'Prurja në hyrje, m³/orë', data: flow, borderColor: '#0b6fb8', borderWidth: 1.5, pointRadius: 0, tension: 0.3 }] },
    options: { maintainAspectRatio: false, scales: { x: { ticks: { autoSkip: false, maxRotation: 0 }, grid: { display: false } }, y: { beginAtZero: true, title: { display: true, text: 'm³/orë' } } }, plugins: { legend: { position: 'bottom' } } }
  });
  new Chart($('cMnf'), {
    type: 'line',
    data: { labels: dayLab, datasets: [
      { label: 'Prurja minimale e natës', data: mnf, borderColor: '#0d3552', backgroundColor: mnf.map(function (v) { return v > thr ? '#c62828' : '#0d3552'; }), pointRadius: 5, borderWidth: 2 },
      { label: 'Kufiri i alarmit (+10%)', data: mnf.map(function () { return thr; }), borderColor: '#c62828', borderDash: [6, 4], pointRadius: 0, borderWidth: 1.5 },
      { label: 'Konsumi legjitim i natës', data: mnf.map(function () { return LEGIT_NIGHT; }), borderColor: '#1a8f5a', borderDash: [2, 3], pointRadius: 0, borderWidth: 1.5 }] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: 'm³/orë' } } }, plugins: { legend: { position: 'bottom' } } }
  });

  // ---------- tab: pressure simulator ----------
  var nb = [0, 0, 0]; D.b.forEach(function (b) { nb[b[3]]++; });
  function sim() {
    var p0 = +$('iP0').value, p1 = Math.min(+$('iP1').value, p0), n1 = +$('iN1').value, cost = +$('iCost').value || 0;
    $('vP0').textContent = p0.toFixed(1); $('vP1').textContent = p1.toFixed(1);
    var wA = nb[0] * p0, wB = nb[1] * 4.5, wC = nb[2] * 3;
    var leakA = REAL * wA / (wA + wB + wC);
    var newA = leakA * Math.pow(p1 / p0, n1), saved = leakA - newA;
    var newNrw = (REAL + APPARENT - saved) / (BILLED + REAL + APPARENT - saved) * 100;
    $('prsRes').innerHTML =
      '<small>Rrjedhja në brezin A sot</small><b>' + fmt(leakA) + ' m³/ditë</b>' +
      '<small>Pas uljes së presionit</small><b>' + fmt(newA) + ' m³/ditë</b>' +
      '<small>Ujë i kursyer</small><b style="color:var(--ok)">' + fmt(saved) + ' m³/ditë · ' + fmt(saved * 365) + ' m³/vit</b>' +
      '<small>Kursim vjetor</small><b style="color:var(--ok)">' + fmt(saved * 365 * cost) + ' €</b>' +
      '<small>UPF i zonës bie nga 64% në</small><b>' + fmt(newNrw) + '%</b>' +
      '<small>Kthimi i një investimi 15 000 €</small><b>' + (saved * cost > 0 ? fmt(15000 / (saved * 365 * cost) * 12, 1) + ' muaj' : '–') + '</b>';
  }
  ['iP0', 'iP1', 'iN1', 'iCost'].forEach(function (id) { $(id).addEventListener('input', sim); });
  sim();

  // ---------- tab: billing-GIS ----------
  $('gisBoxes').innerHTML =
    '<div class="box res"><small>Objekte pa klient, për verifikim</small><b>' + suspects.length + '</b><small>nga ' + noCustB.length + ' objekte pa klient gjithsej (shumica janë objekte ndihmëse)</small></div>' +
    '<div class="box res"><small>Klientë pa pikë në GIS</small><b>' + noGis.length + '</b><small>i njëjti raport si në gjithë kompaninë: 56 536 në faturim, 54 020 në GIS</small></div>';
  $('tNoCust').innerHTML = '<tr><th>#</th><th>Brezi</th><th class="num">Lartësia</th><th class="num">Larg klientit më të afërt</th></tr>' +
    suspects.map(function (s, k) { var b = D.b[s.bi]; return '<tr class="click" data-k="' + k + '"><td>' + (k + 1) + '</td><td>' + BAND[b[3]] + '</td><td class="num">' + fmt(b[2]) + ' m</td><td class="num">' + fmt(s.d) + ' m</td></tr>'; }).join('');
  $('tNoCust').addEventListener('click', function (e) { var r = e.target.closest('tr[data-k]'); if (r) fly(suspects[+r.dataset.k].mk); });
  $('tNoGis').innerHTML = '<tr><th>Kodi i klientit</th><th>Adresa në faturim</th><th class="num">Mesatarja mujore</th></tr>' +
    noGis.map(function (g) { return '<tr><td>' + g.code + '</td><td>Kçiq i Madh, pa koordinata</td><td class="num">' + fmt(g.m3, 1) + ' m³</td></tr>'; }).join('');

  // ---------- tab: anomalies ----------
  var lostM = anomalies.reduce(function (a, b) { return a + b.lost; }, 0);
  $('anoSum').innerHTML = '<b>' + anomalies.length + ' ujëmatës të dyshimtë.</b> Vëllimi i pafaturuar i vlerësuar: ' + fmt(lostM) + ' m³/muaj, rreth ' + fmt(lostM * 12 * TARIFF) + ' € në vit me tarifën 0.53 €/m³.';
  $('tAno').innerHTML = '<tr><th>Klienti</th><th>Arsyeja</th><th class="num">Leximi i fundit</th><th class="num">I pritur</th><th class="num">Mungesa</th></tr>' +
    anomalies.map(function (a, k) {
      return '<tr class="click" data-k="' + k + '"><td>' + a.c.code + '</td><td>' + flagTag(a.c.flag) + '</td><td class="num">' + fmt(a.last, 1) + ' m³</td><td class="num">' + fmt(a.c.exp, 1) + ' m³</td><td class="num">' + fmt(a.lost, 1) + ' m³/muaj</td></tr>';
    }).join('');
  $('tAno').addEventListener('click', function (e) { var r = e.target.closest('tr[data-k]'); if (r) fly(anomalies[+r.dataset.k].mk); });

  // ---------- tabs ----------
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
    document.querySelectorAll('.pane').forEach(function (p) { p.classList.toggle('on', p.id === 'p-' + b.dataset.t); });
  });
})();

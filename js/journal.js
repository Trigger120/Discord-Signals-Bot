// Populate available months in filter dropdowns based on trade dates
function populateMonths() {
  var months = {};
  S.trades.forEach(function(t) {
    var d = new Date(t.date);
    var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    months[k] = true;
  });
  
  var now = new Date();
  var cur = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  if (!months[cur]) months[cur] = true;
  
  var keys = Object.keys(months).sort().reverse();
  
  ['monthFilter', 'dashMonth'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    
    var prev = sel.value || cur;
    sel.innerHTML = keys.map(function(k) {
      var parts = k.split('-');
      var lbl = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      return '<option value="' + k + '"' + (k === prev ? ' selected' : '') + '>' + lbl + '</option>';
    }).join('');
  });
}

// Get trade records filtered by active month selector
function getMonthTrades(selId) {
  var sel = document.getElementById(selId);
  if (!sel || !sel.value) return S.trades;
  
  var month = sel.value;
  return S.trades.filter(function(t) {
    var d = new Date(t.date);
    var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    return k === month;
  });
}

// Set status filters for trade logs table
function setFilter(el, f) {
  S.jFilter = f;
  document.querySelectorAll('.fbtn').forEach(function(b) {
    b.classList.remove('active');
  });
  el.classList.add('active');
  renderJournal();
}

// Render dynamic rows in Trade Journal table
function renderJournal() {
  var trades = getMonthTrades('monthFilter');
  if (S.jFilter !== 'ALL') {
    trades = trades.filter(function(t) {
      return t.status === S.jFilter;
    });
  }
  
  var tbody = document.getElementById('journalBody');
  if (!tbody) return;
  
  if (trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="13" class="no-data">No trades logged for this selection.</td></tr>';
    return;
  }
  
  tbody.innerHTML = trades.map(function(t, i) {
    var bc = t.status === 'WIN' ? 'b-win' : t.status === 'LOSS' ? 'b-loss' : t.status === 'BE' ? 'b-be' : 'b-open';
    var dc = t.dir === 'LONG' ? 'long-txt' : 'short-txt';
    var d = new Date(t.date);
    var ds = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    
    return '<tr>' +
      '<td style="color:var(--text-dark)">' + (i + 1) + '</td>' +
      '<td>' + ds + '</td>' +
      '<td style="font-weight:600;color:var(--text)">' + t.pair + '</td>' +
      '<td class="' + dc + '">' + t.dir + '</td>' +
      '<td>' + t.entry + '</td>' +
      '<td>' + t.sl + '</td>' +
      '<td>' + (t.tp1 || '-') + '</td>' +
      '<td>' + (t.tp2 || '-') + '</td>' +
      '<td>' + (t.tp3 || '-') + '</td>' +
      '<td>' + t.risk + '</td>' +
      '<td style="color:var(--gold); font-weight: 700;">' + (t.rr ? t.rr + 'R' : '-') + '</td>' +
      '<td><span class="badge ' + bc + '">' + t.status + '</span></td>' +
      '<td><button class="upd-btn" onclick="openUpdate(' + t.id + ')">Update</button></td>' +
    '</tr>';
  }).join('');
}

// Open update modal window
function openUpdate(id) {
  S.upId = id;
  S.upRes = '';
  
  document.querySelectorAll('#updateModal .res-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  
  document.getElementById('upRR').value = '';
  document.getElementById('upNote').value = '';
  
  var t = S.trades.find(function(x) { return x.id === id; });
  if (!t) return;
  
  var dc = t.dir === 'LONG' ? 'long-txt' : 'short-txt';
  var bc = t.status === 'WIN' ? 'b-win' : t.status === 'LOSS' ? 'b-loss' : t.status === 'BE' ? 'b-be' : 'b-open';
  
  document.getElementById('updateInfo').innerHTML =
    '<strong style="color:var(--text)">' + t.pair + '</strong> &nbsp; ' +
    '<span class="' + dc + '">' + t.dir + '</span> &nbsp; Entry: ' + t.entry + ' &nbsp; SL: ' + t.sl + '<br>' +
    'TP1: ' + (t.tp1 || '-') + ' &nbsp; TP2: ' + (t.tp2 || '-') + ' &nbsp; TP3: ' + (t.tp3 || '-') + '<br>' +
    'Risk: ' + t.risk + ' &nbsp; Status: <span class="badge ' + bc + '">' + t.status + '</span>';
  
  if (t.result) {
    S.upRes = t.result;
    var btn = Array.from(document.querySelectorAll('#updateModal .res-btn')).find(function(b) {
      return b.textContent.trim() === t.result;
    });
    if (btn) btn.classList.add('active');
  }
  
  if (t.rr) {
    document.getElementById('upRR').value = t.rr;
  }
  if (t.note) {
    document.getElementById('upNote').value = t.note;
  }
  
  openModal('updateModal');
}

// Update state selection
function setUpRes(el, r) {
  S.upRes = r;
  document.querySelectorAll('#updateModal .res-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  el.classList.add('active');
}

// Save update state
function saveUpdate() {
  if (!S.upRes) {
    toast('Select a result!', 'err');
    return;
  }
  
  var t = S.trades.find(function(x) { return x.id === S.upId; });
  if (!t) return;
  
  t.result = S.upRes;
  var rr = parseFloat(document.getElementById('upRR').value);
  if (!isNaN(rr)) {
    t.rr = rr;
  } else {
    t.rr = null;
  }
  
  t.note = document.getElementById('upNote').value;
  
  if (S.upRes.includes('TP') || S.upRes === 'FULL TP') {
    t.status = 'WIN';
  } else if (S.upRes === 'SL HIT' || S.upRes === 'CLOSED') {
    t.status = 'LOSS';
  } else if (S.upRes === 'BREAKEVEN') {
    t.status = 'BE';
  } else {
    t.status = 'OPEN';
  }
  
  saveTrades();
  closeModal('updateModal');
  renderJournal();
  renderDashboard();
  toast('Trade updated successfully!', 'ok');
}

// Open manual trade logger modal with default date set to today
function openAddManualTrade() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  document.getElementById('mDate').value = yyyy + '-' + mm + '-' + dd;
  
  openModal('addTradeModal');
}

// Read inputs and add trade manually into trades database
function addManualTrade() {
  var dateVal = document.getElementById('mDate').value;
  var pairVal = document.getElementById('mPair').value.trim().toUpperCase();
  var dirVal = document.getElementById('mDir').value;
  var entryVal = document.getElementById('mEntry').value;
  var slVal = document.getElementById('mSL').value;
  var tp1Val = document.getElementById('mTP1').value;
  var tp2Val = document.getElementById('mTP2').value;
  var tp3Val = document.getElementById('mTP3').value;
  var riskVal = document.getElementById('mRisk').value || '1R';
  var statusVal = document.getElementById('mStatus').value;
  var resultVal = document.getElementById('mResult').value;
  var rrVal = document.getElementById('mRR').value;
  var noteVal = document.getElementById('mNote').value;

  if (!pairVal) {
    toast('Please specify a pair!', 'err');
    return;
  }
  if (!entryVal) {
    toast('Please enter entry price!', 'err');
    return;
  }

  var dateObj = dateVal ? new Date(dateVal) : new Date();
  
  var calculatedRR = null;
  if (rrVal && !isNaN(parseFloat(rrVal))) {
    calculatedRR = parseFloat(rrVal);
  } else {
    var tpVal = tp1Val || tp2Val || tp3Val;
    if (tpVal) {
      calculatedRR = calcRR(parseFloat(entryVal), parseFloat(slVal), parseFloat(tpVal));
    }
  }

  var newTrade = {
    id: Date.now(),
    date: dateObj.toISOString(),
    pair: pairVal,
    dir: dirVal,
    entry: entryVal,
    sl: slVal || '',
    tp1: tp1Val || '',
    tp2: tp2Val || '',
    tp3: tp3Val || '',
    risk: riskVal,
    rr: calculatedRR ? parseFloat(calculatedRR).toFixed(2) : null,
    status: statusVal,
    result: resultVal || statusVal,
    note: noteVal || ''
  };

  S.trades.unshift(newTrade);
  saveTrades();

  closeModal('addTradeModal');
  populateMonths();
  renderJournal();
  renderDashboard();
  toast('Manual trade logged successfully!', 'ok');

  // Reset form inputs
  document.getElementById('mPair').value = 'XAUUSD';
  document.getElementById('mEntry').value = '';
  document.getElementById('mSL').value = '';
  document.getElementById('mTP1').value = '';
  document.getElementById('mTP2').value = '';
  document.getElementById('mTP3').value = '';
  document.getElementById('mRisk').value = '1R';
  document.getElementById('mNote').value = '';
  document.getElementById('mRR').value = '';
}

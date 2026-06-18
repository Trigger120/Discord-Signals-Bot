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
    tbody.innerHTML = '<tr><td colspan="14" class="no-data">No trades logged for this selection.</td></tr>';
    return;
  }
  
  tbody.innerHTML = trades.map(function(t, i) {
    var bc = t.status === 'WIN' ? 'b-win' : t.status === 'LOSS' ? 'b-loss' : t.status === 'BE' ? 'b-be' : 'b-open';
    var dc = t.dir === 'LONG' ? 'long-txt' : 'short-txt';
    var d = new Date(t.date);
    var ds = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    
    var pnlText = '-';
    var pnlStyle = '';
    if (t.pnl) {
      var pnlVal = parseFloat(t.pnl);
      if (!isNaN(pnlVal)) {
        pnlText = (pnlVal >= 0 ? '+' : '') + pnlVal.toFixed(2) + '%';
        pnlStyle = 'color:' + (pnlVal >= 0 ? 'var(--green)' : 'var(--red)') + '; font-weight: 600;';
      } else {
        pnlText = t.pnl;
      }
    }
    
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
      '<td style="' + pnlStyle + '">' + pnlText + '</td>' +
      '<td><span class="badge ' + bc + '">' + t.status + '</span></td>' +
      '<td><div style="display:flex; gap:6.0px;"><button class="upd-btn" onclick="openUpdate(' + t.id + ')">Update</button><button class="upd-btn" style="border-color:var(--red); color:var(--red);" onclick="deleteTrade(' + t.id + ', event)">Delete</button></div></td>' +
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
  document.getElementById('upPnL').value = t.pnl || '';
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
  
  var pnlVal = document.getElementById('upPnL').value.trim();
  t.pnl = pnlVal ? pnlVal : null;
  
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
  var pnlInputVal = document.getElementById('mPnL').value.trim();
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
    pnl: pnlInputVal ? pnlInputVal : null,
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
  document.getElementById('mPnL').value = '';
  document.getElementById('mNote').value = '';
  document.getElementById('mRR').value = '';
}

// Delete a trade log from the database
function deleteTrade(id, event) {
  if (event) event.stopPropagation();
  if (confirm('Are you sure you want to delete this trade log?')) {
    S.trades = S.trades.filter(function(t) {
      return t.id !== id;
    });
    saveTrades();
    populateMonths();
    renderJournal();
    renderDashboard();
    toast('Trade log deleted!', 'ok');
  }
}

// Export trade logs to structured PDF Report
function exportPDF() {
  var { jsPDF } = window.jspdf;
  if (!jsPDF) {
    toast('PDF Library is still loading. Please try again.', 'err');
    return;
  }
  
  var trades = getMonthTrades('monthFilter');
  if (!trades || trades.length === 0) {
    toast('No trades to export for this month!', 'err');
    return;
  }
  
  // Sort trades chronologically (oldest to newest) for a clean timeline
  trades = trades.slice().sort(function(a, b) {
    return new Date(a.date) - new Date(b.date);
  });
  
  var doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Color palette (Matching app dark & gold theme, optimized for printing)
  var cDark = [15, 23, 42];      // Dark slate blue text/headings
  var cMuted = [100, 116, 139];   // Muted slate gray
  var cGold = [245, 158, 11];     // Gold accent
  var cGreen = [16, 185, 129];    // Success green
  var cRed = [239, 68, 68];       // Alert red
  var cBlue = [59, 130, 246];     // Info blue
  
  // 1. Draw PDF Top Header (Branding block)
  // Draw a dark slate banner at the top
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 30, 'F');
  
  // Draw Gold accent strip below banner
  doc.setFillColor(245, 158, 11); // gold
  doc.rect(0, 30, 297, 1.5, 'F');
  
  // Header text inside banner
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TRIGGERXBT', 14, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11); // gold subtitle
  doc.setFont('Helvetica', 'normal');
  doc.text('SIGNAL HUB - TRADE PERFORMANCE JOURNAL', 14, 21);
  
  // Add right-aligned metadata inside banner
  var selMonth = document.getElementById('monthFilter');
  var monthText = selMonth ? selMonth.options[selMonth.selectedIndex].text : 'ALL DATA';
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('REPORT PERIOD: ' + monthText.toUpperCase(), 283, 14, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('GENERATED ON: ' + new Date().toLocaleDateString(), 283, 20, { align: 'right' });
  
  // 2. Compute Performance Stats for the Selected Month
  var total = trades.length;
  var wins = trades.filter(function(t) { return t.status === 'WIN'; }).length;
  var losses = trades.filter(function(t) { return t.status === 'LOSS'; }).length;
  var bes = trades.filter(function(t) { return t.status === 'BE'; }).length;
  var open = trades.filter(function(t) { return t.status === 'OPEN'; }).length;
  
  var closed = total - open;
  var winRate = closed > 0 ? ((wins / closed) * 100).toFixed(1) + '%' : '0%';
  
  var totalRR = 0;
  var totalPnL = 0;
  trades.forEach(function(t) {
    if (t.rr) totalRR += parseFloat(t.rr);
    if (t.pnl) {
      var val = parseFloat(t.pnl);
      if (!isNaN(val)) totalPnL += val;
    }
  });
  
  // 3. Draw Performance Metric Cards
  var drawMetricCard = function(x, y, w, h, label, value, valColor) {
    // Card background
    doc.setFillColor(248, 250, 252); // soft white gray
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    // Subtle border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, w, h, 2, 2, 'D');
    
    // Label text
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // muted gray
    doc.text(label.toUpperCase(), x + 4, y + 5.5);
    
    // Value text
    doc.setFontSize(15);
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.text(value, x + 4, y + 13.5);
  };
  
  // Draw 4 cards
  var cardY = 38;
  var cardW = 64;
  var cardH = 17;
  var spacing = 5;
  
  drawMetricCard(14, cardY, cardW, cardH, 'Total Trades logged', String(total) + ' (' + open + ' Open)', cDark);
  drawMetricCard(14 + cardW + spacing, cardY, cardW, cardH, 'Net Win Rate (Closed)', winRate, cGreen);
  drawMetricCard(14 + (cardW + spacing) * 2, cardY, cardW, cardH, 'Total Accumulated RR', (totalRR >= 0 ? '+' : '') + totalRR.toFixed(2) + 'R', cGold);
  drawMetricCard(14 + (cardW + spacing) * 3, cardY, cardW, cardH, 'Net Account Growth %', (totalPnL >= 0 ? '+' : '') + totalPnL.toFixed(2) + '%', totalPnL >= 0 ? cGreen : cRed);
  
  // 4. Draw structured Table of Trades
  var headers = [
    'Date', 'Pair', 'Dir', 'Entry', 'Stop Loss', 'TP 1', 'TP 2', 'TP 3', 'Risk', 'RR', 'Gain %', 'Status', 'Execution Note'
  ];
  
  var tableData = trades.map(function(t) {
    var d = new Date(t.date);
    var ds = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    var pnlText = '-';
    if (t.pnl) {
      var pnlVal = parseFloat(t.pnl);
      if (!isNaN(pnlVal)) {
        pnlText = (pnlVal >= 0 ? '+' : '') + pnlVal.toFixed(2) + '%';
      } else {
        pnlText = t.pnl;
      }
    }
    
    return [
      ds,
      t.pair,
      t.dir,
      t.entry,
      t.sl || '-',
      t.tp1 || '-',
      t.tp2 || '-',
      t.tp3 || '-',
      t.risk || '1R',
      t.rr ? t.rr + 'R' : '-',
      pnlText,
      t.status,
      t.note || ''
    ];
  });
  
  doc.autoTable({
    startY: 61,
    head: [headers],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [15, 23, 42],
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 }, // Date
      1: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }, // Pair
      2: { halign: 'center', cellWidth: 12 }, // Dir
      3: { halign: 'right', cellWidth: 16 }, // Entry
      4: { halign: 'right', cellWidth: 16 }, // SL
      5: { halign: 'right', cellWidth: 14 }, // TP1
      6: { halign: 'right', cellWidth: 14 }, // TP2
      7: { halign: 'right', cellWidth: 14 }, // TP3
      8: { halign: 'center', cellWidth: 12 }, // Risk
      9: { halign: 'center', cellWidth: 14, fontStyle: 'bold' }, // RR
      10: { halign: 'center', cellWidth: 16 }, // Gain %
      11: { halign: 'center', cellWidth: 16, fontStyle: 'bold' }, // Status
      12: { halign: 'left' } // Note
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        // Style Direction
        if (data.column.index === 2) {
          var dir = data.cell.raw;
          if (dir === 'LONG') {
            data.cell.styles.textColor = cGreen;
            data.cell.styles.fontStyle = 'bold';
          } else if (dir === 'SHORT') {
            data.cell.styles.textColor = cRed;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Style RR
        if (data.column.index === 9 && data.cell.raw !== '-') {
          data.cell.styles.textColor = cGold;
        }
        // Style PnL Gain
        if (data.column.index === 10) {
          var text = data.cell.raw;
          if (text.startsWith('+')) {
            data.cell.styles.textColor = cGreen;
            data.cell.styles.fontStyle = 'bold';
          } else if (text.startsWith('-')) {
            data.cell.styles.textColor = cRed;
            data.cell.styles.fontStyle = 'bold';
          }
        }
        // Style Status badge column
        if (data.column.index === 11) {
          var status = data.cell.raw;
          if (status === 'WIN') {
            data.cell.styles.textColor = cGreen;
          } else if (status === 'LOSS') {
            data.cell.styles.textColor = cRed;
          } else if (status === 'BE') {
            data.cell.styles.textColor = cBlue;
          }
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 15 },
    styles: {
      font: 'Helvetica',
      lineWidth: 0.1,
      cellPadding: 2
    },
    // Draw page numbers at the bottom of each page
    didDrawPage: function(data) {
      var str = 'Page ' + doc.internal.getNumberOfPages();
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(str, 283, doc.internal.pageSize.height - 8, { align: 'right' });
      doc.text('TRIGGERXBT Signal Hub - Proprietary Trade Report', 14, doc.internal.pageSize.height - 8);
    }
  });
  
  // Save PDF
  var filename = 'triggerxbt_performance_report_' + monthText.toLowerCase().replace(/ /g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(filename);
  toast('PDF report exported successfully!', 'ok');
}

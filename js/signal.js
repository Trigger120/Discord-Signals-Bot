// Direction toggle (LONG/SHORT) and update template text
function setDir(d) {
  S.dir = d;
  document.querySelectorAll('.dir-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  var btn = document.querySelector('.dir-btn.' + (d === 'LONG' ? 'long' : 'short'));
  if (btn) btn.classList.add('active');
  
  updateTemplateText(false);
}

// Select trading pair from predefined list pills and update template text
function setPair(el, p) {
  document.querySelectorAll('.pill').forEach(function(x) {
    x.classList.remove('active');
  });
  el.classList.add('active');
  S.pair = p;
  
  var customPair = document.getElementById('customPair');
  if (customPair) customPair.value = '';
  
  updateTemplateText(false);
}

// Custom pair input text field handler
function onCustomPair(v) {
  if (v) {
    document.querySelectorAll('.pill').forEach(function(x) {
      x.classList.remove('active');
    });
    S.pair = v.toUpperCase();
  } else {
    var activePill = document.querySelector('.pill.active');
    if (activePill) {
      S.pair = activePill.textContent;
    }
  }
  updateTemplateText(false);
}

// Set risk per trade level and update template text
function setRisk(el, r) {
  S.risk = r;
  document.querySelectorAll('.risk-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  el.classList.add('active');
  updateTemplateText(false);
}

// Update the template text in the textarea
function updateTemplateText(force) {
  var box = document.getElementById('signalMessage');
  if (!box) return;
  
  var pair = S.pair || 'XAUUSD';
  var dir = S.dir || 'LONG';
  var risk = S.risk || '0.5R';
  
  var defaultText = '$' + pair + '\n\n' + dir + '\n\nRisk: ' + risk + '\n\nEntry : \nStop Loss:\n\nTake profits:\n';
  
  // Update if empty, if forced, or if it matches the base template pattern
  if (force || !box.value || (box.value.startsWith('$') && (box.value.includes('Entry :') || box.value.includes('Stop Loss:')))) {
    box.value = defaultText;
  }
  updatePreview();
}

// Reset signal text area back to the template text
function resetToTemplate() {
  updateTemplateText(true);
  toast('Template reset!', 'ok');
}

// Toggle TBD check status on Take Profit prices
function toggleTBD(n) {
  S.tbds[n] = !S.tbds[n];
  var btn = document.getElementById('tbd' + n);
  var inp = document.getElementById('tp' + n);
  
  if (btn) btn.classList.toggle('active', S.tbds[n]);
  if (inp) {
    inp.disabled = S.tbds[n];
    inp.style.opacity = S.tbds[n] ? '0.35' : '1';
    if (S.tbds[n]) inp.value = '';
  }
  recalc();
}

// Calculate Risk Reward achieved
function calcRR(e, s, t) {
  if (!e || !s || !t || isNaN(e) || isNaN(s) || isNaN(t)) return null;
  var r = Math.abs(e - s);
  if (r === 0) return null;
  return (Math.abs(t - e) / r).toFixed(2);
}

// Input values recalculate triggers
function recalc() {
  var e = parseFloat(document.getElementById('entry').value);
  var s = parseFloat(document.getElementById('sl').value);
  var t1 = parseFloat(document.getElementById('tp1').value);
  var t2 = parseFloat(document.getElementById('tp2').value);
  var t3 = parseFloat(document.getElementById('tp3').value);
  
  var rr1Box = document.getElementById('rr1');
  var rr2Box = document.getElementById('rr2');
  var rr3Box = document.getElementById('rr3');
  
  if (rr1Box) rr1Box.textContent = (!S.tbds[1] && calcRR(e, s, t1)) ? calcRR(e, s, t1) + 'R' : '-';
  if (rr2Box) rr2Box.textContent = (!S.tbds[2] && calcRR(e, s, t2)) ? calcRR(e, s, t2) + 'R' : '-';
  if (rr3Box) rr3Box.textContent = (!S.tbds[3] && calcRR(e, s, t3)) ? calcRR(e, s, t3) + 'R' : '-';
  
  updatePreview();
}

// Format Role Pings safely
function fmtRole(r) {
  if (!r) return '';
  r = r.trim();
  if (r === '@everyone' || r === '@here') return r;
  var d = r.replace(/[^0-9]/g, '');
  return d ? '<@&' + d + '>' : '';
}

// Get raw message contents from text area and format role ping
function buildMsg(pingRole) {
  var box = document.getElementById('signalMessage');
  var msg = box ? box.value : '';
  var ping = fmtRole(pingRole);
  if (ping) {
    msg += '\n\n' + ping;
  }
  return msg;
}

// Scan custom text message and parse trading metrics using regex
function parseTextMessage(text) {
  var pair = 'XAUUSD';
  var dir = 'LONG';
  var entry = '';
  var sl = '';
  var tp1 = '';
  var tp2 = '';
  var tp3 = '';
  var risk = '1R';
  
  // 1. Pair: look for $word (e.g. $XAUUSD or $BTCUSDT) or plain text matching predefined list
  var pairMatch = text.match(/\$([A-Za-z0-9]+)/);
  if (pairMatch) {
    pair = pairMatch[1].toUpperCase();
  } else {
    var known = ['XAUUSD', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSD', 'NAS100', 'US30', 'XAGUSD'];
    for (var i = 0; i < known.length; i++) {
      var re = new RegExp('\\b' + known[i] + '\\b', 'i');
      if (re.test(text)) {
        pair = known[i];
        break;
      }
    }
  }
  
  // 2. Direction: look for SHORT/SELL vs LONG/BUY
  if (/short|sell/i.test(text)) {
    dir = 'SHORT';
  } else if (/long|buy/i.test(text)) {
    dir = 'LONG';
  }
  
  // 3. Entry Price: e.g., "Entry: 2320.5" or "Entry : 2320"
  var entryMatch = text.match(/(?:entry|ent)(?:\s*[:\-=\s]\s*|\s+)(\d+(?:\.\d+)?)/i);
  if (entryMatch) {
    entry = entryMatch[1];
  }
  
  // 4. Stop Loss: e.g., "Stop Loss: 2310" or "SL: 2310"
  var slMatch = text.match(/(?:stop\s*loss|sl|stop)(?:\s*[:\-=\s]\s*|\s+)(\d+(?:\.\d+)?)/i);
  if (slMatch) {
    sl = slMatch[1];
  }
  
  // 5. Take Profits: e.g. "TP1: 2340" or "TP 1: 2340" or "TP1 - 2340"
  var tp1Match = text.match(/(?:tp1|tp\s+1|target\s+1)(?:\s*[:\-=\s]\s*|\s+)(\d+(?:\.\d+)?|tbd)/i);
  if (tp1Match) {
    tp1 = tp1Match[1].toUpperCase();
  }
  var tp2Match = text.match(/(?:tp2|tp\s+2|target\s+2)(?:\s*[:\-=\s]\s*|\s+)(\d+(?:\.\d+)?|tbd)/i);
  if (tp2Match) {
    tp2 = tp2Match[1].toUpperCase();
  }
  var tp3Match = text.match(/(?:tp3|tp\s+3|target\s+3)(?:\s*[:\-=\s]\s*|\s+)(\d+(?:\.\d+)?|tbd)/i);
  if (tp3Match) {
    tp3 = tp3Match[1].toUpperCase();
  }
  
  // 6. Risk Size: e.g., "Risk: 0.5R" or "Risk 1R"
  var riskMatch = text.match(/risk(?:\s*[:\-=\s]\s*|\s+)(\d+(?:\.\d+)?%?R?)/i);
  if (riskMatch) {
    risk = riskMatch[1].toUpperCase();
  } else {
    var rMatch = text.match(/\b(\d+(?:\.\d+)?R)\b/i);
    if (rMatch) {
      risk = rMatch[1].toUpperCase();
    }
  }
  
  return {
    pair: pair,
    dir: dir,
    entry: entry,
    sl: sl,
    tp1: tp1,
    tp2: tp2,
    tp3: tp3,
    risk: risk
  };
}

// Generate Discord Embed Structure objects
function buildEmbedPayload(w) {
  var pair = S.pair || '???';
  var dir = S.dir || '???';
  var entry = document.getElementById('entry').value || '???';
  var sl = document.getElementById('sl').value || '???';
  var t1 = S.tbds[1] ? 'TBD' : (document.getElementById('tp1').value || '-');
  var t2 = S.tbds[2] ? 'TBD' : (document.getElementById('tp2').value || '-');
  var t3 = S.tbds[3] ? 'TBD' : (document.getElementById('tp3').value || '-');
  var risk = S.risk || '0.25R';
  
  var eVal = parseFloat(entry);
  var sVal = parseFloat(sl);
  var rr1 = calcRR(eVal, sVal, parseFloat(t1));
  var rr2 = calcRR(eVal, sVal, parseFloat(t2));
  var rr3 = calcRR(eVal, sVal, parseFloat(t3));
  
  var tp1Str = t1 + (S.tbds[1] ? '' : (rr1 ? ' (' + rr1 + 'R)' : ''));
  var tp2Str = t2 === '-' ? '-' : (t2 + (S.tbds[2] ? '' : (rr2 ? ' (' + rr2 + 'R)' : '')));
  var tp3Str = t3 === '-' ? '-' : (t3 + (S.tbds[3] ? '' : (rr3 ? ' (' + rr3 + 'R)' : '')));
  
  var color = dir === 'LONG' ? 1096217 : 15680570; // neon green 0x10B981 (1087873) or red 0xEF4444 (15680580)
  
  var fields = [
    { name: 'Pair 🌐', value: '**' + pair + '**', inline: true },
    { name: 'Direction 📈', value: dir === 'LONG' ? '🟢 LONG' : '🔴 SHORT', inline: true },
    { name: 'Risk Size ⚠️', value: '`' + risk + '`', inline: true },
    { name: 'Entry Price 🎯', value: '`' + entry + '`', inline: true },
    { name: 'Stop Loss 🛑', value: '`' + sl + '`', inline: true },
    { name: 'Trade Status ⚙️', value: '跑 Active', inline: true },
    { name: 'Take Profit 1 🎯', value: tp1Str, inline: false }
  ];
  
  if (t2 !== '-') fields.push({ name: 'Take Profit 2 🎯', value: tp2Str, inline: false });
  if (t3 !== '-') fields.push({ name: 'Take Profit 3 🎯', value: tp3Str, inline: false });
  
  var ping = fmtRole(w.pingRole || '');
  
  var payload = {
    content: ping ? ping : '',
    embeds: [{
      title: '⚡ TRIGGERXBT NEW TRADE SIGNAL',
      color: color,
      fields: fields,
      footer: {
        text: 'TRIGGERXBT SIGNAL HUB'
      },
      timestamp: new Date().toISOString()
    }]
  };
  
  if (S.screenshot) {
    payload.embeds[0].image = {
      url: 'attachment://chart.png'
    };
  }
  
  return payload;
}

// Toggle format between text and Discord embeds
function setFormat(fmt) {
  S.format = fmt;
  saveAdvancedSettings();
  document.querySelectorAll('.format-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.format === fmt);
  });
  updatePreview();
}

// Discord embed mockup builder in preview container
function updatePreview() {
  var box = document.getElementById('previewBox');
  if (!box) return;

  var templateSettings = document.getElementById('templateSettings');
  if (templateSettings) {
    templateSettings.style.display = S.format === 'text' ? 'block' : 'none';
  }
  
  if (S.format === 'text') {
    var rawMsg = document.getElementById('signalMessage') ? document.getElementById('signalMessage').value : '';
    box.textContent = rawMsg || 'Write signal message details...';
    box.style.background = '#090d16';
    box.style.border = '1px solid rgba(255, 255, 255, 0.05)';
    box.style.padding = '16px';
    box.style.color = '#c3cedb';
    box.style.borderRadius = '8px';
  } else {
    var pair = S.pair || '???';
    var dir = S.dir || '???';
    var entry = document.getElementById('entry').value || '0.00';
    var sl = document.getElementById('sl').value || '0.00';
    var t1 = S.tbds[1] ? 'TBD' : (document.getElementById('tp1').value || '0.00');
    var t2 = S.tbds[2] ? 'TBD' : (document.getElementById('tp2').value || '-');
    var t3 = S.tbds[3] ? 'TBD' : (document.getElementById('tp3').value || '-');
    var risk = S.risk || '0.25R';
    
    var eVal = parseFloat(entry);
    var sVal = parseFloat(sl);
    var rr1 = calcRR(eVal, sVal, parseFloat(t1)) || '0.00';
    var rr2 = calcRR(eVal, sVal, parseFloat(t2));
    var rr3 = calcRR(eVal, sVal, parseFloat(t3));
    
    var tp1Str = t1 + (S.tbds[1] ? '' : ' (' + rr1 + 'R)');
    var tp2Str = t2 === '-' ? '-' : (t2 + (S.tbds[2] ? '' : (rr2 ? ' (' + rr2 + 'R)' : '')));
    var tp3Str = t3 === '-' ? '-' : (t3 + (S.tbds[3] ? '' : (rr3 ? ' (' + rr3 + 'R)' : '')));
    
    var sideColor = dir === 'LONG' ? '#10b981' : '#ef4444';
    
    var html = '<div style="color:#8e9297;font-size:11px;margin-bottom:8px;font-family:sans-serif;">Pings: <span style="color:#7289da">@role</span></div>' +
      '<div style="background:#2f3136;border-left:4px solid ' + sideColor + ';border-radius:4px;padding:12px;font-family:sans-serif;color:#dcddde;max-width:400px;text-align:left;">' +
        '<div style="font-weight:700;font-size:14px;color:#fff;margin-bottom:8px;">⚡ TRIGGERXBT NEW TRADE SIGNAL</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-bottom:8px;">' +
          '<div><strong>Pair:</strong> ' + pair + '</div>' +
          '<div><strong>Direction:</strong> ' + (dir === 'LONG' ? '🟢 LONG' : '🔴 SHORT') + '</div>' +
          '<div><strong>Risk:</strong> ' + risk + '</div>' +
          '<div><strong>Entry Price:</strong> ' + entry + '</div>' +
          '<div style="grid-column: span 2;"><strong>Stop Loss 🛑:</strong> ' + sl + '</div>' +
        '</div>' +
        '<div style="font-size:12px;margin-bottom:4px;"><strong>Take Profit 1 🎯:</strong> ' + tp1Str + '</div>';
        
    if (t2 !== '-') {
      html += '<div style="font-size:12px;margin-bottom:4px;"><strong>Take Profit 2 🎯:</strong> ' + tp2Str + '</div>';
    }
    if (t3 !== '-') {
      html += '<div style="font-size:12px;margin-bottom:4px;"><strong>Take Profit 3 🎯:</strong> ' + tp3Str + '</div>';
    }
    
    if (S.screenshot) {
      html += '<div style="margin-top:10px;font-size:11px;color:#7289da;border:1px dashed #7289da;padding:8px;border-radius:4px;text-align:center;">[Attached: Chart Image]</div>';
    }
    
    html += '<div style="margin-top:10px;font-size:10px;color:#72767d;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px;">TRIGGERXBT SIGNAL HUB</div>' +
      '</div>';
      
    box.innerHTML = html;
    box.style.background = '#2f3136';
    box.style.border = 'none';
    box.style.padding = '14px';
    box.style.borderRadius = '8px';
  }
}

// Screenshot reader input attached
function onSS(input) {
  var file = input.files[0];
  if (!file) return;
  
  S.screenshot = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = document.getElementById('ssImg');
    if (img) {
      img.src = e.target.result;
      img.style.display = 'block';
    }
    var ssRm = document.getElementById('ssRm');
    if (ssRm) ssRm.style.display = 'inline-block';
    
    var ssLbl = document.getElementById('ssLbl');
    if (ssLbl) ssLbl.textContent = 'Chart attached';
    
    var ssZone = document.getElementById('ssZone');
    if (ssZone) ssZone.classList.add('has-file');
    
    updatePreview();
  };
  reader.readAsDataURL(file);
}

// Screenshot attached removal actions
function rmSS(evt) {
  if (evt) evt.stopPropagation();
  S.screenshot = null;
  
  var ssInput = document.getElementById('ssInput');
  if (ssInput) ssInput.value = '';
  
  var img = document.getElementById('ssImg');
  if (img) {
    img.style.display = 'none';
    img.src = '';
  }
  
  var ssRm = document.getElementById('ssRm');
  if (ssRm) ssRm.style.display = 'none';
  
  var ssLbl = document.getElementById('ssLbl');
  if (ssLbl) ssLbl.textContent = 'Tap to attach chart';
  
  var ssZone = document.getElementById('ssZone');
  if (ssZone) ssZone.classList.remove('has-file');
  
  updatePreview();
}

// Retrieve selected servers lists checkboxes
function getSelServers() {
  var items = document.querySelectorAll('#serverList .sv-item.checked');
  return Array.from(items).map(function(item) {
    return S.webhooks[parseInt(item.dataset.index)];
  }).filter(Boolean);
}

// Post trade signal details using fetch
async function sendSignal() {
  var rawMsg = document.getElementById('signalMessage') ? document.getElementById('signalMessage').value : '';
  if (S.format === 'text' && !rawMsg.trim()) {
    toast('Please enter a signal message!', 'err');
    return;
  }
  if (S.format === 'embed' && !document.getElementById('entry').value) {
    toast('Enter entry price for the Embed fields!', 'err');
    return;
  }
  
  var sel = getSelServers();
  if (sel.length === 0) {
    toast('Select at least one server!', 'err');
    return;
  }
  
  var btn = document.getElementById('sendBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> SENDING...';
  
  var results = await Promise.allSettled(sel.map(async function(w) {
    var bodyData;
    var headers = {};
    
    if (S.format === 'text') {
      var msg = buildMsg(w.pingRole || '');
      if (S.screenshot) {
        var fd = new FormData();
        fd.append('file', S.screenshot, 'chart.png');
        fd.append('payload_json', JSON.stringify({ content: msg }));
        bodyData = fd;
      } else {
        bodyData = JSON.stringify({ content: msg });
        headers['Content-Type'] = 'application/json';
      }
    } else {
      var payload = buildEmbedPayload(w);
      if (S.screenshot) {
        var fd = new FormData();
        fd.append('file', S.screenshot, 'chart.png');
        fd.append('payload_json', JSON.stringify(payload));
        bodyData = fd;
      } else {
        bodyData = JSON.stringify(payload);
        headers['Content-Type'] = 'application/json';
      }
    }
    
    return fetch(w.url, {
      method: 'POST',
      headers: headers,
      body: bodyData
    });
  }));
  
  var ok = results.filter(function(r) {
    return r.status === 'fulfilled' && r.value.ok;
  }).length;
  
  if (ok > 0) {
    // Optional journal logging check
    var logToJournal = document.getElementById('logToJournal') ? document.getElementById('logToJournal').checked : false;
    if (logToJournal) {
      var e, s, t1, t2, t3, pair, dir, risk;
      
      if (S.format === 'text') {
        var parsed = parseTextMessage(rawMsg);
        pair = parsed.pair;
        dir = parsed.dir;
        e = parsed.entry;
        s = parsed.sl;
        t1 = parsed.tp1;
        t2 = parsed.tp2;
        t3 = parsed.tp3;
        risk = parsed.risk;
      } else {
        pair = S.pair;
        dir = S.dir || 'LONG';
        e = document.getElementById('entry').value;
        s = document.getElementById('sl').value;
        t1 = S.tbds[1] ? 'TBD' : document.getElementById('tp1').value;
        t2 = S.tbds[2] ? 'TBD' : document.getElementById('tp2').value;
        t3 = S.tbds[3] ? 'TBD' : document.getElementById('tp3').value;
        risk = S.risk;
      }
      
      if (e) {
        var rr1 = calcRR(parseFloat(e), parseFloat(s), parseFloat(t1));
        S.trades.unshift({
          id: Date.now(),
          date: new Date().toISOString(),
          pair: pair,
          dir: dir,
          entry: e,
          sl: s,
          tp1: t1,
          tp2: t2,
          tp3: t3,
          risk: risk,
          rr: rr1 ? parseFloat(rr1).toFixed(2) : null,
          status: 'OPEN',
          result: '',
          note: ''
        });
        saveTrades();
        if (typeof populateMonths === 'function') populateMonths();
        if (typeof renderJournal === 'function') renderJournal();
        if (typeof renderDashboard === 'function') renderDashboard();
      } else {
        toast('Signal sent, but entry price not found in text - trade not logged.', 'err');
      }
    }
    
    toast('Sent to ' + ok + ' server' + (ok > 1 ? 's' : '') + '!', 'ok');
    
    // Clear inputs after successful broadcast
    document.getElementById('entry').value = '';
    document.getElementById('sl').value = '';
    document.getElementById('tp1').value = '';
    document.getElementById('tp2').value = '';
    document.getElementById('tp3').value = '';
    
    // Reset TBDs
    for (var k = 1; k <= 3; k++) {
      if (S.tbds[k]) toggleTBD(k);
    }
    
    // Reset screenshots
    rmSS({ stopPropagation: function() {} });
    
    // Reset RR displays
    document.getElementById('rr1').textContent = '-';
    document.getElementById('rr2').textContent = '-';
    document.getElementById('rr3').textContent = '-';
    
    // Clear signal text box and re-init template
    document.getElementById('signalMessage').value = '';
    updateTemplateText(true);
  } else {
    toast('All sends failed. Check webhook URLs & network settings.', 'err');
  }
  
  btn.disabled = false;
  btn.innerHTML = 'SEND SIGNAL';
}

// Initial update on load
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    updateTemplateText(true);
  }, 100);
  
  var logChk = document.getElementById('logToJournal');
  var inputs = document.getElementById('journalInputs');
  if (logChk && inputs) {
    logChk.checked = false;
    inputs.style.display = 'none';
    
    logChk.addEventListener('change', function() {
      inputs.style.display = this.checked ? 'block' : 'none';
    });
  }
});

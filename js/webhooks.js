// Render servers selection checklist in Signal page
function renderServers() {
  var el = document.getElementById('serverList');
  if (!el) return;
  
  if (S.webhooks.length === 0) {
    el.innerHTML = '<div class="no-webhooks">No servers added. Click Servers.</div>';
    return;
  }
  
  el.innerHTML = S.webhooks.map(function(w, i) {
    return '<div class="sv-item checked" onclick="toggleSv(this)" data-index="' + i + '">' +
      '<div class="sv-top">' +
        '<div class="sv-check">✓</div>' +
        '<div class="sv-name">' + w.name + '</div>' +
        '<div class="sv-status">READY</div>' +
      '</div>' +
      '<div class="sv-ping">' +
        '<label style="margin-top:8px;margin-bottom:4px">Role ID</label>' +
        '<input type="text" placeholder="e.g. 123456789 or @everyone" value="' + (w.pingRole || '') + '" onclick="event.stopPropagation()" oninput="S.webhooks[' + i + '].pingRole=this.value;saveWH()">' +
        '<div class="hint">Role ID number only — tag auto-formatted</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// Toggle server selection checked state
function toggleSv(el) {
  el.classList.toggle('checked');
}

// Open settings modal and render current webhooks list
function openServers() {
  renderWHEntries();
  openModal('serversModal');
}

// Render webhook editor rows inside the settings modal
function renderWHEntries() {
  var c = document.getElementById('webhookEntries');
  if (!c) return;
  
  if (S.webhooks.length === 0) {
    c.innerHTML = '';
    addWebhook();
    return;
  }
  
  c.innerHTML = S.webhooks.map(function(w, i) {
    return '<div class="wh-entry">' +
      '<button class="rm-btn" onclick="rmWH(' + i + ')" title="Remove Server">' +
        '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
      '</button>' +
      '<button class="wh-test-btn" onclick="testWebhook(' + i + ', event)" title="Test Webhook Connection">' +
        '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Test' +
      '</button>' +
      '<label>Server Name</label>' +
      '<input type="text" placeholder="e.g. Trigger Forex Syndicate" value="' + (w.name || '') + '" oninput="S.webhooks[' + i + '].name=this.value">' +
      '<label style="margin-top:10px;">Webhook URL</label>' +
      '<input type="text" placeholder="https://discord.com/api/webhooks/..." value="' + (w.url || '') + '" oninput="S.webhooks[' + i + '].url=this.value">' +
      '<label style="margin-top:10px;">Role ID (optional)</label>' +
      '<input type="text" placeholder="e.g. 1234567890 or @everyone" value="' + (w.pingRole || '') + '" oninput="S.webhooks[' + i + '].pingRole=this.value">' +
      '<div class="hint">Paste Role ID number — no brackets needed</div>' +
    '</div>';
  }).join('');
}

// Add blank server webhook config row
function addWebhook() {
  S.webhooks.push({ name: '', url: '', pingRole: '' });
  renderWHEntries();
}

// Remove server webhook config row
function rmWH(i) {
  S.webhooks.splice(i, 1);
  renderWHEntries();
}

// Filter, clean, and save webhook servers list
function saveServers() {
  S.webhooks = S.webhooks.filter(function(w) {
    return w.name && w.url;
  });
  saveWH();
  closeModal('serversModal');
  renderServers();
  toast(S.webhooks.length + ' server(s) saved!', 'ok');
}

// Test webhook connection by sending a diagnostic embed to Discord
async function testWebhook(index, event) {
  if (event) event.stopPropagation();
  var w = S.webhooks[index];
  if (!w || !w.url) {
    toast('Invalid webhook URL', 'err');
    return;
  }
  
  var testBtn = event.currentTarget;
  var origHTML = testBtn.innerHTML;
  testBtn.disabled = true;
  testBtn.innerHTML = 'Testing...';
  
  var payload = {
    embeds: [{
      title: '🟢 Webhook Connection Test Successful',
      description: 'TriggerXBT Signal Hub has successfully verified connection to this Discord channel.',
      color: 65280, // Green (hex 00FF00)
      fields: [
        { name: 'Server Configured', value: w.name || 'Unnamed Server', inline: true },
        { name: 'Status', value: 'Active / Connected', inline: true }
      ],
      footer: {
        text: 'TRIGGERXBT SIGNAL HUB'
      },
      timestamp: new Date().toISOString()
    }]
  };
  
  try {
    var response = await fetch(w.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      toast('Test sent successfully to ' + (w.name || 'server') + '!', 'ok');
    } else {
      toast('Test failed. Discord returned error code ' + response.status, 'err');
    }
  } catch (err) {
    toast('Test failed. Check URL, internet connection, or VPN settings.', 'err');
  } finally {
    testBtn.disabled = false;
    testBtn.innerHTML = origHTML;
  }
}

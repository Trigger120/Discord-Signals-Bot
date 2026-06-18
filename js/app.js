// Global Application State Namespace
window.S = {
  dir: '',
  pair: 'XAUUSD',
  risk: '0.25R',
  tbds: { 1: false, 2: false, 3: false },
  screenshot: null,
  webhooks: [],
  trades: [],
  jFilter: 'ALL',
  upId: null,
  upRes: '',
  wlChart: null,
  rrChart: null,
  
  // Advanced settings default values
  format: 'embed', // 'embed' or 'text'
  template: '$pair\n\n$dir\n\nEntry: $entry\nStop Loss: $sl\n\nTake Profits:$tps\n\nRisk: $risk\n\nRisk Free at 1RR\n\n$ping',
  
  // Cloud sync ID
  syncId: ''
};

var DEF_PW = 'trigger2024';

// Retrieve active application password
function getPW() {
  return localStorage.getItem('txbt_pw') || DEF_PW;
}

// Generate secure unguessable Sync ID
function genSyncId() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var id = 'txbt_';
  for (var i = 0; i < 24; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Save active global state to local storage & push to cloud
function saveWH() {
  localStorage.setItem('txbt_wh', JSON.stringify(S.webhooks));
  updateTimestampAndPush();
}

function saveTrades() {
  localStorage.setItem('txbt_tr', JSON.stringify(S.trades));
  updateTimestampAndPush();
}

function saveAdvancedSettings() {
  localStorage.setItem('txbt_format', S.format);
  localStorage.setItem('txbt_template', S.template);
  updateTimestampAndPush();
}

function updateTimestampAndPush() {
  var now = Date.now();
  localStorage.setItem('txbt_last_updated', now);
  pushData();
}

// Cloud synchronization logic (Push)
async function pushData() {
  if (!S.syncId) return;
  var data = {
    webhooks: S.webhooks,
    trades: S.trades,
    format: S.format,
    template: S.template,
    lastUpdated: parseInt(localStorage.getItem('txbt_last_updated') || Date.now())
  };
  
  try {
    await fetch('https://kvdb.io/DrYLY31iqQxqVqUTkjNAin/' + S.syncId, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.warn('Cloud sync push failed (offline or network restriction):', e);
  }
}

// Cloud synchronization logic (Pull)
async function pullData() {
  if (!S.syncId) return;
  try {
    var res = await fetch('https://kvdb.io/DrYLY31iqQxqVqUTkjNAin/' + S.syncId);
    if (res.status === 404) {
      // Key doesn't exist yet on cloud, initialize it
      await pushData();
      return;
    }
    if (!res.ok) return;
    var cloud = await res.json();
    var localLast = parseInt(localStorage.getItem('txbt_last_updated') || '0');
    
    if (cloud.lastUpdated && cloud.lastUpdated > localLast) {
      // Overwrite local state with cloud state
      S.webhooks = cloud.webhooks || [];
      S.trades = cloud.trades || [];
      S.format = cloud.format || S.format;
      S.template = cloud.template || S.template;
      
      localStorage.setItem('txbt_wh', JSON.stringify(S.webhooks));
      localStorage.setItem('txbt_tr', JSON.stringify(S.trades));
      localStorage.setItem('txbt_format', S.format);
      localStorage.setItem('txbt_template', S.template);
      localStorage.setItem('txbt_last_updated', cloud.lastUpdated);
      
      // Reload UI components
      if (typeof renderServers === 'function') renderServers();
      if (typeof populateMonths === 'function') populateMonths();
      if (typeof renderJournal === 'function') renderJournal();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof updatePreview === 'function') updatePreview();
    } else if (localLast > (cloud.lastUpdated || 0)) {
      // Local state is newer, push to cloud
      await pushData();
    }
  } catch (e) {
    console.warn('Cloud sync pull failed:', e);
  }
}

// Connect device to an existing cloud Sync ID session
async function connectSyncId(newSyncId) {
  if (!newSyncId || !newSyncId.startsWith('txbt_')) {
    toast('Invalid Sync ID format. Must start with txbt_', 'err');
    return false;
  }
  
  try {
    var res = await fetch('https://kvdb.io/DrYLY31iqQxqVqUTkjNAin/' + newSyncId);
    if (!res.ok && res.status !== 404) {
      toast('Failed to reach cloud database.', 'err');
      return false;
    }
    
    S.syncId = newSyncId;
    localStorage.setItem('txbt_sync_id', S.syncId);
    
    if (res.status === 404) {
      // Create new session online and push current local data to it
      await pushData();
      toast('Sync Connected! Uploaded data to new session.', 'ok');
    } else {
      // Session exists, pull cloud data and replace local
      var cloud = await res.json();
      S.webhooks = cloud.webhooks || [];
      S.trades = cloud.trades || [];
      S.format = cloud.format || S.format;
      S.template = cloud.template || S.template;
      
      localStorage.setItem('txbt_wh', JSON.stringify(S.webhooks));
      localStorage.setItem('txbt_tr', JSON.stringify(S.trades));
      localStorage.setItem('txbt_format', S.format);
      localStorage.setItem('txbt_template', S.template);
      localStorage.setItem('txbt_last_updated', cloud.lastUpdated || Date.now());
      
      loadData();
      toast('Sync Connected! Merged data from cloud.', 'ok');
    }
    
    // Update Sync Modal display fields
    var sidVal = document.getElementById('syncIdVal');
    if (sidVal) sidVal.value = S.syncId;
    var slinkVal = document.getElementById('syncLinkVal');
    if (slinkVal) slinkVal.value = getShareLink();
    
    return true;
  } catch (e) {
    toast('Connection failed. Verify internet or VPN.', 'err');
    return false;
  }
}

// Router navigation between sections
function navigate(p) {
  document.querySelectorAll('.page').forEach(function(x) {
    x.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(function(x) {
    x.classList.remove('active');
  });
  
  document.getElementById('page-' + p).classList.add('active');
  var idx = ['signal', 'journal', 'dashboard'].indexOf(p);
  if (idx !== -1) {
    document.querySelectorAll('.nav-btn')[idx].classList.add('active');
  }
  
  if (p === 'dashboard') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
  if (p === 'journal') {
    if (typeof renderJournal === 'function') renderJournal();
  }
}

// Modal management helpers
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Toast notification trigger
function toast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + (type || 'ok');
  
  if (t.dataset.timeoutId) {
    clearTimeout(parseInt(t.dataset.timeoutId));
  }
  var id = setTimeout(function() {
    t.classList.remove('show');
  }, 3000);
  t.dataset.timeoutId = id;
}

// Helper to get Sync ID from the URL query string or hash parameters
function getSyncIdFromUrl() {
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var sync = urlParams.get('sync');
    if (sync && sync.startsWith('txbt_')) return sync;
    
    var hash = window.location.hash;
    if (hash) {
      var match = hash.match(/sync=(txbt_[a-z0-9]+)/);
      if (match) return match[1];
      if (hash.startsWith('#txbt_')) return hash.substring(1);
    }
  } catch (e) {}
  return null;
}

// Generate the full shareable URL containing the current Sync ID
function getShareLink() {
  try {
    var href = window.location.href;
    var idxHash = href.indexOf('#');
    if (idxHash !== -1) href = href.substring(0, idxHash);
    var idxSearch = href.indexOf('?');
    if (idxSearch !== -1) href = href.substring(0, idxSearch);
    return href + '#sync=' + S.syncId;
  } catch (e) {
    return '';
  }
}

// Copy the shareable Sync link to the clipboard
function copySyncLink() {
  var link = getShareLink();
  if (link) {
    navigator.clipboard.writeText(link).then(function() {
      toast('Share link copied to clipboard!', 'ok');
    }).catch(function() {
      toast('Failed to copy to clipboard.', 'err');
    });
  }
}

// Load configurations and log files from local storage on startup
function loadData() {
  var urlSyncId = getSyncIdFromUrl();
  var storedSyncId = localStorage.getItem('txbt_sync_id') || '';
  
  if (urlSyncId && urlSyncId !== storedSyncId) {
    // URL has a new Sync ID! Connect automatically
    S.syncId = urlSyncId;
    localStorage.setItem('txbt_sync_id', S.syncId);
    
    connectSyncId(urlSyncId).then(function(ok) {
      if (ok) {
        try {
          var cleanHref = window.location.href.split('#')[0].split('?')[0];
          window.history.replaceState({}, document.title, cleanHref);
        } catch (e) {}
      }
    });
    return;
  }
  
  // Normal startup path
  S.syncId = storedSyncId;
  if (!S.syncId) {
    S.syncId = genSyncId();
    localStorage.setItem('txbt_sync_id', S.syncId);
  }
  
  // Set in modal inputs if exist
  var sidVal = document.getElementById('syncIdVal');
  if (sidVal) sidVal.value = S.syncId;
  
  var slinkVal = document.getElementById('syncLinkVal');
  if (slinkVal) {
    slinkVal.value = getShareLink();
  }

  try {
    S.webhooks = JSON.parse(localStorage.getItem('txbt_wh') || '[]');
  } catch (e) {
    S.webhooks = [];
  }
  try {
    S.trades = JSON.parse(localStorage.getItem('txbt_tr') || '[]');
  } catch (e) {
    S.trades = [];
  }
  
  S.format = localStorage.getItem('txbt_format') || 'embed';
  S.template = localStorage.getItem('txbt_template') || S.template;

  // Initialize advanced settings input fields
  var templateInp = document.getElementById('templateInput');
  if (templateInp) templateInp.value = S.template;
  
  var formatBtns = document.querySelectorAll('.format-btn');
  formatBtns.forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.format === S.format);
  });

  if (typeof renderServers === 'function') renderServers();
  if (typeof populateMonths === 'function') populateMonths();
  if (typeof renderJournal === 'function') renderJournal();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof updatePreview === 'function') updatePreview();

  // Pull latest updates from cloud (background)
  pullData();
}

// Export local data to external backup file (JSON format)
function exportBackup() {
  var data = {
    webhooks: S.webhooks,
    trades: S.trades,
    format: S.format,
    template: S.template
  };
  
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'triggerxbt_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Backup exported successfully!', 'ok');
}

// Import local data from external backup JSON file
function importBackup(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = JSON.parse(e.target.result);
      if (imported.webhooks && Array.isArray(imported.webhooks)) {
        S.webhooks = imported.webhooks;
        localStorage.setItem('txbt_wh', JSON.stringify(S.webhooks));
      }
      if (imported.trades && Array.isArray(imported.trades)) {
        S.trades = imported.trades;
        localStorage.setItem('txbt_tr', JSON.stringify(S.trades));
      }
      if (imported.format) {
        S.format = imported.format;
        localStorage.setItem('txbt_format', S.format);
      }
      if (imported.template) {
        S.template = imported.template;
        localStorage.setItem('txbt_template', S.template);
      }
      
      localStorage.setItem('txbt_last_updated', Date.now());
      pushData();
      
      // Reload UI components
      loadData();
      toast('Backup restored successfully!', 'ok');
    } catch (err) {
      toast('Failed to restore backup: Invalid file format.', 'err');
    }
    event.target.value = ''; // Reset file input
  };
  reader.readAsText(file);
}

// Global initialization logic on body load
window.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.modal-overlay').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target === el) {
        el.classList.remove('open');
      }
    });
  });
});

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
  
  // Puter Cloud status
  puterInitialized: false
};

var DEF_PW = 'trigger2024';

// Retrieve active application password
function getPW() {
  return localStorage.getItem('txbt_pw') || DEF_PW;
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

// Cloud synchronization logic (Push to Puter)
async function pushData() {
  if (typeof puter === 'undefined' || !puter.auth.isSignedIn()) return;
  var data = {
    webhooks: S.webhooks,
    trades: S.trades,
    format: S.format,
    template: S.template,
    lastUpdated: parseInt(localStorage.getItem('txbt_last_updated') || Date.now())
  };
  
  try {
    await puter.kv.set('txbt_data', JSON.stringify(data));
    console.log('Cloud sync push succeeded.');
  } catch (e) {
    console.warn('Cloud sync push failed:', e);
  }
}

// Cloud synchronization logic (Pull from Puter)
async function pullData() {
  if (typeof puter === 'undefined' || !puter.auth.isSignedIn()) return;
  try {
    var val = await puter.kv.get('txbt_data');
    if (!val) {
      // Key doesn't exist yet on cloud, initialize it
      await pushData();
      return;
    }
    
    var cloud = JSON.parse(val);
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
      
      console.log('Cloud sync pull and merge succeeded.');
    } else if (localLast > (cloud.lastUpdated || 0)) {
      // Local state is newer, push to cloud
      await pushData();
    }
  } catch (e) {
    console.warn('Cloud sync pull failed:', e);
  }
}

// Connect with Puter Auth
async function connectPuter() {
  if (typeof puter === 'undefined') {
    toast('Puter Cloud SDK is loading, please try again in a moment.', 'err');
    return;
  }
  try {
    await puter.auth.signIn();
    var signedIn = puter.auth.isSignedIn();
    updatePuterUI(signedIn);
    if (signedIn) {
      toast('Signed in to Puter Cloud! Syncing data...', 'ok');
      await pullData();
      updatePuterUI(true);
    }
  } catch (e) {
    console.error('Puter authentication failed:', e);
    toast('Puter login failed.', 'err');
  }
}

// Disconnect from Puter Auth
async function disconnectPuter() {
  if (typeof puter === 'undefined') return;
  if (confirm("Are you sure you want to sign out and disconnect Cloud Sync on this device? Your local data will remain intact.")) {
    puter.auth.signOut();
    updatePuterUI(false);
    toast('Disconnected from Puter Cloud.', 'ok');
  }
}

// Trigger manual synchronization from UI button
async function triggerManualSync() {
  toast('Syncing with Puter Cloud...', 'ok');
  localStorage.setItem('txbt_last_updated', Date.now());
  await pushData();
  await pullData();
  if (typeof puter !== 'undefined') {
    updatePuterUI(puter.auth.isSignedIn());
  }
  toast('Sync complete!', 'ok');
}

// Render dynamic interface for cloud sync modal
function updatePuterUI(signedIn) {
  var container = document.getElementById('puterSyncContainer');
  if (!container) return;
  
  if (typeof puter === 'undefined') {
    container.innerHTML = '<div style="text-align: center; padding: 20px 0; color: var(--text-muted); font-size:12px;">Initializing Puter Cloud...</div>';
    return;
  }
  
  if (!signedIn) {
    container.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6; text-align: left;">
          Connect your Puter account to automatically synchronize all trade journals, performance analytics, and Discord webhook configurations between your laptop, PC, and phone.
        </div>
        <button class="pw-btn" onclick="connectPuter()" style="margin-bottom: 10px;">SIGN IN WITH PUTER</button>
        <div style="font-size: 10px; color: var(--text-muted); margin-top: 10px;">
          Secure, direct edge database sync. No configuration required.
        </div>
      </div>
    `;
  } else {
    var user = puter.auth.getUser();
    var username = (user && user.username) ? user.username : 'User';
    var lastUpdated = localStorage.getItem('txbt_last_updated');
    var lastSyncStr = lastUpdated ? new Date(parseInt(lastUpdated)).toLocaleString() : 'Never';
    
    container.innerHTML = `
      <div style="padding: 10px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
          <div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Connected Account</div>
            <div style="font-size: 16px; font-weight: 600; color: var(--gold); font-family: var(--font-display);">${username}</div>
          </div>
          <span style="font-size: 9px; background: var(--green-dim); color: var(--green); border: 1px solid var(--green); padding: 4px 8px; border-radius: 4px; font-weight: 600; letter-spacing: 1px;">ACTIVE</span>
        </div>
        
        <div style="font-size: 12px; margin-bottom: 20px; color: var(--text-muted); display: flex; justify-content: space-between;">
          <span>Last Synced:</span>
          <strong style="color: var(--text);">${lastSyncStr}</strong>
        </div>
        
        <button class="pw-btn" onclick="triggerManualSync()" style="margin-bottom: 16px; font-size:14px; padding:12px;">SYNC NOW</button>
        
        <div style="text-align: center; margin-top: 12px;">
          <a href="#" onclick="event.preventDefault(); disconnectPuter();" style="font-size: 11px; color: var(--red); text-decoration: none; font-weight: 600; letter-spacing: 1px;">DISCONNECT ACCOUNT</a>
        </div>
      </div>
    `;
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
  // Trigger update check when opening Sync modal
  if (id === 'syncModal' && typeof puter !== 'undefined') {
    updatePuterUI(puter.auth.isSignedIn());
  }
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

// Check and initialize Puter connectivity state
function initPuterCloud() {
  if (typeof puter !== 'undefined') {
    var signedIn = puter.auth.isSignedIn();
    updatePuterUI(signedIn);
    if (signedIn) {
      pullData().then(function() {
        updatePuterUI(true);
      });
    }
  } else {
    // Retry in 500ms
    setTimeout(initPuterCloud, 500);
  }
}

// Load configurations and log files from local storage on startup
function loadData() {
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

  // Initialize Puter Edge Cloud
  initPuterCloud();
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
  
  // Periodically check/pull updates from cloud in background if signed in
  setInterval(function() {
    if (typeof puter !== 'undefined' && puter.auth.isSignedIn()) {
      pullData().then(function() {
        // Refresh UI state inside the sync modal if it is currently open
        var modal = document.getElementById('syncModal');
        if (modal && modal.classList.contains('open')) {
          updatePuterUI(true);
        }
      });
    }
  }, 30000); // Check every 30 seconds
});

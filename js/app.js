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
  template: '$pair\n\n$dir\n\nEntry: $entry\nStop Loss: $sl\n\nTake Profits:$tps\n\nRisk: $risk\n\nRisk Free at 1RR\n\n$ping'
};

var DEF_PW = 'trigger2024';

// Retrieve active application password
function getPW() {
  return localStorage.getItem('txbt_pw') || DEF_PW;
}

// Save active global state webhook/trade logs to local storage
function saveWH() {
  localStorage.setItem('txbt_wh', JSON.stringify(S.webhooks));
}

function saveTrades() {
  localStorage.setItem('txbt_tr', JSON.stringify(S.trades));
}

function saveAdvancedSettings() {
  localStorage.setItem('txbt_format', S.format);
  localStorage.setItem('txbt_template', S.template);
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
  // Clear any existing timeouts if possible, or just set it
  if (t.dataset.timeoutId) {
    clearTimeout(parseInt(t.dataset.timeoutId));
  }
  var id = setTimeout(function() {
    t.classList.remove('show');
  }, 3000);
  t.dataset.timeoutId = id;
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

  // Initialize advanced settings input fields in modals/settings
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
        saveWH();
      }
      if (imported.trades && Array.isArray(imported.trades)) {
        S.trades = imported.trades;
        saveTrades();
      }
      if (imported.format) {
        S.format = imported.format;
      }
      if (imported.template) {
        S.template = imported.template;
      }
      saveAdvancedSettings();
      
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
  // Modal overlay click listeners for auto-dismiss
  document.querySelectorAll('.modal-overlay').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target === el) {
        el.classList.remove('open');
      }
    });
  });
});

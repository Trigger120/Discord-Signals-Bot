// Compute metrics and update Chart.js displays in the Dashboard page
function renderDashboard() {
  var trades = getMonthTrades('dashMonth');
  var total = trades.length;
  
  var wins = trades.filter(function(t) { return t.status === 'WIN'; }).length;
  var losses = trades.filter(function(t) { return t.status === 'LOSS'; }).length;
  var be = trades.filter(function(t) { return t.status === 'BE'; }).length;
  var open = trades.filter(function(t) { return t.status === 'OPEN'; }).length;
  
  var closed = wins + losses + be;
  var wr = closed > 0 ? Math.round((wins / closed) * 100) : 0;
  
  var rrs = trades.filter(function(t) {
    return t.rr && !isNaN(parseFloat(t.rr));
  }).map(function(t) {
    return parseFloat(t.rr);
  });
  
  var tRR = rrs.reduce(function(a, b) { return a + b; }, 0);
  var aRR = rrs.length > 0 ? (tRR / rrs.length).toFixed(2) : 0;
  
  // Render stats numeric displays
  document.getElementById('dTotal').textContent = total;
  document.getElementById('dWinRate').textContent = wr + '%';
  document.getElementById('dTotalRR').textContent = tRR.toFixed(2) + 'R';
  document.getElementById('dAvgRR').textContent = aRR + 'R';
  document.getElementById('dWins').textContent = wins;
  document.getElementById('dLosses').textContent = losses;
  document.getElementById('dBE').textContent = be;
  document.getElementById('dOpen').textContent = open;
  
  // Render active open trades list
  var openTradesList = S.trades.filter(function(t) { return t.status === 'OPEN'; });
  var atContainer = document.getElementById('activeTrades');
  if (atContainer) {
    if (openTradesList.length === 0) {
      atContainer.innerHTML = '<div class="no-data">No open trades active at the moment.</div>';
    } else {
      atContainer.innerHTML = openTradesList.map(function(t) {
        var dc = t.dir === 'LONG' ? 'l' : 's';
        var dLabel = t.dir === 'LONG' ? 'LONG' : 'SHORT';
        return '<div class="at-item">' +
          '<div>' +
            '<span class="at-pair">' + t.pair + '</span> &nbsp; ' +
            '<span class="at-dir ' + dc + '">' + dLabel + '</span>' +
          '</div>' +
          '<div class="at-info">' +
            'Entry: ' + t.entry + ' &nbsp; SL: ' + t.sl +
          '</div>' +
          '<div>' +
            '<button class="upd-btn" onclick="openUpdate(' + t.id + ')">Update</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  }
  
  // Skip charts initialization if Chart.js is not loaded
  if (typeof Chart === 'undefined') return;
  
  // 1. WL Doughnut Chart
  var wlCtx = document.getElementById('chartWL');
  if (wlCtx) {
    var ctx = wlCtx.getContext('2d');
    if (S.wlChart) S.wlChart.destroy();
    
    S.wlChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses', 'Breakeven', 'Open'],
        datasets: [{
          data: [wins, losses, be, open],
          backgroundColor: [
            'rgba(16, 185, 129, 0.65)',  // Emerald Green
            'rgba(239, 68, 68, 0.65)',    // Red
            'rgba(245, 158, 11, 0.65)',   // Gold
            'rgba(59, 130, 246, 0.4)'     // Blue
          ],
          borderColor: [
            '#10b981',
            '#ef4444',
            '#f59e0b',
            '#3b82f6'
          ],
          borderWidth: 1,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#9ca3af',
              font: {
                family: 'Inter',
                size: 11
              },
              padding: 12
            }
          }
        },
        cutout: '65%'
      }
    });
  }
  
  // 2. RR Per Trade Bar Chart
  var rrCtx = document.getElementById('chartRR');
  if (rrCtx) {
    var ctx = rrCtx.getContext('2d');
    if (S.rrChart) S.rrChart.destroy();
    
    // Get last 15 trades with valid numeric RR logged
    var rrTrades = trades.filter(function(t) {
      return t.rr && !isNaN(parseFloat(t.rr));
    }).slice(-15);
    
    S.rrChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rrTrades.map(function(t) { return t.pair; }),
        datasets: [{
          data: rrTrades.map(function(t) { return parseFloat(t.rr); }),
          backgroundColor: rrTrades.map(function(t) {
            return t.status === 'WIN' ? 'rgba(16, 185, 129, 0.7)' :
                   t.status === 'LOSS' ? 'rgba(239, 68, 68, 0.7)' :
                   'rgba(245, 158, 11, 0.7)';
          }),
          borderColor: rrTrades.map(function(t) {
            return t.status === 'WIN' ? '#10b981' :
                   t.status === 'LOSS' ? '#ef4444' :
                   '#f59e0b';
          }),
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#9ca3af',
              font: {
                family: 'Inter',
                size: 10
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            }
          },
          y: {
            ticks: {
              color: '#9ca3af',
              font: {
                family: 'Inter',
                size: 10
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            }
          }
        }
      }
    });
  }
}

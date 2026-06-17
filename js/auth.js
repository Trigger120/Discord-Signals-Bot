// Check and validate input password against local storage password
function checkPw() {
  var v = document.getElementById('pwInput').value;
  if (v === getPW()) {
    // Unlock transition
    document.getElementById('passwordScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('pwInput').value = '';
    loadData();
  } else {
    document.getElementById('pwError').textContent = 'Incorrect password';
    document.getElementById('pwInput').value = '';
    setTimeout(function() {
      document.getElementById('pwError').textContent = '';
    }, 2000);
  }
}

// Lock application down and show authentication cover
function lockApp() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('passwordScreen').style.display = 'flex';
}

// Handle application password modification
function changePw() {
  var o = document.getElementById('oldPw').value;
  var n = document.getElementById('newPw').value;
  var c = document.getElementById('cfPw').value;
  var err = document.getElementById('pwChgErr');
  
  if (o !== getPW()) {
    err.textContent = 'Current password incorrect';
    return;
  }
  if (n.length < 4) {
    err.textContent = 'Min 4 characters';
    return;
  }
  if (n !== c) {
    err.textContent = 'Passwords do not match';
    return;
  }
  
  localStorage.setItem('txbt_pw', n);
  closeModal('changePwModal');
  toast('Password changed!', 'ok');
  
  ['oldPw', 'newPw', 'cfPw'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  err.textContent = '';
}

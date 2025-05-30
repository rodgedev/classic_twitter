document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('hideVerification');
  
  // Load saved setting
  chrome.storage.sync.get(['hideVerification'], (result) => {
    toggle.checked = !!result.hideVerification;
  });
  
  // Save when changed
  toggle.addEventListener('change', (e) => {
    chrome.storage.sync.set({ hideVerification: e.target.checked });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    });
  });
});
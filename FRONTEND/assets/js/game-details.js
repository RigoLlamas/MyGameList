function toggleTab(tabName) {
  const tabInfo = document.getElementById('tab-info');
  const tabStats = document.getElementById('tab-stats');
  const contentInfo = document.getElementById('content-info');
  const contentStats = document.getElementById('content-stats');

  if (tabName === 'info') {
    tabInfo.className = 'nav-link active fw-semibold';
    tabStats.className = 'nav-link text-secondary';
    
    contentInfo.classList.remove('d-none');
    contentStats.classList.add('d-none');
  } else if (tabName === 'stats') {
    tabStats.className = 'nav-link active fw-semibold';
    tabInfo.className = 'nav-link text-secondary';
    
    contentStats.classList.remove('d-none');
    contentInfo.classList.add('d-none');
  }
}
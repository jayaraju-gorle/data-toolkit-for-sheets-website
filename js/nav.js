document.addEventListener('DOMContentLoaded', function() {
  const navContainer = document.getElementById('nav-container');
  
  if (navContainer) {
    navContainer.innerHTML = `
      <ul>
        <li><a href="index.html"><i class="fas fa-home"></i> Home</a></li>
        <li><a href="privacy.html"><i class="fas fa-shield-alt"></i> Privacy Policy</a></li>
        <li><a href="terms.html"><i class="fas fa-file-contract"></i> Terms of Service</a></li>
        <li><a href="support.html"><i class="fas fa-question-circle"></i> Support</a></li>
      </ul>
    `;
    
    // Highlight current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const currentNav = navContainer.querySelector(`a[href="${currentPage}"]`);
    
    if (currentNav) {
      currentNav.parentElement.classList.add('current-page');
    }
  }
});
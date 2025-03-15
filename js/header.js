document.addEventListener('DOMContentLoaded', function() {
  const headerContainer = document.getElementById('header-container');
  
  if (headerContainer) {
    headerContainer.innerHTML = `
      <div class="container">
        <div class="logo-container">
          <img src="images/logo.png" alt="Data Toolkit for Sheets Logo" class="logo">
          <div class="header-text">
            <h1 id="page-title">Welcome to Data Toolkit for Sheets</h1>
            <p id="page-subtitle">Advanced data tools to supercharge your Google Sheets experience</p>
          </div>
        </div>
      </div>
    `;
    
    // Update page title and subtitle based on current page
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
      case 'privacy.html':
        document.getElementById('page-title').textContent = 'Privacy Policy';
        document.getElementById('page-subtitle').textContent = 'How we protect and manage your data';
        break;
      case 'terms.html':
        document.getElementById('page-title').textContent = 'Terms of Service';
        document.getElementById('page-subtitle').textContent = 'Guidelines for using Data Toolkit for Sheets';
        break;
      case 'support.html':
        document.getElementById('page-title').textContent = 'Support';
        document.getElementById('page-subtitle').textContent = 'Help and resources for Data Toolkit for Sheets';
        break;
      default:
        // Default is already set in the HTML
        break;
    }
  }
});
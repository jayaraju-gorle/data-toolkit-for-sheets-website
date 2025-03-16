// Use a more efficient event listener that doesn't block rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeader);
} else {
  initHeader();
}

function initHeader() {
  const headerContainer = document.getElementById('header-container');
  
  if (!headerContainer) return;
  
  // Create elements instead of using innerHTML for better performance
  const container = document.createElement('div');
  container.className = 'container';
  
  const logoContainer = document.createElement('div');
  logoContainer.className = 'logo-container';
  
  const logoLink = document.createElement('a');
  logoLink.href = 'https://www.datatoolkitforsheets.com/';
  logoLink.className = 'logo-link';
  logoLink.setAttribute('aria-label', 'Data Toolkit Homepage');
  
  const logoImg = document.createElement('img');
  logoImg.src = 'images/logo.png';
  logoImg.alt = 'Data Toolkit for Sheets Logo';
  logoImg.className = 'logo';
  logoImg.width = 50;
  logoImg.height = 50;
  
  const headerText = document.createElement('div');
  headerText.className = 'header-text';
  
  const pageTitle = document.createElement('h1');
  pageTitle.id = 'page-title';
  pageTitle.textContent = 'Welcome to Data Toolkit for Sheets';
  
  const pageSubtitle = document.createElement('p');
  pageSubtitle.id = 'page-subtitle';
  pageSubtitle.textContent = 'Advanced data tools to supercharge your Google Sheets experience';
  
  // Build the DOM structure
  logoLink.appendChild(logoImg);
  logoContainer.appendChild(logoLink);
  headerText.appendChild(pageTitle);
  headerText.appendChild(pageSubtitle);
  logoContainer.appendChild(headerText);
  container.appendChild(logoContainer);
  headerContainer.appendChild(container);
  
  // Update page title and subtitle based on current page
  const currentPage = window.location.pathname.split('/').pop();
  
  switch(currentPage) {
    case 'privacy.html':
      pageTitle.textContent = 'Privacy Policy';
      pageSubtitle.textContent = 'How we protect and manage your data';
      break;
    case 'terms.html':
      pageTitle.textContent = 'Terms of Service';
      pageSubtitle.textContent = 'Guidelines for using Data Toolkit for Sheets';
      break;
    case 'support.html':
      pageTitle.textContent = 'Support';
      pageSubtitle.textContent = 'Help and resources for Data Toolkit for Sheets';
      break;
    default:
      // Default is already set above
      break;
  }
}
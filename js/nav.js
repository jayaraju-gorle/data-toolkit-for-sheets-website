// Use a more efficient event listener that doesn't block rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}

function initNavigation() {
  const navContainer = document.getElementById('nav-container');
  
  if (!navContainer) return;
  
  // Create elements with proper DOM methods instead of innerHTML
  const container = document.createElement('div');
  container.className = 'container';
  
  const navList = document.createElement('ul');
  
  // Define navigation items
  const navItems = [
    { href: 'https://www.datatoolkitforsheets.com/', icon: 'fas fa-home', text: 'Home' },
    { href: 'try.html', icon: 'fas fa-tools', text: 'Try Tools' },
    { href: 'privacy.html', icon: 'fas fa-shield-alt', text: 'Privacy Policy' },
    { href: 'terms.html', icon: 'fas fa-file-contract', text: 'Terms of Service' },
    { href: 'support.html', icon: 'fas fa-question-circle', text: 'Support' }
  ];
  
  // Create each navigation item
  navItems.forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.href;
    
    const icon = document.createElement('i');
    icon.className = item.icon;
    icon.setAttribute('aria-hidden', 'true');
    
    a.appendChild(icon);
    a.appendChild(document.createTextNode(' ' + item.text));
    li.appendChild(a);
    navList.appendChild(li);
  });
  
  container.appendChild(navList);
  navContainer.appendChild(container);
  
  // Highlight current page in navigation
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentNav = navContainer.querySelector(`a[href="${currentPage}"]`);
  
  if (currentNav) {
    currentNav.parentElement.classList.add('current-page');
    currentNav.setAttribute('aria-current', 'page');
  } else if (currentPage === '' || currentPage === 'index.html') {
    // Highlight home link when on homepage
    const homeLink = navContainer.querySelector('a[href="https://www.datatoolkitforsheets.com/"]');
    if (homeLink) {
      homeLink.parentElement.classList.add('current-page');
      homeLink.setAttribute('aria-current', 'page');
    }
  }
}
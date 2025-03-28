// Use a more efficient event listener that doesn't block rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFooter);
} else {
  initFooter();
}

function initFooter() {
  const footerContainer = document.getElementById('footer-container');
  
  if (!footerContainer) return;
  
  // Create elements with proper DOM methods instead of innerHTML
  const container = document.createElement('div');
  container.className = 'container';
  
  // Create logo image
  const logo = document.createElement('img');
  logo.src = 'images/logo.png';
  logo.alt = 'Data Toolkit for Sheets Logo';
  logo.className = 'footer-logo';
  logo.style.maxWidth = '80px';
  logo.style.marginBottom = '10px';
  logo.width = 80;
  logo.height = 80;
  
  // Create copyright text
  const copyright = document.createElement('p');
  copyright.textContent = `© ${new Date().getFullYear()} Data Toolkit for Sheets. All rights reserved.`;
  
  // Create footer links container
  const linksContainer = document.createElement('div');
  linksContainer.className = 'footer-links';
  
  // Define footer links
  const footerLinks = [
    { href: 'privacy.html', text: 'Privacy Policy' },
    { href: 'terms.html', text: 'Terms of Service' },
    { href: 'support.html', text: 'Support' }
  ];
  
  // Create each footer link
  footerLinks.forEach(link => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.style.color = 'white';
    a.style.margin = '0 10px';
    linksContainer.appendChild(a);
  });
  
  // Create contact information
  const contactContainer = document.createElement('p');
  contactContainer.className = 'mt-2';
  contactContainer.textContent = 'Contact: ';
  
  const emailLink = document.createElement('a');
emailLink.href = 'mailto:contact@datatoolkitforsheets.com';
  emailLink.textContent = 'contact@datatoolkitforsheets.com';
  emailLink.style.color = 'white';
  
  contactContainer.appendChild(emailLink);
  
  // Add all elements to the container
  container.appendChild(logo);
  container.appendChild(copyright);
  container.appendChild(linksContainer);
  container.appendChild(contactContainer);
  
  // Add the container to the footer
  footerContainer.appendChild(container);
}

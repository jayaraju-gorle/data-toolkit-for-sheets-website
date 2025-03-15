document.addEventListener('DOMContentLoaded', function() {
  const footerContainer = document.getElementById('footer-container');
  
  if (footerContainer) {
    footerContainer.innerHTML = `
      <div class="container">
        <img src="images/logo.png" alt="Data Toolkit for Sheets Logo" class="footer-logo">
        <p>&copy; ${new Date().getFullYear()} Data Toolkit for Sheets. All rights reserved.</p>
        <div class="footer-links">
          <a href="privacy.html">Privacy Policy</a> | 
          <a href="terms.html">Terms of Service</a> | 
          <a href="support.html">Support</a>
        </div>
        <p class="mt-2">Contact: <a href="mailto:gorlej2015@email.iimcal.ac.in">gorlej2015@email.iimcal.ac.in</a></p>
      </div>
    `;
  }
});
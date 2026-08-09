// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, show update notification
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// PWA Install Prompt
let deferredPrompt;
const installButton = document.getElementById('pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Show install button
  if (installButton) {
    installButton.style.display = 'flex';
  } else {
    // Show install banner if button doesn't exist
    showInstallBanner();
  }
});

function showInstallBanner() {
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl shadow-2xl z-50 animate-slideUp';
  banner.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="bg-white p-2 rounded-lg">
        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      </div>
      <div class="flex-1">
        <h3 class="font-bold text-lg mb-1">Install BORS App</h3>
        <p class="text-sm text-green-50 mb-3">Install our app for quick access and offline use!</p>
        <div class="flex gap-2">
          <button onclick="installPWA()" class="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-50 transition-all">
            Install
          </button>
          <button onclick="dismissInstallBanner()" class="bg-green-800 bg-opacity-50 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-opacity-70 transition-all">
            Later
          </button>
        </div>
      </div>
      <button onclick="dismissInstallBanner()" class="text-white hover:text-green-200">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(banner);
}

function installPWA() {
  if (!deferredPrompt) {
    return;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      dismissInstallBanner();
    } else {
      console.log('User dismissed the install prompt');
    }
    deferredPrompt = null;
  });
}

function dismissInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.remove();
  }
  // Store dismissal in localStorage
  localStorage.setItem('pwa-install-dismissed', Date.now());
}

// Check if banner was recently dismissed
window.addEventListener('load', () => {
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) {
      // Don't show banner if dismissed within last 7 days
      return;
    }
  }
});

// Detect if app is installed
window.addEventListener('appinstalled', () => {
  console.log('BORS PWA was installed');
  dismissInstallBanner();
  // Hide install button if exists
  if (installButton) {
    installButton.style.display = 'none';
  }
});

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-xl shadow-2xl z-50 animate-slideDown max-w-sm';
  notification.innerHTML = `
    <div class="flex items-start gap-3">
      <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
      </svg>
      <div class="flex-1">
        <h3 class="font-bold mb-1">Update Available</h3>
        <p class="text-sm text-blue-50 mb-3">A new version of BORS is available!</p>
        <button onclick="window.location.reload()" class="bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all">
          Update Now
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    notification.remove();
  }, 10000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
`;
document.head.appendChild(style);

// Check if running as PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// Add PWA class to body if running as PWA
if (isPWA()) {
  document.body.classList.add('pwa-mode');
  console.log('Running as PWA');
}

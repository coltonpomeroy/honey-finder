"use cilent";

import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', (e) => {
        setDeferredPrompt(null);
      });
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (isIOS && !isStandalone) {
    return (
      <div>
        <p>Install this app on your iOS device: tap the share icon and then {"Add to Home Screen"}.</p>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div>
        <button onClick={handleInstallClick}>Install App</button>
      </div>
    );
  }

  return null;
};

export default InstallPrompt;
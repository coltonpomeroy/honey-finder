import React, { useEffect, useState } from 'react';
import PushNotificationManager from './PushNotificationManager';

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    // Detect if on iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window).MSStream
    );

    // Detect if app is already installed (standalone mode)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // Listen for the 'beforeinstallprompt' event on supported browsers (e.g., Chrome on Android)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default mini-infobar prompt on Chrome
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) {
    // If the app is already installed (standalone), don’t show the prompt
    return null;
  }

  // Trigger the Android install prompt
  const handleAddToHomeScreen = () => {
    if (!deferredPrompt) return;

    // Cast to the correct event type for TS if needed:
    // const promptEvent = deferredPrompt as any; 
    const promptEvent = deferredPrompt // or type it if using TS

    // Show the prompt
    promptEvent.prompt();

    // Wait for the user’s response
    promptEvent.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setDeferredPrompt(null);
    });
  };

  return (
    <div>
      <h3>Install App</h3>

      {/* Show "Add to Home Screen" button for Android (or non-iOS) only if we have a deferredPrompt */}
      {!isIOS && deferredPrompt && (
        <button onClick={handleAddToHomeScreen}>Add to Home Screen</button>
      )}

      {/* Show iOS-specific instructions if on iOS */}
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon"> ⎋ </span>
          and then "Add to Home Screen"
          <span role="img" aria-label="plus icon"> ➕ </span>.
        </p>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <PushNotificationManager />
      <InstallPrompt />
    </div>
  );
}

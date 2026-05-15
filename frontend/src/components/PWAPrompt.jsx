import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('PWAPrompt: Initializing event listeners...');
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('PWAPrompt: App is already running in standalone mode.');
      return;
    }

    const handler = (e) => {
      console.log('PWAPrompt: beforeinstallprompt event fired!');
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the prompt
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for appinstalled event
    window.addEventListener('appinstalled', (evt) => {
      console.log('PWAPrompt: App was installed.');
      setIsVisible(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md transition-all duration-500 opacity-100 translate-y-0">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/20 p-6 backdrop-blur-xl shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-indigo-500/20 blur-3xl" />

        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Download className="text-white" size={24} />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="text-lg font-bold text-white mb-1">
              Install RTO Sarthi
            </h3>
            <p className="text-sm text-white/70 leading-relaxed mb-4">
              Add RTO Sarthi to your home screen for quick access and a better experience.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-blue-600 hover:bg-blue-50 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-white/10"
              >
                Install App
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-white font-medium text-sm hover:bg-white/10 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAPrompt;

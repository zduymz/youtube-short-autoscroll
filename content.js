/**
 * YouTube Shorts Auto-Scroll Extension
 * Automatically scrolls to the next video when a YouTube Short ends
 */

(function () {
  'use strict';

  // Configuration
  const SCROLL_DELAY = 500; // Delay in ms before scrolling after video ends
  const SCROLL_AMOUNT = 1000; // Pixels to scroll (adjust based on YouTube Shorts layout)
  
  let currentVideo = null;
  let isScrolling = false;
  let observer = null;
  let checkInterval = null;
  let loopMonitorInterval = null;
  let disableLoopHandler = null;

  /**
   * Enhanced logging function
   */
  function log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[YouTube Shorts Auto-Scroll ${timestamp}] ${message}`;
    console.log(logMessage, data || '');
  }

  /**
   * Scroll to the next video
   */
  function scrollToNextVideo() {
    log('scrollToNextVideo() called', { isScrolling });
    
    if (isScrolling) {
      log('Already scrolling, skipping...');
      return;
    }
    
    isScrolling = true;
    log('Starting scroll', { SCROLL_AMOUNT, windowScrollY: window.scrollY });
    
    // Try multiple scroll methods for YouTube Shorts
    const scrollContainer = document.querySelector('#shorts-container') || 
                           document.querySelector('ytd-shorts') ||
                           window;
    
    log('Scroll container found', { 
      container: scrollContainer.tagName || 'window',
      containerId: scrollContainer.id || 'N/A'
    });

    // Method 1: Try scrolling the container
    if (scrollContainer !== window) {
      scrollContainer.scrollBy({
        top: SCROLL_AMOUNT,
        behavior: 'smooth'
      });
      log('Scrolled container element');
    }

    // Method 2: Try window scroll
    window.scrollBy({
      top: SCROLL_AMOUNT,
      behavior: 'smooth'
    });
    log('Scrolled window');

    // Method 3: Try keyboard event (ArrowDown)
    try {
      const arrowDownEvent = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        which: 40,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(arrowDownEvent);
      log('Dispatched ArrowDown keyboard event');
    } catch (e) {
      log('Error dispatching keyboard event', e);
    }

    // Method 4: Try wheel event
    try {
      const wheelEvent = new WheelEvent('wheel', {
        deltaY: SCROLL_AMOUNT,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(wheelEvent);
      log('Dispatched wheel event', { deltaY: SCROLL_AMOUNT });
    } catch (e) {
      log('Error dispatching wheel event', e);
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrolling = false;
      log('Scroll completed, flag reset', { newScrollY: window.scrollY });
    }, 1000);
  }

  /**
   * Handle video end event
   */
  function handleVideoEnd(event) {
    log('Video ended event fired!', {
      videoSrc: currentVideo?.src?.substring(0, 50) || 'N/A',
      videoCurrentTime: currentVideo?.currentTime,
      videoDuration: currentVideo?.duration,
      videoEnded: currentVideo?.ended,
      videoPaused: currentVideo?.paused
    });
    
    // Small delay to ensure video is paused
    setTimeout(() => {
      log('Scroll delay completed, calling scrollToNextVideo()');
      scrollToNextVideo();
    }, SCROLL_DELAY);
  }

  /**
   * Continuously monitor and disable video loop
   */
  function startLoopMonitor(video) {
    // Clear any existing monitor
    if (loopMonitorInterval) {
      clearInterval(loopMonitorInterval);
    }
    
    // Continuously check and disable loop
    loopMonitorInterval = setInterval(() => {
      if (video && video.loop) {
        log('Loop was re-enabled, disabling again');
        video.loop = false;
      }
    }, 100); // Check every 100ms
  }
  
  function stopLoopMonitor() {
    if (loopMonitorInterval) {
      clearInterval(loopMonitorInterval);
      loopMonitorInterval = null;
    }
  }

  /**
   * Setup video event listeners
   */
  function setupVideo(video) {
    if (!video) {
      log('setupVideo() called with null/undefined video');
      return;
    }
    
    if (video === currentVideo) {
      log('setupVideo() called with same video, skipping');
      return;
    }
    
    log('Setting up new video', {
      videoId: video.id || 'no-id',
      videoSrc: video.src?.substring(0, 50) || 'no-src',
      videoCurrentTime: video.currentTime,
      videoDuration: video.duration,
      videoPaused: video.paused,
      videoEnded: video.ended,
      videoLoop: video.loop,
      previousVideo: currentVideo?.id || 'none'
    });
    
    // Remove previous listeners if any
    if (currentVideo && disableLoopHandler) {
      log('Removing listeners from previous video');
      currentVideo.removeEventListener('ended', handleVideoEnd);
      currentVideo.onended = null;
      // Remove click and seek listeners
      currentVideo.removeEventListener('click', disableLoopHandler);
      currentVideo.removeEventListener('seeked', disableLoopHandler);
      currentVideo.removeEventListener('seeking', disableLoopHandler);
    }
    
    // Stop previous loop monitor
    stopLoopMonitor();

    currentVideo = video;
    
    // Prevent video looping
    video.loop = false;
    log('Set video.loop = false');
    
    // Function to disable loop (used for event handlers)
    disableLoopHandler = () => {
      if (video.loop) {
        log('Loop detected after user interaction, disabling');
        video.loop = false;
      }
    };
    
    // Listen for click events to disable loop
    video.addEventListener('click', disableLoopHandler);
    log('Added click event listener to disable loop');
    
    // Listen for seek events to disable loop
    video.addEventListener('seeked', disableLoopHandler);
    video.addEventListener('seeking', disableLoopHandler);
    log('Added seek event listeners to disable loop');
    
    // Start continuous loop monitoring
    startLoopMonitor(video);
    
    // Add multiple event listeners to catch video end
    // Method 1: onended property
    video.onended = () => {
      log('video.onended callback fired');
      video.pause();
      handleVideoEnd();
    };

    // Method 2: addEventListener with ended event
    video.addEventListener('ended', handleVideoEnd, { once: false });
    log('Added ended event listener');

    // Method 3: Listen for timeupdate to detect when video reaches end
    video.addEventListener('timeupdate', () => {
      if (video.currentTime >= video.duration - 0.1 && !video.ended) {
        log('Video near end detected via timeupdate', {
          currentTime: video.currentTime,
          duration: video.duration,
          difference: video.duration - video.currentTime
        });
      }
    });

    // // Log video state periodically
    // const stateLogger = setInterval(() => {
    //   if (video !== currentVideo) {
    //     clearInterval(stateLogger);
    //     return;
    //   }
    // }, 5000);
    
    log('Video setup complete');
  }

  /**
   * Find and setup video element
   */
  function findAndSetupVideo() {
    log('findAndSetupVideo() called');
    const videos = document.querySelectorAll('video');
    log('Found videos', { count: videos.length });
    
    videos.forEach((video, index) => {
      log(`Video ${index}`, {
        id: video.id || 'no-id',
        src: video.src?.substring(0, 50) || 'no-src',
        readyState: video.readyState,
        readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState] || 'UNKNOWN',
        currentTime: video.currentTime,
        duration: video.duration,
        paused: video.paused,
        ended: video.ended
      });
    });
    
    // Find the main video (usually the first one or one that's playing)
    const video = Array.from(videos).find(v => v.readyState >= 2) || videos[0];
    
    if (video) {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        log('Video found with sufficient readyState, setting up...');
        setupVideo(video);
      } else {
        log('Video found but readyState too low, waiting...', {
          readyState: video.readyState,
          required: 2
        });
        // Wait for video to load
        video.addEventListener('loadeddata', () => {
          log('Video loadeddata event fired');
          setupVideo(video);
        }, { once: true });
      }
    } else {
      log('No video element found');
    }
  }

  /**
   * Initialize the extension
   */
  function init() {
    log('=== Extension Initialization Started ===');
    log('Page URL', window.location.href);
    log('Document ready state', document.readyState);
    
    // Check if we're on YouTube Shorts
    if (!window.location.href.includes('/shorts/')) {
      log('WARNING: Not on YouTube Shorts page!', window.location.href);
    }

    // Initial video setup
    findAndSetupVideo();

    // Watch for DOM changes to catch dynamically loaded videos
    observer = new MutationObserver((mutations) => {
      const video = document.querySelector('video');
      if (video && video !== currentVideo) {
        log('MutationObserver detected new video element');
        findAndSetupVideo();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    log('MutationObserver started');

    // Also listen for video element changes in the short player container
    checkInterval = setInterval(() => {
      const video = document.querySelector('video');
      if (video && video !== currentVideo) {
        log('Interval check detected new video element');
        findAndSetupVideo();
      }
    }, 1000);
    log('Interval check started (every 1s)');

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      log('Page unloading, cleaning up...');
      if (observer) {
        observer.disconnect();
      }
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      stopLoopMonitor();
    });

    log('=== Extension Initialization Complete ===');
  }

  // Start when DOM is ready
  log('Script loaded, checking document state...');
  if (document.readyState === 'loading') {
    log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
      log('DOMContentLoaded fired');
      init();
    });
  } else {
    log('Document already ready, initializing immediately');
    init();
  }

  // Also listen for navigation changes (YouTube is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      log('URL changed, reinitializing...', { newUrl: url });
      // Reset state
      currentVideo = null;
      isScrolling = false;
      if (observer) {
        observer.disconnect();
      }
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      stopLoopMonitor();
      // Reinitialize after a short delay
      setTimeout(init, 500);
    }
  }).observe(document, { subtree: true, childList: true });
})();


// RecruitOS LinkedIn Sync - Content Script
// Passive capture of profiles and messages the user views

(function() {
  'use strict';

  const STORAGE_KEY = 'recruitos_linkedin';
  const MAX_CAPTURES_PER_HOUR = 50;
  const CAPTURE_COOLDOWN_MS = 3000; // 3 seconds between captures
  
  let lastCaptureTime = 0;
  let captureCount = 0;
  let captureCountResetTime = Date.now();
  
  // ============================================
  // RATE LIMITING
  // ============================================
  
  function canCapture() {
    const now = Date.now();
    
    // Reset hourly counter
    if (now - captureCountResetTime > 3600000) {
      captureCount = 0;
      captureCountResetTime = now;
    }
    
    // Check rate limits
    if (captureCount >= MAX_CAPTURES_PER_HOUR) {
      console.log('[RecruitOS] Hourly capture limit reached');
      return false;
    }
    
    if (now - lastCaptureTime < CAPTURE_COOLDOWN_MS) {
      console.log('[RecruitOS] Cooldown active');
      return false;
    }
    
    return true;
  }
  
  function recordCapture() {
    lastCaptureTime = Date.now();
    captureCount++;
  }

  // ============================================
  // PROFILE DETECTION & EXTRACTION
  // ============================================
  
  function isProfilePage() {
    return window.location.pathname.startsWith('/in/');
  }
  
  function isMessagingPage() {
    return window.location.pathname.startsWith('/messaging');
  }
  
  function isSearchPage() {
    return window.location.pathname.includes('/search/results/');
  }
  
  function extractProfileData() {
    const profile = {
      url: window.location.href,
      capturedAt: new Date().toISOString(),
      source: 'linkedin_extension'
    };
    
    // Name
    const nameEl = document.querySelector('h1.text-heading-xlarge');
    profile.name = nameEl?.textContent?.trim() || null;
    
    // Headline
    const headlineEl = document.querySelector('.text-body-medium.break-words');
    profile.headline = headlineEl?.textContent?.trim() || null;
    
    // Location
    const locationEl = document.querySelector('.text-body-small.inline.t-black--light.break-words');
    profile.location = locationEl?.textContent?.trim() || null;
    
    // Profile photo
    const photoEl = document.querySelector('.pv-top-card-profile-picture__image--show');
    profile.photoUrl = photoEl?.src || null;
    
    // Current company (from experience section or headline)
    const companyLink = document.querySelector('button[aria-label*="Current company"] span, .pv-text-details__right-panel-item-text');
    profile.currentCompany = companyLink?.textContent?.trim() || null;
    
    // About section
    const aboutSection = document.querySelector('.pv-shared-text-with-see-more');
    profile.about = aboutSection?.textContent?.trim()?.replace('…see more', '').trim() || null;
    
    // Connection degree
    const degreeEl = document.querySelector('.dist-value');
    profile.connectionDegree = degreeEl?.textContent?.trim() || null;
    
    // Mutual connections
    const mutualEl = document.querySelector('[href*="facetConnectionOf"] span');
    profile.mutualConnections = mutualEl?.textContent?.trim() || null;
    
    // LinkedIn ID from URL
    const urlMatch = window.location.pathname.match(/\/in\/([^\/]+)/);
    profile.linkedinId = urlMatch ? urlMatch[1] : null;
    
    // Experience (first 3 positions)
    profile.experience = [];
    const expItems = document.querySelectorAll('.pvs-list__paged-list-item');
    expItems.forEach((item, i) => {
      if (i >= 3) return;
      const titleEl = item.querySelector('.t-bold span[aria-hidden="true"]');
      const compEl = item.querySelector('.t-normal span[aria-hidden="true"]');
      if (titleEl) {
        profile.experience.push({
          title: titleEl.textContent?.trim(),
          company: compEl?.textContent?.trim()
        });
      }
    });
    
    return profile;
  }

  // ============================================
  // MESSAGE EXTRACTION
  // ============================================
  
  function extractMessages() {
    const messages = [];
    
    const thread = document.querySelector('.msg-s-message-list-content');
    if (!thread) return messages;
    
    const headerName = document.querySelector('.msg-overlay-conversation-bubble-header__title, .msg-entity-lockup__entity-title');
    const conversationWith = headerName?.textContent?.trim() || 'Unknown';
    
    const messageItems = thread.querySelectorAll('.msg-s-message-list__event');
    
    messageItems.forEach(item => {
      try {
        const senderEl = item.querySelector('.msg-s-message-group__name');
        const sender = senderEl?.textContent?.trim();
        
        const contentEl = item.querySelector('.msg-s-event-listitem__body');
        const content = contentEl?.textContent?.trim();
        
        const timeEl = item.querySelector('.msg-s-message-group__timestamp, time');
        const timestamp = timeEl?.getAttribute('datetime') || timeEl?.textContent?.trim() || new Date().toISOString();
        
        if (content) {
          messages.push({
            platform: 'linkedin',
            sender: sender || conversationWith,
            content: content,
            timestamp: timestamp,
            conversationWith: conversationWith,
            url: window.location.href
          });
        }
      } catch (e) {
        console.error('[RecruitOS] Message extraction error:', e);
      }
    });
    
    return messages;
  }

  // ============================================
  // UI OVERLAY
  // ============================================
  
  function createOverlayButton() {
    // Don't create if already exists
    if (document.getElementById('recruitos-overlay-btn')) return;
    
    // Only show on profile pages
    if (!isProfilePage()) return;
    
    const btn = document.createElement('button');
    btn.id = 'recruitos-overlay-btn';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      <span>Add to RecruitOS</span>
    `;
    btn.onclick = handleAddToPipeline;
    
    document.body.appendChild(btn);
    console.log('[RecruitOS] Overlay button added');
  }
  
  function updateButtonState(state, text) {
    const btn = document.getElementById('recruitos-overlay-btn');
    if (!btn) return;
    
    btn.className = `recruitos-btn-${state}`;
    btn.querySelector('span').textContent = text;
  }
  
  async function handleAddToPipeline() {
    if (!canCapture()) {
      updateButtonState('error', 'Rate limited');
      setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 2000);
      return;
    }
    
    updateButtonState('loading', 'Capturing...');
    
    const profile = extractProfileData();
    
    if (!profile.name) {
      updateButtonState('error', 'Could not extract profile');
      setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 2000);
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_CANDIDATE',
        profile: profile
      });
      
      if (response.success) {
        recordCapture();
        updateButtonState('success', '✓ Added!');
        setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 3000);
      } else {
        updateButtonState('error', response.error || 'Failed');
        setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 2000);
      }
    } catch (e) {
      console.error('[RecruitOS] Add candidate error:', e);
      updateButtonState('error', 'Connection error');
      setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 2000);
    }
  }

  // ============================================
  // AUTO-CAPTURE (Passive)
  // ============================================
  
  let lastProfileUrl = null;
  
  async function autoCapture() {
    // Auto-capture profile views (passive, no button click needed)
    if (isProfilePage() && window.location.href !== lastProfileUrl) {
      lastProfileUrl = window.location.href;
      
      // Wait for page to fully load
      await new Promise(r => setTimeout(r, 2000));
      
      if (canCapture()) {
        const profile = extractProfileData();
        if (profile.name) {
          chrome.runtime.sendMessage({
            type: 'PROFILE_VIEW',
            profile: profile
          });
          recordCapture();
          console.log('[RecruitOS] Auto-captured profile:', profile.name);
        }
      }
    }
    
    // Auto-capture messages
    if (isMessagingPage()) {
      const messages = extractMessages();
      if (messages.length > 0) {
        chrome.runtime.sendMessage({
          type: 'MESSAGES_SYNC',
          messages: messages
        });
      }
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  
  function init() {
    console.log('[RecruitOS] LinkedIn Sync initialized');
    
    // Create overlay button
    createOverlayButton();
    
    // Initial capture
    autoCapture();
    
    // Watch for navigation (SPA)
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('[RecruitOS] Navigation detected');
        createOverlayButton();
        autoCapture();
      }
    }, 1000);
    
    // Watch for DOM changes (message loading)
    const observer = new MutationObserver(() => {
      if (isMessagingPage()) {
        setTimeout(autoCapture, 500);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Start
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();

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
    
    // LinkedIn ID from URL (most reliable)
    const urlMatch = window.location.pathname.match(/\/in\/([^\/]+)/);
    profile.linkedinId = urlMatch ? urlMatch[1] : null;
    
    // Name - try multiple selectors
    const nameSelectors = [
      'h1.text-heading-xlarge',
      'h1[class*="text-heading"]',
      '.pv-top-card h1',
      '.ph5 h1',
      'section.artdeco-card h1',
      'main h1'
    ];
    for (const sel of nameSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        profile.name = el.textContent.trim();
        break;
      }
    }
    
    // Headline - try multiple selectors
    const headlineSelectors = [
      '.text-body-medium.break-words',
      '[data-generated-suggestion-target="urn:li:fsu_profileActionDelegate"] + div',
      '.pv-top-card--list .text-body-medium',
      '.ph5 .text-body-medium',
      'main section .text-body-medium'
    ];
    for (const sel of headlineSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim() && el.textContent.trim() !== profile.name) {
        profile.headline = el.textContent.trim();
        break;
      }
    }
    
    // Location - try multiple selectors  
    const locationSelectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-top-card--list-bullet .text-body-small',
      'span.text-body-small.inline',
      '.ph5 .pb2 .text-body-small'
    ];
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      // Location usually contains city/country, not "connections" or "followers"
      if (text && !text.includes('connection') && !text.includes('follower')) {
        profile.location = text;
        break;
      }
    }
    
    // Profile photo
    const photoSelectors = [
      '.pv-top-card-profile-picture__image--show',
      'img.pv-top-card-profile-picture__image',
      '.pv-top-card__photo img',
      'main img[class*="profile"]',
      'img[src*="profile-displayphoto"]'
    ];
    for (const sel of photoSelectors) {
      const el = document.querySelector(sel);
      if (el?.src && el.src.includes('licdn.com')) {
        profile.photoUrl = el.src;
        break;
      }
    }
    
    // Current company
    const companySelectors = [
      'button[aria-label*="Current company"] span',
      '.pv-text-details__right-panel-item-text',
      '[aria-label*="current"] span',
      '.experience-item:first-child .t-bold'
    ];
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        profile.currentCompany = el.textContent.trim();
        break;
      }
    }
    
    // About section
    const aboutSelectors = [
      '.pv-shared-text-with-see-more',
      '#about ~ .display-flex .pv-shared-text-with-see-more',
      'section.pv-about-section',
      '[class*="about"] .inline-show-more-text'
    ];
    for (const sel of aboutSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        profile.about = el.textContent.trim().replace(/…see more|see more/gi, '').trim();
        break;
      }
    }
    
    // Connection degree
    const degreeSelectors = [
      '.dist-value',
      '.pvs-profile-actions .artdeco-button span',
      '[class*="degree"]'
    ];
    for (const sel of degreeSelectors) {
      const el = document.querySelector(sel);
      const text = el?.textContent?.trim();
      if (text && /1st|2nd|3rd/.test(text)) {
        profile.connectionDegree = text;
        break;
      }
    }
    
    // Mutual connections
    const mutualEl = document.querySelector('[href*="facetConnectionOf"] span, [href*="shared_connections"] span');
    profile.mutualConnections = mutualEl?.textContent?.trim() || null;
    
    // Experience (first 3 positions)
    profile.experience = [];
    const expSelectors = [
      '.pvs-list__paged-list-item',
      '#experience ~ .pvs-list__outer-container li',
      'section[id*="experience"] li'
    ];
    for (const sel of expSelectors) {
      const expItems = document.querySelectorAll(sel);
      if (expItems.length > 0) {
        expItems.forEach((item, i) => {
          if (i >= 3) return;
          const titleEl = item.querySelector('.t-bold span[aria-hidden="true"], .t-bold span, .t-bold');
          const compEl = item.querySelector('.t-normal span[aria-hidden="true"], .t-normal span, .t-14');
          if (titleEl?.textContent?.trim()) {
            profile.experience.push({
              title: titleEl.textContent.trim(),
              company: compEl?.textContent?.trim() || null
            });
          }
        });
        break;
      }
    }
    
    console.log('[RecruitOS] Extracted profile:', profile);
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
    
    if (!profile.linkedinId) {
      updateButtonState('error', 'Not a profile page');
      setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 2000);
      return;
    }
    
    // If no name found, use linkedinId as fallback
    if (!profile.name) {
      profile.name = profile.linkedinId.replace(/-/g, ' ').replace(/\d+$/, '').trim();
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

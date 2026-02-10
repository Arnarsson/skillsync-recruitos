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
  
  function isNotificationsPage() {
    return window.location.pathname.startsWith('/notifications');
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
    
    // ============================================
    // RICH CAPTURE: Open to Work
    // ============================================
    profile.openToWork = false;
    const openToWorkSelectors = [
      '.pv-open-to-carousel-card',
      '[class*="open-to-work"]',
      '.pv-top-card-v2-ctas [class*="open-to"]',
      'span[class*="hiring"]',
      '.pvs-header__subtitle span'
    ];
    for (const sel of openToWorkSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('open to work') || text.includes('hiring') || text.includes('actively looking')) {
          profile.openToWork = true;
          break;
        }
      }
    }
    // Also check for the green frame/badge
    const profileFrame = document.querySelector('img[class*="profile-picture"]')?.closest('div');
    if (profileFrame?.innerHTML?.includes('#Open_to_work') || profileFrame?.innerHTML?.includes('open-to-work')) {
      profile.openToWork = true;
    }
    
    // ============================================
    // RICH CAPTURE: Full Experience History
    // ============================================
    profile.experience = [];
    const experienceSection = document.querySelector('#experience')?.closest('section') 
      || document.querySelector('section[data-section="experience"]')
      || document.querySelector('[id*="experience"]')?.closest('section');
    
    if (experienceSection) {
      const expItems = experienceSection.querySelectorAll('li.artdeco-list__item, .pvs-list__paged-list-item');
      expItems.forEach((item, i) => {
        if (i >= 10) return; // Cap at 10 positions
        
        // Handle grouped experiences (multiple roles at same company)
        const isGrouped = item.querySelector('.pvs-entity__sub-components');
        
        if (isGrouped) {
          const companyEl = item.querySelector('.hoverable-link-text span[aria-hidden="true"], .t-bold span[aria-hidden="true"]');
          const company = companyEl?.textContent?.trim();
          const subRoles = item.querySelectorAll('.pvs-entity__sub-components li');
          
          subRoles.forEach(role => {
            const titleEl = role.querySelector('.t-bold span[aria-hidden="true"]');
            const durationEl = role.querySelector('.t-normal:not(.t-black--light) span[aria-hidden="true"]');
            const dateEl = role.querySelector('.t-black--light span[aria-hidden="true"]');
            
            if (titleEl?.textContent?.trim()) {
              profile.experience.push({
                title: titleEl.textContent.trim(),
                company: company,
                duration: durationEl?.textContent?.trim() || null,
                dates: dateEl?.textContent?.trim() || null
              });
            }
          });
        } else {
          const titleEl = item.querySelector('.t-bold span[aria-hidden="true"], .t-bold span');
          const companyEl = item.querySelector('.t-normal span[aria-hidden="true"], .t-14:not(.t-black--light) span');
          const durationEl = item.querySelector('.pvs-entity__caption-wrapper span[aria-hidden="true"]');
          const dateEl = item.querySelector('.t-black--light span[aria-hidden="true"]');
          const locationEl = item.querySelectorAll('.t-black--light span[aria-hidden="true"]')[1];
          
          if (titleEl?.textContent?.trim()) {
            profile.experience.push({
              title: titleEl.textContent.trim(),
              company: companyEl?.textContent?.trim()?.replace(/·.*$/, '').trim() || null,
              duration: durationEl?.textContent?.trim() || null,
              dates: dateEl?.textContent?.trim() || null,
              location: locationEl?.textContent?.trim() || null
            });
          }
        }
      });
    }
    
    // ============================================
    // RICH CAPTURE: Education
    // ============================================
    profile.education = [];
    const educationSection = document.querySelector('#education')?.closest('section')
      || document.querySelector('section[data-section="education"]');
    
    if (educationSection) {
      const eduItems = educationSection.querySelectorAll('li.artdeco-list__item, .pvs-list__paged-list-item');
      eduItems.forEach((item, i) => {
        if (i >= 5) return; // Cap at 5 schools
        
        const schoolEl = item.querySelector('.hoverable-link-text span[aria-hidden="true"], .t-bold span[aria-hidden="true"]');
        const degreeEl = item.querySelector('.t-normal span[aria-hidden="true"]');
        const dateEl = item.querySelector('.t-black--light span[aria-hidden="true"]');
        
        if (schoolEl?.textContent?.trim()) {
          profile.education.push({
            school: schoolEl.textContent.trim(),
            degree: degreeEl?.textContent?.trim() || null,
            dates: dateEl?.textContent?.trim() || null
          });
        }
      });
    }
    
    // ============================================
    // RICH CAPTURE: Skills
    // ============================================
    profile.skills = [];
    const skillsSection = document.querySelector('#skills')?.closest('section')
      || document.querySelector('section[data-section="skills"]');
    
    if (skillsSection) {
      const skillItems = skillsSection.querySelectorAll('li.artdeco-list__item, .pvs-list__paged-list-item');
      skillItems.forEach((item, i) => {
        if (i >= 20) return; // Cap at 20 skills
        
        const skillEl = item.querySelector('.hoverable-link-text span[aria-hidden="true"], .t-bold span[aria-hidden="true"]');
        const endorsementEl = item.querySelector('.t-black--light span[aria-hidden="true"]');
        
        if (skillEl?.textContent?.trim()) {
          const endorsementText = endorsementEl?.textContent?.trim() || '';
          const endorsementMatch = endorsementText.match(/(\d+)\s*endorsement/i);
          
          profile.skills.push({
            name: skillEl.textContent.trim(),
            endorsements: endorsementMatch ? parseInt(endorsementMatch[1]) : 0
          });
        }
      });
    }
    
    // ============================================
    // RICH CAPTURE: Languages
    // ============================================
    profile.languages = [];
    const languagesSection = document.querySelector('#languages')?.closest('section');
    
    if (languagesSection) {
      const langItems = languagesSection.querySelectorAll('li.artdeco-list__item, .pvs-list__paged-list-item');
      langItems.forEach((item, i) => {
        if (i >= 10) return;
        
        const langEl = item.querySelector('.t-bold span[aria-hidden="true"]');
        const levelEl = item.querySelector('.t-normal span[aria-hidden="true"]');
        
        if (langEl?.textContent?.trim()) {
          profile.languages.push({
            language: langEl.textContent.trim(),
            proficiency: levelEl?.textContent?.trim() || null
          });
        }
      });
    }
    
    // ============================================
    // RICH CAPTURE: Certifications
    // ============================================
    profile.certifications = [];
    const certSection = document.querySelector('#licenses_and_certifications')?.closest('section')
      || document.querySelector('section[data-section="certifications"]');
    
    if (certSection) {
      const certItems = certSection.querySelectorAll('li.artdeco-list__item, .pvs-list__paged-list-item');
      certItems.forEach((item, i) => {
        if (i >= 10) return;
        
        const nameEl = item.querySelector('.t-bold span[aria-hidden="true"]');
        const issuerEl = item.querySelector('.t-normal span[aria-hidden="true"]');
        const dateEl = item.querySelector('.t-black--light span[aria-hidden="true"]');
        
        if (nameEl?.textContent?.trim()) {
          profile.certifications.push({
            name: nameEl.textContent.trim(),
            issuer: issuerEl?.textContent?.trim() || null,
            date: dateEl?.textContent?.trim() || null
          });
        }
      });
    }
    
    // ============================================
    // RICH CAPTURE: Follower / Connection Count
    // ============================================
    const followerSelectors = [
      '.pv-recent-activity-section__follower-count',
      'span[class*="follower"]',
      '.pvs-header-action-bar__follower-count'
    ];
    for (const sel of followerSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        profile.followers = el.textContent.trim();
        break;
      }
    }
    
    const connectionCountEl = document.querySelector('a[href*="connections"] span, [href*="network"] .t-bold');
    if (connectionCountEl?.textContent?.includes('+') || connectionCountEl?.textContent?.match(/\d/)) {
      profile.connectionCount = connectionCountEl.textContent.trim();
    }
    
    // ============================================
    // RICH CAPTURE: Premium / Creator Mode
    // ============================================
    profile.isPremium = !!document.querySelector('.premium-icon, [class*="premium"], .pv-member-badge--premium');
    profile.isCreator = !!document.querySelector('[class*="creator-mode"], .pv-creator-mode-badge');
    
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
  // NOTIFICATION EXTRACTION
  // ============================================
  
  function extractNotifications() {
    const main = document.querySelector('main');
    if (!main) return [];
    
    const allDivs = main.querySelectorAll('div');
    const notifications = [];
    const seen = new Set();
    
    allDivs.forEach((div) => {
      const text = div.textContent || '';
      
      // Look for notification patterns
      const hasMention = text.includes('mentioned you in a comment');
      const hasReply = text.includes('replied to') && text.includes('comment');
      const hasLike = text.includes('liked your comment');
      const hasPostComment = text.includes('commented on your post');
      const hasPostLike = text.includes('liked your post');
      const hasShare = text.includes('shared your post');
      
      if (!hasMention && !hasReply && !hasLike && !hasPostComment && !hasPostLike && !hasShare) {
        return;
      }
      
      // Only take divs with substantial content (avoid header/footer fragments)
      if (text.length < 50 || text.length > 1000) return;
      
      try {
        let actor = 'Unknown';
        let type = 'activity';
        
        if (hasMention) {
          const match = text.match(/([A-Z][a-z]+(?: [A-Z][a-z.]+)*(?:, Ph\.D\.|, MBA)?)\s+mentioned you in a comment/);
          actor = match ? match[1].trim() : 'Unknown';
          type = 'mention';
        } else if (hasReply) {
          const match = text.match(/([A-Z][a-z]+(?: [A-Z][a-z.]+)*(?:, Ph\.D\.|, MBA)?)\s+replied to/);
          actor = match ? match[1].trim() : 'Unknown';
          type = 'comment_reply';
        } else if (hasLike) {
          const match = text.match(/([A-Z][a-z]+(?: [A-Z][a-z.]+)*(?:, Ph\.D\.|, MBA)?)\s+liked your comment/);
          actor = match ? match[1].trim() : 'Unknown';
          type = 'comment_like';
        } else if (hasPostComment) {
          const match = text.match(/([A-Z][a-z]+(?: [A-Z][a-z.]+)*(?:, Ph\.D\.|, MBA)?)\s+commented on your post/);
          actor = match ? match[1].trim() : 'Unknown';
          type = 'post_comment';
        } else if (hasPostLike) {
          const match = text.match(/([A-Z][a-z]+(?: [A-Z][a-z.]+)*(?:, Ph\.D\.|, MBA)?)\s+liked your post/);
          actor = match ? match[1].trim() : 'Unknown';
          type = 'post_like';
        } else if (hasShare) {
          const match = text.match(/([A-Z][a-z]+(?: [A-Z][a-z.]+)*(?:, Ph\.D\.|, MBA)?)\s+shared your post/);
          actor = match ? match[1].trim() : 'Unknown';
          type = 'post_share';
        }
        
        const preview = text.trim().substring(0, 250).replace(/\s+/g, ' ');
        const timeMatch = text.match(/\b(\d+h|\d+d|\d+w|\d+ hours? ago|\d+ days? ago)\b/);
        const timestamp = timeMatch ? timeMatch[1] : 'recent';
        
        const dedupeKey = `${actor}:${type}:${preview.substring(0, 50)}`;
        if (seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        
        notifications.push({
          platform: 'linkedin',
          type,
          actor,
          text: preview,
          timestamp,
          isUnread: true,
          capturedAt: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('[RecruitOS] Notification parse error:', err);
      }
    });
    
    console.log(`[RecruitOS] Extracted ${notifications.length} notifications`);
    return notifications;
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
      console.log('[RecruitOS] Sending to background script...');
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_CANDIDATE',
        profile: profile
      });
      console.log('[RecruitOS] Background response:', response);
      
      if (response && response.success) {
        recordCapture();
        updateButtonState('success', '✓ Added!');
        setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 3000);
      } else {
        const errorMsg = response?.error || 'No response from background';
        console.error('[RecruitOS] Failed:', errorMsg);
        updateButtonState('error', errorMsg.substring(0, 20));
        setTimeout(() => updateButtonState('default', 'Add to RecruitOS'), 2000);
      }
    } catch (e) {
      console.error('[RecruitOS] Add candidate error:', e);
      updateButtonState('error', e.message?.substring(0, 20) || 'Error');
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
    
    // Auto-capture notifications
    if (isNotificationsPage()) {
      const notifications = extractNotifications();
      if (notifications.length > 0) {
        chrome.runtime.sendMessage({
          type: 'NOTIFICATIONS_SYNC',
          notifications: notifications
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

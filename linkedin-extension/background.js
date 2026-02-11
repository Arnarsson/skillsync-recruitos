// RecruitOS LinkedIn Sync - Background Service Worker

const DEFAULT_API_URL = 'https://recruitos.xyz/api';
const STORAGE_KEY = 'recruitos_config';
const CANDIDATES_QUEUE_KEY = 'recruitos_candidates_queue';
const MESSAGES_QUEUE_KEY = 'recruitos_messages_queue';
const PROFILE_VIEWS_KEY = 'recruitos_profile_views';

function normalizeApiUrl(rawUrl) {
  const fallback = DEFAULT_API_URL;
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;

  try {
    const parsed = new URL(rawUrl.trim());
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname === '' || pathname === '/') {
      parsed.pathname = '/api';
    } else if (!pathname.endsWith('/api')) {
      parsed.pathname = `${pathname}/api`;
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

// ============================================
// CONFIGURATION
// ============================================

async function getConfig() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);
    const config = result[STORAGE_KEY] || {};
    const apiUrl = normalizeApiUrl(config.apiUrl || DEFAULT_API_URL);
    return {
      apiUrl,
      notificationsApiUrl: config.notificationsApiUrl || `${apiUrl}/linkedin/notifications`,
      apiKey: config.apiKey || '',
      autoCapture: config.autoCapture !== false,
      syncMessages: config.syncMessages !== false
    };
  } catch (e) {
    console.error('[RecruitOS] Config error:', e);
    return {
      apiUrl: DEFAULT_API_URL,
      notificationsApiUrl: `${DEFAULT_API_URL}/linkedin/notifications`,
      apiKey: '',
      autoCapture: true,
      syncMessages: true
    };
  }
}

async function setConfig(config) {
  const normalizedApiUrl = normalizeApiUrl(config.apiUrl || DEFAULT_API_URL);
  const notificationsApiUrl =
    config.notificationsApiUrl || `${normalizedApiUrl}/linkedin/notifications`;

  await chrome.storage.sync.set({
    [STORAGE_KEY]: {
      ...config,
      apiUrl: normalizedApiUrl,
      notificationsApiUrl,
    }
  });
}

// ============================================
// LOCAL STORAGE (for offline / queue)
// ============================================

async function queueCandidate(profile) {
  const result = await chrome.storage.local.get(CANDIDATES_QUEUE_KEY);
  const queue = result[CANDIDATES_QUEUE_KEY] || [];
  queue.push({ ...profile, queuedAt: Date.now() });
  await chrome.storage.local.set({ [CANDIDATES_QUEUE_KEY]: queue.slice(-200) });
}

async function getQueue(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] || [];
}

async function clearQueue(key) {
  await chrome.storage.local.set({ [key]: [] });
}

// Track profile views locally
async function recordProfileView(profile) {
  const result = await chrome.storage.local.get(PROFILE_VIEWS_KEY);
  const views = result[PROFILE_VIEWS_KEY] || {};
  
  views[profile.linkedinId] = {
    name: profile.name,
    headline: profile.headline,
    lastViewed: new Date().toISOString(),
    viewCount: (views[profile.linkedinId]?.viewCount || 0) + 1
  };
  
  // Keep last 500 profiles
  const keys = Object.keys(views);
  if (keys.length > 500) {
    const sorted = keys.sort((a, b) => 
      new Date(views[b].lastViewed) - new Date(views[a].lastViewed)
    );
    const toDelete = sorted.slice(500);
    toDelete.forEach(k => delete views[k]);
  }
  
  await chrome.storage.local.set({ [PROFILE_VIEWS_KEY]: views });
}

// ============================================
// API COMMUNICATION
// ============================================

async function sendToRecruitOS(endpoint, data) {
  const config = await getConfig();
  
  // Use demo key if none configured
  const apiKey = config.apiKey || 'demo';
  
  const fullUrl = `${config.apiUrl}${endpoint}`;
  console.log('[RecruitOS] Sending to:', fullUrl);
  
  try {
    let response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-RecruitOS-Extension-Key': apiKey
      },
      body: JSON.stringify(data)
    });

    // If user configured a stale/invalid key, transparently retry with demo key.
    if (response.status === 401 && apiKey !== 'demo') {
      response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo',
          'X-RecruitOS-Extension-Key': 'demo'
        },
        body: JSON.stringify(data)
      });
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (e) {
    console.error('[RecruitOS] API error:', e);
    return { success: false, error: e.message };
  }
}

async function pingApi() {
  const config = await getConfig();
  try {
    const response = await fetch(`${config.apiUrl}/health`, { method: 'GET' });
    return { ok: response.ok, status: response.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function addCandidate(profile) {
  // Always record locally first
  await recordProfileView(profile);
  
  const result = await sendToRecruitOS('/linkedin/candidate', {
    source: 'linkedin_extension',
    profile: profile,
    capturedAt: new Date().toISOString()
  });
  
  if (!result.success) {
    // Queue for later sync
    await queueCandidate(profile);
  }
  
  return result;
}

async function syncMessages(messages) {
  const config = await getConfig();
  if (!config.syncMessages) return { success: true };
  
  return await sendToRecruitOS('/linkedin/messages', {
    source: 'linkedin_extension',
    messages: messages,
    syncedAt: new Date().toISOString()
  });
}

async function syncNotifications(notifications) {
  const config = await getConfig();
  const notificationsApiUrl = config.notificationsApiUrl;
  const apiKey = config.apiKey || 'demo';
  
  console.log(`[RecruitOS] Syncing ${notifications.length} notifications to Eureka`);
  
  try {
    const response = await fetch(notificationsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-RecruitOS-Extension-Key': apiKey
      },
      body: JSON.stringify({
        source: 'recruitos-extension',
        notifications: notifications,
        capturedAt: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[RecruitOS] Synced ${result.inserted || 0} new notifications`);
    return { success: true, data: result };
  } catch (e) {
    console.error('[RecruitOS] Notification sync error:', e);
    return { success: false, error: e.message };
  }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ADD_CANDIDATE') {
    addCandidate(request.profile)
      .then(sendResponse)
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  
  if (request.type === 'PROFILE_VIEW') {
    recordProfileView(request.profile)
      .then(() => sendResponse({ success: true }))
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  
  if (request.type === 'MESSAGES_SYNC') {
    syncMessages(request.messages)
      .then(sendResponse)
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  
  if (request.type === 'NOTIFICATIONS_SYNC') {
    syncNotifications(request.notifications)
      .then(sendResponse)
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  
  if (request.type === 'GET_CONFIG') {
    getConfig().then(sendResponse);
    return true;
  }
  
  if (request.type === 'SET_CONFIG') {
    setConfig(request.config)
      .then(() => sendResponse({ success: true }))
      .catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }
  
  if (request.type === 'GET_STATS') {
    Promise.all([
      getConfig(),
      chrome.storage.local.get(PROFILE_VIEWS_KEY),
      getQueue(CANDIDATES_QUEUE_KEY)
    ]).then(([config, views, queue]) => {
      const profileViews = views[PROFILE_VIEWS_KEY] || {};
      sendResponse({
        configured: !!config.apiKey,
        profileViewsCount: Object.keys(profileViews).length,
        queuedCount: queue.length,
        autoCapture: config.autoCapture,
        syncMessages: config.syncMessages
      });
    });
    return true;
  }

  if (request.type === 'PING_API') {
    pingApi().then(sendResponse);
    return true;
  }
  
  if (request.type === 'GET_RECENT_VIEWS') {
    chrome.storage.local.get(PROFILE_VIEWS_KEY).then(result => {
      const views = result[PROFILE_VIEWS_KEY] || {};
      const sorted = Object.entries(views)
        .map(([id, data]) => ({ linkedinId: id, ...data }))
        .sort((a, b) => new Date(b.lastViewed) - new Date(a.lastViewed))
        .slice(0, 20);
      sendResponse(sorted);
    });
    return true;
  }
  
  if (request.type === 'SYNC_QUEUED') {
    processQueue().then(sendResponse);
    return true;
  }
});

// ============================================
// QUEUE PROCESSING
// ============================================

async function processQueue() {
  const queue = await getQueue(CANDIDATES_QUEUE_KEY);
  if (queue.length === 0) return { processed: 0 };
  
  console.log('[RecruitOS] Processing', queue.length, 'queued candidates');
  
  let processed = 0;
  for (const candidate of queue) {
    const result = await sendToRecruitOS('/linkedin/candidate', {
      source: 'linkedin_extension',
      profile: candidate,
      capturedAt: candidate.queuedAt
    });
    
    if (result.success) {
      processed++;
    } else {
      break; // Stop on first failure
    }
  }
  
  if (processed > 0) {
    const remaining = queue.slice(processed);
    await chrome.storage.local.set({ [CANDIDATES_QUEUE_KEY]: remaining });
  }
  
  return { processed, remaining: queue.length - processed };
}

// ============================================
// BADGE UPDATES
// ============================================

async function updateBadge() {
  const result = await chrome.storage.local.get(PROFILE_VIEWS_KEY);
  const views = result[PROFILE_VIEWS_KEY] || {};
  const count = Object.keys(views).length;
  
  if (count > 0) {
    chrome.action.setBadgeText({ text: count > 99 ? '99+' : count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge periodically
setInterval(updateBadge, 30000);
updateBadge();

console.log('[RecruitOS] LinkedIn Sync background worker started');

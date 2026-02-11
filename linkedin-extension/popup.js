// RecruitOS LinkedIn Sync - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // Load current config
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  
  document.getElementById('apiUrl').value = config.apiUrl || '';
  document.getElementById('notificationsApiUrl').value = config.notificationsApiUrl || '';
  document.getElementById('apiKey').value = config.apiKey || '';
  document.getElementById('autoCapture').checked = config.autoCapture !== false;
  document.getElementById('syncMessages').checked = config.syncMessages !== false;
  
  // Load stats
  await loadStats();
  
  // Load recent views
  await loadRecentViews();
  
  // Event listeners
  document.getElementById('saveBtn').addEventListener('click', saveConfig);
  document.getElementById('autoCapture').addEventListener('change', saveSettings);
  document.getElementById('syncMessages').addEventListener('change', saveSettings);
});

async function loadStats() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  const health = await chrome.runtime.sendMessage({ type: 'PING_API' });
  
  document.getElementById('profileCount').textContent = stats.profileViewsCount || 0;
  document.getElementById('queuedCount').textContent = stats.queuedCount || 0;
  
  const statusIcon = document.getElementById('statusIcon');
  if (stats.configured && health?.ok) {
    statusIcon.textContent = '🟢';
    statusIcon.title = 'Connected';
  } else if (stats.configured && !health?.ok) {
    statusIcon.textContent = '🟠';
    statusIcon.title = 'Configured, API unreachable';
  } else {
    statusIcon.textContent = '🟡';
    statusIcon.title = 'Not configured';
  }
}

async function loadRecentViews() {
  const views = await chrome.runtime.sendMessage({ type: 'GET_RECENT_VIEWS' });
  const container = document.getElementById('recentViews');
  
  if (!views || views.length === 0) {
    container.innerHTML = '<div class="empty-state">No profiles captured yet<br><small>Browse LinkedIn profiles to start</small></div>';
    return;
  }
  
  container.innerHTML = views.map(view => `
    <div class="view-item">
      <div class="view-avatar">${getInitials(view.name)}</div>
      <div class="view-info">
        <div class="view-name">${escapeHtml(view.name)}</div>
        <div class="view-headline">${escapeHtml(view.headline || 'No headline')}</div>
      </div>
      <div class="view-time">${formatTime(view.lastViewed)}</div>
    </div>
  `).join('');
}

async function saveConfig() {
  const btn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('saveStatus');
  
  btn.disabled = true;
  btn.textContent = 'Saving...';
  
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  
  const normalizedApiUrl = normalizeApiUrl(document.getElementById('apiUrl').value.trim());
  const notificationsFieldValue = document.getElementById('notificationsApiUrl').value.trim();
  const normalizedNotificationsApiUrl =
    notificationsFieldValue || `${normalizedApiUrl}/linkedin/notifications`;

  const newConfig = {
    ...config,
    apiUrl: normalizedApiUrl,
    notificationsApiUrl: normalizedNotificationsApiUrl,
    apiKey: document.getElementById('apiKey').value.trim()
  };
  
  await chrome.runtime.sendMessage({ type: 'SET_CONFIG', config: newConfig });
  
  btn.disabled = false;
  btn.textContent = 'Save Configuration';
  
  statusEl.innerHTML = '<div class="status status-success">Configuration saved!</div>';
  setTimeout(() => { statusEl.innerHTML = ''; }, 3000);
  
  await loadStats();
}

async function saveSettings() {
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  
  const newConfig = {
    ...config,
    autoCapture: document.getElementById('autoCapture').checked,
    syncMessages: document.getElementById('syncMessages').checked
  };
  
  await chrome.runtime.sendMessage({ type: 'SET_CONFIG', config: newConfig });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function normalizeApiUrl(rawUrl) {
  const fallback = 'https://recruitos.xyz/api';
  if (!rawUrl) return fallback;

  try {
    const parsed = new URL(rawUrl);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname || pathname === '/') {
      parsed.pathname = '/api';
    } else if (!pathname.endsWith('/api')) {
      parsed.pathname = `${pathname}/api`;
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

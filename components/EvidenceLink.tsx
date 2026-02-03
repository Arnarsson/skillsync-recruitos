interface EvidenceLinkProps {
  type: 'repo' | 'pr' | 'commit' | 'file' | 'issue';
  url: string;
  title: string;
  snippet?: string;
}

export function EvidenceLink({ type, url, title, snippet }: EvidenceLinkProps) {
  const icons = { 
    repo: '📁', 
    pr: '🔀', 
    commit: '📝', 
    file: '📄',
    issue: '🐛'
  };
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex items-start gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm transition-colors"
    >
      <span className="text-base">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">
          {title}
        </div>
        {snippet && (
          <div className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5">
            {snippet}
          </div>
        )}
      </div>
    </a>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface User {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  onMentionsChange?: (mentions: string[]) => void;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  onMentionsChange,
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mentionQuery.length >= 2) {
      searchUsers(mentionQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [mentionQuery]);

  async function searchUsers(query: string) {
    try {
      const res = await fetch(`/api/mentions?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.users || []);
      setShowSuggestions(data.users?.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSuggestions([]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newValue);

    // Check if we're typing a mention
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionStart(cursorPos - mentionMatch[1].length - 1);
      setMentionQuery(mentionMatch[1]);
    } else {
      setMentionStart(-1);
      setMentionQuery('');
      setShowSuggestions(false);
    }

    // Extract all mentions for parent component
    if (onMentionsChange) {
      const allMentions = newValue.match(/@(\w+)/g) || [];
      const usernames = allMentions.map(m => m.slice(1));
      onMentionsChange(usernames);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        }
        break;
    }
  }

  function insertMention(user: User) {
    if (mentionStart === -1) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterMention = value.slice(mentionStart + mentionQuery.length + 1);
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;

    onChange(newValue);
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStart(-1);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-muted ${
                index === selectedIndex ? 'bg-muted' : ''
              }`}
              onClick={() => insertMention(user)}
            >
              <div className="w-8 h-8 rounded-full bg-mariners-navy flex items-center justify-center text-white text-sm">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (user.display_name || user.username)[0].toUpperCase()
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Type @ to mention someone
      </p>
    </div>
  );
}

// Utility function to render content with mention links
export function renderMentions(content: string): string {
  return content.replace(
    /@(\w+)/g,
    '<a href="/profile/$1" class="text-mariners-teal hover:underline">@$1</a>'
  );
}

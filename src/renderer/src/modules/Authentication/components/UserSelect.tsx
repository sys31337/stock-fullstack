import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@web/shared/components/ui/input';
import { Check, ChevronDown, Search, User, Users } from 'lucide-react';
import { t } from 'i18next';
import { cn } from '@web/shared/utils/cn';
import { PublicUser } from '../api/useGetAllUsers';
import UserAvatar from './UserAvatar';

interface UserSelectProps {
  users: PublicUser[];
  value: string;
  onPickUser: (user: PublicUser) => void;
}

const UserSelect = ({ users, value, onPickUser }: UserSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedUser = users.find(
    (user) => user.username.toLowerCase() === value.trim().toLowerCase(),
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        (user.fullname || '').toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q),
    );
  }, [users, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const pick = (user: PublicUser) => {
    onPickUser(user);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredUsers.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filteredUsers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(filteredUsers[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full h-12 rounded-xl border-2 bg-background px-3.5 flex items-center gap-3 text-left transition-all duration-150',
          'hover:border-muted-foreground/30',
          'focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15',
          open ? 'border-primary ring-4 ring-primary/15' : 'border-border',
        )}
      >
        {selectedUser ? (
          <>
            <UserAvatar user={selectedUser} size="sm" />
            <span className="font-medium text-foreground truncate">
              {selectedUser.fullname || selectedUser.username}
            </span>
          </>
        ) : (
          <>
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground/70 truncate">{t('selectAccount')}</span>
          </>
        )}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-popover shadow-xl shadow-foreground/10 p-1.5">
          <div className="relative mb-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('searchUsers')}
              autoFocus
              className="pl-9 h-10 rounded-lg"
            />
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto">
            {filteredUsers.length ? (
              filteredUsers.map((user, index) => (
                <button
                  key={user._id}
                  type="button"
                  data-index={index}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(user)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors',
                    index === activeIndex ? 'bg-accent' : 'hover:bg-accent/60',
                  )}
                >
                  <UserAvatar user={user} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {user.fullname || user.username}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                  </div>
                  {user.username.toLowerCase() === value.trim().toLowerCase() && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-sm">
                <Users className="h-6 w-6 text-muted-foreground/40" />
                {t('noUsersFound')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelect;

import { useGetPermissions } from '@web/shared/hooks/usePermissions';
import { Checkbox } from '@web/shared/components/ui/checkbox';
import { Label } from '@web/shared/components/ui/label';
import { Input } from '@web/shared/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { t } from 'i18next';
import { cn } from '@web/shared/utils/cn';

interface PermissionMatrixProps {
  value: string[];
  onChange: (permissions: string[]) => void;
  readonly?: boolean;
}

const PermissionMatrix = ({ value, onChange, readonly }: PermissionMatrixProps) => {
  const { data: permissionsData } = useGetPermissions();
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    if (!permissionsData?.groups) return [];
    if (!search) return permissionsData.groups;
    const lower = search.toLowerCase();
    return permissionsData.groups.filter(
      (g: any) =>
        g.label.toLowerCase().includes(lower) ||
        g.module.toLowerCase().includes(lower),
    );
  }, [permissionsData, search]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const togglePermission = (permission: string) => {
    if (readonly) return;
    const next = new Set(selectedSet);
    if (next.has(permission)) next.delete(permission);
    else next.add(permission);
    onChange([...next]);
  };

  const toggleGroup = (module: string, actions: { action: string }[]) => {
    if (readonly) return;
    const perms = actions.map((a) => `${module}.${a.action}`);
    const allSelected = perms.every((p) => selectedSet.has(p));
    const next = new Set(selectedSet);
    for (const p of perms) {
      if (allSelected) next.delete(p);
      else next.add(p);
    }
    onChange([...next]);
  };

  const isGroupSelected = (module: string, actions: { action: string }[]) =>
    actions.every((a) => selectedSet.has(`${module}.${a.action}`));

  const isGroupPartial = (module: string, actions: { action: string }[]) => {
    const count = actions.filter((a) => selectedSet.has(`${module}.${a.action}`)).length;
    return count > 0 && count < actions.length;
  };

  return (
    <div className="space-y-4">
      {!readonly && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-muted/40 border-border/50"
            placeholder={t('searchModules')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-1">
        {groups.map((group: any) => (
          <div
            key={group.module}
            className={cn(
              'rounded-lg border border-border/60 p-3 transition-colors',
              !readonly && 'hover:border-primary/30',
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              {!readonly && (
                <Checkbox
                  id={`group-${group.module}`}
                  checked={isGroupSelected(group.module, group.actions)}
                  data-state={
                    isGroupSelected(group.module, group.actions)
                      ? 'checked'
                      : isGroupPartial(group.module, group.actions)
                      ? 'indeterminate'
                      : 'unchecked'
                  }
                  onCheckedChange={() => toggleGroup(group.module, group.actions)}
                />
              )}
              <Label
                htmlFor={`group-${group.module}`}
                className="text-sm font-semibold cursor-pointer"
              >
                {group.label}
              </Label>
              <span className="text-xs text-muted-foreground ml-auto">
                {group.actions.filter((a: any) => selectedSet.has(`${group.module}.${a.action}`)).length}/{group.actions.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 ml-7">
              {group.actions.map((action: any) => {
                const perm = `${group.module}.${action.action}`;
                return (
                  <label
                    key={perm}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors',
                      selectedSet.has(perm)
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted/50 text-muted-foreground border border-border/40 hover:bg-muted',
                      readonly && 'cursor-default',
                    )}
                    onClick={() => !readonly && togglePermission(perm)}
                  >
                    {!readonly && (
                      <input
                        type="checkbox"
                        checked={selectedSet.has(perm)}
                        onChange={() => togglePermission(perm)}
                        className="sr-only"
                      />
                    )}
                    {action.label}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionMatrix;

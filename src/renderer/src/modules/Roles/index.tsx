import React, { useState } from 'react';
import { Input } from '@web/shared/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@web/shared/components/ui/table';
import CustomModal from '@web/shared/components/CustomModal';
import { Button } from '@web/shared/components/ui/button';
import { t } from 'i18next';
import { Search, Shield, Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import RefreshButton from '@web/shared/components/RefreshButton';
import Pagination from '@web/shared/components/Pagination';
import { useGetAllRoles, useCreateRole, useUpdateRole, useDeleteRole, useSeedRoles } from '@web/shared/hooks/useRoles';
import PermissionMatrix from '@web/shared/components/PermissionMatrix';
import { useToast } from '@web/shared/components/ui/use-toast';

interface RolesProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Roles: React.FC<RolesProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const { data: roles, isFetched, refetch, isFetching } = useGetAllRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const seedRoles = useSeedRoles();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [editingId, setEditingId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const list = (roles || []) as any[];
  const filtered = filter
    ? list.filter((r) =>
        r.name.toLowerCase().includes(filter.toLowerCase())
      )
    : list;

  const openEdit = (role?: any) => {
    if (role) {
      setForm({ name: role.name, description: role.description || '', permissions: role.permissions || [] });
      setEditingId(role._id);
    } else {
      setForm({ name: '', description: '', permissions: [] });
      setEditingId(null);
    }
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateRole.mutateAsync({ id: editingId, data: form });
        toast({ title: t('roleUpdated') });
      } else {
        await createRole.mutateAsync(form);
        toast({ title: t('roleCreated') });
      }
      setEditModal(false);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteRole.mutateAsync(id);
      toast({ title: t('roleDeleted') });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const isControlled = controlledOpen !== undefined;

  return (
    <>
      {!isControlled && isTopBar && (
        <div onClick={onOpen} className="group block p-2.5 px-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <div className="flex flex-row items-center">
            <ShieldCheck className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium transition-colors group-hover:text-primary">{t('roles')}</p>
              <p className="text-xs text-muted-foreground">{t('manageRoles')}</p>
            </div>
          </div>
        </div>
      )}
      <CustomModal modalProps={{ size: 'full' }} isOpen={isOpen} onClose={onClose} title={t('roles')}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 bg-muted/40 border-border/50" placeholder={t('search')} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => seedRoles.mutateAsync().then(() => toast({ title: 'Roles seeded successfully' })).catch(() => {})} className="gap-2">
                <Shield className="h-4 w-4" />
                Seed Roles
              </Button>
              <Button onClick={() => openEdit()} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('addRole')}
              </Button>
              <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
            </div>
          </div>
          <div className="rounded-xl border border-border/60 overflow-hidden flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase">{t('name')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('description')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('permissions')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm">{t('loading')}...</p>
                    </div>
                  </TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Shield className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell></TableRow>
                ) : (
                  filtered.slice(startIndex, endIndex).map((role: any) => (
                    <TableRow key={role._id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-muted-foreground">{role.description || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          {role.permissions?.length || 0} {t('permissions')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(role)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(role._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-center mt-4">
            <Pagination currentPage={currentPage} totalCount={filtered.length} pageSize={itemsPerPage} onPageChange={setCurrentPage} />
          </div>
        </div>
      </CustomModal>

      <CustomModal isOpen={editModal} onClose={() => setEditModal(false)} title={editingId ? t('editRole') : t('addRole')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('name')} *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('roleName')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('description')}</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('roleDescription')} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">{t('permissions')}</label>
            <PermissionMatrix
              value={form.permissions}
              onChange={(perms) => setForm({ ...form, permissions: perms })}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => setEditModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name}>{t('save')}</Button>
          </div>
        </div>
      </CustomModal>
    </>
  );
};

export default Roles;

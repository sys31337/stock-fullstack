import React, { useState } from 'react';
import { Input } from '@web/shared/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@web/shared/components/ui/table';
import CustomModal from '@web/shared/components/CustomModal';
import { Button } from '@web/shared/components/ui/button';
import { Checkbox } from '@web/shared/components/ui/checkbox';
import { Combobox } from '@web/shared/components/ui/combobox';
import { t } from 'i18next';
import {
  Search, Users, Plus, Pencil, Trash2, UserCircle, Shield, Warehouse,
  Power, MoreHorizontal,
} from 'lucide-react';
import RefreshButton from '@web/shared/components/RefreshButton';
import Pagination from '@web/shared/components/Pagination';
import { useGetAllUsersEnhanced, useCreateUserEnhanced, useUpdateUserEnhanced, useDeleteUserEnhanced, useForceLogout } from '@web/shared/hooks/useUsersEnhanced';
import { useGetAllRoles } from '@web/shared/hooks/useRoles';
import { useGetAllWarehouses } from '@web/shared/hooks/useWarehouses';
import { useToast } from '@web/shared/components/ui/use-toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@web/shared/components/ui/dropdown-menu';

interface UsersProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface UserForm {
  fullname: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  status: 'active' | 'suspended' | 'disabled';
  role: string;
  assignedWarehouses: string[];
  warehouseAccessMode: 'all' | 'assigned';
  defaultWarehouse: string;
  preferredLanguage: string;
  notes: string;
  userPermissions: string[];
}

const emptyForm: UserForm = {
  fullname: '', username: '', email: '', phone: '', password: '',
  status: 'active', role: '', assignedWarehouses: [], warehouseAccessMode: 'assigned',
  defaultWarehouse: '', preferredLanguage: 'fr', notes: '', userPermissions: [],
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-yellow-100 text-yellow-700',
  disabled: 'bg-red-100 text-red-700',
};

const UsersModule: React.FC<UsersProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const { data: usersData, isFetched, refetch, isFetching } = useGetAllUsersEnhanced();
  const { data: roles } = useGetAllRoles();
  const { data: warehouses } = useGetAllWarehouses();
  const createUser = useCreateUserEnhanced();
  const updateUser = useUpdateUserEnhanced();
  const deleteUser = useDeleteUserEnhanced();
  const forceLogout = useForceLogout();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const users = (usersData?.users || usersData || []) as any[];
  const filtered = filter
    ? users.filter((u: any) =>
        (u.fullname || '').toLowerCase().includes(filter.toLowerCase()) ||
        u.username.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase())
      )
    : users;

  const openEdit = (user?: any) => {
    if (user) {
      setForm({
        fullname: user.fullname || '',
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        password: '',
        status: user.status || 'active',
        role: user.role?._id || '',
        assignedWarehouses: user.assignedWarehouses?.map((w: any) => w._id || w) || [],
        warehouseAccessMode: user.warehouseAccessMode || 'assigned',
        defaultWarehouse: user.defaultWarehouse?._id || user.defaultWarehouse || '',
        preferredLanguage: user.preferredLanguage || 'fr',
        notes: user.notes || '',
        userPermissions: user.userPermissions || [],
      });
      setEditingId(user._id);
    } else {
      setForm(emptyForm);
      setEditingId(null);
    }
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.password && !editingId) {
        toast({ title: t('passwordRequired'), variant: 'destructive' });
        return;
      }
      if (editingId) { delete (payload as any).password; }

      if (editingId) {
        await updateUser.mutateAsync({ id: editingId, data: payload });
        toast({ title: t('userUpdated') });
      } else {
        await createUser.mutateAsync(payload);
        toast({ title: t('userCreated') });
      }
      setEditModal(false);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteUser.mutateAsync(id);
      toast({ title: t('userDeleted') });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const handleForceLogout = async (id: string) => {
    try {
      await forceLogout.mutateAsync(id);
      toast({ title: t('forceLogoutSuccess') });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const toggleWarehouse = (warehouseId: string) => {
    setForm((prev) => ({
      ...prev,
      assignedWarehouses: prev.assignedWarehouses.includes(warehouseId)
        ? prev.assignedWarehouses.filter((w) => w !== warehouseId)
        : [...prev.assignedWarehouses, warehouseId],
    }));
  };

  const isControlled = controlledOpen !== undefined;

  return (
    <>
      {!isControlled && isTopBar && (
        <div onClick={onOpen} className="group block p-2.5 px-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <div className="flex flex-row items-center">
            <Users className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium transition-colors group-hover:text-primary">{t('users')}</p>
              <p className="text-xs text-muted-foreground">{t('manageUsers')}</p>
            </div>
          </div>
        </div>
      )}
      <CustomModal modalProps={{ size: 'full' }} isOpen={isOpen} onClose={onClose} title={t('users')}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 bg-muted/40 border-border/50" placeholder={t('search')} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <Button onClick={() => openEdit()} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addUser')}
            </Button>
            <RefreshButton onRefresh={() => refetch()} loading={isFetching} />
          </div>
          <div className="rounded-xl border border-border/60 overflow-hidden flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase">{t('user')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('email')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('role')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('status')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('warehouses')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('lastLogin')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm">{t('loading')}...</p>
                    </div>
                  </TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-40" />
                      <p className="text-sm">{t('noRecordsFound')}</p>
                    </div>
                  </TableCell></TableRow>
                ) : (
                  filtered.slice(startIndex, endIndex).map((user: any) => (
                    <TableRow key={user._id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {user.profilePicture && user.profilePicture !== 'default.png' ? (
                              <img src={user.profilePicture} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UserCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.fullname || user.username}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        {user.role ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                            <Shield className="h-3 w-3" />
                            {user.role.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[user.status] || 'bg-gray-100 text-gray-700'}`}>
                          {t(user.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Warehouse className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {user.warehouseAccessMode === 'all' ? t('all') : (user.assignedWarehouses?.length || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(user)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleForceLogout(user._id)} className="text-amber-600">
                                <Power className="h-4 w-4 mr-2" />
                                {t('forceLogout')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(user._id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <CustomModal isOpen={editModal} onClose={() => setEditModal(false)} title={editingId ? t('editUser') : t('addUser')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('fullname')} *</label>
              <Input value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} placeholder={t('fullname')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('username')} *</label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder={t('username')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('email')}</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t('email')} type="email" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('phone')}</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('phone')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('password')} {!editingId && '*'}</label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingId ? t('leaveBlankToKeep') : t('password')} type="password" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('status')}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="active">{t('active')}</option>
                <option value="suspended">{t('suspended')}</option>
                <option value="disabled">{t('disabled')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('role')}</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">{t('noRole')}</option>
                {(roles || []).map((r: any) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('preferredLanguage')}</label>
              <select
                value={form.preferredLanguage}
                onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="fr">{t('french')}</option>
                <option value="en">{t('english')}</option>
                <option value="ar">{t('arabic')}</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">{t('warehouseAccess')}</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={form.warehouseAccessMode === 'all'}
                  onCheckedChange={(c) => setForm({ ...form, warehouseAccessMode: c ? 'all' : 'assigned' })}
                />
                {t('accessAllWarehouses')}
              </label>
            </div>
            {form.warehouseAccessMode === 'assigned' && (
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(warehouses || []).map((w: any) => (
                    <label key={w._id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-sm ${form.assignedWarehouses.includes(w._id) ? 'border-primary bg-primary/5' : 'border-border/60'}`}>
                      <Checkbox
                        checked={form.assignedWarehouses.includes(w._id)}
                        onCheckedChange={() => toggleWarehouse(w._id)}
                      />
                      <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{w.name}</span>
                    </label>
                  ))}
                </div>
                {form.assignedWarehouses.length > 0 && (
                  <div className="mb-3">
                    <label className="text-sm font-medium mb-1 block">{t('defaultWarehouse')}</label>
                    <Combobox
                      options={[
                        { value: '', label: t('none') },
                        ...form.assignedWarehouses
                          .map((wid) => {
                            const w = (warehouses || []).find((x: any) => x._id === wid);
                            return w ? { value: w._id, label: w.name } : null;
                          })
                          .filter((x): x is { value: string; label: string } => x !== null),
                      ]}
                      value={form.defaultWarehouse}
                      onChange={(val) => setForm({ ...form, defaultWarehouse: val })}
                      placeholder={t('defaultWarehouse')}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block">{t('notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder={t('userNotes')}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => setEditModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.fullname || !form.username}>{t('save')}</Button>
          </div>
        </div>
      </CustomModal>
    </>
  );
};

export default UsersModule;

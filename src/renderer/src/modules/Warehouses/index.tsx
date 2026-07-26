import React, { useState } from 'react';
import { Input } from '@web/shared/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@web/shared/components/ui/table';
import CustomModal from '@web/shared/components/CustomModal';
import { Button } from '@web/shared/components/ui/button';
import { t } from 'i18next';
import { Search, Warehouse, Plus, Pencil, Trash2, Building2, Wand2 } from 'lucide-react';
import Pagination from '@web/shared/components/Pagination';
import { useGetAllWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '@web/shared/hooks/useWarehouses';
import { Checkbox } from '@web/shared/components/ui/checkbox';
import { useToast } from '@web/shared/components/ui/use-toast';

interface WarehousesProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface WarehouseForm {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const emptyForm: WarehouseForm = { name: '', code: '', address: '', phone: '', email: '', isActive: true };

const Warehouses: React.FC<WarehousesProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const { data: warehouses, isFetched } = useGetAllWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const list = (warehouses || []) as any[];
  const filtered = filter
    ? list.filter((w) =>
      w.name.toLowerCase().includes(filter.toLowerCase()) ||
      w.code.toLowerCase().includes(filter.toLowerCase())
    )
    : list;

  const openEdit = (warehouse?: any) => {
    if (warehouse) {
      setForm({ name: warehouse.name, code: warehouse.code, address: warehouse.address || '', phone: warehouse.phone || '', email: warehouse.email || '', isActive: warehouse.isActive });
      setEditingId(warehouse._id);
    } else {
      setForm(emptyForm);
      setEditingId(null);
    }
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateWarehouse.mutateAsync({ id: editingId, data: form });
        toast({ title: t('warehouseUpdated') });
      } else {
        await createWarehouse.mutateAsync(form);
        toast({ title: t('warehouseCreated') });
      }
      setEditModal(false);
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteWarehouse.mutateAsync(id);
      toast({ title: t('warehouseDeleted') });
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || t('error'), variant: 'destructive' });
    }
  };

  const slugify = (text: string) =>
    text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 20) || 'untitled';

  const generateCode = () => {
    if (!form.name.trim()) return;
    let baseCode = slugify(form.name);
    let code = baseCode;
    let counter = 1;
    const existingCodes = new Set((warehouses || []).map((w: any) => w.code.toLowerCase()));
    if (editingId) {
      const current = (warehouses || []).find((w: any) => w._id === editingId);
      if (current) existingCodes.delete(current.code.toLowerCase());
    }
    while (existingCodes.has(code)) {
      code = `${baseCode}-${counter}`;
      counter++;
    }
    setForm({ ...form, code });
  };

  const isControlled = controlledOpen !== undefined;

  return (
    <>
      {!isControlled && isTopBar && (
        <div onClick={onOpen} className="group block p-2.5 px-3 rounded-lg cursor-pointer hover:bg-accent transition-colors">
          <div className="flex flex-row items-center">
            <Building2 className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium transition-colors group-hover:text-primary">{t('warehouses')}</p>
              <p className="text-xs text-muted-foreground">{t('manageWarehouses')}</p>
            </div>
          </div>
        </div>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('warehouses')}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 bg-muted/40 border-border/50"
                placeholder={t('search')}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <Button onClick={() => openEdit()} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addWarehouse')}
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold uppercase">{t('name')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('code')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('address')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('phone')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t('status')}</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isFetched ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm">{t('loading')}...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Warehouse className="h-8 w-8 opacity-40" />
                        <p className="text-sm">{t('noRecordsFound')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.slice(startIndex, endIndex).map((warehouse: any) => (
                    <TableRow key={warehouse._id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex px-2 py-0.5 bg-primary/5 text-primary rounded text-xs font-mono">{warehouse.code}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{warehouse.address || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{warehouse.phone || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${warehouse.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {warehouse.isActive ? t('active') : t('inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(warehouse)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(warehouse._id)}>
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

      <CustomModal isOpen={editModal} onClose={() => setEditModal(false)} title={editingId ? t('editWarehouse') : t('addWarehouse')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('name')} *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('warehouseName')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('code')} *</label>
              <div className="relative">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('warehouseCode')} className="pr-10" />
                <button
                  type="button"
                  onClick={generateCode}
                  disabled={!form.name.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title={t('generateFromName')}
                >
                  <Wand2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('address')}</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t('address')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('phone')}</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t('phone')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('email')}</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t('email')} />
            </div>
            <div className='flex flex-col'>
              <label className="text-sm font-medium mb-1 block">{t('email')}</label>
              <div className="flex flex-1 items-center gap-2">
                <Checkbox id="isActive" checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
                <label htmlFor="isActive" className="text-sm font-medium">{t('active')}</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" onClick={() => setEditModal(false)}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.code}>{t('save')}</Button>
          </div>
        </div>
      </CustomModal>
    </>
  );
};

export default Warehouses;

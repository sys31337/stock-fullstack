import React, { useMemo, useState } from 'react';
import { t } from 'i18next';
import { Button } from '@web/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@web/shared/components/ui/card';
import CustomModal from '@web/shared/components/CustomModal';
import { useGetCharges, useGetChargeSummary, useDeleteCharge } from '@web/shared/hooks/useCharges';
import { useGetMyPermissions } from '@web/shared/hooks/useUsersEnhanced';
import { useToast } from '@web/shared/components/ui/use-toast';
import { money } from '@web/shared/functions/words';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ChargeModal from './ChargeModal';
import { ICharge } from '@web/shared/types/charges';

interface ChargesProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const typeLabels: Record<string, string> = {
  salary: t('chargeSalary'),
  rent: t('chargeRent'),
  utility: t('chargeUtility'),
  tax: t('chargeTax'),
  marketing: t('chargeMarketing'),
  maintenance: t('chargeMaintenance'),
  other: t('chargeOther'),
};

const paymentLabels: Record<string, string> = {
  cash: t('cash'),
  bank: t('bank'),
  check: t('check'),
  other: t('other'),
};

const Charges: React.FC<ChargesProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => (onOpenChange ? onOpenChange(true) : setInternalOpen(true));
  const onClose = () => (onOpenChange ? onOpenChange(false) : setInternalOpen(false));

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<ICharge | null>(null);
  const { data: charges, isLoading } = useGetCharges();
  const { data: summary } = useGetChargeSummary();
  const { mutateAsync: deleteCharge } = useDeleteCharge();
  const { data: myPermissions } = useGetMyPermissions();
  const { toast } = useToast();

  const canCreate = myPermissions?.isMainAccount || (myPermissions?.effectivePermissions || []).includes('charges.create');
  const canEdit = myPermissions?.isMainAccount || (myPermissions?.effectivePermissions || []).includes('charges.edit');
  const canDelete = myPermissions?.isMainAccount || (myPermissions?.effectivePermissions || []).includes('charges.delete');

  const sortedCharges = useMemo(() => {
    if (!charges) return [];
    return [...charges].sort((a: ICharge, b: ICharge) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [charges]);

  const handleEdit = (charge: ICharge) => {
    setSelectedCharge(charge);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCharge(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDeleteCharge'))) return;
    try {
      await deleteCharge(id);
      toast({ title: t('chargeDeleted') });
    } catch (error: any) {
      toast({ title: t('error'), description: error?.response?.data?.message || error.message, variant: 'destructive' });
    }
  };

  if (!isOpen) {
    if (isTopBar) return null;
    return (
      <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={onOpen}>
        <CardHeader>
          <CardTitle className="text-base">{t('charges')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('chargesDescription')}</p>
          <p className="text-2xl font-bold mt-2">{money(summary?.total || 0)} DZD</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('charges')}
        footer={(
          <div className="flex justify-end">
            {canCreate && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('newCharge')}
              </Button>
            )}
          </div>
        )}
      >
        <div className="space-y-4 min-w-[700px]">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t('totalCharges')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{money(summary?.total || 0)} DZD</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t('count')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{sortedCharges.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2">{t('date')}</th>
                  <th className="text-left px-4 py-2">{t('type')}</th>
                  <th className="text-left px-4 py-2">{t('amount')}</th>
                  <th className="text-left px-4 py-2">{t('paymentMethod')}</th>
                  <th className="text-left px-4 py-2">{t('description')}</th>
                  <th className="text-right px-4 py-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center">{t('loading')}</td></tr>
                ) : sortedCharges.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('noCharges')}</td></tr>
                ) : (
                  sortedCharges.map((charge: ICharge) => (
                    <tr key={charge._id} className="border-t hover:bg-accent/50">
                      <td className="px-4 py-2">{new Date(charge.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{typeLabels[charge.type] || charge.type}</td>
                      <td className="px-4 py-2 font-medium">{money(charge.amount)} DZD</td>
                      <td className="px-4 py-2">{paymentLabels[charge.paymentMethod] || charge.paymentMethod}</td>
                      <td className="px-4 py-2 max-w-xs truncate">{charge.description || '-'}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(charge)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(charge._id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CustomModal>
      <ChargeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} charge={selectedCharge} />
    </>
  );
};

export default Charges;

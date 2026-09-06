import { AlertCircle, User } from 'lucide-react';
import { FaPhoneAlt, FaWhatsapp, FaViber, FaTelegram } from 'react-icons/fa';
import { Popover, PopoverContent, PopoverTrigger } from '@web/shared/components/ui/popover';
import { Button } from '@web/shared/components/ui/button';
import { ICustomer } from '@web/shared/types/customer';
import { getWilayaLabel, getBaladiyaLabel } from '@web/config/wilayas';
import { defaultId } from '@web/config';
import { t } from 'i18next';
import i18next from 'i18next';
import { cn } from '@web/shared/utils/cn';

interface CustomerInfoButtonProps {
  customer?: ICustomer | null;
}

const Row = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 text-xs">
    <span className="flex items-center gap-1.5 text-muted-foreground">
      {icon}
      {label}
    </span>
    <span className="font-medium text-right truncate max-w-[180px]">{value || '-'}</span>
  </div>
)

const CustomerInfoButton: React.FC<CustomerInfoButtonProps> = ({ customer }) => {
  const lang = i18next.language || 'fr';

  // Only render when a customer is selected (and not the default walk-in/counter customer).
  if (!customer || customer._id === defaultId) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title={t('customerDetails')}
          className="h-8 w-8 shrink-0 text-amber-500 border-amber-300 hover:bg-amber-50 hover:text-amber-600"
        >
          <AlertCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[100001]" align="end">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/60">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{customer.fullname}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t(customer.type === 'Supplier' ? 'supplier' : 'client')}
              </p>
            </div>
          </div>

          <Row label={t('phoneNumber')} value={customer.phoneNumber} icon={<FaPhoneAlt className="h-3 w-3" />} />
          {(customer.whatsapp || customer.viber || customer.telegram) && (
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {t('contactChannels')}
              </span>
              <span className="flex items-center gap-2 font-medium">
                {customer.whatsapp && (
                  <span className="inline-flex items-center gap-1 text-green-600"><FaWhatsapp className="h-3 w-3" />{customer.whatsapp}</span>
                )}
                {customer.viber && (
                  <span className="inline-flex items-center gap-1 text-purple-600"><FaViber className="h-3 w-3" />{customer.viber}</span>
                )}
                {customer.telegram && (
                  <span className="inline-flex items-center gap-1 text-blue-600"><FaTelegram className="h-3 w-3" />{customer.telegram}</span>
                )}
              </span>
            </div>
          )}
          <Row
            label={t('wilaya')}
            value={getWilayaLabel(customer.wilaya, lang)}
          />
          <Row
            label={t('baladiya')}
            value={getBaladiyaLabel(customer.wilaya, customer.baladiya, lang)}
          />
          <Row label={t('address')} value={customer.address} />

          {(customer.rc || customer.nif || customer.nis) && (
            <div className="pt-2 border-t border-border/60 space-y-2.5">
              <Row label="RC" value={customer.rc} />
              <Row label="NIF" value={customer.nif} />
              <Row label="NIS" value={customer.nis} />
            </div>
          )}

          {(Number(customer.credit) > 0 || Number(customer.debts) > 0) && (
            <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-border/60">
              <span className={cn('font-semibold', Number(customer.debts) > 0 ? 'text-orange-600' : 'text-green-600')}>
                {Number(customer.debts) > 0 ? t('debts') : t('credit')}
              </span>
              <span className="font-bold">
                {Number(customer.debts) > 0 ? Number(customer.debts).toFixed(2) : Number(customer.credit).toFixed(2)} DZD
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default CustomerInfoButton
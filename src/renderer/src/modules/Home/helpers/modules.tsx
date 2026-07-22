import { t } from 'i18next';

export const modules = [{
    label: t('newSale'),
    icon: <img src="/assets/icons/sale.gif" width={40} />,
    href: 'sale',
    keyBind: 'F3',
    bg: 'bg-teal-50',
}, {
  label: t('newInvoice'),
  icon: <img src="/assets/icons/files.gif" width={40} />,
  href: 'invoice',
  keyBind: 'F4',
  bg: 'bg-cyan-50',
}]

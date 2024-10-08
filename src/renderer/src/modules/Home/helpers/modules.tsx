import { t } from 'i18next';

export const modules = [{
    label: t('newOrder'),
    icon: <img src="/assets/icons/boxing.gif" width={64} />,
    href: 'order',
    keyBind: 'F2',
    bg: 'blue.400',
}, {
    label: t('newSale'),
    icon: <img src="/assets/icons/sale.gif" width={64} />,
    href: 'sale',
    keyBind: 'F3',
    bg: 'blue.400',
}, {
  label: t('newInvoice'),
  icon: <img src="/assets/icons/files.gif" width={64} />,
  href: 'invoice',
  keyBind: 'F4',
  bg: 'blue.400',
}]

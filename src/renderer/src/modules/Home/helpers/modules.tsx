import { t } from 'i18next';
import { MdOutlineSell } from 'react-icons/md';
import { LiaFileInvoiceDollarSolid, LiaHandHoldingUsdSolid } from 'react-icons/lia';

export const modules = [{
    label: t('newOrder'),
    icon: <LiaHandHoldingUsdSolid color={'black'} size={'36'} />,
    href: 'order',
    keyBind: 'F2',
    bg: 'blue.400',
}, {
    label: t('newSale'),
    icon: <MdOutlineSell color={'black'} size={'36'} />,
    href: 'sale',
    keyBind: 'F3',
    bg: 'blue.400',
}, {
  label: t('newInvoice'),
  icon: <LiaFileInvoiceDollarSolid color={'black'} size={'36'} />,
  href: 'invoice',
  keyBind: 'F4',
  bg: 'blue.400',
}]
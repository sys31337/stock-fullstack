import { t } from 'i18next';
import { MdOutlineSell } from 'react-icons/md';
import { LiaArchiveSolid, LiaFileInvoiceDollarSolid, LiaHandHoldingUsdSolid } from 'react-icons/lia';

export const modules = [{
    label: t('newBuyBill'),
    icon: <LiaArchiveSolid color={'black'} size={'36'} />,
    href: 'newBuyBill',
    keyBind: 'F1',
}, {
    label: t('newOrder'),
    icon: <LiaHandHoldingUsdSolid color={'black'} size={'36'} />,
    href: 'newOrder',
    keyBind: 'F1',
}, {
    label: t('newSale'),
    icon: <MdOutlineSell color={'black'} size={'36'} />,
    href: 'newSale',
    keyBind: 'F1',
}, {
    label: t('newInvoice'),
    icon: <LiaFileInvoiceDollarSolid color={'black'} size={'36'} />,
    href: 'newInvoice',
    keyBind: 'F1',
}]
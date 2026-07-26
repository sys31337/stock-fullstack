import React from 'react';
import Card from '@web/modules/Home/components/Card';
import { modules } from '@web/modules/Home/helpers/modules';
import cacheService from '@web/shared/services/cache';
import { t } from 'i18next';
import Receipt from '@web/modules/Receipt';
import AllReceiptBills from '@web/modules/Receipt/AllReceiptBills';
import Order from '@web/modules/Order';
import AllOrders from '@web/modules/Order/AllOrders';
import Delivery from '@web/modules/Delivery';
import AllDeliveries from '@web/modules/Delivery/AllDeliveries';

const Home: React.FC = () => {
  const userInfo = cacheService.get('USER_INFO_KEY') as { fullname: string };
  const { fullname } = userInfo;

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-2">
        <div className="max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t('welcomeUser', { fullname })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard')}
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 px-8 pb-8 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Receipt />
            <Order />
            <Delivery />
            {modules.map(({ label, icon, href, keyBind, bg }, key) => (
              <Card
                key={key}
                label={label}
                keyBind={keyBind}
                icon={icon}
                href={href}
                bg={bg}
              />
            ))}
            <AllReceiptBills />
            <AllOrders />
            <AllDeliveries />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home;

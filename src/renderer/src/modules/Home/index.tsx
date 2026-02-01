import React from 'react';
import Card from '@web/modules/Home/components/Card';
import { modules } from '@web/modules/Home/helpers/modules';
import cacheService from '@web/shared/services/cache';
import { t } from 'i18next';
import Receipt from '@web/modules/Receipt';
import AllReceiptBills from '@web/modules/Receipt/AllReceiptBills';

const Home: React.FC = () => {
  const userInfo = cacheService.get('USER_INFO_KEY') as { fullname: string };
  const { fullname } = userInfo;

  return (
    <div className="p-4">
      <div className="container max-w-6xl mx-auto text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
          {t('welcomeUser', { fullname })}
        </h1>
      </div>
      <div className="container max-w-[90rem] mx-auto mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <Receipt />
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
        </div>
      </div>
    </div>
  )
}

export default Home;

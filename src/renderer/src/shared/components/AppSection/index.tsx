import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Loading from '@web/shared/components/Loading';
import AppTopBar from '@web/shared/components/AppTopBar';
import { ReceiptHoldProvider } from '@web/shared/contexts/ReceiptHoldContext';
import HeldReceipts from '@web/shared/components/HeldReceipts';
import { ToastStateProvider, ToastProvider } from '@web/shared/components/ui/use-toast';

const AppSection: React.FC = () => {
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('Home');
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>('default.png');

  return (
    <ReceiptHoldProvider>
      <ToastProvider>
        <ToastStateProvider>
          <div className="w-screen h-screen bg-background overflow-x-hidden">
            <div className="h-full flex flex-col">
              <AppTopBar>
                <div className="flex-1 overflow-auto">
                  <Suspense fallback={<Loading />}>
                    <Outlet context={[currentPageTitle, setCurrentPageTitle, currentProfilePicture, setCurrentProfilePicture]} />
                  </Suspense>
                </div>
              </AppTopBar>
            </div>
            <HeldReceipts />
          </div>
        </ToastStateProvider>
      </ToastProvider>
    </ReceiptHoldProvider>
  );
};

export default AppSection;

import React, { Suspense, useState } from 'react';
import {
  Box, Flex,
} from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Loading from '@web/shared/components/Loading';
import AppTopBar from '@web/shared/components/AppTopBar';

const AppSection: React.FC = () => {
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('Home');
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>('default.png');

  return (
    <Box w="100vw" h="100vh" bg="gray.50" overflowX="hidden">
      <Flex color="white" h="100%">
        <AppTopBar>
          <Box flex="1">
            <Suspense fallback={<Loading />}>
              <Outlet context={[currentPageTitle, setCurrentPageTitle, currentProfilePicture, setCurrentProfilePicture]} />
            </Suspense>
          </Box>
        </AppTopBar>
      </Flex>
    </Box>
  );
};

export default AppSection;

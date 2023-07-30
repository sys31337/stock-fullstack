import React, { Suspense, useState } from 'react';
import {
  Box, Flex,
} from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Loading from '@shared/components/Loading';
import AppSideBar from '@shared/components/AppSideBar';

const AppSection = () => {
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('Home');
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>('default.png');

  return (
    <Box w="100vw" h="100vh" bg="gray.900">
      <Flex color="white" h="100%">
        <AppSideBar currentPageTitle={currentPageTitle} currentProfilePicture={currentProfilePicture}>
          <Box flex="1">
            <Suspense fallback={<Loading />}>
              <Outlet context={[currentPageTitle, setCurrentPageTitle, currentProfilePicture, setCurrentProfilePicture]} />
            </Suspense>
          </Box>
        </AppSideBar>
      </Flex>
    </Box>
  );
};

export default AppSection;

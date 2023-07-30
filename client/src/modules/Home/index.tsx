import { Text } from '@chakra-ui/react';
import { t } from 'i18next';
import React from 'react';

const Home = () => {
  return (
    <Text>
      {t('headerTitle', { appName: "App for Translations" })}
    </Text>
  )
}

export default Home;

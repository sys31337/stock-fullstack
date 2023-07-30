import React from 'react';
import { Box, Spinner } from '@chakra-ui/react';

const Loading = () => (
    <Box display={'flex'} w={'100%'} h={'90vh'}>
      <Box margin={'auto'}>
        <Spinner size={'xl'} color={'theme.900'} textAlign={'center'} />
      </Box>
    </Box>
);

export default Loading;

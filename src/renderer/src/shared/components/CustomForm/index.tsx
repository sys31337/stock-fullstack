import React from 'react';
import { t } from 'i18next';
import { Box, Button } from '@chakra-ui/react';

const CustomForm = (props) => {
  const { handleSubmit, children, ...rest } = props
  return (
    <Box as={'form'} onSubmit={handleSubmit} {...rest} align={'center'}>
      {children}
      <Button colorScheme='green' my={5} px={20} size={'lg'} borderRadius={'full'} type="submit">{t('submit')}</Button>
    </Box>
  )
}

export default CustomForm
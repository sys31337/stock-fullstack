import React from 'react';
import { t } from 'i18next';
import { Box, Button } from '@chakra-ui/react';

const CustomForm = (props) => {
  const { handleSubmit, children, ...rest } = props
  return (
    <Box as={'form'} onSubmit={handleSubmit} {...rest} align={'center'}>
      {children}
      <Button colorScheme='green' mt={10} px={20} size={'lg'} borderRadius={'2xl'} type="submit">{t('submit')}</Button>
    </Box>
  )
}

export default CustomForm
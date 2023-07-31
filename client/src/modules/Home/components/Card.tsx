import React from 'react'
import { ReactElement } from 'react'

import {
  Box,
  Flex,
  Heading,
} from '@chakra-ui/react';

interface CardProps {
  label: string
  keyBind: string
  icon: ReactElement
  href: string
}

const Card = ({ label, keyBind, icon, href }: CardProps) => (
  <Box
    as={'a'}
    href={href}
    target={'_blank'}
    w={'90%'}
    borderWidth="1px"
    borderRadius="2xl"
    pos={'relative'}
    overflow="hidden"
    bg={'gray.400'}
    mx={5}
    p={5}>
    <Flex
      mt={1}
      align={'center'}
      justify={'center'}
      fontSize={'sm'}
      pos={'absolute'}
      bg={'gray.600'}
      top={2}
      right={2}
      p={2}
      borderRadius={'full'}
      h={5}
      w={5}
    >
      {keyBind}
    </Flex>
    <Flex align={'center'} me={2}>
      <Flex
        w={16}
        h={16}
        p={0}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        me={5}
        bg={'gray.100'}>
        {icon}
      </Flex>
      <Heading size="md">{label}</Heading>
    </Flex>
  </Box>
)

export default Card
import React from 'react'
import { ReactElement } from 'react'

import {
  Box,
  Flex,
  Heading,
} from '@chakra-ui/react';

interface CardProps {
  label: string;
  keyBind: string;
  icon: ReactElement;
  href: string;
  bg: string;
}

const Card: React.FC<CardProps> = ({
  label, keyBind, icon, href, bg,
}) => (
  <Box
    as={'a'}
    href={href}
    w={'100%'}
    borderWidth="1px"
    borderRadius="3xl"
    pos={'relative'}
    bg={bg || 'gray.400'}
    mx={5}
    p={5}>
    <Flex
      align={'center'}
      justify={'center'}
      fontSize={'sm'}
      pos={'absolute'}
      bg={'gray.800'}
      top={-2}
      right={-2}
      p={5}
      borderRadius={'2xl'}
      h={8}
      w={8}
    >
      {keyBind}
    </Flex>
    <Flex align={'center'} gap={4}>
      <Flex
        minW={20}
        minH={20}
        align={'center'}
        justify={'center'}
        color={'white'}
        borderRadius={'2xl'}
        bg={'white'}>
        {icon}
      </Flex>
      <Heading size="md">{label}</Heading>
    </Flex>
  </Box>
)

export default Card

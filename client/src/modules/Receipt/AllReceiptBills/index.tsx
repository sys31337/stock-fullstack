import React from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
} from '@chakra-ui/react';
import CustomModal from '@shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillDelete, AiFillEdit, AiFillFilePdf, AiFillRightCircle } from 'react-icons/ai';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import { useGetAllBills } from '@shared/hooks/useBill';
import dayjs from 'dayjs';
import { sortByOrderId } from '@shared/functions/array';

interface AllReceiptBillsProps {
  isTopBar?: boolean;
}

const AllReceiptBills = ({ isTopBar }: AllReceiptBillsProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: getAllReceiptBills, isFetched } = useGetAllBills('BUY');
  const hoverBackground = useColorModeValue('blue.50', 'gray.900');
  return (
    <>
      {isTopBar ? (
        <Box
          cursor={'pointer'}
          onClick={onOpen}
          role={'group'}
          display={'block'}
          p={2}
          px={3}
          rounded={'lg'}
          _hover={{ bg: hoverBackground }}>
          <Stack direction={'row'} align={'center'}>
            <Box>
              <Text
                transition={'all .3s ease'}
                _groupHover={{ color: 'blue.500' }}
                fontWeight={500}>
                {t('allReceiptBill')}
              </Text>
              <Text fontSize={'sm'}>{t('allReceiptBillLabel')}</Text>
            </Box>
            <Flex
              transition={'all .3s ease'}
              transform={'translateX(-10px)'}
              opacity={0}
              _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
              justify={'flex-end'}
              align={'center'}
              flex={1}>
              <Icon color={'blue.400'} w={5} h={5} as={AiFillRightCircle} />
            </Flex>
          </Stack>
        </Box>
      ) : (
        <Box
          onClick={onOpen}
          cursor={'pointer'}
          w={'100%'}
          borderWidth="1px"
          borderRadius="3xl"
          pos={'relative'}
          bg={'blue.400'}
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
            F1
          </Flex>
          <Flex align={'center'} gap={4}>
            <Flex
              minW={20}
              minH={20}
              align={'center'}
              justify={'center'}
              color={'white'}
              borderRadius={'2xl'}
              bg={'gray.100'}>
              <LiaFileInvoiceDollarSolid color={'black'} size={'36'} />
            </Flex>
            <Heading size="md">{t('allReceiptBill')}</Heading>
          </Flex>
        </Box>
      )}
      <CustomModal
        modalProps={{ size: 'full' }}
        overlayProps={{ bg: 'blackAlpha.300', backdropFilter: 'blur(5px) hue-rotate(10deg)' }}
        contentProps={{ bg: 'white', borderRadius: 'xl', overflowWrap: 'unset', minH: '90vh', w: '95vw', mt: '5vh', }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('allReceiptBill')}
      >
        <Box p={4}>
          <Container maxW={'full'}>
            <TableContainer borderRadius={'10px'}>
              <Table variant='striped'>
                <Thead bg={'blue.100'}>
                  <Tr>
                    <Th w={'5ch'}>#</Th>
                    <Th>{t('customer')}</Th>
                    <Th>{t('date')}</Th>
                    <Th>{t('customer')}</Th>
                    <Th>{t('category')}</Th>
                    <Th>{t('total')}</Th>
                    <Th textAlign={'end'}>{t('actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isFetched && getAllReceiptBills.sort(sortByOrderId).map(({ _id, billDate, orderId, customer, category, products, orderTotalTTC }, k) => (
                    <Tr key={k}>
                      <Td>{orderId}</Td>
                      <Td>{dayjs(billDate).format('DD/MM/YYYY HH:mm:ss')}</Td>
                      <Td>{customer?.fullname}</Td>
                      <Td>{category?.name}</Td>
                      <Td>{products.length}</Td>
                      <Td>{orderTotalTTC}</Td>
                      <Td>
                        <Flex gap={1} justifyContent={'flex-end'}>
                          <Button colorScheme='blue' p={0} size={'sm'} fontWeight={400} borderRadius={'2xl'} as={'a'} href={`/billpdf/${_id}`}>
                            <AiFillFilePdf />
                          </Button>
                          <Button colorScheme='green' p={0} size={'sm'} fontWeight={400} borderRadius={'2xl'} as={'a'} href={`/editbill/${_id}`}>
                            <AiFillEdit />
                          </Button>
                          <Button colorScheme='red' p={0} size={'sm'} fontWeight={400} borderRadius={'2xl'}>
                            <AiFillDelete />
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Container>
        </Box>
      </CustomModal>
    </>
  )
}

export default AllReceiptBills
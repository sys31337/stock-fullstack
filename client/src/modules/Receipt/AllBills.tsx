import React, { useState } from 'react';
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
  Input,
} from '@chakra-ui/react';
import CustomModal from '@shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillDelete, AiFillEdit, AiFillFilePdf, AiFillRightCircle } from 'react-icons/ai';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import { useGetAllBills } from '@shared/hooks/useBill';
import dayjs from 'dayjs';
import { sortByOrderId } from '@shared/functions/array';
import Pagination from '@shared/components/Pagination';
import { price } from '@shared/functions/words';

interface AllReceiptBillsProps {
  isTopBar?: boolean;
}

const AllReceiptBills = ({ isTopBar }: AllReceiptBillsProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: getAllReceiptBills, isFetched } = useGetAllBills('BUY');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');

  const itemsPerPage = 10;
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = (+currentPage - 1) * itemsPerPage + itemsPerPage;

  const filteredBills = filter
    ? getAllReceiptBills.filter(({ customer, category, orderTotalTTC, orderTotalHT, orderId, description }) => (
      category?.name.toLowerCase().includes(filter.toLowerCase())
      || customer?.fullname.toLowerCase().includes(filter.toLowerCase())
      || price(orderTotalTTC) === price(filter)
      || price(orderTotalHT) === price(filter)
      || orderId === filter
      || description.toLowerCase().includes(filter.toLowerCase())
    ))
    : getAllReceiptBills;

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
        contentProps={{ bg: 'white', borderRadius: 'xl', overflowWrap: 'unset', minH: '95vh', maxH: '95vh', w: '97.5vw', mt: '2.5vh', }}
        bodyProps={{ overflow: 'scroll' }}
        isOpen={isOpen}
        onClose={onClose}
        title={t('allReceiptBill')}
      >
        <Box p={4}>
          <Container maxW={'full'}>
            <Text>{t('search')}</Text>
            <Input
              my={2}
              borderRadius={'2xl'}
              placeholder={t('searchBills')}
              onChange={(e) => setFilter(e.target.value)}
            />
            <TableContainer borderRadius={'10px'}>
              <Table variant='striped'>
                <Thead bg={'gray.700'}>
                  <Tr>
                    <Th color={'white'} w={'5ch'}>#</Th>
                    <Th color={'white'}>{t('customer')}</Th>
                    <Th color={'white'}>{t('date')}</Th>
                    <Th color={'white'}>{t('productsCounter')}</Th>
                    <Th color={'white'}>{t('category')}</Th>
                    <Th color={'white'}>{t('total')}</Th>
                    <Th color={'white'} textAlign={'end'}>{t('actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isFetched && filteredBills.length === 0 ? (
                    <Tr>
                      <Td colSpan={7}>
                        <Text textAlign={'center'}> {t('noRecordsFound')} </Text>
                      </Td>
                    </Tr>
                  ) :
                    isFetched && filteredBills.sort(sortByOrderId).slice(startIndex, endIndex).map(({ _id, billDate, orderId, customer, category, products, orderTotalTTC }, k) => (
                      <Tr key={k}>
                        <Td>{orderId}</Td>
                        <Td>{customer?.fullname || t('counter')}</Td>
                        <Td>{dayjs(billDate).format('DD/MM/YYYY HH:mm:ss')}</Td>
                        <Td>{products.length}</Td>
                        <Td>{category?.name || t('undefined')}</Td>
                        <Td>{price(orderTotalTTC)} DA</Td>
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
                    ))
                  }
                </Tbody>
              </Table>
            </TableContainer>
            <Pagination
              className="pagination-bar"
              currentPage={currentPage}
              totalCount={filteredBills?.length}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </Container>
        </Box>
      </CustomModal>
    </>
  )
}

export default AllReceiptBills
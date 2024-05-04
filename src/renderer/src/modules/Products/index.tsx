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
  Input,
} from '@chakra-ui/react';
import CustomModal from '@web/shared/components/CustomModal';
import { t } from 'i18next';
import { AiFillBell, AiFillRightCircle } from 'react-icons/ai';
import { LiaFileInvoiceDollarSolid } from 'react-icons/lia';
import Pagination from '@web/shared/components/Pagination';
import { price } from '@web/shared/functions/words';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import ProductRow from '@web/modules/Products/ProductRow';
import { IProduct } from '@web/shared/types/product';

interface ProductsProps {
  isTopBar?: boolean;
}

const Products: React.FC<ProductsProps> = ({ isTopBar }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: getProducts, isFetched } = useGetAllProducts();
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');

  const itemsPerPage = 10;
  const startIndex = (+currentPage - 1) * itemsPerPage;
  const endIndex = (+currentPage - 1) * itemsPerPage + itemsPerPage;

  const filteredBills = filter
    ? (getProducts as IProduct[]).filter(({ barCode, productName, buyPrice, quantity, tva, sellPrice_1, sellPrice_2, sellPrice_3 }) => (
      barCode.toLowerCase().includes(filter.toLowerCase())
      || productName.toLowerCase().includes(filter.toLowerCase())
      || price(buyPrice) === price(filter)
      || price(sellPrice_1) === price(filter)
      || price(sellPrice_2) === price(filter)
      || price(sellPrice_3) === price(filter)
      || price(quantity) === price(filter)
      || tva === Number(filter)
    ))
    : getProducts;

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
                {t('productsList')}
              </Text>
              <Text fontSize={'sm'}>{t('productsListSublabel')}</Text>
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
            <Heading size="md">{t('productsList')}</Heading>
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
        title={t('productsList')}
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
                    <Th color={'white'}>{t('barCode')}</Th>
                    <Th color={'white'}>{t('productName')}</Th>
                    <Th color={'white'}>{t('qté')}</Th>
                    <Th color={'white'}>{t('buyPrice')}</Th>
                    <Th color={'white'}>{t('tva')}</Th>
                    <Th color={'white'}>{t('sellPrice')} 1</Th>
                    <Th color={'white'}>{t('sellPrice')} 2</Th>
                    <Th color={'white'}>{t('sellPrice')} 3</Th>
                    <Th color={'white'} textAlign={'center'}><Icon as={AiFillBell} margin={'auto'} w={5} h={5} /></Th>
                    <Th color={'white'} textAlign={'end'}>{t('actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isFetched && filteredBills?.length === 0 ? (
                    <Tr>
                      <Td colSpan={9}>
                        <Text textAlign={'center'}> {t('noRecordsFound')} </Text>
                      </Td>
                    </Tr>
                  ) :
                    isFetched && filteredBills.slice(startIndex, endIndex).map((product: IProduct, k: number) => (
                      <ProductRow key={k} product={product} />
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

export default Products
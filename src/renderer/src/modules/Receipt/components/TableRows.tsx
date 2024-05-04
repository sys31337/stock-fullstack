import React, { useEffect, useState } from 'react';
import { Tr, Td, Input, Button, InputGroup, InputRightElement, Flex, InputLeftElement, Icon } from '@chakra-ui/react';
import { BiTrash } from 'react-icons/bi';
import { BsPercent } from 'react-icons/bs';
import { price } from '@web/shared/functions/words';
import CustomInput from '@web/shared/components/CustomForm/Input';
import { useGetAllProducts } from '@web/shared/hooks/useProducts';
import CustomAutoComplete from '@web/shared/components/CustomAutoComplete';
import { AiOutlineBarcode } from 'react-icons/ai';
import { randomNumber } from '@web/shared/utils/word';
import Any from '@web/shared/types/any';

const TableRows = ({ index, data, products, deleteTableRows, handleChange, handleBlur }) => {
  const [totalHT, setTotalHT] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [productName, setProductName] = useState('');
  const [barCode, setBarCode] = useState('');
  const { data: allProducts, isFetched } = useGetAllProducts();

  useEffect(() => {
    const total = parseInt(data.quantity || 0, 10) * parseInt(data.stack || 0, 10) * parseInt(data.buyPrice || 0, 10)
    const productTva = total * data.tva / 100;
    data.totalHT = total;
    data.totalTTC = total + productTva;
    setProductName(data.productName)
    setTotalHT(total)
    setTotalTTC(total + productTva)
    setBarCode(data.barCode);
  }, [data])

  const productsList = products.map((product) => product.productName.toLowerCase());

  const filterProductsList = (query: string, _optionValue: string, optionLabel: string) => optionLabel.toLowerCase().includes(query.toLowerCase()) && !productsList.includes(optionLabel.toLowerCase())

  const updateTotal = (e) => {
    handleChange(index, e)
    const { quantity, stack, buyPrice, tva } = data;
    const total = parseInt(quantity || 0, 10) * parseInt(stack || 0, 10) * parseInt(buyPrice || 0, 10)
    const productTva = total * tva / 100;
    data.totalHT = total;
    data.totalTTC = total + productTva;
    setTotalHT(total);
    setTotalTTC(total + productTva);
  }
  const { id, tva, quantity, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = data;

  const selectProduct = (selectedItems) => {
    const { id, barCode, productName, tva, stack, buyPrice, sellPrice_1, sellPrice_2, sellPrice_3 } = selectedItems.item.originalValue;
    data.id = id;
    data.barCode = barCode;
    data.productName = productName;
    data.tva = tva;
    data.stack = stack;
    data.buyPrice = buyPrice;
    data.sellPrice_1 = sellPrice_1;
    data.sellPrice_2 = sellPrice_2;
    data.sellPrice_3 = sellPrice_3;
    setTotalHT(0);
    setTotalTTC(0);
    setBarCode(barCode)
  };

  const onProductSelectOption = (selectedItems) => {
    const e = { target: { name: 'productName', value: selectedItems.item.label } };
    handleChange(index, e);
    setProductName(selectedItems.item.label);
    selectProduct(selectedItems);
  }

  const onProductChange = (e) => {
    setProductName(e.target.value as unknown as string);
    handleChange(index, e);
  }

  const generateBarCode = () => {
    const newBarCode = `${productName[0] || 'P'}000${randomNumber(5)}`;
    setBarCode(newBarCode)
    data.barCode = newBarCode;
  }

  return (
    <>
      {isFetched && (
        <Tr key={id}>
          <Td color={'theme.900'}>
            {index + 1}
          </Td>
          <Td p={0} w={'5px'} textAlign={'center'}>
            <Button px={0} variant={'ghost'} onClick={() => (deleteTableRows(id))}>
              <BiTrash color={'red'} />
            </Button>
          </Td>
          <Td px={1}>
            <Flex>
              <InputGroup>
                <InputRightElement
                  as={Button}
                  m={'auto'}
                  p={0}
                  variant={'link'}
                  borderRadius={'2xl'}
                  display={barCode.length > 0 ? 'none' : 'block'}
                >
                  <Icon as={AiOutlineBarcode} onClick={generateBarCode} m={'5px'} />
                </InputRightElement>
                <Input
                  textAlign={'center'}
                  px={2}
                  p={barCode.length > 0 ? 0 : 2}
                  bg={'white'}
                  borderColor={'gray.200'}
                  borderRadius={'xl'}
                  color={'theme.900'}
                  type={'text'}
                  name="barCode"
                  isDisabled={!!data.id && !!data.barCode && !!data.productName}
                  defaultValue={barCode}
                  onChange={(e) => {
                    handleChange(index, e)
                    setBarCode(e.target.value)
                  }}
                />
              </InputGroup>
            </Flex>
          </Td>
          <Td px={1}>
            <CustomAutoComplete
              creatable={true}
              emptyState={true}
              freeSolo={true}
              filter={filterProductsList}
              focusInputOnSelect={false}
              selectOnFocus={false}
              maxSelections={0}
              defaultValue={null}
              name={'productName'}
              value={productName}
              inputProps={{ isDisabled: !!data.id && !!data.barCode && !!data.productName && (document.activeElement as Any)?.name !== 'productName' }}
              onSelectOption={onProductSelectOption}
              onChange={onProductChange}
              selector={'productName'}
              items={allProducts}
            />

          </Td>
          <Td px={1}>
            <Input
              textAlign={'center'}
              px={2}
              bg={'white'}
              borderColor={'gray.200'}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="quantity"
              defaultValue={quantity}
              onChange={(e) => (updateTotal(e))}
            />
          </Td>
          <Td px={1}>
            <Input
              textAlign={'center'}
              px={2}
              bg={'white'}
              borderColor={'gray.200'}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="stack"
              isDisabled={!!data.id && !!data.barCode && !!data.productName}
              defaultValue={stack}
              onChange={(e) => (updateTotal(e))}
            />
          </Td>
          <Td px={1}>
            <Input
              textAlign={'center'}
              px={2}
              bg={'white'}
              borderColor={'gray.200'}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="buyPrice"
              defaultValue={price(buyPrice)}
              onChange={(e) => (updateTotal(e))}
              onBlur={(e) => handleBlur(e)}
            />
          </Td>
          <Td px={1}>
            <Input
              textAlign={'center'}
              px={2}
              bg={(Number(sellPrice_1) < Number(buyPrice) && Number(sellPrice_1) !== 0)
                ? 'red.100'
                : ((Number(sellPrice_1) === Number(buyPrice) && Number(sellPrice_1) !== 0)
                  ? 'yellow.100'
                  : 'white')}
              borderColor={'gray.200'}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="sellPrice_1"
              defaultValue={price(sellPrice_1)}
              onBlur={(e) => handleBlur(e)}
              onChange={(e) => handleChange(index, e)}
            />
          </Td>
          <Td px={1}>
            <Input
              textAlign={'center'}
              px={2}
              bg={(Number(sellPrice_2) < Number(buyPrice) && Number(sellPrice_2) !== 0)
                ? 'red.100'
                : ((Number(sellPrice_2) === Number(buyPrice) && Number(sellPrice_2) !== 0)
                  ? 'yellow.100'
                  : 'white')}
              borderColor={'gray.200'}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="sellPrice_2"
              defaultValue={price(sellPrice_2)}
              onBlur={(e) => handleBlur(e)}
              onChange={(e) => handleChange(index, e)}
            />
          </Td>
          <Td px={1}>
            <Input
              textAlign={'center'}
              px={2}
              bg={(Number(sellPrice_3) < Number(buyPrice) && Number(sellPrice_3) !== 0)
                ? 'red.100'
                : ((Number(sellPrice_3) === Number(buyPrice) && Number(sellPrice_3) !== 0)
                  ? 'yellow.100'
                  : 'white')}
              borderColor={'gray.200'}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="sellPrice_3"
              defaultValue={price(sellPrice_3)}
              onBlur={(e) => handleBlur(e)}
              onChange={(e) => handleChange(index, e)}
            />
          </Td>
          <Td px={1}>
            <InputGroup>
              <InputLeftElement pointerEvents='none' ps={2} w={'2ch'}>
                <BsPercent color='gray' />
              </InputLeftElement>
              <Input
                p={'0 0 0 25px'}
                bg={'white'}
                borderColor={'gray.200'}
                borderRadius={'xl'}
                color={'theme.900'}
                type={'number'}
                name="tva"
                defaultValue={tva}
                onChange={(e) => (updateTotal(e))}
              />
            </InputGroup>
          </Td>
          <Td px={1}>
            <CustomInput
              textAlign={'center'}
              px={2}
              _focusVisible={{
                boxShadow: 'unset',
                border: 'unset'
              }}
              bg={'transparent'}
              border={0}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="totalHT"
              isReadOnly={true}
              value={price(`${totalHT}`)}
              currency='DZD'
            />
          </Td>
          <Td px={1}>
            <CustomInput
              textAlign={'center'}
              px={2}
              _focusVisible={{
                boxShadow: 'unset',
                border: 'unset'
              }}
              bg={'transparent'}
              border={0}
              borderRadius={'xl'}
              color={'theme.900'}
              type={'number'}
              name="totalTTC"
              isReadOnly={true}
              value={price(`${totalTTC}`)}
              currency='DZD'
            />
          </Td>
        </Tr>
      )}
    </>
  )
}

export default TableRows;
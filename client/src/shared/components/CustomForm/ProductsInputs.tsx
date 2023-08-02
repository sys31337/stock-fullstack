import React from "react"
import TableRows from "./TableRows";
import { Button, Table, TableCaption, TableContainer, Tbody, Th, Thead, Tr } from "@chakra-ui/react";
import { t } from "i18next";

const ProductsInputs = ({ productsValues, setProductsValues }) => {
  const addTableRows = () => {
    const rowsInput = {
      barCode: '',
      productName: '',
      quantity: 0,
      stack: 0,
      buyPrice: 0,
      sellPrice_1: 0,
      sellPrice_2: 0,
      sellPrice_3: 0,
    }
    setProductsValues([...productsValues, rowsInput])
  }
  const deleteTableRows = (index) => {
    const rows = [...productsValues];
    rows.splice(index, 1);
    setProductsValues(rows);
  }

  const handleChange = (index, evnt) => {
    const { name, value } = evnt.target;
    const rowsInput = [...productsValues];
    rowsInput[index][name] = value;
    setProductsValues(rowsInput);
  }

  return (
    <>
      <TableContainer>
        <Table variant='simple'>
          <TableCaption><Button colorScheme={'green'} onClick={addTableRows} borderRadius={'full'} px={10}>{t('addProduct')}</Button></TableCaption>
          <Thead>
            <Tr>
              <Th w={'24ch'}>{t('barCode')}</Th>
              <Th>{t('designation')}</Th>
              <Th w={'14ch'}>{t('quantity')}</Th>
              <Th w={'10ch'}>{t('units')}</Th>
              <Th w={'16ch'}>{t('buyPrice')}</Th>
              <Th w={'16ch'} color={'red.500'}>{t('sellPrice_1')}</Th>
              <Th w={'16ch'} color={'blue.500'}>{t('sellPrice_2')}</Th>
              <Th w={'16ch'} color={'green.500'}>{t('sellPrice_3')}</Th>
              <Th w={'20ch'}>{t('total')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              productsValues.map((data, index) => (
                <TableRows key={index} data={data} index={index} products={productsValues} deleteTableRows={deleteTableRows} handleChange={handleChange} />
              ))
            }
          </Tbody>
        </Table>
      </TableContainer>
    </>
  )
}
export default ProductsInputs

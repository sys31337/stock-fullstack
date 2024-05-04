import React from 'react';
import { Button, Flex, Icon } from '@chakra-ui/react';
import { usePagination, DOTS } from '@shared/components/Pagination/usePagination';
import { AiOutlineArrowLeft, AiOutlineArrowRight, AiOutlineSmallDash } from 'react-icons/ai';

const Pagination = (props) => {
  const {
    onPageChange,
    totalCount,
    siblingCount = 1,
    currentPage,
    pageSize,
  } = props;

  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  });

  if (currentPage === 0 || (paginationRange && paginationRange.length < 2)) {
    return null;
  }

  const onNext = () => {
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    onPageChange(currentPage - 1);
  };

  const lastPage = paginationRange && paginationRange[paginationRange.length - 1];

  return (
    <Flex gap={1} justifyContent={'center'} mt={10}>
      <Button
        size={'xs'}
        color={'white'}
        background={currentPage === 1 ? 'black' : 'gray.700'}
        borderRadius={25}
        _hover={{
          bg: currentPage === 1 ? 'black' : 'gray.700',
        }}
        isDisabled={currentPage === 1}
        p={1}
        onClick={onPrevious}>
        <AiOutlineArrowLeft />
      </Button>

      {paginationRange && paginationRange.map((pageNumber) => {
        if (pageNumber === DOTS) {
          return (<Button
            key={Math.floor(Math.random() * 1000) * -5}
            size={'xs'}
            p={1}
            fontWeight={100}
            borderRadius={25}
            background={'transparent'}
            _hover={{ bg: 'transparent' }}
            color={'white'}>
            <Icon as={AiOutlineSmallDash} color={'black'} alignSelf={'end'} />
          </Button>);
        }
        return (
          <Button
            key={pageNumber}
            size={'xs'}
            p={1}
            fontWeight={100}
            borderRadius={25}
            color={'white'}
            background={pageNumber === currentPage ? 'gray.900' : 'gray.500'}
            _hover={{
              bg: pageNumber === currentPage ? 'gray.900' : 'gray.600',
            }}
            onClick={() => onPageChange(pageNumber)}>
            {pageNumber}
          </Button>
        );
      })}

      <Button
        size={'xs'}
        color={'white'}
        background={currentPage === 1 ? 'black' : 'gray.700'}
        borderRadius={25}
        _hover={{
          bg: currentPage === 1 ? 'black' : 'gray.700',
        }}
        isDisabled={currentPage === lastPage}
        p={1}
        onClick={onNext}>
        <AiOutlineArrowRight />
      </Button>
    </Flex>
  );
};

export default Pagination;

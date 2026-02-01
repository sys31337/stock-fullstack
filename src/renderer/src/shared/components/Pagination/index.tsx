import React from 'react';
import { Button } from '@web/shared/components/ui/button';
import { usePagination, DOTS } from '@web/shared/components/Pagination/usePagination';
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
    <div className="flex gap-1 justify-center mt-10">
      <Button
        size="icon"
        variant="secondary"
        className="h-6 w-6 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
        disabled={currentPage === 1}
        onClick={onPrevious}>
        <AiOutlineArrowLeft />
      </Button>

      {paginationRange && paginationRange.map((pageNumber, i) => {
        if (pageNumber === DOTS) {
          return (
            <div
              key={`dots-${i}`}
              className="flex items-center justify-center h-6 w-6"
            >
              <AiOutlineSmallDash className="text-black" />
            </div>
          );
        }
        return (
          <Button
            key={pageNumber}
            size="icon"
            className={`h-6 w-6 rounded-full ${pageNumber === currentPage ? 'bg-gray-900 text-white hover:bg-gray-900' : 'bg-gray-500 text-white hover:bg-gray-600'}`}
            onClick={() => onPageChange(pageNumber)}>
            {pageNumber}
          </Button>
        );
      })}

      <Button
        size="icon"
        variant="secondary"
        className="h-6 w-6 rounded-full bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
        disabled={currentPage === lastPage}
        onClick={onNext}>
        <AiOutlineArrowRight />
      </Button>
    </div>
  );
};

export default Pagination;

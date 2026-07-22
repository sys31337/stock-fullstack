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
    <div className="flex items-center gap-1.5 justify-center py-4">
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-lg border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={currentPage === 1}
        onClick={onPrevious}
      >
        <AiOutlineArrowLeft className="h-3.5 w-3.5" />
      </Button>

      {paginationRange && paginationRange.map((pageNumber, i) => {
        if (pageNumber === DOTS) {
          return (
            <div
              key={`dots-${i}`}
              className="flex items-center justify-center h-8 w-8"
            >
              <AiOutlineSmallDash className="text-muted-foreground" />
            </div>
          );
        }
        return (
          <Button
            key={pageNumber}
            size="icon"
            variant={pageNumber === currentPage ? 'default' : 'ghost'}
            className={`h-8 w-8 rounded-lg text-xs font-medium ${
              pageNumber === currentPage
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        );
      })}

      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-lg border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        disabled={currentPage === lastPage}
        onClick={onNext}
      >
        <AiOutlineArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default Pagination;

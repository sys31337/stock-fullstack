import React from 'react';
import { t } from 'i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@web/shared/components/ui/dropdown-menu';
import { Button } from '@web/shared/components/ui/button';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';
import { cn } from '@web/shared/utils/cn';

interface ExportMenuProps {
  /** Opens the print dialog (user can save as PDF). */
  onPdf: () => void;
  /** Downloads a real .xlsx workbook. */
  onExcel: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A single "Export" button that lets the user pick between
 * exporting the current listing to PDF (print dialog) or Excel (.xlsx).
 */
const ExportMenu: React.FC<ExportMenuProps> = ({ onPdf, onExcel, disabled, className }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 text-xs', className)}
          disabled={disabled}
        >
          <Download className="h-3.5 w-3.5" />
          {t('export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onPdf} disabled={disabled}>
          <Printer className="mr-2 h-3.5 w-3.5" />
          {t('exportPdf')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExcel} disabled={disabled}>
          <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-emerald-600" />
          {t('exportExcel')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
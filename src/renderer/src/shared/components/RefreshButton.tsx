import { Button } from '@web/shared/components/ui/button';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void;
  loading?: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, loading }) => (
  <Button variant="outline" onClick={onRefresh} disabled={loading} className="gap-2">
    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
    {t('refresh')}
  </Button>
);

export default RefreshButton;

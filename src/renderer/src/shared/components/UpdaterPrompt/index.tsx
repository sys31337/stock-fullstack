import { useEffect, useState } from 'react';
import { t } from 'i18next';
import { Download } from 'lucide-react';
import { Button } from '@web/shared/components/ui/button';
import { useUpdater } from '@web/shared/hooks/useUpdater';

/**
 * Bottom-right prompt shown on any authenticated screen once an update has
 * finished downloading. POS-friendly: lets staff pick "Later" so they can
 * finish a session, or "Restart now" to apply and relaunch.
 */
const UpdaterPrompt = () => {
  const { phase, downloadedVersion, install } = useUpdater();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (phase === 'downloaded') setDismissed(false);
  }, [phase]);

  if (phase !== 'downloaded' || !downloadedVersion || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[400] w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-4 shadow-2xl animate-in fade-in-0 zoom-in-95">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-primary shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">{t('updateDownloaded')}</p>
          <p className="text-xs text-muted-foreground">
            {t('updateDownloadedMessage', { version: downloadedVersion })}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDismissed(true)}>
              {t('later')}
            </Button>
            <Button size="sm" onClick={() => install()}>
              {t('restartNow')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdaterPrompt;

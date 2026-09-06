import { t } from 'i18next';
import { CheckCircle2, Download, Loader2, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@web/shared/components/ui/button';
import { Separator } from '@web/shared/components/ui/separator';
import { useUpdater } from '@web/shared/hooks/useUpdater';

const UpdatesTab = () => {
  const {
    phase,
    currentVersion,
    remoteVersion,
    downloadedVersion,
    progress,
    error,
    hasChecked,
    busy,
    check,
    install,
  } = useUpdater();

  return (
    <div className="max-w-md space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{t('updatesTab')}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t('settingsUpdatesDesc')}</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('currentVersion')}</span>
          <span className="font-medium">{currentVersion}</span>
        </div>

        {remoteVersion && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('newVersion')}</span>
            <span className="font-medium">{remoteVersion}</span>
          </div>
        )}

        <Separator />

        {phase === 'checking' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('updateChecking')}
          </div>
        )}

        {phase === 'available' && remoteVersion && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            {t('updateAvailable', { version: remoteVersion })}
          </div>
        )}

        {phase === 'downloading' && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('downloadProgress', { percent: progress?.percent ?? 0 })}
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress?.percent ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {phase === 'downloaded' && downloadedVersion && (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{t('updateDownloaded')}</p>
              <p className="text-muted-foreground">
                {t('updateDownloadedMessage', { version: downloadedVersion })}
              </p>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex items-start gap-2 text-sm">
            <TriangleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">{t('updateError')}</p>
              <p className="text-muted-foreground">{error || t('updateErrorDesc')}</p>
            </div>
          </div>
        )}

        {hasChecked && phase === 'idle' && !remoteVersion && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {t('upToDate')}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {phase === 'downloaded' && (
          <Button onClick={() => install()} className="gap-2">
            <Download className="h-4 w-4" />
            {t('restartNow')}
          </Button>
        )}
        <Button
          onClick={() => check()}
          disabled={busy || phase === 'checking'}
          variant="outline"
          className="gap-2"
        >
          {busy || phase === 'checking' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t('checkForUpdates')}
        </Button>
      </div>
    </div>
  );
};

export default UpdatesTab;

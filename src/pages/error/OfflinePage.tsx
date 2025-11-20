import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Wifi } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function OfflinePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      // 自动跳转回上一页或首页
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    }
  }, [isOnline, navigate]);

  const handleRetry = async () => {
    setRetrying(true);
    
    try {
      // 尝试ping服务器
      await fetch('/api/v1/health', { method: 'HEAD' });
      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
    } finally {
      setTimeout(() => setRetrying(false), 1000);
    }
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <Wifi className="w-16 h-16 text-green-500 animate-pulse" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">{t('error.offline.restored')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('error.offline.restoring')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 离线图标 */}
        <div className="relative flex justify-center">
          <div className="w-48 h-48 rounded-full bg-muted/30 flex items-center justify-center">
            <WifiOff className="w-24 h-24 text-muted-foreground animate-pulse" />
          </div>
          <div className="absolute inset-0 blur-2xl opacity-30">
            <div className="w-48 h-48 mx-auto bg-muted rounded-full" />
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">{t('error.offline.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {t('error.offline.description')}
            <br />
            {t('error.offline.hint')}
          </p>
        </div>

        {/* 连接状态动画 */}
        <div className="flex justify-center items-center gap-2 py-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-4 h-4 bg-muted-foreground/30 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* 检查清单 */}
        <div className="bg-muted/30 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-foreground mb-3">{t('error.offline.checklistTitle')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.offline.checklist.wifi')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.offline.checklist.airplane')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.offline.checklist.router')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.offline.checklist.maintenance')}</span>
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            onClick={handleRetry}
            disabled={retrying}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? t('error.offline.retrying') : t('error.offline.btnRetry')}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="pt-8 text-xs text-muted-foreground">
          <p>{t('error.offline.footer')}</p>
        </div>
      </div>
    </div>
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { errorLogger } from '@/utils/errorLogger';
import { useEffect } from 'react';

export default function InternalErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const customMessage = location.state?.message;
  const errorDetails = location.state?.error;

  useEffect(() => {
    errorLogger.log({
      type: 'HTTP_ERROR',
      severity: 'HIGH',
      message: errorDetails?.message || `Internal server error: ${location.pathname}`,
      stack: errorDetails?.stack,
      meta: {
        path: location.pathname,
        status: 500,
      },
    });
  }, [location.pathname, errorDetails]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 500图标 */}
        <div className="relative flex justify-center">
          <div className="relative">
            <AlertTriangle className="w-48 h-48 text-orange-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-orange-500">500</span>
            </div>
          </div>
          <div className="absolute inset-0 blur-3xl opacity-20">
            <AlertTriangle className="w-48 h-48 text-orange-500 mx-auto" />
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">{t('error.500.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {customMessage || t('error.500.description')}
            <br />
            {t('error.500.hint')}
          </p>
        </div>

        {/* 错误动画 */}
        <div className="flex justify-center gap-4 py-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-16 bg-orange-500/30 rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* 建议操作 */}
        <div className="bg-muted/30 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-foreground mb-3">{t('error.500.suggestionsTitle')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>{t('error.500.suggestions.refresh')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>{t('error.500.suggestions.clearCache')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>{t('error.500.suggestions.retry')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500 mt-1">•</span>
              <span>{t('error.500.suggestions.contact')}</span>
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="border-border hover:bg-accent"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('error.500.btnRefresh')}
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary/90"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('error.500.btnHome')}
          </Button>
        </div>

        {/* 错误ID */}
        <div className="pt-8 space-y-2">
          <p className="text-xs text-muted-foreground">
            {t('error.500.errorId')}: {Date.now().toString(36).toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('error.500.time')}: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

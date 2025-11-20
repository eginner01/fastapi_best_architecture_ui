import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, ShieldAlert, Lock } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { errorLogger } from '@/utils/errorLogger';
import { useEffect } from 'react';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const customMessage = location.state?.message;

  useEffect(() => {
    errorLogger.log({
      type: 'HTTP_ERROR',
      severity: 'MEDIUM',
      message: `Access forbidden: ${location.pathname}`,
      meta: {
        path: location.pathname,
        status: 403,
      },
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 403图标 */}
        <div className="relative flex justify-center">
          <div className="relative">
            <ShieldAlert className="w-48 h-48 text-destructive/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold text-destructive">403</span>
            </div>
          </div>
          <div className="absolute inset-0 blur-3xl opacity-20">
            <ShieldAlert className="w-48 h-48 text-destructive mx-auto" />
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">{t('error.403.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {customMessage || t('error.403.description')}
            <br />
            {t('error.403.hint')}
          </p>
        </div>

        {/* 锁图标装饰 */}
        <div className="flex justify-center gap-6 py-8">
          <div className="relative">
            <Lock className="w-12 h-12 text-destructive/30 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-ping" />
          </div>
          <div className="relative" style={{ animationDelay: '0.3s' }}>
            <Lock className="w-12 h-12 text-destructive/30 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-ping" />
          </div>
          <div className="relative" style={{ animationDelay: '0.6s' }}>
            <Lock className="w-12 h-12 text-destructive/30 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-ping" />
          </div>
        </div>

        {/* 可能的原因 */}
        <div className="bg-muted/30 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-foreground mb-3">{t('error.403.reasonsTitle')}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>{t('error.403.reasons.noPermission')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>{t('error.403.reasons.roleRestricted')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive mt-1">•</span>
              <span>{t('error.403.reasons.sessionExpired')}</span>
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-border hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('error.403.btnBack')}
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary/90"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('error.403.btnHome')}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="pt-8 text-xs text-muted-foreground">
          <p>{t('error.403.footer')}</p>
        </div>
      </div>
    </div>
  );
}

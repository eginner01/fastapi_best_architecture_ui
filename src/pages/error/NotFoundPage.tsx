import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { errorLogger } from '@/utils/errorLogger';
import { useEffect } from 'react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const customMessage = location.state?.message;

  useEffect(() => {
    // 上报404错误
    errorLogger.log({
      type: 'HTTP_ERROR',
      severity: 'LOW',
      message: `Page not found: ${location.pathname}`,
      meta: {
        path: location.pathname,
        referrer: document.referrer,
      },
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404动画数字 */}
        <div className="relative">
          <h1 className="text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60 leading-none animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-30">
            <div className="text-[180px] font-bold text-primary leading-none">404</div>
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">{t('error.404.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {customMessage || t('error.404.description')}
            <br />
            {t('error.404.hint')}
          </p>
        </div>

        {/* 搜索图标装饰 */}
        <div className="flex justify-center gap-8 py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce" style={{ animationDelay: '0s' }}>
            <Search className="w-8 h-8 text-primary/50" />
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.1s' }}>
            <Search className="w-8 h-8 text-primary/50" />
          </div>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-bounce" style={{ animationDelay: '0.2s' }}>
            <Search className="w-8 h-8 text-primary/50" />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-border hover:bg-accent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('error.404.btnBack')}
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary/90"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('error.404.btnHome')}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="pt-8 text-xs text-muted-foreground">
          <p>{t('error.404.footer')}</p>
        </div>
      </div>
    </div>
  );
}

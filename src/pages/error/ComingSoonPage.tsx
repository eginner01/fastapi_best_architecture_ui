import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Rocket, Clock } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ComingSoonPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 火箭图标 */}
        <div className="relative flex justify-center">
          <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
            <Rocket className="w-32 h-32 text-primary" />
            {/* 火箭尾焰 */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-b from-primary/30 to-transparent rounded-full blur-xl animate-pulse" />
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-foreground">{t('error.comingSoon.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {t('error.comingSoon.description')}
            <br />
            {t('error.comingSoon.hint')}
          </p>
        </div>

        {/* 时钟动画 */}
        <div className="flex justify-center items-center gap-4 py-8">
          <Clock className="w-12 h-12 text-primary/50 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="text-4xl font-bold text-primary animate-pulse">
            ...
          </div>
        </div>

        {/* 特性预告 */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-left max-w-md mx-auto border border-primary/20">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary">★</span>
            {t('error.comingSoon.featuresTitle')}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.comingSoon.features.powerful')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.comingSoon.features.smooth')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t('error.comingSoon.features.beautiful')}</span>
            </li>
          </ul>
        </div>

        {/* 进度指示 */}
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t('error.comingSoon.progress')}</span>
            <span>75%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-1000 animate-pulse"
              style={{ width: '75%' }}
            />
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
            {t('error.comingSoon.btnBack')}
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary/90"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('error.comingSoon.btnHome')}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="pt-8 text-xs text-muted-foreground">
          <p>{t('error.comingSoon.footer')}</p>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Github, Mail as GmailIcon, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { bindAccountApi, unbindAccountApi } from '@/api/profile';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';

interface BindingOption {
  icon: React.ReactNode;
  name: string;
  description: string;
  type: string;
  bound: boolean;
  boundAccount?: string;
}

export default function AccountBinding() {
  const [bindings] = useState<BindingOption[]>([
    {
      icon: <Github className="w-5 h-5" />,
      name: 'GitHub',
      description: '使用GitHub账号快速登录',
      type: 'github',
      bound: false, // TODO: 从用户信息获取
      boundAccount: undefined
    },
    {
      icon: <GmailIcon className="w-5 h-5" />,
      name: 'Gmail',
      description: '使用Gmail账号快速登录',
      type: 'gmail',
      bound: false, // TODO: 从用户信息获取
      boundAccount: undefined
    },
    {
      icon: <LinkIcon className="w-5 h-5" />,
      name: 'Linuxdo',
      description: '使用Linuxdo账号快速登录',
      type: 'linuxdo',
      bound: false, // TODO: 从用户信息获取
      boundAccount: undefined
    }
  ]);

  const { toast } = useToast();
  const { confirm } = useConfirmDialog();

  const handleBind = async (type: string) => {
    try {
      // TODO: 实现OAuth流程，获取code
      // 这里需要跳转到第三方登录页面，然后回调后获取code
      const mockCode = 'mock-oauth-code';
      await bindAccountApi(type, mockCode);
      
      toast({
        title: "绑定成功",
        description: `${type}账号已成功绑定`,
      });
    } catch (error) {
      toast({
        title: "绑定失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  const handleUnbind = async (type: string) => {
    const confirmed = await confirm({
      title: '确认解绑',
      description: `确定要解绑${type}账号吗？`,
      confirmText: '确定解绑',
      cancelText: '取消',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      await unbindAccountApi(type);
      
      toast({
        title: "解绑成功",
        description: `${type}账号已解绑`,
      });
    } catch (error) {
      toast({
        title: "解绑失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      {bindings.map((binding) => (
        <div
          key={binding.type}
          className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {binding.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{binding.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  binding.bound
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {binding.bound ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      已绑定
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      未绑定
                    </>
                  )}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{binding.description}</p>
              {binding.bound && binding.boundAccount && (
                <p className="text-xs text-muted-foreground mt-1">
                  绑定账号：{binding.boundAccount}
                </p>
              )}
            </div>
          </div>
          <Button
            variant={binding.bound ? 'outline' : 'default'}
            onClick={() => binding.bound ? handleUnbind(binding.type) : handleBind(binding.type)}
            className="ml-4"
          >
            {binding.bound ? '解绑' : '绑定'}
          </Button>
        </div>
      ))}

      <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex gap-3">
          <div className="text-blue-400 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-400 mb-1">提示</h4>
            <p className="text-xs text-blue-300/80">
              绑定第三方账号后，您可以使用该账号快速登录系统。<br />
              建议至少绑定一个第三方账号，以便在忘记密码时可以通过其他方式登录。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

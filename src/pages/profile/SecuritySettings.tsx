import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Phone, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  updatePhoneApi, 
  updateEmailApi, 
  updatePasswordApi,
  sendPhoneCaptchaApi,
  sendEmailCaptchaApi
} from '@/api/profile';

interface SecurityOption {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'phone' | 'email' | 'password';
  status: boolean;
  statusText: string;
}

export default function SecuritySettings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentType, setCurrentType] = useState<'phone' | 'email' | 'password'>('password');
  const { toast } = useToast();
  const navigate = useNavigate();

  // 表单状态
  const [phoneForm, setPhoneForm] = useState({ phone: '', captcha: '' });
  const [emailForm, setEmailForm] = useState({ email: '', captcha: '' });
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [phoneCaptchaLoading, setPhoneCaptchaLoading] = useState(false);
  const [emailCaptchaLoading, setEmailCaptchaLoading] = useState(false);
  const [phoneCaptchaCountdown, setPhoneCaptchaCountdown] = useState(0);
  const [emailCaptchaCountdown, setEmailCaptchaCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const securityOptions: SecurityOption[] = [
    {
      icon: <Phone className="w-5 h-5" />,
      title: '安全手机',
      description: '手机号可用于登录、身份验证、密码找回、通知接收',
      type: 'phone',
      status: true, // TODO: 从用户信息获取
      statusText: '已绑定'
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: '安全邮箱',
      description: '邮箱可用于登录、身份验证、密码找回、通知接收',
      type: 'email',
      status: true, // TODO: 从用户信息获取
      statusText: '已绑定'
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: '登录密码',
      description: '为了您的账号安全，建议定期修改密码',
      type: 'password',
      status: true,
      statusText: '已设置'
    }
  ];

  const openDialog = (type: 'phone' | 'email' | 'password') => {
    setCurrentType(type);
    setDialogOpen(true);
    // 重置表单
    setPhoneForm({ phone: '', captcha: '' });
    setEmailForm({ email: '', captcha: '' });
    setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
  };

  // 倒计时效果
  useEffect(() => {
    if (phoneCaptchaCountdown > 0) {
      const timer = setTimeout(() => setPhoneCaptchaCountdown(phoneCaptchaCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCaptchaCountdown]);

  useEffect(() => {
    if (emailCaptchaCountdown > 0) {
      const timer = setTimeout(() => setEmailCaptchaCountdown(emailCaptchaCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCaptchaCountdown]);

  // 发送手机验证码
  const handleSendPhoneCaptcha = async () => {
    if (!phoneForm.phone) {
      toast({
        title: "错误",
        description: "请先输入手机号",
        variant: "destructive"
      });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
      toast({
        title: "错误",
        description: "手机号格式不正确",
        variant: "destructive"
      });
      return;
    }

    try {
      setPhoneCaptchaLoading(true);
      await sendPhoneCaptchaApi(phoneForm.phone);
      setPhoneCaptchaCountdown(60);
      toast({
        title: "发送成功",
        description: "验证码已发送到您的手机"
      });
    } catch (error) {
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setPhoneCaptchaLoading(false);
    }
  };

  // 发送邮箱验证码
  const handleSendEmailCaptcha = async () => {
    if (!emailForm.email) {
      toast({
        title: "错误",
        description: "请先输入邮箱地址",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.email)) {
      toast({
        title: "错误",
        description: "邮箱格式不正确",
        variant: "destructive"
      });
      return;
    }

    try {
      setEmailCaptchaLoading(true);
      await sendEmailCaptchaApi(emailForm.email);
      setEmailCaptchaCountdown(60);
      toast({
        title: "发送成功",
        description: "验证码已发送到您的邮箱"
      });
    } catch (error) {
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setEmailCaptchaLoading(false);
    }
  };

  // 密码强度检测
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength >= 4) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
  };

  const handleSubmit = async () => {
    try {
      if (currentType === 'password') {
        if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
          toast({
            title: "错误",
            description: "请填写所有密码字段",
            variant: "destructive"
          });
          return;
        }

        if (passwordForm.new_password !== passwordForm.confirm_password) {
          toast({
            title: "错误",
            description: "两次输入的新密码不一致",
            variant: "destructive"
          });
          return;
        }

        if (passwordForm.new_password.length < 6) {
          toast({
            title: "错误",
            description: "新密码长度不能少于6位",
            variant: "destructive"
          });
          return;
        }

        // 强制密码强度检查
        const strength = checkPasswordStrength(passwordForm.new_password);
        if (strength === 'weak') {
          toast({
            title: "密码强度太弱",
            description: "建议使用大小写字母、数字和特殊字符的组合",
            variant: "destructive"
          });
          return;
        }

        await updatePasswordApi(passwordForm);

        toast({
          title: "密码修改成功",
          description: "请重新登录"
        });

        setDialogOpen(false);
        
        // 密码修改成功后跳转到登录页
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('session_uuid');
          navigate('/login');
        }, 1500);
        
      } else if (currentType === 'phone') {
        if (!phoneForm.phone || !phoneForm.captcha) {
          toast({
            title: "错误",
            description: "请填写手机号和验证码",
            variant: "destructive"
          });
          return;
        }

        await updatePhoneApi(phoneForm);

        toast({
          title: "绑定成功",
          description: "手机号已绑定"
        });
        setDialogOpen(false);

      } else if (currentType === 'email') {
        if (!emailForm.email || !emailForm.captcha) {
          toast({
            title: "错误",
            description: "请填写邮箱和验证码",
            variant: "destructive"
          });
          return;
        }

        await updateEmailApi(emailForm);

        toast({
          title: "绑定成功",
          description: "邮箱已绑定"
        });
        setDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  const renderDialogContent = () => {
    if (currentType === 'password') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="old_password">
              当前密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="old_password"
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              className="bg-background border-border mt-2"
              placeholder="请输入当前密码"
            />
          </div>
          <div>
            <Label htmlFor="new_password">
              新密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new_password"
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => {
                const newPassword = e.target.value;
                setPasswordForm({ ...passwordForm, new_password: newPassword });
                if (newPassword) {
                  setPasswordStrength(checkPasswordStrength(newPassword));
                } else {
                  setPasswordStrength(null);
                }
              }}
              className="bg-background border-border mt-2"
              placeholder="请输入新密码（至少6位）"
            />
            {passwordStrength && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${
                    passwordStrength === 'weak' ? 'bg-red-500' : 
                    passwordStrength === 'medium' ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`} />
                  <div className={`h-1 flex-1 rounded ${
                    passwordStrength === 'medium' || passwordStrength === 'strong' ? 
                    passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500' : 
                    'bg-muted'
                  }`} />
                  <div className={`h-1 flex-1 rounded ${
                    passwordStrength === 'strong' ? 'bg-green-500' : 'bg-muted'
                  }`} />
                </div>
                <p className={`text-xs ${
                  passwordStrength === 'weak' ? 'text-red-400' : 
                  passwordStrength === 'medium' ? 'text-yellow-400' : 
                  'text-green-400'
                }`}>
                  密码强度：{
                    passwordStrength === 'weak' ? '弱' : 
                    passwordStrength === 'medium' ? '中' : 
                    '强'
                  }
                </p>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="confirm_password">
              确认新密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirm_password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="bg-background border-border mt-2"
              placeholder="请再次输入新密码"
            />
          </div>
        </div>
      );
    } else if (currentType === 'phone') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">
              手机号 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phoneForm.phone}
              onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })}
              className="bg-background border-border mt-2"
              placeholder="请输入手机号"
            />
          </div>
          <div>
            <Label htmlFor="phone_captcha">
              验证码 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="phone_captcha"
                value={phoneForm.captcha}
                onChange={(e) => setPhoneForm({ ...phoneForm, captcha: e.target.value })}
                className="bg-background border-border"
                placeholder="请输入验证码"
              />
              <Button 
                variant="outline" 
                className="border-border whitespace-nowrap"
                onClick={handleSendPhoneCaptcha}
                disabled={phoneCaptchaCountdown > 0 || phoneCaptchaLoading}
              >
                {phoneCaptchaCountdown > 0 ? `${phoneCaptchaCountdown}秒` : '发送验证码'}
              </Button>
            </div>
          </div>
        </div>
      );
    } else if (currentType === 'email') {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">
              邮箱 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={emailForm.email}
              onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
              className="bg-background border-border mt-2"
              placeholder="请输入邮箱地址"
            />
          </div>
          <div>
            <Label htmlFor="email_captcha">
              验证码 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="email_captcha"
                value={emailForm.captcha}
                onChange={(e) => setEmailForm({ ...emailForm, captcha: e.target.value })}
                className="bg-background border-border"
                placeholder="请输入验证码"
              />
              <Button 
                variant="outline" 
                className="border-border whitespace-nowrap"
                onClick={handleSendEmailCaptcha}
                disabled={emailCaptchaCountdown > 0 || emailCaptchaLoading}
              >
                {emailCaptchaCountdown > 0 ? `${emailCaptchaCountdown}秒` : '发送验证码'}
              </Button>
            </div>
          </div>
        </div>
      );
    }
  };

  const getDialogTitle = () => {
    const titles = {
      phone: '绑定手机号',
      email: '绑定邮箱',
      password: '修改密码'
    };
    return titles[currentType];
  };

  return (
    <>
      <div className="space-y-4">
        {securityOptions.map((option) => (
          <div
            key={option.type}
            className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{option.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    option.status 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {option.status ? (
                      <CheckCircle2 className="w-3 h-3 inline mr-1" />
                    ) : (
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                    )}
                    {option.statusText}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
            <Button
              variant={option.status ? 'outline' : 'default'}
              onClick={() => openDialog(option.type)}
              className="ml-4"
            >
              {option.status ? '修改' : '绑定'}
            </Button>
          </div>
        ))}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderDialogContent()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

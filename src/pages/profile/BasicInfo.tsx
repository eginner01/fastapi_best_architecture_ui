import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Edit, IdCard, Upload } from 'lucide-react';
import { getUserInfoApi } from '@/api/auth';
import { updateAvatarApi, updateNicknameApi } from '@/api/profile';

interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  phone?: string;
  avatar?: string;
  dept?: string;
  roles?: string[];
  last_login_time?: string;
}

export default function BasicInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const { toast } = useToast();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const data = await getUserInfoApi();
      setUserInfo(data as any);
    } catch (error) {
      toast({
        title: "获取用户信息失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) {
      toast({
        title: "错误",
        description: "昵称不能为空",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateNicknameApi({ nickname: newNickname });
      
      toast({
        title: "更新成功",
        description: "昵称已更新"
      });
      setNicknameDialogOpen(false);
      fetchUserInfo();
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: "错误",
        description: "请选择图片文件",
        variant: "destructive"
      });
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "错误",
        description: "图片大小不能超过2MB",
        variant: "destructive"
      });
      return;
    }

    setAvatarFile(file);

    // 生成预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAvatar = async () => {
    let avatarUrl = '';

    if (uploadMode === 'file') {
      if (!avatarFile) {
        toast({
          title: "错误",
          description: "请选择头像文件",
          variant: "destructive"
        });
        return;
      }

      // TODO: 实现文件上传到服务器
      // const formData = new FormData();
      // formData.append('file', avatarFile);
      // const response = await uploadFileApi(formData);
      // avatarUrl = response.url;

      // 临时方案：使用base64
      avatarUrl = avatarPreview;
    } else {
      if (!newAvatar.trim()) {
        toast({
          title: "错误",
          description: "请输入头像URL",
          variant: "destructive"
        });
        return;
      }
      avatarUrl = newAvatar;
    }

    try {
      await updateAvatarApi({ avatar: avatarUrl });
      
      toast({
        title: "更新成功",
        description: "头像已更新"
      });
      setAvatarDialogOpen(false);
      setAvatarFile(null);
      setAvatarPreview('');
      fetchUserInfo();
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">加载中...</div>
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-lg">基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 头像和昵称 */}
        <div className="text-center">
          <div 
            className="relative inline-block cursor-pointer group"
            onClick={() => {
              setNewAvatar(userInfo?.avatar || '');
              setAvatarDialogOpen(true);
            }}
          >
            <Avatar className="w-32 h-32 mx-auto">
              <AvatarImage src={userInfo?.avatar} alt={userInfo?.nickname} />
              <AvatarFallback className="text-2xl">{userInfo?.nickname?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Edit className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold">{userInfo?.nickname}</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setNewNickname(userInfo?.nickname || '');
                setNicknameDialogOpen(true);
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <IdCard className="w-4 h-4" />
            <span>ID: {userInfo?.id}</span>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">用户名</span>
            <span className="font-medium">{userInfo?.username}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">手机号</span>
            <span className="font-medium">{userInfo?.phone || '未绑定'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">邮箱</span>
            <span className="font-medium">{userInfo?.email || '未绑定'}</span>
          </div>

          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">部门</span>
            {userInfo?.dept ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400">
                {userInfo.dept}
              </Badge>
            ) : (
              <span className="text-muted-foreground">未分配</span>
            )}
          </div>

          <div className="py-2 border-b border-border">
            <div className="text-muted-foreground mb-2">角色</div>
            <div className="flex flex-wrap gap-2">
              {userInfo?.roles && userInfo.roles.length > 0 ? (
                userInfo.roles.map((role, index) => (
                  <Badge key={index} variant="default" className="bg-purple-500/20 text-purple-400">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">未分配角色</span>
              )}
            </div>
          </div>
        </div>

        {/* 最后登录时间 */}
        {userInfo?.last_login_time && (
          <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
            最后登录：{new Date(userInfo.last_login_time).toLocaleString()}
          </div>
        )}
      </CardContent>

      {/* 编辑昵称对话框 */}
      <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>更新昵称</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nickname">新昵称</Label>
              <Input
                id="nickname"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                className="bg-background border-border mt-2"
                placeholder="请输入新昵称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNicknameDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpdateNickname}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑头像对话框 */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>更新头像</DialogTitle>
          </DialogHeader>
          <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'file' | 'url')} className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">上传文件</TabsTrigger>
              <TabsTrigger value="url">输入链接</TabsTrigger>
            </TabsList>
            
            <TabsContent value="file" className="space-y-4">
              <div>
                <Label htmlFor="avatar-file" className="text-sm font-medium">
                  选择图片 <span className="text-muted-foreground text-xs">(最大2MB)</span>
                </Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-background border-border"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              
              {avatarPreview && (
                <div className="space-y-2">
                  <Label className="text-sm">预览</Label>
                  <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={avatarPreview} alt="预览" />
                      <AvatarFallback>预览</AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {avatarFile?.name} ({(avatarFile!.size / 1024).toFixed(1)}KB)
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="avatar-url">头像链接</Label>
                <Input
                  id="avatar-url"
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  className="bg-background border-border mt-2"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              
              {newAvatar && (
                <div className="space-y-2">
                  <Label className="text-sm">预览</Label>
                  <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={newAvatar} alt="预览" />
                      <AvatarFallback>预览</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAvatarDialogOpen(false);
              setAvatarFile(null);
              setAvatarPreview('');
              setNewAvatar('');
            }}>取消</Button>
            <Button onClick={handleUpdateAvatar}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

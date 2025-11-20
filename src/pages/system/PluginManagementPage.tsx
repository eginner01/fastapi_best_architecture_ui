import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RefreshCw, Plus, Download, Trash2, Package, Search, Activity, AlertTriangle, CheckCircle2, Power, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import {
  getPluginListApi,
  getPluginChangedApi,
  installZipPluginApi,
  installGitPluginApi,
  updatePluginStatusApi,
  downloadPluginApi,
  uninstallPluginApi
} from '@/api/plugin';

interface PluginInfo {
  plugin: {
    name: string;
    summary: string;
    author: string;
    description: string;
    version: string;
    enable: string;
  };
}

export default function PluginManagementPage() {
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();
  const [pluginInfo, setPluginInfo] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [pluginChanged, setPluginChanged] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [installType, setInstallType] = useState(0); // 0: ZIP, 1: GIT
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');

  const fetchPluginChanged = async () => {
    try {
      const changed: any = await getPluginChangedApi();
      setPluginChanged(typeof changed === 'boolean' ? changed : changed?.data === true);
    } catch (error) {
      console.error('获取插件变更状态失败:', error);
    }
  };

  const fetchPlugin = async () => {
    setLoading(true);
    try {
      const plugins: any = await getPluginListApi();
      const pluginList = Array.isArray(plugins) ? plugins : plugins?.data || [];
      setPluginInfo(pluginList);
    } catch (error) {
      console.error('获取插件列表失败:', error);
      toast({ title: "错误", description: "获取插件列表失败", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPluginChanged();
    fetchPlugin();
  }, []);

  // 统计数据
  const stats = useMemo(() => {
    const total = pluginInfo.length;
    const enabled = pluginInfo.filter(p => p.plugin.enable === "1").length;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  }, [pluginInfo]);

  // 过滤插件列表
  const filteredPlugins = useMemo(() => {
    return pluginInfo.filter(info => {
      const matchesSearch = searchQuery === '' || 
        info.plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info.plugin.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        info.plugin.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterStatus === 'all' ||
        (filterStatus === 'enabled' && info.plugin.enable === "1") ||
        (filterStatus === 'disabled' && info.plugin.enable === "0");
      
      return matchesSearch && matchesFilter;
    });
  }, [pluginInfo, searchQuery, filterStatus]);

  const handleInstall = () => {
    setRepoUrl('');
    setSelectedFile(null);
    setInstallType(0);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitInstall = async () => {
    try {
      if (installType === 0) {
        if (!selectedFile) {
          toast({ title: "错误", description: "请选择要上传的ZIP文件", variant: "destructive" });
          return;
        }
        await installZipPluginApi(selectedFile);
      } else {
        if (!repoUrl) {
          toast({ title: "错误", description: "请输入Git仓库URL", variant: "destructive" });
          return;
        }
        await installGitPluginApi(repoUrl);
      }
      toast({ title: "成功", description: "插件安装成功" });
      setIsDialogOpen(false);
      setSelectedFile(null);
      setRepoUrl('');
      await fetchPlugin();
      await fetchPluginChanged();
    } catch (error) {
      console.error('安装插件失败:', error);
      toast({ title: "错误", description: "安装插件失败", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (pluginName: string, currentEnable: string) => {
    try {
      await updatePluginStatusApi(pluginName);
      setPluginInfo(prev => prev.map(info => 
        info.plugin.name === pluginName 
          ? { ...info, plugin: { ...info.plugin, enable: currentEnable === "1" ? "0" : "1" } }
          : info
      ));
      await fetchPluginChanged();
      toast({ 
        title: "成功", 
        description: `插件已${currentEnable === "1" ? "禁用" : "启用"}` 
      });
    } catch (error) {
      console.error('更新插件状态失败:', error);
      toast({ title: "错误", description: "更新插件状态失败", variant: "destructive" });
      await fetchPlugin();
    }
  };

  const handleDownload = async (pluginName: string) => {
    const confirmed = await confirm({
      title: '下载插件',
      description: `确认打包并下载插件 ${pluginName} 吗？`,
      confirmText: '下载',
      type: 'info',
    });
    if (!confirmed) return;
    try {
      const response: any = await downloadPluginApi(pluginName);
      const blob = response?.data || response;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pluginName}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "成功", description: "下载插件成功" });
    } catch (error) {
      console.error('下载插件失败:', error);
      toast({ title: "错误", description: "下载插件失败", variant: "destructive" });
    }
  };

  const handleUninstall = async (pluginName: string) => {
    const confirmed = await confirm({
      title: '卸载插件',
      description: `确认卸载插件 ${pluginName} 吗？此操作不可恢复！`,
      confirmText: '卸载',
      type: 'error',
    });
    if (!confirmed) return;
    try {
      await uninstallPluginApi(pluginName);
      toast({ title: "成功", description: "删除插件成功" });
      await fetchPlugin();
      await fetchPluginChanged();
    } catch (error) {
      console.error('删除插件失败:', error);
      toast({ title: "错误", description: "删除插件失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题区域 */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            插件管理中心
          </h1>
          <p className="text-muted-foreground">
            集中管理和监控系统插件，支持在线安装、启用和配置
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => { fetchPlugin(); fetchPluginChanged(); }}
            className="border-border hover:bg-accent transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button 
            onClick={handleInstall}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            安装插件
          </Button>
        </div>
      </div>

      {/* 插件变更警告 */}
      {pluginChanged && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-500 mb-1">插件配置变更检测</h4>
                <p className="text-sm text-amber-500/90">
                  检测到插件状态存在变更，为了确保系统能够正常运行，请尽快联系系统管理员进行相关调整
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计卡片区域 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">总插件数</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">运行中</p>
                <p className="text-3xl font-bold text-green-500">{stats.enabled}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-gradient-to-br from-card to-card/50 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">已停用</p>
                <p className="text-3xl font-bold text-muted-foreground">{stats.disabled}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Power className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选区域 */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索插件名称、描述或作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className="transition-all duration-200"
              >
                全部
              </Button>
              <Button
                variant={filterStatus === 'enabled' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('enabled')}
                className="transition-all duration-200"
              >
                运行中
              </Button>
              <Button
                variant={filterStatus === 'disabled' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('disabled')}
                className="transition-all duration-200"
              >
                已停用
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 插件列表卡片网格 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {searchQuery || filterStatus !== 'all' ? '未找到匹配的插件' : '暂无已安装插件'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== 'all' 
                    ? '尝试调整搜索条件或筛选器' 
                    : '点击"安装插件"按钮开始安装您的第一个插件'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPlugins.map((info) => (
            <Card 
              key={info.plugin.name}
              className="border-border bg-card hover:shadow-xl transition-all duration-200 group overflow-hidden relative"
            >
              {/* 渐变装饰线 */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                info.plugin.enable === "1" 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-muted to-muted-foreground'
              }`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-foreground mb-1 truncate">
                      {info.plugin.summary}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{info.plugin.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Switch 
                      checked={info.plugin.enable === "1"}
                      onCheckedChange={() => handleToggleStatus(info.plugin.name, info.plugin.enable)}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-muted-foreground/50"
                    />
                    <Badge 
                      variant={info.plugin.enable === "1" ? "default" : "secondary"}
                      className={`${
                        info.plugin.enable === "1" 
                          ? "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20" 
                          : "bg-muted text-muted-foreground border-border"
                      } transition-colors duration-200`}
                    >
                      {info.plugin.enable === "1" ? (
                        <><Activity className="w-3 h-3 mr-1" />运行中</>
                      ) : (
                        <><Power className="w-3 h-3 mr-1" />已停用</>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* 作者和版本信息 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">作者:</span>
                    <span className="text-foreground">@{info.plugin.author}</span>
                  </div>
                  <Badge variant="outline" className="border-border font-mono text-xs">
                    v{info.plugin.version}
                  </Badge>
                </div>

                {/* 描述 */}
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {info.plugin.description}
                </p>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownload(info.plugin.name)}
                    className="flex-1 border-border hover:bg-accent hover:border-primary/50 transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleUninstall(info.plugin.name)}
                    className="flex-1 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    卸载
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 安装对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">安装新插件</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">安装方式</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInstallType(0)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    installType === 0
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <Package className={`w-6 h-6 mx-auto mb-2 ${installType === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${installType === 0 ? 'text-primary' : 'text-foreground'}`}>
                    ZIP 压缩包
                  </p>
                </button>
                <button
                  onClick={() => setInstallType(1)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    installType === 1
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <Activity className={`w-6 h-6 mx-auto mb-2 ${installType === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${installType === 1 ? 'text-primary' : 'text-foreground'}`}>
                    Git 仓库
                  </p>
                </button>
              </div>
            </div>
            
            {installType === 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">选择文件</Label>
                <div className="space-y-2">
                  <Input 
                    type="file" 
                    accept=".zip" 
                    onChange={handleFileChange}
                    className="bg-background border-border text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                      <Package className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  仅支持 ZIP 格式的插件包文件，重新上传将覆盖之前的选择
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Git 仓库地址</Label>
                <Input 
                  value={repoUrl} 
                  onChange={(e) => setRepoUrl(e.target.value)} 
                  placeholder="https://github.com/username/repository.git"
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
                <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-500/90">
                    仓库内容无法实时检测，请确保来源可信，避免恶意代码植入
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-border"
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmitInstall}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              开始安装
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

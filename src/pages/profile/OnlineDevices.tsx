import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { Monitor, Smartphone, Tablet, Chrome, CheckCircle2 } from 'lucide-react';
import { getOnlineDevicesApi, logoutDeviceApi } from '@/api/profile';
import type { OnlineDevice } from '@/api/profile';


export default function OnlineDevices() {
  const [devices, setDevices] = useState<OnlineDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await getOnlineDevicesApi();
      setDevices(data);
    } catch (error) {
      toast({
        title: "获取设备列表失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (deviceId: string, isCurrent: boolean) => {
    const confirmed = await confirm({
      title: '确认下线',
      description: isCurrent 
        ? '确定要退出当前设备吗？您将被重新导向到登录页面。'
        : '确定要强制该设备下线吗？',
      confirmText: '确定下线',
      cancelText: '取消',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      await logoutDeviceApi(deviceId);
      
      toast({
        title: "操作成功",
        description: isCurrent ? "已退出登录" : "设备已下线"
      });

      if (isCurrent) {
        // 当前设备下线，跳转到登录页
        setTimeout(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('session_uuid');
          window.location.href = '/login';
        }, 1000);
      } else {
        fetchDevices();
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {devices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无在线设备</p>
        </div>
      ) : (
        devices.map((device) => (
          <div
            key={device.id}
            className="flex items-start justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getDeviceIcon(device.device_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold truncate">{device.device_name}</h3>
                  {device.is_current && (
                    <Badge variant="default" className="bg-green-500/20 text-green-400 whitespace-nowrap">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      当前设备
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    <span className="truncate">{device.os}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Chrome className="w-3 h-3" />
                    <span className="truncate">{device.browser}</span>
                  </div>
                  <div className="truncate">IP: {device.ip}</div>
                  {device.location && (
                    <div className="truncate">位置: {device.location}</div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  最后活动：{formatTime(device.last_active)}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLogout(device.id, device.is_current)}
              className="ml-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground whitespace-nowrap"
            >
              {device.is_current ? '退出登录' : '强制下线'}
            </Button>
          </div>
        ))
      )}

      <div className="mt-6 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <div className="flex gap-3">
          <div className="text-orange-400 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-orange-400 mb-1">安全提示</h4>
            <p className="text-xs text-orange-300/80">
              如果您发现有未知设备登录，请立即强制下线并修改密码。<br />
              为了账号安全，建议定期检查在线设备列表。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

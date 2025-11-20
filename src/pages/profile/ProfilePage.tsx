import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BasicInfo from './BasicInfo';
import SecuritySettings from './SecuritySettings';
import AccountBinding from './AccountBinding';
import OnlineDevices from './OnlineDevices';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">个人中心</h1>
        <p className="text-muted-foreground text-sm mt-1">管理您的个人信息和账户设置</p>
      </div>

      {/* 内容区域 */}
      <div className="grid grid-cols-12 gap-4 min-h-[calc(100vh-200px)]">
        {/* 左侧：基本信息卡片 */}
        <Card className="col-span-4 border-border bg-card h-fit">
          <BasicInfo />
        </Card>

        {/* 右侧：Tab内容 */}
        <Card className="col-span-8 border-border bg-card">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="security">安全设置</TabsTrigger>
                <TabsTrigger value="binding">第三方账号</TabsTrigger>
                <TabsTrigger value="devices">在线设备</TabsTrigger>
              </TabsList>

              <TabsContent value="security" className="mt-0">
                <SecuritySettings />
              </TabsContent>

              <TabsContent value="binding" className="mt-0">
                <AccountBinding />
              </TabsContent>

              <TabsContent value="devices" className="mt-0">
                <OnlineDevices />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

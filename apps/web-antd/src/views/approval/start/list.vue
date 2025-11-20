<script setup lang="ts">
import { ref, onMounted, onActivated, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getFlowList } from '#/api/approval';
import type { Flow } from '#/api/approval';

const router = useRouter();
const loading = ref(false);
const flows = ref<Flow[]>([]);
const searchText = ref('');

// 加载已发布的流程列表（禁用缓存）
const loadFlows = async (showMessage = false) => {
  loading.value = true;
  try {
    const { items } = await getFlowList({
      page: 1,
      size: 100,
      is_published: true, // 只显示已发布的流程
      is_active: true, // 只显示激活的流程
      _t: Date.now(), // 添加时间戳防止缓存
    });
    flows.value = items || [];
    filteredFlows.value = items || [];
    if (showMessage) {
      message.success('已刷新流程列表');
    }
  } catch (error) {
    message.error('加载流程列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索流程
const filteredFlows = ref<Flow[]>([]);
const handleSearch = () => {
  if (!searchText.value.trim()) {
    filteredFlows.value = flows.value;
    return;
  }
  
  const keyword = searchText.value.toLowerCase();
  filteredFlows.value = flows.value.filter(flow => 
    flow.name.toLowerCase().includes(keyword) ||
    flow.description?.toLowerCase().includes(keyword) ||
    flow.category?.toLowerCase().includes(keyword)
  );
};

// 发起流程
const handleStartFlow = (flow: Flow) => {
  router.push({
    name: 'approval:start',
    query: { flowId: flow.id },
  });
};

// 获取分类显示文本
const getCategoryText = (category: string | null | undefined) => {
  const map: Record<string, string> = {
    general: '通用',
    hr: '人事',
    finance: '财务',
    purchase: '采购',
    other: '其他',
  };
  return category ? map[category] || category : '未分类';
};

// 获取分类颜色
const getCategoryColor = (category: string | null | undefined) => {
  const map: Record<string, string> = {
    general: 'default',
    hr: 'blue',
    finance: 'green',
    purchase: 'orange',
    other: 'purple',
  };
  return category ? map[category] || 'default' : 'default';
};

// 页面可见性变化监听
let visibilityChangeHandler: (() => void) | null = null;

onMounted(async () => {
  await loadFlows();
  
  // 监听页面可见性变化，页面重新可见时刷新数据
  visibilityChangeHandler = () => {
    if (!document.hidden) {
      loadFlows();
    }
  };
  document.addEventListener('visibilitychange', visibilityChangeHandler);
});

// 组件激活时刷新（用于keep-alive缓存的组件）
onActivated(() => {
  loadFlows();
});

// 清理事件监听
onBeforeUnmount(() => {
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
  }
});
</script>

<template>
  <Page
    content-class="flex flex-col"
    title="发起申请"
    description="选择流程模板，发起新的审批申请"
  >
    <!-- 搜索栏 -->
    <div class="mb-6">
      <a-input-search
        v-model:value="searchText"
        placeholder="搜索流程名称、描述或分类..."
        size="large"
        allow-clear
        @search="handleSearch"
        @change="handleSearch"
      >
        <template #prefix>
          <Icon icon="ant-design:search-outlined" />
        </template>
      </a-input-search>
    </div>

    <!-- 流程统计 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        共 {{ filteredFlows.length }} 个可用流程
      </div>
      <a-button @click="loadFlows(true)">
        <template #icon>
          <Icon icon="ant-design:reload-outlined" />
        </template>
        刷新
      </a-button>
    </div>

    <!-- 流程卡片列表 -->
    <a-spin :spinning="loading">
      <div v-if="filteredFlows.length === 0" class="text-center py-16">
        <a-empty description="暂无可用流程">
          <template #image>
            <Icon icon="ant-design:file-search-outlined" class="text-6xl text-gray-300" />
          </template>
        </a-empty>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a-card
          v-for="flow in filteredFlows"
          :key="flow.id"
          hoverable
          class="cursor-pointer transition-all hover:shadow-lg"
          @click="handleStartFlow(flow)"
        >
          <!-- 卡片头部 -->
          <template #title>
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <Icon 
                    v-if="flow.icon" 
                    :icon="flow.icon" 
                    class="text-xl text-primary" 
                  />
                  <span class="font-semibold text-base">{{ flow.name }}</span>
                </div>
                <div class="text-xs text-gray-400 font-normal">
                  {{ flow.flow_no }}
                </div>
              </div>
              <a-tag :color="getCategoryColor(flow.category)" class="ml-2">
                {{ getCategoryText(flow.category) }}
              </a-tag>
            </div>
          </template>

          <!-- 卡片内容 -->
          <div class="space-y-3">
            <!-- 描述 -->
            <div class="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
              {{ flow.description || '暂无描述' }}
            </div>

            <!-- 底部信息 -->
            <div class="flex items-center justify-between pt-2 border-t">
              <div class="flex items-center gap-4 text-xs text-gray-400">
                <span class="flex items-center gap-1">
                  <Icon icon="ant-design:clock-circle-outlined" />
                  版本 v{{ flow.version }}
                </span>
              </div>
              <a-button type="primary" size="small" @click.stop="handleStartFlow(flow)">
                <template #icon>
                  <Icon icon="ant-design:plus-outlined" />
                </template>
                发起
              </a-button>
            </div>
          </div>
        </a-card>
      </div>
    </a-spin>
  </Page>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

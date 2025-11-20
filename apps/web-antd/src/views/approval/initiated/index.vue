<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getMyInitiated, cancelInstance, deleteInstance } from '#/api/approval';
import type { ApprovalInstance } from '#/api/approval';
import { formatDateTime, getUrgencyConfig, getInstanceStatusConfig } from '../utils/formatters';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const instances = ref<ApprovalInstance[]>([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 表格列配置
const columns = [
  {
    title: '实例编号',
    dataIndex: 'instance_no',
    key: 'instance_no',
    width: 200,
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '紧急程度',
    dataIndex: 'urgency',
    key: 'urgency',
    width: 100,
  },
  {
    title: '发起时间',
    dataIndex: 'started_at',
    key: 'started_at',
    width: 180,
  },
  {
    title: '完成时间',
    dataIndex: 'ended_at',
    key: 'ended_at',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 150,
  },
];

// 加载我发起的审批
const loadInstances = async () => {
  loading.value = true;
  try {
    const { items, total } = await getMyInitiated({
      page: pagination.value.current,
      size: pagination.value.pageSize,
    });
    instances.value = items || [];
    pagination.value.total = total || 0;
  } catch (error) {
    message.error('加载审批列表失败');
  } finally {
    loading.value = false;
  }
};

// 查看详情
const handleView = (instanceId: number) => {
  router.push({
    name: 'approval:detail',
    params: { instanceId },
  });
};

// 撤销审批（仅对审批中状态）
const handleCancel = (instance: ApprovalInstance) => {
  Modal.confirm({
    title: '确认撤销',
    content: `确定要撤销审批“${instance.title}”吗？所有待办任务将被取消，此操作不可恢复。`,
    okText: '确定撤销',
    okType: 'warning',
    cancelText: '取消',
    onOk: async () => {
      try {
        await cancelInstance(instance.id);
        message.success('审批已撤销');
        // 通过路由参数触发刷新
        router.push({ name: 'approval:initiated', query: { refresh: Date.now().toString() } });
      } catch (error: any) {
        message.error(error.message || '撤销失败');
      }
    },
  });
};

// 删除审批记录（仅对非审批中状态）
const handleDelete = (instance: ApprovalInstance) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除这条审批记录吗？

实例编号：${instance.instance_no}
标题：${instance.title}

此操作不可恢复！`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteInstance(instance.id);
        message.success('审批记录已删除');
        // 通过路由参数触发刷新
        router.push({ name: 'approval:initiated', query: { refresh: Date.now().toString() } });
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
};

// 分页变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadInstances();
};

onMounted(() => {
  loadInstances();
});

// 监听路由查询参数变化，支持刷新
watch(
  () => route.query.refresh,
  (newVal) => {
    if (newVal) {
      console.log('[InitiatedList] 检测到刷新标志，重新加载');
      loadInstances();
      // 清除刷新参数
      router.replace({ name: 'approval:initiated', query: {} });
    }
  },
  { immediate: false }
);
</script>

<template>
  <Page
    content-class="flex flex-col"
    description="我发起的审批申请"
    title="我发起的"
  >
    <a-table
      :columns="columns"
      :data-source="instances"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: any) => record.id"
      @change="handleTableChange"
    >
      <!-- 实例编号列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'instance_no'">
          <span class="font-mono">{{ record.instance_no }}</span>
        </template>

        <!-- 状态列 -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="getInstanceStatusConfig(record.status).color">
            {{ getInstanceStatusConfig(record.status).text }}
          </a-tag>
        </template>

        <!-- 紧急程度列 -->
        <template v-else-if="column.key === 'urgency'">
          <a-tag :color="getUrgencyConfig(record.urgency).color">
            {{ getUrgencyConfig(record.urgency).text }}
          </a-tag>
        </template>

        <!-- 发起时间列 -->
        <template v-else-if="column.key === 'started_at'">
          {{ formatDateTime(record.started_at) }}
        </template>

        <!-- 完成时间列 -->
        <template v-else-if="column.key === 'ended_at'">
          {{ record.ended_at ? formatDateTime(record.ended_at) : '-' }}
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.key === 'action'">
          <a-space>
            <!-- 查看按钮 -->
            <a-tooltip title="查看详情">
              <a-button
                size="small"
                type="text"
                @click="handleView(record.id)"
              >
                <template #icon>
                  <Icon icon="ant-design:eye-outlined" class="text-blue-500" />
                </template>
              </a-button>
            </a-tooltip>
            
            <!-- 撤销按钮（仅对审批中状态） -->
            <a-tooltip v-if="record.status === 'PENDING'" title="撤销审批">
              <a-button
                size="small"
                type="text"
                @click="handleCancel(record)"
              >
                <template #icon>
                  <Icon icon="ant-design:rollback-outlined" class="text-orange-500" />
                </template>
              </a-button>
            </a-tooltip>
            
            <!-- 删除按钮（仅对非审批中状态） -->
            <a-tooltip v-if="record.status !== 'PENDING'" title="删除记录">
              <a-button
                size="small"
                type="text"
                danger
                @click="handleDelete(record)"
              >
                <template #icon>
                  <Icon icon="ant-design:delete-outlined" class="text-red-500" />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </a-table>
  </Page>
</template>

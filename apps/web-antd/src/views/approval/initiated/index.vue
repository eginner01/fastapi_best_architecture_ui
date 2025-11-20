<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getMyInitiated, cancelInstance } from '#/api/approval';
import type { ApprovalInstance } from '#/api/approval';
import { formatDateTime, getUrgencyConfig, getInstanceStatusConfig } from '../utils/formatters';

const router = useRouter();
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

// 撤回审批
const handleCancel = (instance: ApprovalInstance) => {
  Modal.confirm({
    title: '确认撤回',
    content: `确定要撤回审批"${instance.title}"吗？此操作不可恢复。`,
    okText: '确定撤回',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await cancelInstance(instance.id);
        message.success('审批已撤回');
        loadInstances();
      } catch (error: any) {
        message.error(error.message || '撤回失败');
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
            <a-button
              size="small"
              type="link"
              @click="handleView(record.id)"
            >
              <template #icon>
                <Icon icon="ant-design:eye-outlined" />
              </template>
              查看
            </a-button>
            <a-button
              v-if="record.status === 'PENDING'"
              size="small"
              type="link"
              danger
              @click="handleCancel(record)"
            >
              <template #icon>
                <Icon icon="ant-design:close-circle-outlined" />
              </template>
              撤回
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </Page>
</template>

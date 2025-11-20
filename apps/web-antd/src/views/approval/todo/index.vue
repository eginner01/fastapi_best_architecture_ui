<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getMyTodo, type TodoTask } from '#/api/approval';
import { formatDateTime, getElapsedTime, getUrgencyConfig } from '../utils/formatters';

const router = useRouter();
const loading = ref(false);
const tasks = ref<TodoTask[]>([]);
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
    customCell: () => {
      return {
        style: {
          fontFamily: 'monospace',
        },
      };
    },
  },
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: '申请人',
    dataIndex: 'applicant_name',
    key: 'applicant_name',
    width: 120,
  },
  {
    title: '紧急程度',
    dataIndex: 'urgency',
    key: 'urgency',
    width: 100,
  },
  {
    title: '开始时间',
    dataIndex: 'started_at',
    key: 'started_at',
    width: 180,
  },
  {
    title: '待办时长',
    dataIndex: 'elapsed',
    key: 'elapsed',
    width: 120,
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 100,
  },
];

// 加载待办任务
const loadTasks = async () => {
  loading.value = true;
  try {
    const { items, total } = await getMyTodo({
      page: pagination.value.current,
      size: pagination.value.pageSize,
    });
    tasks.value = items || [];
    pagination.value.total = total || 0;
  } catch (error) {
    message.error('加载待办任务失败');
  } finally {
    loading.value = false;
  }
};

// 处理审批
const handleProcess = (stepId: number, instanceId: number) => {
  router.push({
    name: 'approval:process',
    params: { stepId },
    query: { instance: instanceId },
  });
};

// 分页变化
const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  loadTasks();
};

onMounted(() => {
  loadTasks();
});
</script>

<template>
  <Page
    content-class="flex flex-col"
    description="我的待办审批任务"
    title="我的待办"
  >
    <a-table
      :columns="columns"
      :data-source="tasks"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: any) => record.step_id"
      @change="handleTableChange"
    >
      <!-- 紧急程度列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'urgency'">
          <a-tag :color="getUrgencyConfig(record.urgency).color">
            {{ getUrgencyConfig(record.urgency).text }}
          </a-tag>
        </template>

        <!-- 开始时间列 -->
        <template v-else-if="column.key === 'started_at'">
          {{ formatDateTime(record.started_at) }}
        </template>

        <!-- 待办时长列 -->
        <template v-else-if="column.key === 'elapsed'">
          {{ getElapsedTime(record.started_at) }}
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.key === 'action'">
          <a-button
            size="small"
            type="primary"
            @click="handleProcess(record.step_id, record.instance_id)"
          >
            处理
          </a-button>
        </template>
      </template>
    </a-table>
  </Page>
</template>

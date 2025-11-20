<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getFlowList, deleteFlow, publishFlow, unpublishFlow } from '#/api/approval';
import type { Flow } from '#/api/approval';

const router = useRouter();
const loading = ref(false);
const flows = ref<Flow[]>([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 搜索条件
const searchForm = ref({
  name: '',
  category: undefined as string | undefined,
  is_published: undefined as boolean | undefined,
});

// 表格列配置
const columns = [
  {
    title: '流程编号',
    dataIndex: 'flow_no',
    key: 'flow_no',
    width: 150,
  },
  {
    title: '流程名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '分类',
    dataIndex: 'category',
    key: 'category',
    width: 100,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '版本',
    dataIndex: 'version',
    key: 'version',
    width: 80,
  },
  {
    title: '创建时间',
    dataIndex: 'created_time',
    key: 'created_time',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 280,
  },
];

// 加载流程列表
const loadFlows = async () => {
  loading.value = true;
  try {
    const { items, total } = await getFlowList({
      page: pagination.value.current,
      size: pagination.value.pageSize,
      name: searchForm.value.name || undefined,
      category: searchForm.value.category,
      is_published: searchForm.value.is_published,
    });
    flows.value = items || [];
    pagination.value.total = total || 0;
  } catch (error) {
    message.error('加载流程列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.value.current = 1;
  loadFlows();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    name: '',
    category: undefined,
    is_published: undefined,
  };
  pagination.value.current = 1;
  loadFlows();
};

// 获取流程状态
const getFlowStatus = (flow: Flow) => {
  if (!flow.is_active) {
    return { color: 'error', text: '已禁用' };
  }
  if (flow.is_published) {
    return { color: 'success', text: '已发布' };
  }
  return { color: 'default', text: '草稿' };
};

// 创建流程
const handleCreate = () => {
  router.push({ name: 'approval:flow:design' });
};

// 编辑流程
const handleEdit = (flowId: number) => {
  router.push({
    name: 'approval:flow:design',
    params: { flowId },
  });
};

// 查看详情
const handleView = (flowId: number) => {
  router.push({
    name: 'approval:flow:detail',
    params: { flowId },
  });
};

// 发布流程
const handlePublish = async (flow: Flow) => {
  try {
    await publishFlow(flow.id);
    message.success('流程已发布');
    loadFlows();
  } catch (error: any) {
    message.error(error.message || '发布失败');
  }
};

// 取消发布
const handleUnpublish = async (flow: Flow) => {
  try {
    await unpublishFlow(flow.id);
    message.success('已取消发布');
    loadFlows();
  } catch (error: any) {
    message.error(error.message || '操作失败');
  }
};

// 删除流程
const handleDelete = (flow: Flow) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除流程"${flow.name}"吗？此操作不可恢复。`,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteFlow(flow.id);
        message.success('流程已删除');
        loadFlows();
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
  loadFlows();
};

onMounted(() => {
  loadFlows();
});
</script>

<template>
  <Page
    content-class="flex flex-col"
    description="创建和管理审批流程模板"
    title="流程管理"
  >
    <!-- 搜索栏 -->
    <a-card class="mb-4" :bordered="false">
      <a-form layout="inline" :model="searchForm">
        <a-form-item label="流程名称">
          <a-input
            v-model:value="searchForm.name"
            placeholder="请输入流程名称"
            style="width: 200px"
            allow-clear
            @press-enter="handleSearch"
          />
        </a-form-item>
        <a-form-item label="流程分类">
          <a-select
            v-model:value="searchForm.category"
            placeholder="请选择分类"
            style="width: 150px"
            allow-clear
          >
            <a-select-option value="general">通用</a-select-option>
            <a-select-option value="hr">人事</a-select-option>
            <a-select-option value="finance">财务</a-select-option>
            <a-select-option value="purchase">采购</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="发布状态">
          <a-select
            v-model:value="searchForm.is_published"
            placeholder="全部"
            style="width: 120px"
            allow-clear
          >
            <a-select-option :value="true">已发布</a-select-option>
            <a-select-option :value="false">草稿</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <template #icon>
                <Icon icon="ant-design:search-outlined" />
              </template>
              搜索
            </a-button>
            <a-button @click="handleReset">
              <template #icon>
                <Icon icon="ant-design:reload-outlined" />
              </template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between mb-4">
      <div class="text-sm text-gray-500">
        共 {{ pagination.total }} 条流程
      </div>
      <a-button type="primary" @click="handleCreate">
        <template #icon>
          <Icon icon="ant-design:plus-outlined" />
        </template>
        创建流程
      </a-button>
    </div>

    <!-- 流程列表 -->
    <a-table
      :columns="columns"
      :data-source="flows"
      :loading="loading"
      :pagination="pagination"
      :row-key="(record: any) => record.id"
      @change="handleTableChange"
    >
      <!-- 状态列 -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getFlowStatus(record).color">
            {{ getFlowStatus(record).text }}
          </a-tag>
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.key === 'action'">
          <a-space>
            <a-tooltip title="查看详情">
              <a-button
                size="small"
                type="text"
                @click="handleView(record.id)"
              >
                <template #icon>
                  <Icon icon="ant-design:eye-outlined" />
                </template>
              </a-button>
            </a-tooltip>
            
            <!-- 只有草稿状态才能编辑 -->
            <a-tooltip v-if="!record.is_published" title="编辑">
              <a-button
                size="small"
                type="text"
                @click="handleEdit(record.id)"
              >
                <template #icon>
                  <Icon icon="ant-design:edit-outlined" />
                </template>
              </a-button>
            </a-tooltip>
            
            <!-- 草稿状态可以发布 -->
            <a-tooltip v-if="!record.is_published && record.is_active" title="发布流程">
              <a-button
                size="small"
                type="text"
                @click="handlePublish(record)"
              >
                <template #icon>
                  <Icon icon="ant-design:cloud-upload-outlined" class="text-green-500" />
                </template>
              </a-button>
            </a-tooltip>
            
            <!-- 已发布状态可以取消发布 -->
            <a-tooltip v-if="record.is_published" title="取消发布">
              <a-button
                size="small"
                type="text"
                @click="handleUnpublish(record)"
              >
                <template #icon>
                  <Icon icon="ant-design:cloud-download-outlined" class="text-orange-500" />
                </template>
              </a-button>
            </a-tooltip>
            
            <!-- 只有草稿状态才能删除 -->
            <a-tooltip v-if="!record.is_published" title="删除">
              <a-button
                size="small"
                type="text"
                danger
                @click="handleDelete(record)"
              >
                <template #icon>
                  <Icon icon="ant-design:delete-outlined" />
                </template>
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </template>
    </a-table>
  </Page>
</template>

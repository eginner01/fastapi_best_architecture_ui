<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getFlow } from '#/api/approval';
import type { FlowDetail } from '#/api/approval';
import { getFlowStatusConfig, getNodeTypeConfig } from '../utils/formatters';

const router = useRouter();
const route = useRoute();
const flowId = ref(Number(route.params.flowId));

const loading = ref(false);
const flow = ref<FlowDetail | null>(null);

// 加载流程详情
const loadFlow = async () => {
  loading.value = true;
  try {
    flow.value = await getFlow(flowId.value);
  } catch (error) {
    message.error('加载流程详情失败');
  } finally {
    loading.value = false;
  }
};

// 获取分配人类型文本
const getAssigneeTypeText = (type: string) => {
  const map: Record<string, string> = {
    DEPT: '部门',
    ROLE: '角色',
    USER: '用户',
  };
  return map[type] || type;
};

onMounted(() => {
  loadFlow();
});
</script>

<template>
  <Page content-class="flex flex-col" title="流程详情">
    <!-- 返回按钮 -->
    <div class="mb-4">
      <a-button @click="router.push({ name: 'approval:flow:manage' })">
        <template #icon>
          <Icon icon="ant-design:arrow-left-outlined" />
        </template>
        返回列表
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <div class="space-y-4">
        <!-- 基本信息 -->
        <a-card title="基本信息">
          <a-descriptions bordered :column="2">
            <a-descriptions-item label="流程名称">
              {{ flow?.name }}
            </a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag v-if="flow?.status" :color="getFlowStatusConfig(flow.status).color">
                {{ getFlowStatusConfig(flow.status).text }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="描述" :span="2">
              {{ flow?.description || '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="版本">
              v{{ flow?.version }}
            </a-descriptions-item>
            <a-descriptions-item label="业务类型">
              {{ flow?.business_type || '-' }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <!-- 流程节点 -->
        <a-card title="流程节点">
          <a-table
            :data-source="flow?.nodes || []"
            :pagination="false"
            :row-key="(record: any) => record.id"
          >
            <a-table-column key="name" title="节点名称" data-index="name" />
            <a-table-column key="node_type" title="节点类型" data-index="node_type">
              <template #default="{ record }">
                <a-tag :color="getNodeTypeConfig(record.node_type).color">
                  <Icon :icon="getNodeTypeConfig(record.node_type).icon" class="mr-1" />
                  {{ getNodeTypeConfig(record.node_type).text }}
                </a-tag>
              </template>
            </a-table-column>
            <a-table-column key="assignee_type" title="分配方式" data-index="assignee_type">
              <template #default="{ record }">
                {{ getAssigneeTypeText(record.assignee_type) }}
              </template>
            </a-table-column>
            <a-table-column key="assignee_names" title="审批人" data-index="assignee_names">
              <template #default="{ record }">
                <a-tag v-for="(name, index) in record.assignee_names" :key="index" class="mb-1">
                  {{ name }}
                </a-tag>
                <span v-if="!record.assignee_names || record.assignee_names.length === 0" class="text-gray-400">
                  -
                </span>
              </template>
            </a-table-column>
          </a-table>
        </a-card>

        <!-- 流程连线 -->
        <a-card v-if="flow?.lines && flow.lines.length > 0" title="流程连线">
          <a-table
            :data-source="flow.lines"
            :pagination="false"
            :row-key="(record: any) => record.id"
          >
            <a-table-column key="source" title="源节点" data-index="source_node_id">
              <template #default="{ record }">
                {{ flow?.nodes?.find((n) => n.id === record.source_node_id)?.name || '-' }}
              </template>
            </a-table-column>
            <a-table-column key="target" title="目标节点" data-index="target_node_id">
              <template #default="{ record }">
                {{ flow?.nodes?.find((n) => n.id === record.target_node_id)?.name || '-' }}
              </template>
            </a-table-column>
            <a-table-column key="condition" title="条件" data-index="condition">
              <template #default="{ record }">
                {{ record.condition || '无条件' }}
              </template>
            </a-table-column>
            <a-table-column key="priority" title="优先级" data-index="priority" />
          </a-table>
        </a-card>
      </div>
    </a-spin>
  </Page>
</template>

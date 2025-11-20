<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import { Icon } from '@iconify/vue';
import { getFlowList, createInstance } from '#/api/approval';
import type { Flow } from '#/api/approval';

const router = useRouter();
const route = useRoute();
const selectedFlowId = ref<number | null>(null);

const loading = ref(false);
const submitting = ref(false);
const flows = ref<Flow[]>([]);
const formData = ref<Record<string, any>>({});

// 从URL参数获取流程ID
onMounted(async () => {
  const flowId = route.query.flowId;
  if (flowId) {
    selectedFlowId.value = Number(flowId);
  }
  await loadFlows();
});

// 加载可用流程列表
const loadFlows = async () => {
  loading.value = true;
  try {
    const { items } = await getFlowList({
      page: 1,
      size: 100,
      is_published: true, // 只显示已发布的流程
      is_active: true, // 只显示激活的流程
    });
    flows.value = items || [];
  } catch (error) {
    message.error('加载流程列表失败');
  } finally {
    loading.value = false;
  }
};

// 当前选中的流程
const selectedFlow = computed(() => {
  return flows.value.find((f) => f.id === selectedFlowId.value);
});

// 表单字段（从流程的form_schema中获取）
const formFields = computed(() => {
  if (!selectedFlow.value?.form_schema) {
    return [];
  }
  // 这里假设form_schema是一个字段数组
  return selectedFlow.value.form_schema.fields || [];
});

// 发起审批
const handleSubmit = async () => {
  if (!selectedFlowId.value) {
    message.warning('请选择流程');
    return;
  }

  submitting.value = true;
  try {
    await createInstance({
      flow_id: selectedFlowId.value,
      title: formData.value.title || '审批申请',
      urgency: formData.value.urgency || 'NORMAL',
      form_data: formData.value,
    });

    message.success('审批已发起');
    router.push({ name: 'approval:initiated', query: { refresh: Date.now().toString() } });
  } catch (error: any) {
    message.error(error.message || '发起失败');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Page content-class="flex flex-col" title="发起审批" description="选择流程并填写表单发起审批">
    <!-- 返回按钮 -->
    <div class="mb-4">
      <a-button @click="router.back()">
        <template #icon>
          <Icon icon="ant-design:arrow-left-outlined" />
        </template>
        返回
      </a-button>
    </div>

    <a-spin :spinning="loading">
      <div class="max-w-4xl space-y-4">
        <!-- 选择流程 -->
        <a-card title="选择流程">
          <a-form-item label="审批流程" required>
            <a-select
              v-model:value="selectedFlowId"
              placeholder="请选择审批流程"
              size="large"
              :disabled="!!route.query.flowId"
            >
              <a-select-option v-for="flow in flows" :key="flow.id" :value="flow.id">
                <div class="flex items-center justify-between">
                  <span>{{ flow.name }}</span>
                  <span class="text-gray-400 text-xs">v{{ flow.version }}</span>
                </div>
              </a-select-option>
            </a-select>
          </a-form-item>
          <div v-if="selectedFlow" class="text-sm text-gray-500 mt-2">
            {{ selectedFlow.description }}
          </div>
        </a-card>

        <!-- 填写表单 -->
        <a-card v-if="selectedFlow" title="填写表单">
          <a-form :model="formData" layout="vertical">
            <!-- 标题 -->
            <a-form-item label="审批标题" required>
              <a-input
                v-model:value="formData.title"
                placeholder="请输入审批标题"
                size="large"
              />
            </a-form-item>

            <!-- 紧急程度 -->
            <a-form-item label="紧急程度">
              <a-radio-group v-model:value="formData.urgency">
                <a-radio value="LOW">低</a-radio>
                <a-radio value="NORMAL">普通</a-radio>
                <a-radio value="HIGH">高</a-radio>
                <a-radio value="URGENT">紧急</a-radio>
              </a-radio-group>
            </a-form-item>

            <!-- 申请描述 -->
            <a-form-item label="申请描述">
              <a-textarea
                v-model:value="formData.description"
                :rows="6"
                placeholder="请详细描述您的申请内容..."
              />
            </a-form-item>

            <!-- 动态表单字段（如果流程定义了form_schema） -->
            <template v-if="formFields.length > 0">
              <a-divider>其他信息</a-divider>
              <div v-for="field in formFields" :key="field.key">
                <!-- 文本输入 -->
                <a-form-item v-if="field.type === 'text'" :label="field.label" :required="field.required">
                  <a-input
                    v-model:value="formData[field.key]"
                    :placeholder="field.placeholder"
                  />
                </a-form-item>

                <!-- 数字输入 -->
                <a-form-item v-else-if="field.type === 'number'" :label="field.label" :required="field.required">
                  <a-input-number
                    v-model:value="formData[field.key]"
                    :placeholder="field.placeholder"
                    class="w-full"
                  />
                </a-form-item>

                <!-- 日期选择 -->
                <a-form-item v-else-if="field.type === 'date'" :label="field.label" :required="field.required">
                  <a-date-picker
                    v-model:value="formData[field.key]"
                    class="w-full"
                  />
                </a-form-item>

                <!-- 下拉选择 -->
                <a-form-item v-else-if="field.type === 'select'" :label="field.label" :required="field.required">
                  <a-select
                    v-model:value="formData[field.key]"
                    :placeholder="field.placeholder"
                  >
                    <a-select-option
                      v-for="option in field.options"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </div>
            </template>
          </a-form>
        </a-card>

        <!-- 提交按钮 -->
        <div v-if="selectedFlow" class="flex items-center justify-center gap-4">
          <a-button size="large" @click="router.back()">
            取消
          </a-button>
          <a-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="handleSubmit"
          >
            <template #icon>
              <Icon icon="ant-design:check-outlined" />
            </template>
            提交审批
          </a-button>
        </div>
      </div>
    </a-spin>
  </Page>
</template>

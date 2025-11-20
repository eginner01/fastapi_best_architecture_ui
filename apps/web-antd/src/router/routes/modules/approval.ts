/**
 * 审批流路由配置
 */

import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:file-text-outlined',
      order: 50,
      title: $t('page.menu.approval'),
    },
    name: 'approval',
    path: '/approval',
    children: [
      {
        name: 'approval:flow:manage',
        path: '/approval/flow-manage',
        component: () => import('#/views/approval/flow/index.vue'),
        meta: {
          icon: 'ant-design:setting-outlined',
          title: $t('page.menu.approvalFlowManage'),
        },
      },
      {
        name: 'approval:flow:design',
        path: '/approval/flow-design/:flowId?',
        component: () => import('#/views/approval/flow/design-v2.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.menu.approvalFlowDesign'),
        },
      },
      {
        name: 'approval:flow:detail',
        path: '/approval/flow-detail/:flowId',
        component: () => import('#/views/approval/flow/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.menu.approvalFlowDetail'),
        },
      },
      {
        name: 'approval:start:list',
        path: '/approval/start-list',
        component: () => import('#/views/approval/start/list.vue'),
        meta: {
          icon: 'ant-design:plus-circle-outlined',
          title: $t('page.menu.approvalStartList'),
        },
      },
      {
        name: 'approval:start',
        path: '/approval/start',
        component: () => import('#/views/approval/start/index.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.menu.approvalStart'),
        },
      },
      {
        name: 'approval:todo',
        path: '/approval/todo',
        component: () => import('#/views/approval/todo/index.vue'),
        meta: {
          icon: 'ant-design:inbox-outlined',
          title: $t('page.menu.approvalTodo'),
        },
      },
      {
        name: 'approval:process',
        path: '/approval/process/:stepId',
        component: () => import('#/views/approval/todo/process.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.menu.approvalProcess'),
        },
      },
      {
        name: 'approval:initiated',
        path: '/approval/initiated',
        component: () => import('#/views/approval/initiated/index.vue'),
        meta: {
          icon: 'ant-design:send-outlined',
          title: $t('page.menu.approvalInitiated'),
        },
      },
      {
        name: 'approval:detail',
        path: '/approval/detail/:instanceId',
        component: () => import('#/views/approval/initiated/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.menu.approvalDetail'),
        },
      },
    ],
  },
];

export default routes;

<template>
  <a-layout id="app" style="min-height: 100vh">
    <!-- 左侧菜单 -->
    <a-layout-sider
      :collapsed="collapsed"
      collapsible
      @collapse="onCollapse"
      width="256"
    >
      <div class="logo" style="height: 32px; margin: 16px; background: rgba(255, 255, 255, 0.3);">
        <h3 style="color: white; text-align: center; line-height: 32px;" v-if="!collapsed">
          管理系统
        </h3>
        <h3 style="color: white; text-align: center; line-height: 32px;" v-else>
          管理
        </h3>
      </div>
      
      <a-menu
        :default-selected-keys="['/tableManage']"
        mode="inline"
        theme="dark"
        :inline-collapsed="collapsed"
        @click="handleMenuClick"
      >
        <a-menu-item key="/tableManage">
          <a-icon type="table" />
          <span>表与关联关系管理</span>
        </a-menu-item>
        <a-menu-item key="/crossTableUpdate">
          <a-icon type="search" />
          <span>跨表关键词定位与数据更新</span>
        </a-menu-item>
        <a-menu-item key="/resultExport">
          <a-icon type="export" />
          <span>更新结果显示与导出</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <!-- 右侧内容区域 -->
    <a-layout>
      <!-- 顶部头部 -->
      <a-layout-header style="background: #fff; padding: 0 16px; display: flex; align-items: center;">
        <a-button type="primary" @click="toggleCollapsed" style="font-size: 16px;">
          <a-icon :type="collapsed ? 'menu-unfold' : 'menu-fold'" />
        </a-button>
      </a-layout-header>

      <!-- 主要内容区域 -->
      <a-layout-content style="margin: 16px; overflow: auto">
        <div style="padding: 24px; background: #fff; min-height: 360px;">
          <router-view></router-view>
        </div>
      </a-layout-content>

    </a-layout>
  </a-layout>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      collapsed: false,
    };
  },
  methods: {
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
    },
    onCollapse(collapsed) {
      this.collapsed = collapsed;
    },
    handleMenuClick({ key }) {
      if (this.$route.path !== key) {
        this.$router.push(key);
      }
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

/* 确保布局充满整个屏幕 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

/* 菜单样式优化 */
.ant-layout-sider-dark {
  background: #001529;
}

/* 内容区域滚动 */
.ant-layout-content {
  overflow: auto;
}
</style>
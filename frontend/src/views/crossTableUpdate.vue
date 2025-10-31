<template>
  <div>
    <a-page-header title="跨表关键词定位与数据更新" sub-title="通过关键字/条件批量修改多表数据" />
    
    <a-form layout="inline" @submit.prevent>
      <a-form-item label="更新条件">
        <a-input v-model="updateCondition" placeholder="如 Tab1.科室='内科' AND Tab2.主治医生='陈医生'" style="width: 480px" />
      </a-form-item>
      <a-form-item label="目标字段">
        <a-select v-model="targetField" :options="fieldOptions" show-search style="width: 220px" allow-clear />
      </a-form-item>
      <a-form-item label="新值">
        <a-input v-model="newValue" placeholder="请输入新的字段值" style="width: 150px" />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="handlePreview">预览命中</a-button>
      </a-form-item>
      <a-form-item>
        <a-button type="danger" :disabled="!canUpdate" @click="handleUpdate">批量更新</a-button>
      </a-form-item>
    </a-form>

    <div v-if="previewCount !== null" class="mt-2 mb-2">
      <a-alert :message="`符合条件的待更新记录共有：${previewCount} 条`" type="info" show-icon />
    </div>

    <a-table 
      v-if="previewRows.length"
      :columns="previewColumns"
      :dataSource="previewRows"
      rowKey="id"
      bordered
      pagination="false"
      size="small"
      class="mb-3"
    />

    <a-divider>历史操作记录</a-divider>
    <a-table
      :columns="logColumns"
      :dataSource="updateLogs"
      rowKey="logId"
      size="small"
      bordered
      :pagination="false"
      style="margin-bottom: 20px"
    />
  </div>
</template>

<script>
import { crossTablePreview, crossTableBatchUpdate, getUpdateLogs } from '@/api/tables'
export default {
  data() {
    return {
      updateCondition: '',
      targetField: '',
      newValue: '',
      fieldOptions: [],
      previewColumns: [],
      previewRows: [],
      previewCount: null,
      canUpdate: false,
      updateLogs: [],
      logColumns: [
        { title: '时间', dataIndex: 'time', width: 170 },
        { title: '操作者', dataIndex: 'operator', width: 90 },
        { title: '条件', dataIndex: 'condition' },
        { title: '目标字段', dataIndex: 'field', width: 120 },
        { title: '新值', dataIndex: 'new_value', width: 120 },
        { title: '更新前的值', dataIndex: 'old_values', width: 170,
          customRender: (text) => {
            if (!text) return '-';
            let arr = [];
            try {
              arr = JSON.parse(text);
            } catch { arr = []; }
            return arr.map(item => `id:${item.id}, ${item.value}`).join('; ');
          },
        },
        { title: '更新条数', dataIndex: 'count', width: 90 },
        { title: '结果', dataIndex: 'result', width: 70 },
      ]
    }
  },
  methods: {
    async handlePreview() {
      this.updateCondition = this.updateCondition.replace(/[．｡。·•●]/g, '.');
      if (!this.updateCondition) return this.$message.warning('请填写更新条件')
      this.previewRows = []
      this.previewColumns = []
      this.previewCount = null
      this.fieldOptions = []
      try {
        const res = await crossTablePreview(this.updateCondition)
        this.previewRows = res.data.preview || []
        this.previewCount = res.data.count || 0
        // 列
        this.previewColumns = (res.data.fields || []).map(f => ({
          title: f,
          dataIndex: f
        }))
        // 字段下拉选
        this.fieldOptions = (res.data.fields || []).map(f => ({ label: f, value: f }))
        this.canUpdate = !!(this.previewCount > 0 && this.targetField && this.newValue)
      } catch (e) {
        this.$message.error((e.response && e.response.data && e.response.data.message) || '命中预览失败')
        this.previewCount = 0
        this.previewRows = []
        this.fieldOptions = []
        this.canUpdate = false
      }
    },
    async handleUpdate() {
      this.updateCondition = this.updateCondition.replace(/[．｡。·•●]/g, '.');
      if (!this.canUpdate) return
      try {
        const tableMatch = this.updateCondition.match(/([\w\u4e00-\u9fa5]+)\.[\w\u4e00-\u9fa5]+\s*=/)
        const table = tableMatch ? tableMatch[1] : ''
        if (!table) return this.$message.error('解析主表名失败')
        const params = {
          condition: this.updateCondition,
          table,
          field: this.targetField,
          value: this.newValue,
          operator: '管理员'
        }
        const res = await crossTableBatchUpdate(params)
        this.$message.success(res.data.message || '批量更新成功')
        // 自动刷新历史日志
        this.fetchLogs()
        this.handlePreview()
      } catch (e) {
        this.$message.error((e.response && e.response.data && e.response.data.message) || '批量更新失败')
      }
    },
    async fetchLogs() {
      try {
        const res = await getUpdateLogs()
        // id 字段做为 rowKey
        this.updateLogs = res.data.map(item => ({ ...item, logId: item.id }))
      } catch (e) {
        this.$message.error('历史操作记录加载失败')
      }
    }
  },
  mounted() {
    this.fetchLogs()
  },
  watch: {
    targetField() {
      this.canUpdate = !!(this.previewCount > 0 && this.targetField && this.newValue)
    },
    newValue() {
      this.canUpdate = !!(this.previewCount > 0 && this.targetField && this.newValue)
    }
  }
}
</script>

<style scoped>
.mb-2 { margin-bottom: 16px; }
.mb-3 { margin-bottom: 24px; }
.mt-2 { margin-top: 16px; }
</style>

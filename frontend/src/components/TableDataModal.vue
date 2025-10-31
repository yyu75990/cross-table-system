<template>
  <a-modal v-model="visible" :title="`管理数据：${tableName}`" width="80%" @ok="handleOk">
    <div class="mb-2 flex justify-between">
      <a-button type="primary" @click="showAddModal">新增记录</a-button>
    </div>

    <a-table
      :columns="columns"
      :dataSource="rows"
      :rowKey="rowKeyFn"
      bordered
      size="small"
    >
      <template slot="actions" slot-scope="text, record">
        <a @click="editRow(record)">编辑</a> |
        <a-popconfirm title="确定删除该条记录吗？" @confirm="removeRow(record)">
          <a style="color:red">删除</a>
        </a-popconfirm>
      </template>
    </a-table>

    <a-modal v-model="editVisible" :title="isEdit ? '编辑记录' : '新增记录'" @ok="saveRow">
      <a-form :model="editData">
        <a-form-item v-for="(v, k) in editData" :key="k" :label="k">
          <a-input v-model="editData[k]" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script>
import { getTableData, insertData, updateData, deleteData, getTableStructure } from '@/api/tables'

export default {
  data() {
    return {
      visible: false,
      tableName: '',
      rows: [],
      columns: [],
      editVisible: false,
      editData: {},
      isEdit: false,
      pkName: 'id',
      pkAuto: false,
    }
  },
  methods: {
    async open(tableName) {
      this.tableName = tableName
      this.visible = true
      await this.loadData()
    },
    async loadData() {
      const [structureRes, dataRes] = await Promise.all([
        getTableStructure(this.tableName),
        getTableData(this.tableName),
      ])
      const fields = structureRes.data || []
      const pkField = (fields.find(f => f.Key === 'PRI') || {})
      const pk = pkField.Field || 'id'
      const pkAuto = /auto_increment/i.test(pkField.Extra || '')
      this.pkName = pk
      this.pkAuto = pkAuto
      this.columns = fields.map(f => ({
        title: f.Field,
        dataIndex: f.Field,
      }))
      this.columns.push({ title: '操作', key: 'actions', scopedSlots: { customRender: 'actions' } })
      this.rows = dataRes.data
    },
    rowKeyFn(record) {
      return record[this.pkName] != null ? record[this.pkName] : record.id
    },
    showAddModal() {
      this.isEdit = false
      // 基于列（结构）自动生成可编辑新对象：主键若是自增则排除，否则包含
      const keys = this.columns
        .filter(c => c.dataIndex && c.dataIndex !== '操作')
        .map(c => c.dataIndex)
        .filter(k => this.pkAuto ? (k !== this.pkName) : true)
      const nextData = {}
      keys.forEach(k => { nextData[k] = '' })
      this.editData = nextData
      this.editVisible = true
    },
    handleOk() {
      this.visible = false
    },
    editRow(record) {
      this.isEdit = true
      this.editData = { ...record }
      this.editVisible = true
    },
    async saveRow() {
      try {
        if (this.isEdit) {
          const pkVal = this.editData[this.pkName]
          await updateData(this.tableName, this.pkName, pkVal, this.editData)
          this.$message.success('更新成功')
        } else {
          await insertData(this.tableName, this.editData)
          this.$message.success('新增成功')
        }
        this.editVisible = false
        await this.loadData()
      } catch(e) {
        const msg = (e && e.response && e.response.data && (e.response.data.error || e.response.data.message)) || '请求失败'
        this.$message.error('新增或更新失败：' + msg)
      }
    },
    async removeRow(record) {
      const pkVal = record[this.pkName]
      await deleteData(this.tableName, pkVal)
      this.$message.success('删除成功')
      await this.loadData()
    },
  },
}
</script>

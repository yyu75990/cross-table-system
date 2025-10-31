<template>
  <a-modal v-model="visible" title="设置表间关联" @ok="handleOk">
    <a-form :model="form">
      <a-form-item label="当前表（子表）">
        <a-input v-model="form.tableA" disabled />
      </a-form-item>

      <a-form-item label="字段（子表外键）">
        <a-input v-model="form.fieldA" placeholder="请输入字段名" />
      </a-form-item>

      <a-form-item label="关联主表">
        <a-select v-model="form.tableB" :options="tableOptions" placeholder="请选择主表" />
      </a-form-item>

      <a-form-item label="主表字段">
        <a-input v-model="form.fieldB" placeholder="通常为主键，如 id" />
      </a-form-item>
    </a-form>

    <div v-if="relations.length" class="mt-3">
      <a-table
        :dataSource="relations"
        :columns="columns"
        rowKey="CONSTRAINT_NAME"
        bordered
        size="small"
      />
    </div>
  </a-modal>
</template>

<script>
import { addRelation, getTableRelations, getTableStructure } from '@/api/tables'

export default {
  data() {
    return {
      visible: false,
      form: { tableA: '', fieldA: '', tableB: '', fieldB: '' },
      relations: [],
      tableOptions: [],
      columns: [
        { title: '约束名', dataIndex: 'CONSTRAINT_NAME' },
        { title: '子表', dataIndex: 'referencing_table' },
        { title: '子表字段', dataIndex: 'referencing_column' },
        { title: '主表', dataIndex: 'referenced_table' },
        { title: '主表字段', dataIndex: 'referenced_column' },
      ],
    }
  },

  methods: {
    async open(tableName, tables) {
      this.visible = true
      this.form.tableA = tableName
      this.tableOptions = tables.map(t => ({ label: t.tableName, value: t.tableName }))

      try {
        const res = await getTableRelations(tableName)
        this.relations = res.data
      } catch (err) {
        console.error(err)
        this.$message.error('获取表关联信息失败')
      }
    },

    async handleOk() {
      const { tableA, fieldA, tableB, fieldB } = this.form

      if (!tableA || !fieldA || !tableB || !fieldB) {
        this.$message.warning('请填写完整的关联信息')
        return
      }

      // 获取主表结构并校验外键字段
      try {
        const res = await getTableStructure(tableB)
        const targetField = res.data.find(f => f.Field === fieldB)

        if (!targetField) {
          this.$message.error(`主表 ${tableB} 中不存在字段 ${fieldB}`)
          return
        }

        // 检查是否为主键或唯一键
        if (targetField.Key !== 'PRI' && targetField.Key !== 'UNI') {
          this.$message.warning('被引用字段必须是主键或唯一键！')
          return
        }

        // 发请求创建外键
        await addRelation(this.form)
        this.$message.success('外键关联创建成功')

        // 重新加载当前表的外键关系
        this.open(this.form.tableA, this.tableOptions)
      } catch (error) {
        console.error(error)
        this.$message.error('外键创建失败，请检查字段类型和索引设置')
      }
    },
  },
}
</script>

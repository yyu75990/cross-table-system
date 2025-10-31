<template>
  <a-modal
    v-model="visible"
    title="表结构管理"
    width="800px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div>
      <a-table :dataSource="fields" :columns="columns" rowKey="Field" bordered>
        <template slot="actions" slot-scope="text, record">
          <a @click="openEditModal(record)">修改</a> |
          <a-popconfirm title="确定删除该字段？" @confirm="removeField(record)">
            <a style="color:red">删除</a>
          </a-popconfirm>
        </template>
      </a-table>

      <a-divider />
      <a-form layout="inline">
        <a-input v-model="newField.name" placeholder="字段名" style="width: 40%" />
        <a-input v-model="newField.type" placeholder="类型 (如 VARCHAR(50))" style="width: 40%" />
        <a-button type="primary" @click="addNewField">添加字段</a-button>
      </a-form>
    </div>
    <a-modal
      v-model="editModalVisible"
      title="修改字段"
      @ok="confirmEditField"
      okText="保存"
    >
      <a-form :model="editFieldForm" :label-col="{span:6}" :wrapper-col="{span:16}">
        <a-form-item label="原字段名">
          <a-input v-model="editFieldForm.oldName" disabled />
        </a-form-item>
        <a-form-item label="新字段名">
          <a-input v-model="editFieldForm.newName" placeholder="请输入新的字段名" />
        </a-form-item>
        <a-form-item label="字段类型">
          <a-input v-model="editFieldForm.newType" placeholder="如 VARCHAR(100)" />
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script>
import { getTableStructure, addField, deleteField, modifyField } from '@/api/tables'

export default {
  name: 'TableStructureModal',
  props: ['tableName'],
  data() {
    return {
      visible: false,
      fields: [],
      newField: { name: '', type: '' },
      columns: [
        { title: '字段名', dataIndex: 'Field', key: 'Field' },
        { title: '类型', dataIndex: 'Type', key: 'Type' },
        { title: '操作', key: 'actions', scopedSlots: { customRender: 'actions' } }
      ],
      editModalVisible: false,  // 修改字段弹窗显示状态
      editFieldForm: { oldName: '', newName: '', newType: '' } // 编辑字段表单
    }
  },
  methods: {
    async open() {
      this.visible = true
      this.$nextTick(async () => {
        const res = await getTableStructure(this.tableName);
        this.fields = res.data;
      });
    },
    handleOk() {
      this.visible = false
    },
    handleCancel() {
      this.visible = false
    },
    async addNewField() {
      if (!this.newField.name || !this.newField.type) {
        this.$message.warning('请填写完整字段信息')
        return
      }
      await addField(this.tableName, this.newField)
      this.$message.success('添加成功')
      this.open()
    },
    async removeField(record) {
      await deleteField(this.tableName, record.Field)
      this.$message.success('删除成功')
      this.open()
    },
  // 打开修改字段弹窗
  openEditModal(record) {
    this.editFieldForm = {
      oldName: record.Field,
      newName: record.Field,
      newType: record.Type
    }
    this.editModalVisible = true
  },

  // 确认修改字段
  async confirmEditField() {
    const { oldName, newName, newType } = this.editFieldForm
    if (!newName || !newType) {
      this.$message.warning('请填写完整字段信息')
      return
    }

    await modifyField({
      tableName: this.tableName,
      oldName,
      newName,
      newType
    })

    this.$message.success('修改成功')
    this.editModalVisible = false
    this.open(this.tableName) // 重新加载字段结构
    }
  }
}
</script>

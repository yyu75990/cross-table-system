<template>
  <div class="p-6">
    <a-page-header title="表与关联关系管理" sub-title="管理系统中的数据表与关联">
      <template #extra>
        <a-button type="primary" @click="showCreateModal = true">新建表</a-button>
      </template>
    </a-page-header>

    <!-- 表列表 -->
    <a-table :columns="columns" :dataSource="tables" rowKey="tableName" bordered class="mt-4">
      <template slot="actions" slot-scope="text, record">
        <a @click="viewStructure(record)">结构</a> |
        <a @click="viewRelations(record)">关联</a> |
        <a @click="viewData(record)">数据</a> |
        <a-popconfirm title="确定删除该表吗？" @confirm="deleteTable(record.tableName)">
          <a style="color:red">删除</a>
        </a-popconfirm>
      </template>
    </a-table>

    <!-- 新建表弹窗 -->
    <a-modal title="新建数据表" v-model="showCreateModal" @ok="createTable" okText="创建">
      <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="表名">
          <a-input v-model="form.tableName" placeholder="例如 patients" />
        </a-form-item>

        <a-form-item label="字段定义">
          <div v-for="(field, index) in form.fields" :key="index" style="display: flex; align-items: center; margin-bottom: 8px;">
            <a-input v-model="field.name" placeholder="字段名" style="width: 35%; margin-right: 8px;" />
            <a-input v-model="field.type" placeholder="类型 (如 INT)" style="width: 35%; margin-right: 8px;" />
            <a-radio-group :value="form.primaryKeyIndex" @change="handlePrimaryKeyChange(index)">
                <a-radio :value="index">主键</a-radio>
            </a-radio-group>
            <a-button type="link" @click="removeField(index)" style="margin-left: auto;">删除</a-button>
          </div>
          <a-button type="dashed" @click="addField" style="width: 100%;">+ 添加字段</a-button>
        </a-form-item>
      </a-form>
    </a-modal>
    <TableStructureModal ref="structureModal" :tableName="selectedTable" />
    <RelationModal ref="relationModal" />
    <TableDataModal ref="dataModal" />
  </div>
</template>

<script>
import { getTables, createTable, deleteTable } from "@/api/tables";
import TableStructureModal from "@/components/TableStructureModal.vue"
import RelationModal from "@/components/RelationModal.vue";
import TableDataModal from "@/components/TableDataModal.vue";

export default {
  components: {
    TableStructureModal,
    RelationModal,
    TableDataModal
  },
  data() {
    return {
      tables: [],
      showCreateModal: false,
      selectedTable: '',
      form: {
        tableName: '',
        fields: [], // 字段列表
        primaryKeyIndex: -1, // 单独记录主键的索引
      },
      columns: [
        { title: '表名', dataIndex: 'tableName' },
        { title: '操作', key: 'actions', scopedSlots: { customRender: 'actions' } },
      ]
    }
  },
  methods: {
    // 加载表
    async loadTables() {
      try {
        const res = await getTables();
        this.tables = res.data.map(name => ({ tableName: name }));
      } catch (e) {
        this.$message.error('加载表列表失败');
      }
    },

    // 创建表
    async createTable() {
      if (!this.form.tableName) return this.$message.error('表名不能为空');
      if (this.form.fields.length === 0) return this.$message.error('至少需要一个字段');
      if (this.form.primaryKeyIndex === -1) return this.$message.error('请选择一个主键');
      
      try {
        const fieldsPayload = this.form.fields.map((field, index) => {
          let finalType = field.type;
          // 移除可能存在的旧 PRIMARY KEY 标记
          finalType = finalType.replace(/PRIMARY\s+KEY/i, '').trim();
          // 为选中的主键添加标记
          if (index === this.form.primaryKeyIndex) {
            finalType += ' PRIMARY KEY';
          }
          return { name: field.name, type: finalType };
        });

        await createTable({ tableName: this.form.tableName, fields: fieldsPayload });
        this.$message.success('创建成功');
        this.showCreateModal = false;
        // 重置表单
        this.form = { tableName: '', fields: [], primaryKeyIndex: -1 };
        this.loadTables();
      } catch (e) {
        const msg = (e.response && e.response.data && e.response.data.message) || '创建失败';
        this.$message.error(msg);
      }
    },

    // 删除表
    async deleteTable(tableName) {
      try {
        await deleteTable(tableName);
        this.$message.success(`表 ${tableName} 已删除`);
        await this.loadTables();
      } catch (err) {
        this.$message.error('删除失败');
      }
    },
    
    // 添加字段
    addField() {
      this.form.fields.push({ name: '', type: '' });
      // 如果是第一个字段，自动设为主键
      if (this.form.fields.length === 1) {
        this.form.primaryKeyIndex = 0;
      }
    },

    // 删除字段
    removeField(index) {
      this.form.fields.splice(index, 1);
      // 如果删除的是主键，重置
      if (this.form.primaryKeyIndex === index) {
        this.form.primaryKeyIndex = -1;
      } 
      // 如果删除的是主键前面的字段，索引要减一
      else if (this.form.primaryKeyIndex > index) {
        this.form.primaryKeyIndex--;
      }
    },
    
    // 点击主键 Radio 的逻辑：允许取消
    handlePrimaryKeyChange(index) {
        if (this.form.primaryKeyIndex === index) {
            // 如果点击的是当前已选中的，则取消选中
            this.form.primaryKeyIndex = -1;
        } else {
            // 否则，选中点击的
            this.form.primaryKeyIndex = index;
        }
    },

    // 其他视图方法
    viewStructure(record) {
      this.selectedTable = record.tableName;
      this.$refs.structureModal.open();
    },
    async viewRelations(record) {
      this.$refs.relationModal.open(record.tableName, this.tables);
    },
    viewData(record) {
      this.$refs.dataModal.open(record.tableName);
    }
  },
  mounted() {
    this.loadTables();
  }
}
</script>

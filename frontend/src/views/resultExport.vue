<template>
  <div>
    <a-page-header title="更新结果显示与导出" sub-title="批量操作效果统计、导出及后续分析" />
    <!-- 1. 操作日志与导出 -->
    <a-card title="操作记录与结果导出" class="mb-3">
      <a-table :columns="logColumns" :dataSource="updateLogs"
        :rowKey="record => record.logId || record.id || (record.time + '-' + record.field)" size="small" bordered
        :pagination="{ pageSize: 8 }" class="mb-2" />
      <div style="text-align:right; margin-top: 8px; position: relative; z-index: 2;">
        <a-button type="primary" icon="download" :loading="exporting" @click="onExportClick">导出CSV</a-button>
      </div>
    </a-card>

    <a-card title="就诊量 Top5（主治医生）" class="mb-3">
      <div style="margin-bottom:10px;">
        <a-button type="primary" icon="bar-chart" @click="renderDoctorTop5Bar">统计Top5</a-button>
      </div>
      <div id="doctorTopTrendChart" style="height:360px;width:100%;background:#fff;"></div>
      <div v-if="!trendReady" style="color:#888; text-align:center; margin-top:12px;">暂无统计数据</div>
    </a-card>
  </div>
</template>

<script>
import { getUpdateLogs, getDoctorTop5 } from '@/api/tables'
export default {
  data() {
    return {
      updateLogs: [],
      exporting: false,
      logColumns: [
        { title: '时间', dataIndex: 'time', width: 150 },
        { title: '执行人', dataIndex: 'operator', width: 90 },
        { title: '条件', dataIndex: 'condition' },
        { title: '字段', dataIndex: 'field', width: 110 },
        { title: '新值', dataIndex: 'new_value', width: 110 },
        {
          title: '更新前的值', dataIndex: 'old_values', width: 180, customRender: (text) => {
            if (!text) return '-'
            let arr = []
            try { arr = JSON.parse(text) } catch { arr = [] }
            return arr.map(i => `id:${i.id}, ${i.value}`).join('; ')
          }
        },
        { title: '影响条数', dataIndex: 'count', width: 90 },
        { title: '结果', dataIndex: 'result', width: 90 },
      ],
      trendReady: false,
      doctorTrendChart: null,
    }
  },
  methods: {
    async onExportClick() {
      try {
        this.exporting = true
        await this.$nextTick()
        this.exportCsv()
      } finally {
        this.exporting = false
      }
    },
    async fetchLogs() {
      try {
        const res = await getUpdateLogs()
        this.updateLogs = (res.data || []).map((i, idx) => ({
          ...i,
          logId: i.id || `${i.time || ''}-${i.field || ''}-${idx}`
        }))
      } catch (e) {
        this.$message.error('历史操作记录加载失败')
      }
    },
    exportCsv() {
      try {
        const columns = this.logColumns.map(c => ({ title: c.title, dataIndex: c.dataIndex }))
        if (!columns.length) {
          this.$message.warning('无可导出的列')
          return
        }
        const escapeCsv = val => {
          if (val === undefined || val === null) return ''
          const s = String(val)
          if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
          return s
        }
        const renderOldValues = (text) => {
          if (!text) return '-'
          let arr = []
          try { arr = JSON.parse(text) } catch { arr = [] }
          return arr.map(i => `id:${i.id}, ${i.value}`).join('; ')
        }
        const rows = (this.updateLogs || []).map(row => {
          return columns.map(col => {
            if (col.dataIndex === 'old_values') return renderOldValues(row[col.dataIndex])
            return row[col.dataIndex]
          })
        })
        if (!rows.length) {
          this.$message.info('暂无数据，仅导出表头')
        }
        const header = columns.map(c => escapeCsv(c.title)).join(',')
        const body = rows.map(r => r.map(escapeCsv).join(',')).join('\n')
        const csv = '\ufeff' + header + (body ? ('\n' + body) : '')
        const filename = `批量更新记录-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
        try {
          const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' })
          const url = (window.URL || window.webkitURL).createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
      a.href = url
          a.setAttribute('download', filename)
      document.body.appendChild(a)
          setTimeout(() => {
      a.click()
            setTimeout(() => {
      document.body.removeChild(a)
                ; (window.URL || window.webkitURL).revokeObjectURL(url)
            }, 200)
          }, 0)
        } catch (e1) {
          try {
            const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
            const a = document.createElement('a')
            a.href = dataUri
            a.setAttribute('download', filename)
            document.body.appendChild(a)
            setTimeout(() => {
              a.click()
              setTimeout(() => document.body.removeChild(a), 200)
            }, 0)
          } catch (e2) {
            this.$message.error('导出失败，请稍后重试')
          }
        }
      } catch (errAll) {
        this.$message.error('导出异常！请稍后重试')
      }
    },
    // 简版：主治医生Top5柱状图（后端真实数据）
    async renderDoctorTop5Bar() {
      const dom = document.getElementById('doctorTopTrendChart')
      if (!dom) return
      try {
        const res = await getDoctorTop5()
        const doctors = (res.data && res.data.doctors) || []
        const values = (res.data && res.data.counts) || []
        if (!doctors.length) {
          this.trendReady = false
          this.$message.info('暂无数据')
          if (this.doctorTrendChart) { try { this.doctorTrendChart.dispose() } catch (e) { this.doctorTrendChart = null } }
          return
        }
        let echartsLib = window.echarts || null
        try { if (!echartsLib) echartsLib = require('echarts') } catch (e) { echartsLib = null }
        if (!echartsLib) { this.$message.error('未正确引入 echarts！'); return }
        const option = {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: 40, right: 20, top: 30, bottom: 40 },
          xAxis: { type: 'category', data: doctors },
          yAxis: { type: 'value', name: '就诊量' },
          series: [{ name: '就诊量', type: 'bar', data: values, barWidth: '50%' }]
        }
        if (this.doctorTrendChart) {
          try { this.doctorTrendChart.dispose() } catch (e) { this.doctorTrendChart = null }
        }
        this.doctorTrendChart = echartsLib.init(dom)
        this.doctorTrendChart.setOption(option)
        this.trendReady = true
      } catch (e) {
        this.$message.error('获取Top5失败')
      }
    },
  },
  mounted() {
    this.fetchLogs()
  }
}
</script>

<style scoped>
.mb-2 {
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 24px;
}
</style>

import Vue from 'vue'
import VueRouter from 'vue-router'
import tableManage from '@/views/tableManage.vue'
import crossTableUpdate from '@/views/crossTableUpdate.vue'
import resultExport from '@/views/resultExport.vue'
Vue.use(VueRouter)

const routes = [
  {
    path: '/tableManage',
    name: 'tableManage',
    component: tableManage
  },
  {
    path: '/crossTableUpdate',
    name: 'crossTableUpdate',
    component: crossTableUpdate
  },
  {
    path: '/resultExport',
    name: 'resultExport',
    component: resultExport
  }
]

const router = new VueRouter({
  mode: 'hash', 
  routes,
})

export default router
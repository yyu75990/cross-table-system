import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api/tableManager'

// 获取所有表
export function getTables() {
  return axios.get(`${BASE_URL}/list`)
}

// 创建新表
export function createTable(data) {
  return axios.post(`${BASE_URL}/create`, data)
}

// 删除表（根据表名删除）
export function deleteTable(tableName) {
  return axios.delete(`${BASE_URL}/delete/${tableName}`)
}

// 查看表结构
export function getTableStructure(tableName) {
  return axios.get(`${BASE_URL}/structure/${tableName}`)
}

// 添加字段
export function addField(tableName, field) {
  return axios.post(`${BASE_URL}/addField`, {
    tableName,
    fieldName: field.name,
    fieldType: field.type
  })
}

export function deleteField(tableName, fieldName) {
  return axios.post(`${BASE_URL}/deleteField`, { tableName, fieldName })
}

// 修改字段
export function modifyField(data) {
  // data 结构为 { tableName, oldName, newName, newType }
  return axios.post(`${BASE_URL}/modifyField`, data)
}

export function addRelation(data) {
  return axios.post(`${BASE_URL}/addRelation`, data)
}

export function getTableRelations(tableName) {
  return axios.get(`${BASE_URL}/relations/${tableName}`)
}

// 跨表命中预览
export function crossTablePreview(condition) {
  return axios.post(`${BASE_URL}/crossTablePreview`, { condition })
}
// 跨表批量更新
export function crossTableBatchUpdate(params) {
  return axios.post(`${BASE_URL}/crossTableBatchUpdate`, params)
}

// 获取表数据
export function getTableData(tableName) {
  return axios.get(`${BASE_URL}/data/${tableName}`)
}
// 新增表数据
export function insertData(tableName, data) {
  return axios.post(`${BASE_URL}/data/insert`, { tableName, data })
}
// 更新表数据（支持任意主键）
export function updateData(tableName, pkName, pkValue, data) {
  return axios.put(`${BASE_URL}/data/update`, { tableName, pkName, pkValue, data })
}
// 删除表数据
export function deleteData(tableName, id) {
  return axios.delete(`${BASE_URL}/data/${tableName}/${id}`)
}

export function getUpdateLogs() {
  return axios.get(`${BASE_URL}/updateLogs`)
}

export function getDoctorTop5() {
  return axios.get(`${BASE_URL}/doctorTop5`)
}
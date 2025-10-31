const express = require('express');
const router = express.Router();
const controller = require('../controllers/tableManagerController');

router.post('/create', controller.createTable);
router.delete('/delete/:tableName', controller.deleteTable);
router.get('/list', controller.getTables);
router.get('/structure/:tableName', controller.getTableStructure);
router.post('/addField', controller.addField);
router.post('/deleteField', controller.deleteField);
router.post('/modifyField', controller.modifyField);
router.post('/addRelation', controller.addRelation)
router.get('/relations/:tableName', controller.getTableRelations)
// 表数据 CRUD
router.get('/data/:tableName', controller.getTableData);
router.post('/data/insert', controller.insertData);
router.put('/data/update', controller.updateData);
router.delete('/data/:tableName/:id', controller.deleteData);
// 跨表条件命中预览
router.post('/crossTablePreview', controller.crossTableConditionPreview)
// 跨表批量更新
router.post('/crossTableBatchUpdate', controller.crossTableBatchUpdate)
router.get('/updateLogs', controller.getUpdateLogs);
// 统计：主治医生Top5
router.get('/doctorTop5', controller.getDoctorTop5)


module.exports = router;

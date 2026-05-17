"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SqlUsefulRepository = (function () {
  function SqlUsefulRepository(db, usefulTable, attributes, buildToSave, rateTable, rateIdCol, usefulCol) {
    this.db = db;
    this.usefulTable = usefulTable;
    this.attributes = attributes;
    this.buildToSave = buildToSave;
    this.rateTable = rateTable;
    this.rateIdCol = rateIdCol;
    this.usefulCol = usefulCol;
    this.setUseful = this.setUseful.bind(this);
    this.removeUseful = this.removeUseful.bind(this);
  }
  SqlUsefulRepository.prototype.setUseful = function (rateId, userId) {
    var obj = { rateId: rateId, userId: userId, time: new Date(), reaction: 1 };
    var stm1 = this.buildToSave(obj, this.usefulTable, this.attributes);
    var query = "update " + this.rateTable + " set " + this.usefulCol + " = " + this.usefulCol + " + 1 where " + this.rateIdCol + " = " + this.db.param(1);
    var stm2 = { query: query, params: [rateId] };
    return this.db.executeBatch([stm1, stm2], true);
  };
  SqlUsefulRepository.prototype.removeUseful = function (rateId, userId) {
    var atr1 = this.attributes["rateId"];
    var atr2 = this.attributes["userId"];
    var col1 = atr1.column ? atr1.column : "rateid";
    var col2 = atr2.column ? atr2.column : "userid";
    var query1 = "delete from " + this.usefulTable + " where " + col1 + " = " + this.db.param(1) + " and " + col2 + " = " + this.db.param(2);
    var stm1 = { query: query1, params: [rateId, userId] };
    var query2 = "update " + this.rateTable + " set " + this.usefulCol + " = " + this.usefulCol + " - 1 where " + this.rateIdCol + " = " + this.db.param(1);
    var stm2 = { query: query2, params: [rateId] };
    return this.db.executeBatch([stm1, stm2], true);
  };
  return SqlUsefulRepository;
}());
exports.SqlUsefulRepository = SqlUsefulRepository;

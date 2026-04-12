"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildMap(attrs) {
  var mp = {};
  var ks = Object.keys(attrs);
  for (var _i = 0, ks_1 = ks; _i < ks_1.length; _i++) {
    var k = ks_1[_i];
    var attr = attrs[k];
    attr.name = k;
    var field = attr.column ? attr.column : k;
    var s = field.toLowerCase();
    if (s !== k) {
      mp[s] = k;
    }
  }
  return mp;
}
exports.buildMap = buildMap;
var SqlRateRepository = (function () {
  function SqlRateRepository(db, table, attributes, max, infoTable, buildToInsert, buildToUpdate, generateId, rateIdField, rateField, count, score, authorCol, id, idField, idCol, rateCol) {
    this.db = db;
    this.table = table;
    this.attributes = attributes;
    this.max = max;
    this.infoTable = infoTable;
    this.buildToInsert = buildToInsert;
    this.buildToUpdate = buildToUpdate;
    this.generateId = generateId;
    this.rateIdField = rateIdField;
    this.map = buildMap(attributes);
    this.id = (id && id.length > 0 ? id : 'id');
    this.rate = (rateCol && rateCol.length > 0 ? rateCol : 'rate');
    this.count = (count && count.length > 0 ? count : 'count');
    this.score = (score && score.length > 0 ? score : 'score');
    this.idField = (idField && idField.length > 0 ? idField : 'id');
    this.rateField = (rateField && rateField.length > 0 ? rateField : 'rate');
    this.authorCol = (authorCol && authorCol.length > 0 ? authorCol : 'author');
    if (idCol && idCol.length > 0) {
      this.idCol = idCol;
    }
    else {
      var c = attributes[this.idField];
      if (c) {
        this.idCol = (c.column && c.column.length > 0 ? c.column : this.idField);
      }
      else {
        this.idCol = this.idField;
      }
    }
    if (rateCol && rateCol.length > 0) {
      this.rate = rateCol;
    }
    else {
      var c = attributes[this.rateField];
      if (c) {
        this.rate = (c.column && c.column.length > 0 ? c.column : this.rateField);
      }
      else {
        this.rate = this.rateField;
      }
    }
    this.load = this.load.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.insertInfo = this.insertInfo.bind(this);
    this.updateNewInfo = this.updateNewInfo.bind(this);
    this.updateOldInfo = this.updateOldInfo.bind(this);
  }
  SqlRateRepository.prototype.load = function (id, author, tx) {
    var db = tx ? tx : this.db;
    return db.query("select * from " + this.table + " where " + this.idCol + " = " + this.db.param(1) + " and " + this.authorCol + " = " + this.db.param(2), [id, author], this.map).then(function (rates) {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  };
  SqlRateRepository.prototype.create = function (rate, newInfo, tx) {
    rate[this.rateIdField] = this.generateId();
    var stmt = this.buildToInsert(rate, this.table, this.attributes, this.db.param);
    if (stmt.query) {
      var obj = rate;
      var rateNum = obj[this.rateField];
      var id = obj[this.idField];
      var db = tx ? tx : this.db;
      if (newInfo) {
        var query = this.insertInfo(rateNum);
        var s2 = { query: query, params: [id] };
        return db.executeBatch([s2, stmt], true);
      }
      else {
        var query = this.updateNewInfo(rateNum);
        var s2 = { query: query, params: [id] };
        return db.executeBatch([s2, stmt], true);
      }
    }
    else {
      return Promise.resolve(-1);
    }
  };
  SqlRateRepository.prototype.insertInfo = function (r) {
    var rateCols = [];
    var ps = [];
    for (var i = 1; i <= this.max; i++) {
      rateCols.push("" + this.rate + i);
      if (i === r) {
        ps.push('' + 1);
      }
      else {
        ps.push('0');
      }
    }
    var query = "\n    insert into " + this.infoTable + " (" + this.id + ", " + this.rate + ", " + this.count + ", " + this.score + ", " + rateCols.join(',') + ")\n    values (" + this.db.param(1) + ", " + r + ", 1, " + r + ", " + ps.join(',') + ")";
    return query;
  };
  SqlRateRepository.prototype.update = function (rate, oldRate, tx) {
    var stmt = this.buildToUpdate(rate, this.table, this.attributes, this.db.param);
    if (stmt.query) {
      var obj = rate;
      var rateNum = obj[this.rateField];
      var id = obj[this.idField];
      var query = this.updateOldInfo(rateNum, oldRate);
      var s2 = { query: query, params: [id] };
      var db = tx ? tx : this.db;
      return db.executeBatch([s2, stmt], true);
    }
    else {
      return Promise.resolve(-1);
    }
  };
  SqlRateRepository.prototype.updateNewInfo = function (r) {
    var query = "\n    update " + this.infoTable + " set " + this.rate + " = (" + this.score + " + " + r + ")/(" + this.count + " + 1), " + this.count + " = " + this.count + " + 1, " + this.score + " = " + this.score + " + " + r + ", " + this.rate + r + " = " + this.rate + r + " + 1\n    where " + this.id + " = " + this.db.param(1);
    return query;
  };
  SqlRateRepository.prototype.updateOldInfo = function (newRate, oldRate) {
    if (newRate === oldRate) {
      return '';
    }
    var delta = newRate - oldRate;
    var query = "\n    update " + this.infoTable + " set " + this.rate + " = (" + this.score + " + (" + delta + "))/" + this.count + ", " + this.score + " = " + this.score + " + (" + delta + "), " + this.rate + newRate + " = " + this.rate + newRate + " + 1, " + this.rate + oldRate + " = " + this.rate + oldRate + " - 1\n    where " + this.id + " = " + this.db.param(1);
    return query;
  };
  return SqlRateRepository;
}());
exports.SqlRateRepository = SqlRateRepository;

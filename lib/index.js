"use strict";
var __extends = (this && this.__extends) || (function () {
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };
  return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
  var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0: case 1: t = op; break;
        case 4: _.label++; return { value: op[1], done: false };
        case 5: _.label++; y = op[1]; op = [0]; continue;
        case 7: op = _.ops.pop(); _.trys.pop(); continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
          if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
          if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
          if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
          if (t[2]) _.ops.pop();
          _.trys.pop(); continue;
      }
      op = body.call(thisArg, _);
    } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(exports, "__esModule", { value: true });
var query_core_1 = require("query-core");
exports.rateReactionModel = {
  id: {
    key: true,
    required: true
  },
  author: {
    key: true,
    required: true
  },
  userId: {
    key: true,
    required: true
  },
  time: {
    type: 'datetime',
  },
  reaction: {
    type: 'integer',
  }
};
var SqlRateRepository = (function () {
  function SqlRateRepository(db, table, attributes, buildToSave, max, infoTable, rateField, count, score, authorCol, id, idField, idCol, rateCol) {
    this.db = db;
    this.table = table;
    this.attributes = attributes;
    this.buildToSave = buildToSave;
    this.max = max;
    this.infoTable = infoTable;
    var m = query_core_1.metadata(attributes);
    this.map = m.map;
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
    this.getRate = this.getRate.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.insertInfo = this.insertInfo.bind(this);
    this.updateNewInfo = this.updateNewInfo.bind(this);
    this.updateOldInfo = this.updateOldInfo.bind(this);
  }
  SqlRateRepository.prototype.getRate = function (id, author, ctx) {
    return this.db.query("select * from " + this.table + " where " + this.idCol + " = " + this.db.param(1) + " and " + this.authorCol + " = " + this.db.param(2), [id, author], this.map, undefined, ctx).then(function (rates) {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  };
  SqlRateRepository.prototype.insert = function (rate, newInfo) {
    var stmt = query_core_1.buildToInsert(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      var obj = rate;
      var rateNum = obj[this.rateField];
      var id = obj[this.idField];
      if (newInfo) {
        var query = this.insertInfo(rateNum);
        var s2 = { query: query, params: [id] };
        return this.db.execBatch([s2, stmt], true);
      }
      else {
        var query = this.updateNewInfo(rateNum);
        var s2 = { query: query, params: [id] };
        return this.db.execBatch([s2, stmt], true);
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
    var query = "\n      insert into " + this.infoTable + " (" + this.id + ", " + this.rate + ", " + this.count + ", " + this.score + ", " + rateCols.join(',') + ")\n      values (" + this.db.param(1) + ", " + r + ", 1, " + r + ", " + ps.join(',') + ")";
    return query;
  };
  SqlRateRepository.prototype.update = function (rate, oldRate) {
    var stmt = query_core_1.buildToUpdate(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      var obj = rate;
      var rateNum = obj[this.rateField];
      var id = obj[this.idField];
      var query = this.updateOldInfo(rateNum, oldRate);
      var s2 = { query: query, params: [id] };
      return this.db.execBatch([s2, stmt], true);
    }
    else {
      return Promise.resolve(-1);
    }
  };
  SqlRateRepository.prototype.updateNewInfo = function (r) {
    var query = "\n      update " + this.infoTable + " set " + this.rate + " = (" + this.score + " + " + r + ")/(" + this.count + " + 1), " + this.count + " = " + this.count + " + 1, " + this.score + " = " + this.score + " + " + r + ", " + this.rate + r + " = " + this.rate + r + " + 1\n      where " + this.id + " = " + this.db.param(1);
    return query;
  };
  SqlRateRepository.prototype.updateOldInfo = function (newRate, oldRate) {
    var delta = newRate - oldRate;
    var query = "\n      update " + this.infoTable + " set " + this.rate + " = (" + this.score + " + " + delta + ")/" + this.count + ", " + this.score + " = " + this.score + " + " + delta + ", " + this.rate + newRate + " = " + this.rate + newRate + " + 1, " + this.rate + oldRate + " = " + this.rate + oldRate + " - 1\n      where " + this.id + " = " + this.db.param(1);
    return query;
  };
  return SqlRateRepository;
}());
exports.SqlRateRepository = SqlRateRepository;
var SqlInfoRepository = (function (_super) {
  __extends(SqlInfoRepository, _super);
  function SqlInfoRepository(db, table, attributes, buildToSave) {
    var _this = _super.call(this, db.query, table, attributes, db.param) || this;
    _this.db = db;
    _this.buildToSave = buildToSave;
    _this.save = _this.save.bind(_this);
    return _this;
  }
  SqlInfoRepository.prototype.save = function (obj, ctx) {
    return __awaiter(this, void 0, void 0, function () {
      var stmt;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0: return [4, this.buildToSave(obj, this.table, this.attributes)];
          case 1:
            stmt = _a.sent();
            if (stmt) {
              return [2, this.db.exec(stmt.query, stmt.params, ctx)];
            }
            else {
              return [2, Promise.resolve(0)];
            }
            return [2];
        }
      });
    });
  };
  return SqlInfoRepository;
}(query_core_1.SqlLoader));
exports.SqlInfoRepository = SqlInfoRepository;
var SqlCommentRepository = (function (_super) {
  __extends(SqlCommentRepository, _super);
  function SqlCommentRepository(db, table, attrs, parent, idField, authorField, col, author, time, id, idCol, authorCol) {
    var _this = _super.call(this, db, table, attrs) || this;
    _this.parent = parent;
    _this.col = (col && col.length > 0 ? col : 'replycount');
    _this.id = (id && id.length > 0 ? id : 'id');
    _this.author = (author && author.length > 0 ? author : 'author');
    _this.time = (time && time.length > 0 ? time : 'time');
    _this.idField = (idField && idField.length > 0 ? idField : 'id');
    _this.authorField = (authorField && authorField.length > 0 ? authorField : 'author');
    if (idCol && idCol.length > 0) {
      _this.idCol = idCol;
    }
    else {
      var c = attrs[_this.idField];
      if (c) {
        _this.idCol = (c.column && c.column.length > 0 ? c.column : _this.idField);
      }
      else {
        _this.idCol = _this.idField;
      }
    }
    if (authorCol && authorCol.length > 0) {
      _this.authorCol = authorCol;
    }
    else {
      var c = attrs[_this.authorField];
      if (c) {
        _this.authorCol = (c.column && c.column.length > 0 ? c.column : _this.authorField);
      }
      else {
        _this.authorCol = _this.authorField;
      }
    }
    _this.insert = _this.insert.bind(_this);
    _this.remove = _this.remove.bind(_this);
    _this.getComments = _this.getComments.bind(_this);
    return _this;
  }
  SqlCommentRepository.prototype.insert = function (obj) {
    var stmt = query_core_1.buildToInsert(obj, this.table, this.attributes, this.param, this.version);
    if (stmt) {
      var query = "update " + this.parent + " set " + this.col + " = " + this.col + " + 1 where " + this.id + " = " + this.param(1) + " and " + this.author + " = " + this.param(2);
      var ob = obj;
      var s2 = { query: query, params: [ob[this.idField], ob[this.authorField]] };
      return this.execBatch([stmt, s2], true);
    }
    else {
      return Promise.resolve(0);
    }
  };
  SqlCommentRepository.prototype.remove = function (commentId, id, author) {
    var stmt = query_core_1.buildToDelete(commentId, this.table, this.primaryKeys, this.param);
    if (stmt) {
      var query = "update " + this.parent + " set " + this.col + " = " + this.col + " - 1 where " + this.id + " = " + this.param(1) + " and " + this.author + " = " + this.param(2);
      var s2 = { query: query, params: [id, author] };
      return this.execBatch([stmt, s2]);
    }
    else {
      return Promise.resolve(0);
    }
  };
  SqlCommentRepository.prototype.getComments = function (id, author, limit) {
    var sql = "select * from " + this.table + " where " + this.idCol + " = " + this.param(1) + " and " + this.authorCol + " = " + this.param(2);
    if (limit && limit > 0) {
      sql = sql + (" order by " + this.time + " desc limit " + limit);
    }
    else {
      sql = sql + (" order by " + this.time);
    }
    return this.query(sql, [id, author], this.map).then(function (comments) {
      if (limit && limit > 0) {
        return revert(comments);
      }
      else {
        return comments;
      }
    });
  };
  return SqlCommentRepository;
}(query_core_1.Repository));
exports.SqlCommentRepository = SqlCommentRepository;
function revert(arr) {
  if (!arr || arr.length <= 1) {
    return arr;
  }
  var newArr = [];
  for (var i = arr.length - 1; i >= 0; i--) {
    newArr.push(arr[i]);
  }
  return newArr;
}
exports.revert = revert;
var SqlReactionRepository = (function () {
  function SqlReactionRepository(db, table, attributes, parent, col, author, id, userIdCol, authorCol, idCol) {
    this.db = db;
    this.table = table;
    this.attributes = attributes;
    this.parent = parent;
    this.col = (col && col.length > 0 ? col : 'usefulcount');
    this.parentId = (id && id.length > 0 ? id : 'id');
    this.parentAuthor = (author && author.length > 0 ? author : 'author');
    this.userIdCol = (userIdCol && userIdCol.length > 0 ? userIdCol : 'userId');
    this.idCol = (idCol && idCol.length > 0 ? idCol : this.parentId);
    this.authorCol = (authorCol && authorCol.length > 0 ? authorCol : this.parentAuthor);
    this.exist = this.exist.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
  }
  SqlReactionRepository.prototype.exist = function (id, author, userId) {
    return this.db.query("select " + this.idCol + " from " + this.table + " where " + this.idCol + " = " + this.db.param(1) + " and " + this.authorCol + " = " + this.db.param(2) + " and " + this.userIdCol + " = " + this.db.param(3), [id, author, userId]).then(function (rates) {
      return rates && rates.length > 0 ? true : false;
    });
  };
  SqlReactionRepository.prototype.remove = function (id, author, userId) {
    var query1 = "delete from " + this.table + " where " + this.idCol + " = " + this.db.param(1) + " and " + this.authorCol + " = " + this.db.param(2) + " and " + this.userIdCol + "= " + this.db.param(3);
    var s1 = { query: query1, params: [id, author, userId] };
    var query2 = "update " + this.parent + " set " + this.col + " = " + this.col + " - 1 where " + this.parentId + " = " + this.db.param(1) + " and " + this.parentAuthor + " = " + this.db.param(2);
    var s2 = { query: query2, params: [id, author] };
    return this.db.execBatch([s1, s2], true);
  };
  SqlReactionRepository.prototype.save = function (id, author, userId, reaction) {
    var _this = this;
    var obj = { id: id, userId: userId, author: author, time: new Date(), reaction: reaction };
    var stmt = query_core_1.buildToInsert(obj, this.table, this.attributes, this.db.param);
    if (stmt) {
      return this.exist(id, author, userId).then(function (ok) {
        if (ok === false) {
          var query = "update " + _this.parent + " set " + _this.col + " = " + _this.col + " + 1 where " + _this.parentId + " = " + _this.db.param(1) + " and " + _this.parentAuthor + " = " + _this.db.param(2);
          var s2 = { query: query, params: [id, author] };
          return _this.db.execBatch([stmt, s2]);
        }
        else {
          return Promise.resolve(0);
        }
      });
    }
    else {
      return Promise.resolve(0);
    }
  };
  return SqlReactionRepository;
}());
exports.SqlReactionRepository = SqlReactionRepository;

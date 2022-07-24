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
var SqlRateRepository = (function (_super) {
  __extends(SqlRateRepository, _super);
  function SqlRateRepository(db, table, attributes, buildToSave) {
    var _this = _super.call(this, db, table, attributes) || this;
    _this.buildToSave = buildToSave;
    _this.save = _this.save.bind(_this);
    _this.getRate = _this.getRate.bind(_this);
    return _this;
  }
  SqlRateRepository.prototype.getRate = function (id, author, ctx) {
    return this.query("select * from " + this.table + " where id = " + this.param(1) + " and author = " + this.param(2), [id, author], this.map, undefined, ctx).then(function (rates) {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  };
  SqlRateRepository.prototype.save = function (obj, ctx) {
    var stmt = this.buildToSave(obj, this.table, this.attributes);
    if (stmt) {
      return this.exec(stmt.query, stmt.params, ctx);
    }
    else {
      return Promise.resolve(0);
    }
  };
  return SqlRateRepository;
}(query_core_1.Repository));
exports.SqlRateRepository = SqlRateRepository;
var SqlInfoRepository = (function (_super) {
  __extends(SqlInfoRepository, _super);
  function SqlInfoRepository(db, table, attributes, buildToSave) {
    var _this = _super.call(this, db, table, attributes) || this;
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
              return [2, this.exec(stmt.query, stmt.params, ctx)];
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
}(query_core_1.Repository));
exports.SqlInfoRepository = SqlInfoRepository;
var SqlRateCommentRepository = (function (_super) {
  __extends(SqlRateCommentRepository, _super);
  function SqlRateCommentRepository(db, table, attrs, parent, col, author, id) {
    var _this = _super.call(this, db, table, attrs) || this;
    _this.parent = parent;
    _this.col = (col && col.length > 0 ? col : 'replycount');
    _this.id = (id && id.length > 0 ? id : 'id');
    _this.author = (author && author.length > 0 ? author : 'author');
    _this.insert = _this.insert.bind(_this);
    _this.remove = _this.remove.bind(_this);
    return _this;
  }
  SqlRateCommentRepository.prototype.insert = function (obj) {
    var stmt = query_core_1.buildToInsert(obj, this.table, this.attributes, this.param, this.version);
    if (stmt) {
      var query = "update " + this.parent + " set " + this.col + " = " + this.col + " + 1 where " + this.id + " = " + this.param(1) + " and " + this.author + " = " + this.param(2);
      var s2 = { query: query, params: [obj.id, obj.author] };
      return this.execBatch([stmt, s2], true);
    }
    else {
      return Promise.resolve(0);
    }
  };
  SqlRateCommentRepository.prototype.remove = function (commentId, id, author) {
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
  return SqlRateCommentRepository;
}(query_core_1.Repository));
exports.SqlRateCommentRepository = SqlRateCommentRepository;
var SqlRateReactionRepository = (function () {
  function SqlRateReactionRepository(db, table, attributes, parent, col, author, id) {
    this.db = db;
    this.table = table;
    this.attributes = attributes;
    this.parent = parent;
    this.col = (col && col.length > 0 ? col : 'replycount');
    this.id = (id && id.length > 0 ? id : 'id');
    this.author = (author && author.length > 0 ? author : 'author');
    this.exist = this.exist.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
  }
  SqlRateReactionRepository.prototype.exist = function (id, author, userId) {
    return this.db.query("select id from " + this.table + " where id = " + this.db.param(1) + " and author = " + this.db.param(2) + " and userId = " + this.db.param(3), [id, author, userId]).then(function (rates) {
      return rates && rates.length > 0 ? true : false;
    });
  };
  SqlRateReactionRepository.prototype.remove = function (id, author, userId) {
    var query1 = "delete from " + this.table + " where id = " + this.db.param(1) + " and author = " + this.db.param(2) + " and userId= " + this.db.param(3);
    var s1 = { query: query1, params: [id, author, userId] };
    var query2 = "update " + this.parent + " set " + this.col + " = " + this.col + " - 1 where " + this.id + " = " + this.db.param(1) + " and " + this.author + " = " + this.db.param(2);
    var s2 = { query: query2, params: [id, author] };
    return this.db.execBatch([s1, s2], true);
  };
  SqlRateReactionRepository.prototype.save = function (id, author, userId, reaction) {
    var _this = this;
    var obj = { id: id, userId: userId, author: author, time: new Date(), reaction: reaction };
    var stmt = query_core_1.buildToInsert(obj, this.table, this.attributes, this.db.param);
    if (stmt) {
      return this.exist(id, author, userId).then(function (ok) {
        if (ok === false) {
          var query = "update " + _this.parent + " set " + _this.col + " = " + _this.col + " + 1 where " + _this.id + " = " + _this.db.param(1) + " and " + _this.author + " = " + _this.db.param(2);
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
  return SqlRateReactionRepository;
}());
exports.SqlRateReactionRepository = SqlRateReactionRepository;

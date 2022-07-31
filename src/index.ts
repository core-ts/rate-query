import { Attributes, buildToDelete, buildToInsert, buildToUpdate, DB, metadata, Repository, SqlLoader, Statement, StringMap } from 'query-core';
import { CommentRepository, InfoRepository, RateReaction, RateReactionRepository, RateRepository } from './core-query';

export * from './core-query';
export const rateReactionModel: Attributes = {
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

export class SqlRateRepository<R> implements RateRepository<R> {
  constructor(public db: DB, public table: string, public attributes: Attributes, protected buildToSave: <K>(obj: K, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined, public max: number, public infoTable: string, rateField?: string, count?: string, score?: string, authorCol?: string, id?: string, idField?: string, idCol?: string, rateCol?: string) {
    const m = metadata(attributes);
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
    } else {
      const c = attributes[this.idField];
      if (c) {
        this.idCol = (c.column && c.column.length > 0 ? c.column : this.idField);
      } else {
        this.idCol = this.idField;
      }
    }
    if (rateCol && rateCol.length > 0) {
      this.rate = rateCol;
    } else {
      const c = attributes[this.rateField];
      if (c) {
        this.rate = (c.column && c.column.length > 0 ? c.column : this.rateField);
      } else {
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
  map?: StringMap;
  count: string;
  score: string;
  id: string;
  rate: string;
  idField: string;
  rateField: string;
  idCol: string;
  authorCol: string;
  getRate(id: string, author: string, ctx?: any): Promise<R | null> {
    return this.db.query<R>(`select * from ${this.table} where ${this.idCol} = ${this.db.param(1)} and ${this.authorCol} = ${this.db.param(2)}`, [id, author], this.map, undefined, ctx).then(rates => {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  }
  insert(rate: R, newInfo?: boolean): Promise<number> {
    const stmt = buildToInsert(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      const obj: any = rate;
      const rateNum: number = obj[this.rateField];
      const id: string = obj[this.idField];
      if (newInfo) {
        const query = this.insertInfo(rateNum);
        const s2: Statement = { query, params: [id] };
        return this.db.execBatch([s2, stmt], true);
      } else {
        const query = this.updateNewInfo(rateNum);
        const s2: Statement = { query, params: [id] };
        return this.db.execBatch([s2, stmt], true);
      }
    } else {
      return Promise.resolve(-1);
    }
  }
  protected insertInfo(r: number): string {
    const rateCols: string[] = [];
    const ps: string[] = [];
    for (let i = 1; i <= this.max; i++) {
      rateCols.push(`${this.rate}${i}`);
      if (i === r) {
        ps.push('' + 1);
      } else {
        ps.push('0');
      }
    }
    const query = `
      insert into ${this.infoTable} (${this.id}, ${this.rate}, ${this.count}, ${this.score}, ${rateCols.join(',')})
      values (${this.db.param(1)}, ${r}, 1, ${r}, ${ps.join(',')})`;
    return query;
  }
  update(rate: R, oldRate: number): Promise<number> {
    const stmt = buildToUpdate(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      const obj: any = rate;
      const rateNum: number = obj[this.rateField];
      const id: string = obj[this.idField];
      const query = this.updateOldInfo(rateNum, oldRate);
      const s2: Statement = { query, params: [id] };
      return this.db.execBatch([s2, stmt], true);
    } else {
      return Promise.resolve(-1);
    }
  }
  protected updateNewInfo(r: number): string {
    const query = `
      update ${this.infoTable} set ${this.rate} = (${this.score} + ${r})/(${this.count} + 1), ${this.count} = ${this.count} + 1, ${this.score} = ${this.score} + ${r}, ${this.rate}${r} = ${this.rate}${r} + 1
      where ${this.id} = ${this.db.param(1)}`;
    return query;
  }
  protected updateOldInfo(newRate: number, oldRate: number): string {
    const delta = newRate - oldRate;
    const query = `
      update ${this.infoTable} set ${this.rate} = (${this.score} + ${delta})/${this.count}, ${this.score} = ${this.score} + ${delta}, ${this.rate}${newRate} = ${this.rate}${newRate} + 1, ${this.rate}${oldRate} = ${this.rate}${oldRate} - 1
      where ${this.id} = ${this.db.param(1)}`;
    return query;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class SqlInfoRepository<T> extends SqlLoader<T, string> implements InfoRepository<T> {
  constructor(public db: DB, table: string, attributes: Attributes, protected buildToSave: <K>(obj: K, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    super(db.query, table, attributes, db.param);
    this.save = this.save.bind(this);
  }
  async save(obj: T, ctx?: any): Promise<number> {
    const stmt = await this.buildToSave<T>(obj, this.table, this.attributes);
    if (stmt) {
      return this.db.exec(stmt.query, stmt.params, ctx);
    } else {
      return Promise.resolve(0);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class SqlCommentRepository<T> extends Repository<T, string> implements CommentRepository<T> {
  constructor(db: DB, table: string, attrs: Attributes, protected parent: string, idField?: string, authorField?: string, col?: string, author?: string, time?: string, id?: string, idCol?: string, authorCol?: string) {
    super(db, table, attrs);
    this.col = (col && col.length > 0 ? col : 'replycount');
    this.id = (id && id.length > 0 ? id : 'id');
    this.author = (author && author.length > 0 ? author : 'author');
    this.time = (time && time.length > 0 ? time : 'time');
    this.idField = (idField && idField.length > 0 ? idField : 'id');
    this.authorField = (authorField && authorField.length > 0 ? authorField : 'author');
    if (idCol && idCol.length > 0) {
      this.idCol = idCol;
    } else {
      const c = attrs[this.idField];
      if (c) {
        this.idCol = (c.column && c.column.length > 0 ? c.column : this.idField);
      } else {
        this.idCol = this.idField;
      }
    }
    if (authorCol && authorCol.length > 0) {
      this.authorCol = authorCol;
    } else {
      const c = attrs[this.authorField];
      if (c) {
        this.authorCol = (c.column && c.column.length > 0 ? c.column : this.authorField);
      } else {
        this.authorCol = this.authorField;
      }
    }
    this.insert = this.insert.bind(this);
    this.remove = this.remove.bind(this);
    this.getComments = this.getComments.bind(this);
  }
  col: string;
  id: string;
  author: string;
  time: string;
  protected idField: string;
  protected authorField: string;
  protected idCol: string;
  protected authorCol: string;
  insert(obj: T): Promise<number> {
    const stmt = buildToInsert(obj, this.table, this.attributes, this.param, this.version);
    if (stmt) {
      const query = `update ${this.parent} set ${this.col} = ${this.col} + 1 where ${this.id} = ${this.param(1)} and ${this.author} = ${this.param(2)}`;
      const ob: any = obj;
      const s2: Statement = { query, params: [ob[this.idField], ob[this.authorField]] };
      return this.execBatch([stmt, s2], true);
    } else {
      return Promise.resolve(0);
    }
  }
  remove(commentId: string, id: string, author: string): Promise<number> {
    const stmt = buildToDelete<string>(commentId, this.table, this.primaryKeys, this.param);
    if (stmt) {
      const query = `update ${this.parent} set ${this.col} = ${this.col} - 1 where ${this.id} = ${this.param(1)} and ${this.author} = ${this.param(2)}`;
      const s2: Statement = { query, params: [id, author] };
      return this.execBatch([stmt, s2]);
    } else {
      return Promise.resolve(0);
    }
  }
  getComments(id: string, author: string, limit?: number): Promise<T[]> {
    let sql = `select * from ${this.table} where ${this.idCol} = ${this.param(1)} and ${this.authorCol} = ${this.param(2)}`;
    if (limit && limit > 0) {
      sql = sql + ` order by ${this.time} desc limit ${limit}`;
    } else {
      sql = sql + ` order by ${this.time}`;
    }
    return this.query<T>(sql, [id, author], this.map).then(comments => {
      if (limit && limit > 0) {
        return revert<T>(comments);
      } else {
        return comments;
      }
    });
  }
}
export function revert<T>(arr: T[]): T[] {
  if (!arr || arr.length <= 1) {
    return arr;
  }
  const newArr: T[] = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    newArr.push(arr[i]);
  }
  return newArr;
}
// tslint:disable-next-line:max-classes-per-file
export class SqlRateReactionRepository implements RateReactionRepository {
  constructor(protected db: DB, protected table: string, protected attributes: Attributes,
    protected parent: string, col?: string, author?: string, id?: string) {
    this.col = (col && col.length > 0 ? col : 'replycount');
    this.id = (id && id.length > 0 ? id : 'id');
    this.author = (author && author.length > 0 ? author : 'author');
    this.exist = this.exist.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
  }
  protected col: string;
  protected id: string;
  protected author: string;
  protected exist(id: string, author: string, userId: string): Promise<boolean> {
    return this.db.query<RateReaction>(`select id from ${this.table} where id = ${this.db.param(1)} and author = ${this.db.param(2)} and userId = ${this.db.param(3)}`, [id, author, userId]).then(rates => {
      return rates && rates.length > 0 ? true : false;
    });
  }
  remove(id: string, author: string, userId: string): Promise<number> {
    const query1 = `delete from ${this.table} where id = ${this.db.param(1)} and author = ${this.db.param(2)} and userId= ${this.db.param(3)}`;
    const s1: Statement = { query: query1, params: [id, author, userId] };
    const query2 = `update ${this.parent} set ${this.col} = ${this.col} - 1 where ${this.id} = ${this.db.param(1)} and ${this.author} = ${this.db.param(2)}`;
    const s2: Statement = { query: query2, params: [id, author] };
    return this.db.execBatch([s1, s2], true);
  }
  save(id: string, author: string, userId: string, reaction: number): Promise<number> {
    const obj: RateReaction = { id, userId, author, time: new Date(), reaction };
    const stmt = buildToInsert(obj, this.table, this.attributes, this.db.param);
    if (stmt) {
      return this.exist(id, author, userId).then(ok => {
        if (ok === false) {
          const query = `update ${this.parent} set ${this.col} = ${this.col} + 1 where ${this.id} = ${this.db.param(1)} and ${this.author} = ${this.db.param(2)}`;
          const s2: Statement = { query, params: [id, author] };
          return this.db.execBatch([stmt, s2]);
        } else {
          return Promise.resolve(0);
        }
      });
    } else {
      return Promise.resolve(0);
    }
  }
}

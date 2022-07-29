import { Attributes, buildToDelete, buildToInsert, buildToUpdate, DB, metadata, Repository, SqlLoader, Statement, StringMap } from 'query-core';
import { InfoRepository, Rate, RateComment, RateCommentRepository, RateReaction, RateReactionRepository, RateRepository } from './core-query';

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

export class SqlRateRepository implements RateRepository {
  constructor(public db: DB, public table: string, public attributes: Attributes, protected buildToSave: <K>(obj: K, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined, public max: number, public infoTable: string, public id: string, public rate: string, public count: string, public score: string) {
    const m = metadata(attributes);
    this.map = m.map;
    this.getRate = this.getRate.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.insertInfo = this.insertInfo.bind(this);
    this.updateNewInfo = this.updateNewInfo.bind(this);
    this.updateOldInfo = this.updateOldInfo.bind(this);
  }
  map?: StringMap;
  getRate(id: string, author: string, ctx?: any): Promise<Rate | null> {
    return this.db.query<Rate>(`select * from ${this.table} where id = ${this.db.param(1)} and author = ${this.db.param(2)}`, [id, author], this.map, undefined, ctx).then(rates => {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  }
  insert(rate: Rate, newInfo?: boolean): Promise<number> {
    const stmt = buildToInsert(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      if (newInfo) {
        const query = this.insertInfo(rate.rate);
        const s2: Statement = {query, params: [rate.id]};
        return this.db.execBatch([s2, stmt], true);
      } else {
        const query = this.updateNewInfo(rate.rate);
        const s2: Statement = {query, params: [rate.id]};
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
  update(rate: Rate, oldRate: number): Promise<number> {
    const stmt = buildToUpdate(rate, this.table, this.attributes, this.db.param);
    if (stmt) {
      const query = this.updateOldInfo(rate.rate, oldRate);
      const s2: Statement = {query, params: [rate.id]};
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
export class SqlRateCommentRepository extends Repository<RateComment, string> implements RateCommentRepository {
  constructor(db: DB, table: string, attrs: Attributes, protected parent: string, col?: string, author?: string, id?: string) {
    super(db, table, attrs);
    this.col = (col && col.length > 0 ? col : 'replycount');
    this.id = (id && id.length > 0 ? id : 'id');
    this.author = (author && author.length > 0 ? author : 'author');
    this.insert = this.insert.bind(this);
    this.remove = this.remove.bind(this);
  }
  protected col: string;
  protected id: string;
  protected author: string;
  insert(obj: RateComment): Promise<number> {
    const stmt = buildToInsert(obj, this.table, this.attributes, this.param, this.version);
    if (stmt) {
      const query = `update ${this.parent} set ${this.col} = ${this.col} + 1 where ${this.id} = ${this.param(1)} and ${this.author} = ${this.param(2)}`;
      const s2: Statement = { query, params: [obj.id, obj.author]};
      return this.execBatch([stmt, s2], true);
    } else {
      return Promise.resolve(0);
    }
  }
  remove(commentId: string, id: string, author: string): Promise<number> {
    const stmt = buildToDelete<string>(commentId, this.table, this.primaryKeys, this.param);
    if (stmt) {
      const query = `update ${this.parent} set ${this.col} = ${this.col} - 1 where ${this.id} = ${this.param(1)} and ${this.author} = ${this.param(2)}`;
      const s2: Statement = { query, params: [id, author]};
      return this.execBatch([stmt, s2]);
    } else {
      return Promise.resolve(0);
    }
  }
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
    const s1: Statement = {query: query1, params: [id, author, userId]};
    const query2 = `update ${this.parent} set ${this.col} = ${this.col} - 1 where ${this.id} = ${this.db.param(1)} and ${this.author} = ${this.db.param(2)}`;
    const s2: Statement = {query: query2, params: [id, author]};
    return this.db.execBatch([s1, s2], true);
  }
  save(id: string, author: string, userId: string, reaction: number): Promise<number> {
    const obj: RateReaction = { id, userId, author, time: new Date(), reaction};
    const stmt = buildToInsert(obj, this.table, this.attributes, this.db.param);
    if (stmt) {
      return this.exist(id, author, userId).then(ok => {
        if (ok === false) {
          const query = `update ${this.parent} set ${this.col} = ${this.col} + 1 where ${this.id} = ${this.db.param(1)} and ${this.author} = ${this.db.param(2)}`;
          const s2: Statement = {query, params: [id, author]};
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

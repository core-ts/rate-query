import { metadata, Repository } from 'query-core';
import { Attributes, DB, Statement, StringMap } from 'query-core';
import { Info, InfoRepository, Rate, RateComment, RateCommentRepository, RateId, RateReaction, RateReactionRepository, RateRepository } from './core-query';

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

export class SqlInfoRepository extends Repository<Info, string> implements InfoRepository {
  constructor(db: DB, table: string, attributes: Attributes, protected buildToSave: <T>(obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    super(db, table, attributes);
    this.save = this.save.bind(this);
  }
  async save(obj: Info, ctx?: any): Promise<number> {
    const stmt = await this.buildToSave(obj, this.table, this.attributes);
    if (stmt) {
      return this.exec(stmt.query, stmt.params, ctx);
    } else {
      return Promise.resolve(0);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class SqlRateCommentRepository extends Repository<RateComment, string> implements RateCommentRepository {
  constructor(db: DB, table: string, attrs: Attributes, protected buildToSave: <T>(obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    super(db, table, attrs);
    this.save = this.save.bind(this);
  }
  save(obj: RateComment, ctx?: any): Promise<number> {
    const stmt = this.buildToSave(obj, this.table, this.attributes);
    if (stmt) {
      return this.exec(stmt.query, stmt.params, ctx);
    } else {
      return Promise.resolve(0);
    }
  }
}
// tslint:disable-next-line:max-classes-per-file
export class SqlRateReactionRepository implements RateReactionRepository {
  constructor(protected db: DB, protected table: string, protected attributes: Attributes,
    protected buildToSave: <T>(obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    this.save = this.save.bind(this);
    this.getUseful = this.getUseful.bind(this);
    this.removeUseful = this.removeUseful.bind(this);
    const meta = metadata(attributes);
    this.map = meta.map;
  }
  map?: StringMap;
  getUseful(id: string, author: string, userId: string, ctx?: any): Promise<RateReaction | null> {
    return this.db.query<RateReaction>(`select * from ${this.table} where id = ${this.db.param(1)} and author = ${this.db.param(2)} and userId = ${this.db.param(3)}`, [id, author, userId], this.map, undefined, ctx).then(rates => {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  }
  removeUseful(id: string, author: string, userId: string, ctx?: any): Promise<number> {
    return this.db.exec(`delete from ${this.table} where id = ${this.db.param(1)} and author = ${this.db.param(2)} and  userId= ${this.db.param(3)}`, [id, author, userId], ctx);
  }
  save(obj: RateReaction, ctx?: any): Promise<number> {
    const stmt = this.buildToSave(obj, this.table, this.attributes);
    if (stmt) {
      return this.db.exec(stmt.query, stmt.params, ctx);
    } else {
      return Promise.resolve(0);
    }
  }
}

// tslint:disable-next-line:max-classes-per-file
export class SqlRateRepository extends Repository<Rate, RateId> implements RateRepository {
  constructor(db: DB, table: string, attributes: Attributes, protected buildToSave: <T>(obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    super(db, table, attributes);
    this.save = this.save.bind(this);
    this.getRate = this.getRate.bind(this);
    this.increaseUsefulCount = this.increaseUsefulCount.bind(this);
    this.decreaseUsefulCount = this.decreaseUsefulCount.bind(this);
    this.increaseReplyCount = this.increaseReplyCount.bind(this);
    this.decreaseReplyCount = this.decreaseReplyCount.bind(this);
  }
  getRate(id: string, author: string, ctx?: any): Promise<Rate | null> {
    return this.query<Rate>(`select * from ${this.table} where id = ${this.param(1)} and author = ${this.param(2)}`, [id, author], this.map, undefined, ctx).then(rates => {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  }
  save(obj: Rate, ctx?: any): Promise<number> {
    const stmt = this.buildToSave(obj, this.table, this.attributes);
    if (stmt) {
      return this.exec(stmt.query, stmt.params, ctx);
    } else {
      return Promise.resolve(0);
    }
  }
  increaseUsefulCount(id: string, author: string, ctx?: any): Promise<number> {
    return this.exec(`update ${this.table} set usefulCount = usefulCount + 1 where id = ${this.param(1)} and author = ${this.param(2)}`, [id, author], ctx);
  }
  decreaseUsefulCount(id: string, author: string, ctx?: any): Promise<number> {
    return this.exec(`update ${this.table} set usefulCount = usefulCount - 1 where id = ${this.param(1)} and author = ${this.param(2)}`, [id, author], ctx);
  }
  increaseReplyCount(id: string, author: string, ctx?: any): Promise<number> {
    return this.exec(`update ${this.table} set replyCount = replyCount + 1 where id = ${this.param(1)} and author = ${this.param(2)}`, [id, author], ctx);
  }
  decreaseReplyCount(id: string, author: string, ctx?: any): Promise<number> {
    return this.exec(`update ${this.table} set replyCount = replyCount - 1 where id = ${this.param(1)} and author = ${this.param(2)}`, [id, author], ctx);
  }
}

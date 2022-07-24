import { Attributes, buildToDelete, buildToInsert, DB, Repository, Statement } from 'query-core';
import { InfoRepository, Rate, RateComment, RateCommentRepository, RateId, RateReaction, RateReactionRepository, RateRepository } from './core-query';

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

export class SqlRateRepository extends Repository<Rate, RateId> implements RateRepository {
  constructor(db: DB, table: string, attributes: Attributes, protected buildToSave: <T>(obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    super(db, table, attributes);
    this.save = this.save.bind(this);
    this.getRate = this.getRate.bind(this);
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
}
// tslint:disable-next-line:max-classes-per-file
export class SqlInfoRepository<T> extends Repository<T, string> implements InfoRepository<T> {
  constructor(db: DB, table: string, attributes: Attributes, protected buildToSave: <T>(obj: T, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined) {
    super(db, table, attributes);
    this.save = this.save.bind(this);
  }
  async save(obj: T, ctx?: any): Promise<number> {
    const stmt = await this.buildToSave<T>(obj, this.table, this.attributes);
    if (stmt) {
      return this.exec(stmt.query, stmt.params, ctx);
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

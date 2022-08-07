import { Attributes, buildToInsert, buildToUpdate, DB, metadata, Statement, StringMap } from 'query-core';
import { RateRepository } from './core-query';

export * from './core-query';

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
    this.load = this.load.bind(this);
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
  load(id: string, author: string, ctx?: any): Promise<R | null> {
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
export interface BaseRate {
  rate: number;
  rates: number[];
}
export function avg(n: number[]): number {
  let sum = 0;
  for (const s of n) {
    sum = sum + s;
  }
  return sum / n.length;
}
export class SqlRatesRepository<R extends BaseRate> {
  constructor(public db: DB, public table: string, public fullTable: string, public tables: string[], public attributes: Attributes,
    protected buildToSave: <K>(obj: K, table: string, attrs: Attributes, ver?: string, buildParam?: (i: number) => string, i?: number) => Statement | undefined,
    public max: number, rateField?: string, count?: string, score?: string, authorCol?: string, id?: string, idField?: string, idCol?: string,
    rateCol?: string) {
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
    this.load = this.load.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.insertInfo = this.insertInfo.bind(this);
    this.insertFullInfo = this.insertFullInfo.bind(this);
    this.updateFullInfo = this.updateFullInfo.bind(this);
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

  load(id: string, author: string, ctx?: any): Promise<R | null> {
    return this.db.query<R>(`select * from ${this.table} where ${this.idCol} = ${this.db.param(1)} and ${this.authorCol} = ${this.db.param(2)}`, [id, author], this.map, undefined, ctx).then(rates => {
      return rates && rates.length > 0 ? rates[0] : null;
    });
  }
  insert(rate: R, newInfo?: boolean): Promise<number> {
    if (rate.rates.length !== this.tables.length) {
      return Promise.reject('Invalid rates length');
    }
    const obj: any = rate;
    const id: string = obj[this.idField];
    const mainStmt = buildToInsert<R>(rate, this.table, this.attributes, this.db.param);
    if (!mainStmt) {
      return Promise.reject('cannot build to insert rate');
    }
    const stmts: Statement[] = [];
    if (newInfo) {
      for (let i = 0; i < rate.rates.length; i++) {
        const sql = this.insertInfo(rate.rates[i], this.tables[i]);
        stmts.push({ query: sql, params: [id] });
      }
      const fullStmt: Statement = { query: this.insertFullInfo(rate.rate, this.fullTable, this.tables), params: [id, id, id, id, id, id] };
      stmts.push(fullStmt);
      console.log(fullStmt);
      stmts.push(mainStmt);
      return this.db.execBatch(stmts, true);
    } else {
      const fullStmt: Statement = { query: this.updateFullInfo(rate.rate, this.fullTable, this.tables), params: [id, id, id, id, id, id] };
      stmts.push(fullStmt);
      for (let i = 0; i < rate.rates.length; i++) {
        const sql = this.updateNewInfo(rate.rates[i], this.tables[i]);
        stmts.push({ query: sql, params: [id] });
      }
      stmts.push(mainStmt);
      return this.db.execBatch(stmts, true);
    }
  }
  protected insertInfo(r: number, table: string): string {
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
      insert into ${table} (${this.id}, ${this.rate}, ${this.count}, ${this.score}, ${rateCols.join(',')})
      values (${this.db.param(1)}, ${r}, 1, ${r}, ${ps.join(',')})`;
    return query;
  }
  protected insertFullInfo(r: number, table: string, tables: string[]): string {
    const rateCols: string[] = [];
    const s: string[] = [];
    for (let i = 1; i <= tables.length; i++) {
      rateCols.push(`${this.rate}${i}`);
      s.push(`(select avg(${this.rate}) from ${tables[i - 1]} where ${this.id} = ${this.db.param(i)} group by ${this.id})`);
    }
    const query = `
      insert into ${table} (${this.id}, ${this.rate}, ${this.count}, ${this.score}, ${rateCols.join(', ')})
      values (${this.db.param(6)}, ${r}, 1, ${r}, ${s.join(',')})`;
    return query;
  }
  protected updateFullInfo(r: number, table: string, tables?: string[]): string {
    if (tables && tables.length > 0) {
      const s: string[] = [];
      for (let i = 1; i <= tables.length; i++) {
        s.push(`${this.rate}${i} = (select avg(${this.rate}) from ${tables[i - 1]} where ${this.id} = ${this.db.param(i)} group by ${this.id})`);
      }
      const query = `
        update ${table} set ${this.rate} = (${this.score} + ${r})/(${this.count} + 1), ${this.score} = ${this.score} + ${r},${this.count} = ${this.count} + 1, ${s.join(',')}
        where ${this.id} = ${this.db.param(6)}`;
      return query;
    } else {
      const query = `
        update ${table} set ${this.rate} = (${this.score} + ${r})/(${this.count} + 1), ${this.score} = ${this.score} + ${r}, ${this.count} = ${this.count} + 1
        where ${this.id} = ${this.db.param(6)}`;
      return query;
    }
  }
  protected updateNewInfo(r: number, table: string): string {
    const query = `
      update ${table} set ${this.rate} = (${this.score} + ${r})/(${this.count} + 1), ${this.count} = ${this.count} + 1, ${this.score} = ${this.score} + ${r}, ${this.rate}${r} = ${this.rate}${r} + 1
      where ${this.id} = ${this.db.param(1)}`;
    return query;
  }
  protected updateOldInfo(newRate: number, oldRate: number, table: string, tables?: string[]): string {
    const delta = newRate - oldRate;
    const s: string[] = [];
    if (tables && tables.length > 0) {
      for (let i = 1; i <= tables.length; i++) {
        s.push(`${this.rate}${i} = (select avg(${this.rate}) from ${tables[i - 1]} where ${this.id} = ${this.db.param(i)} group by ${this.id})`);
      }
      const query = `
        update ${table} set ${this.rate} = (${this.score} + ${delta})/${this.count}, ${this.score} = ${this.score} + ${delta}, ${this.count} = ${this.count}, ${s.join(',')}
        where ${this.id} = ${this.db.param(6)}`;
      return query;
    } else {
      const query = `
        update ${table} set ${this.rate} = (${this.score} + ${delta})/${this.count}, ${this.score} = ${this.score} + ${delta}, ${this.count} = ${this.count}
        where ${this.id} = ${this.db.param(6)}`;
      return query;
    }
  }
  update(rate: R, oldRate: number): Promise<number> {
    const rates = rate.rates;
    const r = rate.rate;
    const stmts: Statement[] = [];
    const stmt = buildToUpdate(rate, this.table, this.attributes, this.db.param);
    if (r && rates && rates.length > 0) {
      if (stmt) {
        const obj: any = rate;
        const id: string = obj[this.idField];
        for (let i = 0; i < rate.rates.length; i++) {
          const sql = this.updateNewInfo(rate.rates[i], this.tables[i]);
          stmts.push({ query: sql, params: [id] });
        }
        const query: Statement = { query: this.updateOldInfo(rate.rate, oldRate, this.fullTable, this.tables), params: [id, id, id, id, id, id] };
        stmts.push(query);
        stmts.push(stmt);
        return this.db.execBatch(stmts, true);
      } else {
        return Promise.resolve(-1);
      }
    } else {
      if (!stmt) {
        return Promise.reject('cannot build to insert rate');
      } else {
        stmts.push(stmt);
        return this.db.execBatch(stmts, true);
      }
    }
  }
}

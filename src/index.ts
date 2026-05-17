export type DataType =
  | "ObjectId"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "number"
  | "integer"
  | "string"
  | "text"
  | "object"
  | "array"
  | "binary"
  | "primitives"
  | "booleans"
  | "numbers"
  | "integers"
  | "strings"
  | "dates"
  | "datetimes"
  | "times"
export type Operator = "=" | "like" | "!=" | "<>" | ">" | ">=" | "<" | "<="

export interface Attribute {
  name?: string
  column?: string
  type?: DataType
  operator?: Operator
  default?: string | number | Date | boolean
  key?: boolean
  q?: boolean
  noinsert?: boolean
  noupdate?: boolean
  nopatch?: boolean
  version?: boolean
  ignored?: boolean
  true?: string | number
  false?: string | number
  createdAt?: boolean
  updatedAt?: boolean
}
export interface Attributes {
  [key: string]: Attribute
}
export interface Statement {
  query: string;
  params?: any[];
}
interface StringMap {
  [key: string]: string;
}
export interface DB {
  // driver: string
  param(i: number): string
  // execute(sql: string, args?: any[], ctx?: any): Promise<number>
  executeBatch(statements: Statement[], firstSuccess?: boolean, ctx?: any): Promise<number>
  // query<T>(sql: string, args?: any[], m?: StringMap, bools?: Attribute[], ctx?: any): Promise<T[]>
}

export interface UsefulRepository {
  setUseful(rateId: string, userId: string): Promise<number>
  removeUseful(rateId: string, userId: string): Promise<number>
}
export interface RateReaction {
  rateId: string;
  userId: string;
  time: Date;
  reaction: number;
}
export class SqlUsefulRepository implements UsefulRepository {
  constructor(protected db: DB, protected usefulTable: string, protected attributes: Attributes, protected buildToSave: (obj: RateReaction, table: string, attrs: Attributes) => Statement,
      protected rateTable: string, protected rateIdCol: string, protected usefulCol: string) {
    this.setUseful = this.setUseful.bind(this)
    this.removeUseful = this.removeUseful.bind(this)
  }
  setUseful(rateId: string, userId: string): Promise<number> {
    const obj: RateReaction = { rateId, userId, time: new Date(), reaction: 1 };
    const stm1 = this.buildToSave(obj, this.usefulTable, this.attributes)
    const query = `update ${this.rateTable} set ${this.usefulCol} = ${this.usefulCol} + 1 where ${this.rateIdCol} = ${this.db.param(1)}`
    const stm2: Statement = { query, params: [rateId] }
    return this.db.executeBatch([stm1, stm2], true)
  }
  removeUseful(rateId: string, userId: string): Promise<number> {
    const atr1 = this.attributes["rateId"] as Attribute
    const atr2 = this.attributes["userId"] as Attribute
    const col1 = atr1.column ? atr1.column : "rateid"
    const col2 = atr2.column ? atr2.column : "userid"
    const query1 = `delete from ${this.usefulTable} where ${col1} = ${this.db.param(1)} and ${col2} = ${this.db.param(2)}`
    const stm1: Statement = {query: query1, params: [rateId, userId] }
    const query2 = `update ${this.rateTable} set ${this.usefulCol} = ${this.usefulCol} - 1 where ${this.rateIdCol} = ${this.db.param(1)}`
    const stm2: Statement = { query: query2, params: [rateId] }
    return this.db.executeBatch([stm1, stm2], true)
  }
}

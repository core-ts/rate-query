export type DataType = 'ObjectId' | 'date' | 'datetime' | 'time'
  | 'boolean' | 'number' | 'integer' | 'string' | 'text'
  | 'object' | 'array' | 'binary'
  | 'primitives' | 'booleans' | 'numbers' | 'integers' | 'strings' | 'dates' | 'datetimes' | 'times';
export type FormatType = 'currency' | 'percentage' | 'email' | 'url' | 'phone' | 'fax' | 'ipv4' | 'ipv6';
export type MatchType = 'equal' | 'prefix' | 'contain' | 'max' | 'min'; // contain: default for string, min: default for Date, number

export interface Attribute {
  name?: string;
  field?: string;
  column?: string;
  type?: DataType;
  format?: FormatType;
  required?: boolean;
  match?: MatchType;
  default?: string|number|Date|boolean;
  key?: boolean;
  unique?: boolean;
  enum?: string[] | number[];
  q?: boolean;
  noinsert?: boolean;
  noupdate?: boolean;
  nopatch?: boolean;
  version?: boolean;
  length?: number;
  min?: number;
  max?: number;
  gt?: number;
  lt?: number;
  precision?: number;
  scale?: number;
  exp?: RegExp | string;
  code?: string;
  noformat?: boolean;
  ignored?: boolean;
  jsonField?: string;
  link?: string;
  typeof?: Attributes;
  true?: string|number;
  false?: string|number;
}
export interface Attributes {
  [key: string]: Attribute;
}
export interface ViewRepository<T, ID> {
  metadata?(): Attributes|undefined;
  keys?(): string[];
  all?(ctx?: any): Promise<T[]>;
  load(id: ID, ctx?: any): Promise<T|null>;
  exist?(id: ID, ctx?: any): Promise<boolean>;
}
export interface Repository<T, ID> extends ViewRepository<T, ID> {
  insert(obj: T, ctx?: any): Promise<number>;
  update(obj: T, ctx?: any): Promise<number>;
  patch?(obj: T, ctx?: any): Promise<number>;
  save?(obj: T, ctx?: any): Promise<number>;
  delete(id: ID, ctx?: any): Promise<number>;
}
export interface RateRepository<R> {
  insert(rate: R, newInfo?: boolean): Promise<number>;
  update(rate: R, oldRate: number): Promise<number>;
  getRate(id: string, author: string): Promise<R | null>;
}
export interface InfoRepository<T> extends ViewRepository<T, string> {
  save(obj: T, ctx?: any): Promise<number>;
}
export interface Reaction {
  id: string;
  author: string;
  userId: string;
  time: Date;
  reaction: number;
}
export interface ReactionRepository {
  remove(id: string, author: string, userId: string, ctx?: any): Promise<number>;
  save(id: string, author: string, userId: string, type: number): Promise<number>;
}
export interface CommentRepository<T> extends Repository<T, string> {
  remove(commentId: string, id: string, author: string): Promise<number>;
  getComments(id: string, author: string, limit?: number): Promise<T[]>;
}

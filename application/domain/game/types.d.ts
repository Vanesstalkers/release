import { ObjectId } from 'mongodb';

/* type ScalarValue = string | number | undefined;

export interface GameClass {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  logger: { db: Function; debug: Function };
}
 */

/**
 *
 */
interface GameObjectData {
  /**
   * ObjectID-идентификатор
   */
  _id: ObjectId;
}
interface GameObjectConfig {
  col: string;
  parent: GameObject;
}

export class GameObject {
  /**
   * ObjectID-идентификатор
   */
  _id: ObjectId;
  col: string;
  constructor(data: GameObjectData, config: GameObjectConfig);
  getParent(): GameObject;
}

class HasDeckClass {
  addDeck(): GameObject;
}

interface CardData extends GameObjectData {
  /**
   * 123123213
   */
  name: string;
}
export class Card extends HasDeckClass extends GameObject {
  constructor(data: CardData, config: GameObjectConfig);
  moveToTarget(target: object): object;
}
/* 
export class Query {
  constructor(
    db: Database,
    table: string,
    fields: Array<string>,
    ...where: Array<object>
  );
  order(field: string | Array<string>): Query;
  desc(field: string | Array<string>): Query;
  limit(count: number): Query;
  offset(count: number): Query;
  then(resolve: (rows: Array<object>) => void, reject: Function): void;
  toString(): string;
  toObject(): QueryObject;
  static from(db: Database, metadata: QueryObject): Query;
}

interface QueryObject {
  table: string;
  fields: string | Array<string>;
  where?: Array<object>;
  options: Array<object>;
}

export class Modify {
  constructor(db: Database, sql: string, args: Array<string>);
  returning(field: string | Array<string>): Modify;
  then(resolve: (rows: Array<object>) => void, reject: Function): void;
  toString(): string;
  toObject(): ModifyObject;
  static from(db: Database, metadata: ModifyObject): Modify;
}

interface ModifyObject {
  sql: string;
  args: Array<string>;
  options: Array<object>;
}
 */

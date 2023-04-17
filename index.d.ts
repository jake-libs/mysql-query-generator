import { UseCache } from "./src/cache";
import Keys from "./src/keys";
import { UseParser } from "./src/parser";
import { InputData, MysqlQueryGeneratorInstance, MysqlQueryGeneratorType, Data, SqlParser } from "./types";

export class MysqlQueryGenerator implements MysqlQueryGeneratorInstance {
  [Keys.Tables]: SqlParser.Tables;
  [Keys.FromTables]: SqlParser.FromTables;
  [Keys.InitTable]: string | Data.FromTable;
  [Keys.SelectColumns]: SqlParser.SelectColumns;
  [Keys.WhereConditions]: SqlParser.WhereConditions;
  [Keys.JoinOptions]: SqlParser.JoinOptions;
  [Keys.OrderByConditions]: SqlParser.OrderByConditions;
  [Keys.LimitOption]: SqlParser.LimitOption;
  [Keys.UpdateColumns]: SqlParser.UpdateColumns;
  [Keys.InsertColumns]: SqlParser.InsertColumns;
  [Keys.Cache]: UseCache;
  [Keys.Parser]: UseParser;
  constructor(table: string | Data.FromTable);

  select(columns: InputData.SelectColumns | InputData.SelectColumns[]): this;
  from(tables: InputData.FromTables | InputData.FromTables[]): this;
  where(conditions: InputData.WhereConditions | InputData.WhereConditions[]): this;
  orderBy(conditions: InputData.OrderByConditions | InputData.OrderByConditions[]): this;
  join(options: InputData.JoinOptions | InputData.JoinOptions[]): this;
  limit(page: number, pageSize: number): this;
  updateColumns(columns: InputData.UpdateColumns | InputData.UpdateColumns[]): this;
  insertColumns(columns: InputData.InsertColumns | InputData.InsertColumns[]): this;

  resetAll(): void;
  execute(type?: MysqlQueryGeneratorType | undefined): string;
  get defaultTableName(): string;

  setTable(table: Data.Table): void;
  [Keys.ParseSelect](): string;
  [Keys.ParseInsert](): string;
  [Keys.ParseUpdate](): string;
  [Keys.ParseDelete](): string;
}

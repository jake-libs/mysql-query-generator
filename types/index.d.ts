import { UseCache } from "../src/cache";
import Keys from "../src/keys";
import { UseParser } from "../src/parser";

export namespace Data {
  interface Table {
    name: string;
    as?: string;
  }
  interface SelectColumn {
    column?: string;
    table?: string;
    as?: string;
    raw?: string;
  }
  type FromTable = Table;
  // interface WhereCondition {
  //   column?: string;
  //   table?: string;
  //   operator?:string;
  //   targetTable?: string;
  //   value?: any;
  //   raw?: string;
  //   rawValue?: any;
  // }
  interface WhereConditionField {
    table?: string;
    column?: string;
    raw?: string;
  }
  type WhereCondition = [WhereConditionField, (string | -1)?, (WhereConditionField | -1)?];
  // type WhereCondition
  interface OrderByCondition {
    column: string;
    direction?: "desc" | "asc" | "DESC" | "ASC";
    table?: string;
  }
  interface LimitOption {
    page: number;
    pageSize: number;
  }
  interface JoinOption {
    on: SqlParser.WhereConditions;
    type?: "LEFT" | "RIGHT";
    table: Table["name"];
    as?: Table["alias"];
  }
  type UpdateColumn = WhereCondition;
  type InsertColumn = string;
}

export namespace InputData {
  type Table = Data.Table | string;
  type SelectColumns = string | Data.SelectColumn | Array<Data.SelectColumn | string>;
  type FromTables = string | Data.FromTable | Array<Data.FromTable | string>;

  type WhereConditionField = string | Data.WhereConditionField;
  type WhereCondition = [InputData.WhereConditionField, string?, InputData.WhereConditionField?] | [InputData.WhereConditionField, InputData.WhereConditionField?];
  type WhereConditions = InputData.WhereCondition | Array<InputData.WhereCondition>;
  type OrderByConditions = string | Data.OrderByCondition | Array<string | Data.OrderByCondition>;
  interface JoinOption extends Data.JoinOption {
    on: InputData.WhereConditions;
  }
  type JoinOptions = JoinOption | JoinOption[];
  type LimitOption = Data.LimitOption;
  type UpdateColumns = InputData.WhereConditions | Record<string, any>;
  type InsertColumns = Data.InsertColumn[] | Record<string, any>;
}

export namespace SqlParser {
  type SelectColumns = Map<string | symbol, Data.SelectColumn>;
  type FromTables = Data.FromTable[];
  type Tables = Map<string, Data.Table>;
  type WhereConditions = Data.WhereCondition[];
  type JoinOptions = Data.JoinOption[];
  type OrderByConditions = Data.OrderByCondition[];
  type LimitOption = Data.LimitOption | null;
  type UpdateColumns = Data.UpdateColumn[];
  type InsertColumns = { columns: Data.InsertColumn[]; length: number } | null;
}

export type MysqlQueryGeneratorType = "select" | "update" | "delete" | "insert";

export interface MysqlQueryGeneratorInstance {
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

  readonly defaultTableName: string;

  _setTable(table: Data.Table): void;
  select(columns: InputData.SelectColumns): this;
  from(tables: InputData.FromTables): this;
  where(conditions: InputData.WhereConditions): this;
  orderBy(conditions: InputData.OrderByConditions): this;
  join(options: InputData.JoinOptions): this;
  limit(page: number, pageSize: number): this;
  updateColumns(columns: InputData.UpdateColumns): this;
  insertColumns(columns: InputData.InsertColumns): this;
  [Keys.ParseSelect](): string;
  [Keys.ParseInsert](): string;
  [Keys.ParseUpdate](): string;
  [Keys.ParseDelete](): string;
  resetAll(): void;
  execute(type?: MysqlQueryGeneratorType): string;
}

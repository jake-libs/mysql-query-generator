import { Data, InputData, MysqlQueryGeneratorInstance, MysqlQueryGeneratorType, SqlParser } from "../types";
import useCache, { UseCache } from "./cache";
import Keys from "./keys";
import useParser, { UseParser } from "./parser";

class MysqlQueryGenerator implements MysqlQueryGeneratorInstance {
  [Keys.Tables]: SqlParser.Tables = new Map();
  [Keys.FromTables]: SqlParser.FromTables = [];
  [Keys.SelectColumns]: SqlParser.SelectColumns = new Map();
  [Keys.WhereConditions]: SqlParser.WhereConditions = [];
  [Keys.JoinOptions]: SqlParser.JoinOptions = [];
  [Keys.OrderByConditions]: SqlParser.OrderByConditions = [];
  [Keys.LimitOption]: SqlParser.LimitOption = null;
  [Keys.UpdateColumns]: SqlParser.UpdateColumns = [];
  [Keys.InsertColumns]: SqlParser.InsertColumns = null;
  // @ts-ignore
  [Keys.InitTable]: InputData.Table;
  //設置cache
  [Keys.Cache]: UseCache = useCache();
  // @ts-ignore
  [Keys.Parser]: UseParser;
  constructor(table: InputData.Table) {
    this.from(table);
    this[Keys.InitTable] = table;

    this[Keys.Parser] = useParser(
      (name) => this[Keys.Tables].get(name),
      () => this.defaultTableName
    );
  }

  get defaultTableName() {
    const cache = this[Keys.Cache].value;
    if (!cache.defaultTableName) {
      cache.defaultTableName = this[Keys.Parser].table.getAliasedName(this[Keys.Tables].values().next().value);
    }
    return cache.defaultTableName;
  }

  select(columns: InputData.SelectColumns) {
    if (!columns) return this;
    if (!(columns instanceof Array)) {
      columns = [columns];
    }

    const selectColumnMap = this[Keys.SelectColumns];

    for (const column of columns) {
      if (!column) continue;
      if (typeof column === "string") {
        selectColumnMap.set(column, {
          name: column,
        });
      } else if (column.name || column.raw) {
        selectColumnMap.set(column.name || Symbol(), column);
      }
    }

    // console.log("columns :>> ", selectColumnMap.values());
    return this;
  }

  setTable(table: Data.Table) {
    this[Keys.Tables].set(table.name, table);
  }

  from(tables: InputData.FromTables) {
    if (!tables) return this;
    if (!(tables instanceof Array)) {
      tables = [tables];
    }

    const fromTables = this[Keys.FromTables];
    for (const table of tables) {
      if (!table) continue;
      if (typeof table === "string") {
        fromTables.push({ name: table });
        this.setTable({ name: table });
      } else if (table.name) {
        fromTables.push(table);
        this.setTable(table);
      }
    }

    // console.log("tables :>> ", fromTables);
    return this;
  }

  where(conditions: InputData.WhereConditions) {
    if (!conditions) return this;
    if (!(conditions instanceof Array)) {
      conditions = [conditions];
    }

    const whereConditions = this[Keys.WhereConditions];
    whereConditions.push(...this[Keys.Parser].resolveConditionsInput(conditions));

    // console.log("conditions :>> ", whereConditions);
    return this;
  }

  orderBy(conditions: InputData.OrderByConditions) {
    if (!conditions) return this;
    if (!(conditions instanceof Array)) {
      conditions = [conditions];
    }

    const orderByConditions = this[Keys.OrderByConditions];
    for (const condition of conditions) {
      if (!condition) continue;
      if (typeof condition === "string") {
        orderByConditions.push({
          column: condition,
        });
      } else if (condition.column) {
        orderByConditions.push(condition);
      }
    }
    // console.log("orderByConditions :>> ", orderByConditions);
    return this;
  }

  join(options: InputData.JoinOptions) {
    if (!(options instanceof Array)) {
      options = [options];
    }

    const joinOptions = this[Keys.JoinOptions];
    for (const option of options) {
      if (!option || !option.table || !option.on) continue;
      option.on = this[Keys.Parser].resolveConditionsInput(option.on);
      if (!option.on.length) continue;

      this.setTable({ name: option.table, alias: option.tableAlias });
      joinOptions.push(option);
    }

    return this;
  }

  limit(page: InputData.LimitOption["page"] = 1, pageSize: InputData.LimitOption["pageSize"] = 10) {
    if (!page || !pageSize) return this;
    this[Keys.LimitOption] = { page, pageSize };
    return this;
  }

  /**
   *
   * @param columns
   * @param isData
   * @returns
   */
  updateColumns(columns: InputData.UpdateColumns, isData = false) {
    if (!columns) return this;
    const updateColumns = this[Keys.UpdateColumns];
    if (isData) {
      Object.keys(columns).forEach((key) => {
        updateColumns.push({
          column: key,
        });
      });
    } else {
      if (!(columns instanceof Array)) {
        columns = [columns];
      }
      updateColumns.push(...this[Keys.Parser].resolveConditionsInput(columns));
    }
    return this;
  }

  /**
   *
   * @param columns
   * @param length
   * @returns
   */
  insertColumns(columns: InputData.InsertColumns, length = 1) {
    if (!(columns instanceof Array)) {
      columns = Object.keys(columns);
    }
    this[Keys.InsertColumns] = this[Keys.InsertColumns] || { columns: [], length: 1 };
    const insertColumns = this[Keys.InsertColumns] as NonNullable<SqlParser.InsertColumns>;
    insertColumns.columns.push(...(columns as Data.InsertColumn[]));
    insertColumns.length = length;

    // console.log("insertColumns :>> ", insertColumns);
    return this;
  }

  [Keys.ParseSelect]() {
    const toSqlParser = this[Keys.Parser].toSql;
    const sql = "SELECT <columns> <tables> <whereConditions> <joinOptions> <orderByConditions> <limitOption>";
    return sql
      .replace("<columns>", toSqlParser.selectColumns(this[Keys.SelectColumns]))
      .replace("<tables>", toSqlParser.fromTables(this[Keys.FromTables]))
      .replace("<whereConditions>", toSqlParser.whereConditions(this[Keys.WhereConditions]))
      .replace("<joinOptions>", toSqlParser.joinOptions(this[Keys.JoinOptions]))
      .replace("<orderByConditions>", toSqlParser.orderByConditions(this[Keys.OrderByConditions]))
      .replace("<limitOption>", toSqlParser.limitOption(this[Keys.LimitOption]));
  }

  [Keys.ParseUpdate]() {
    const toSqlParser = this[Keys.Parser].toSql;
    const sql = "UPDATE <tables> <columns> <whereConditions>";
    return sql
      .replace("<tables>", toSqlParser.tables(this[Keys.FromTables]))
      .replace("<columns>", toSqlParser.updateColumns(this[Keys.UpdateColumns]))
      .replace("<whereConditions>", toSqlParser.whereConditions(this[Keys.WhereConditions]));
  }
  [Keys.ParseInsert]() {
    const toSqlParser = this[Keys.Parser].toSql;
    const sql = "INSERT INTO <tables> <columns> <values>";
    const insertColumns = this[Keys.InsertColumns];
    return sql
      .replace("<tables>", toSqlParser.tables(this[Keys.FromTables]))
      .replace("<columns>", toSqlParser.insertColumns(insertColumns))
      .replace("<values>", toSqlParser.insertColumnValues(insertColumns));
  }
  [Keys.ParseDelete]() {
    const toSqlParser = this[Keys.Parser].toSql;
    const sql = "DELETE <tables> <whereConditions>";
    return sql.replace("<tables>", toSqlParser.fromTables(this[Keys.FromTables])).replace("<whereConditions>", toSqlParser.whereConditions(this[Keys.WhereConditions]));
  }

  resetAll() {
    this[Keys.Tables] = new Map();
    this[Keys.FromTables] = [];
    this[Keys.SelectColumns] = new Map();
    this[Keys.WhereConditions] = [];
    this[Keys.JoinOptions] = [];
    this[Keys.OrderByConditions] = [];
    this[Keys.LimitOption] = null;
    this[Keys.UpdateColumns] = [];
    this[Keys.InsertColumns] = null;

    this.from(this[Keys.InitTable]);
    const cache = this[Keys.Cache];
    cache.reset();
    return this;
  }

  execute(type: MysqlQueryGeneratorType = "select") {
    const ParserMap = {
      select: () => this[Keys.ParseSelect](),
      update: () => this[Keys.ParseUpdate](),
      insert: () => this[Keys.ParseInsert](),
      delete: () => this[Keys.ParseDelete](),
    };

    if (!(type in ParserMap)) {
      throw new TypeError("type must be one of select, update, delete, insert.");
    }

    const sql = ParserMap[type]();
    console.log("sql :>> ", sql);
    this.resetAll();
    return sql;
  }
}

export default MysqlQueryGenerator;
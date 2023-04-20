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

  /**
   * @param columns - [col, col, col...] OR col
   * @param defaultTable 將會覆蓋本次select中非raw並且col沒有指定table的欄位
   * @returns 
   * @example select("col") = select({column:"col"}) -> "table.col"
   * @example select({column:"col", table:"manager"}) -> "manager.col"
   */
  select(columns: InputData.SelectColumns, defaultTable?: string) {
    if (!columns) return this;
    if (!(columns instanceof Array)) {
      columns = [columns];
    }

    const selectColumnMap = this[Keys.SelectColumns];

    for (const column of columns) {
      if (!column) continue;
      if (typeof column === "string") {
        selectColumnMap.set(column, {
          column: column,
          table: defaultTable,
        });
      } else if (column.column || column.raw) {
        selectColumnMap.set(column.column || Symbol(), Object.assign({ table: defaultTable }, column));
      }
    }

    // console.log("columns :>> ", selectColumnMap.values());
    return this;
  }

  _setTable(table: Data.Table) {
    this[Keys.Tables].set(table.name, table);
  }

  /**
   * 預設會From constructor的table
   * @param tables 
   * @returns 
   * 
   * @example from("manager") -> "FROM <basicTable>, manager"
   * @example from({name:"manager", as:"m"}) -> "FROM <basicTable>, manager AS m"
   * 
   * 
   */
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
        this._setTable({ name: table });
      } else if (table.name) {
        fromTables.push(table);
        this._setTable(table);
      }
    }

    // console.log("tables :>> ", fromTables);
    return this;
  }

  /**
   *
   * @param conditions
   * @example where("id") = where({ column: "id" }) -> "WHERE table.id = :id"
   * @example where(['name', 'email']) -> "WHERE manager.name = :name AND manager.email = :email"
   * @example from("user").where({ column: "id", table: "user" }) -> "WHERE user.id = :id"
   * @example from("user").where({ column: "id", targetTable: "user" }) -> "WHERE manager.id = user.id"
   * @example from("user").where({ column: "id", targetTable: "user", operator: ">=" }) -> "WHERE manager.id >= user.id"
   * @example where({ raw:"xxx = xxx"}) -> "WHERE xxx = xxx"
   * @example where({ column: "id", rawValue: "abc.id" }) -> "WHERE manager.id = abc.id"
   * @returns
   */
  where(conditions: InputData.WhereConditions) {
    const whereConditions = this[Keys.WhereConditions];
    whereConditions.push(...this[Keys.Parser].resolveConditionsInput(conditions));

    // console.log("conditions :>> ", whereConditions);
    return this;
  }

  whereRaw(conditions: InputData.WhereConditions) {
    const whereConditions = this[Keys.WhereConditions];
    whereConditions.push(...this[Keys.Parser].resolveConditionsInput(conditions, { rawStringToRaw: true }));
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
      const joinOnOptions = this[Keys.Parser].resolveConditionsInput(option.on, { defaultTable: option.as || option.table }) as SqlParser.WhereConditions;
      if (!joinOnOptions.length) continue;

      this._setTable({ name: option.table, as: option.as });
      joinOptions.push(Object.assign(option, { on: joinOnOptions }));
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
   * @param columns 跟where一樣用法
   * @param isData 如果值為true，表示啟用columns 為資料，將會取columns的key自動填入欄位
   * @returns 
   * @example .updateColumns({ name: "name", email: "email", }, true) -> "SET table.name = :name , table.email = :email"
   * @example .updateColumns(['name']) -> "SET ot.name = :name"
  )
   */
  updateColumns(columns: InputData.UpdateColumns, isData = false) {
    if (!columns) return this;
    const updateColumns = this[Keys.UpdateColumns];
    if (isData) {
      Object.keys(columns).forEach((key) => {
        updateColumns.push([{
          column: key,
        }]);
      });
    } else {
      updateColumns.push(...this[Keys.Parser].resolveConditionsInput(columns as InputData.WhereConditions));
    }
    return this;
  }

  /**
   *
   * @param columns
   * @param length
   * @returns
   * @example insertColumns({ a: 1, b: 2, c: 3 }, 3) -> ""
   * INSERT INTO table_name(a, b, c) VALUES(:a, :b, :c), VALUES(:a, :b, :c), VALUES(:a, :b, :c)
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
    const sql = "SELECT <columns> <tables> <joinOptions> <whereConditions> <orderByConditions> <limitOption>";
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
      .replace("<tables>", this[Keys.Tables].values().next().value)
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
    console.log("sql :>> \n", sql);
    this.resetAll();
    return sql;
  }
}

export default MysqlQueryGenerator;

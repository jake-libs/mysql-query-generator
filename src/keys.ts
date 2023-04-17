const SelectColumns: unique symbol = Symbol("SelectColumns");
const InitTable: unique symbol = Symbol("InitTable");
const Tables: unique symbol = Symbol("Tables");
const FromTables: unique symbol = Symbol("FromTables");
const WhereConditions: unique symbol = Symbol("WhereConditions");
const JoinOptions: unique symbol = Symbol("JoinOptions");
const OrderByConditions: unique symbol = Symbol("OrderBy");
const LimitOption: unique symbol = Symbol("LimitOption");
const UpdateColumns: unique symbol = Symbol("UpdateColumns");
const InsertColumns: unique symbol = Symbol("InsertColumns");
const ParseSelect: unique symbol = Symbol("ParseSelect");
const ParseUpdate: unique symbol = Symbol("ParseUpdate");
const ParseInsert: unique symbol = Symbol("ParseInsert");
const ParseDelete: unique symbol = Symbol("ParseDelete");
const Cache: unique symbol = Symbol("cache");
const Parser: unique symbol = Symbol("parser");

const Keys = {
  SelectColumns,
  InitTable,
  Tables,
  FromTables,
  WhereConditions,
  JoinOptions,
  OrderByConditions,
  LimitOption,
  UpdateColumns,
  InsertColumns,
  ParseSelect,
  ParseUpdate,
  ParseInsert,
  ParseDelete,
  Cache,
  Parser,
} as const;
export default Keys;

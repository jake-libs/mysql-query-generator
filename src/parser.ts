import { Data, InputData, SqlParser } from "../types";

function useParser(getTable: (name: string) => Data.Table | undefined, getDefaultTableName: () => string) {
  const tableParser = {
    getAliasedName: useParser.getTableAliasedName,

    getNameFromTable(table?: Data.Table) {
      return table ? useParser.getTableAliasedName(table) : getDefaultTableName();
    },
    getName(table?: Data.Table | string) {
      if (typeof table === "string") {
        return this.getNameFromTable(getTable(table));
      }
      return this.getNameFromTable(table);
    },
  };
  function resolveConditionsToSql(conditions: SqlParser.WhereConditions, separator = "AND") {
    const sql = conditions.map((condition) => {
      if (condition.raw) {
        return condition.raw;
      }

      const { column } = condition;
      const table = tableParser.getName(condition.table);
      const value = condition.value || `:${column}`;
      return `${table}.${column} = ${value}`;
    }, []);
    return sql.join(` ${separator} `);
  }
  return {
    table: tableParser,
    toSql: {

      selectColumns(columns: SqlParser.SelectColumns) {
        const parseSql = (column:Data.SelectColumn) => {
          if (column.raw) return column.raw;
          const { name, alias } = column;
          if (!name) return;
          const table = tableParser.getName(column.table);
          return `${table}.${name}${alias ? ` AS ${alias}` : ""}`;
        };

        const sqlArray = [];
        for (const [, column] of columns) {
          sqlArray.push(parseSql(column));
        }
        return `${sqlArray.length ? sqlArray.join(", ") : "*"}`;
      },

      fromTables(tables: SqlParser.FromTables) {
        const sql = this.tables(tables);
        return sql ? `FROM ${sql}` : "";
      },

      tables(tables: SqlParser.FromTables) {
        return tables
          .map((table) => {
            return `${table.name}${table.alias ? ` AS ${table.alias}` : ""}`;
          })
          .join(", ");
      },

      whereConditions(conditions: SqlParser.WhereConditions) {
        const sql = resolveConditionsToSql(conditions);
        return sql ? `\nWHERE ${sql}` : "";
      },

      orderByConditions(conditions: SqlParser.OrderByConditions) {
        const sql = conditions.map((condition) => {
          const { column, direction } = condition;
          const table = tableParser.getName(condition.table);
          return `${table}.${column} ${direction || ""}`;
        });
        return sql.length ? `\nORDER BY ${sql.join(", ")}` : "";
      },

      joinOptions(options: SqlParser.JoinOptions) {
        return options.reduce((sql, option) => {
          const { type = "LEFT", table, tableAlias, on } = option;
          sql += `\n${type} JOIN ${table}${tableAlias ? `AS ${tableAlias}` : ""} ON ${resolveConditionsToSql(on)}`;
          return sql;
        }, "");
      },

      limitOption(option: SqlParser.LimitOption) {
        if (!option) return "";
        const { page, pageSize } = option;
        return `\nLIMIT ${(page - 1) * pageSize + 1}, ${pageSize}`;
      },

      updateColumns(columns: SqlParser.UpdateColumns) {
        const sql = resolveConditionsToSql(columns, ",");
        return sql ? `\nSET ${sql}` : "";
      },

      insertColumns(insertColumns: SqlParser.InsertColumns) {
        if (!insertColumns) return "";
        const columns = insertColumns.columns;
        return columns.length ? `(${columns.join(", ")})` : "";
      },

      insertColumnValues(insertColumns: SqlParser.InsertColumns) {
        if (!insertColumns) return "";
        const { columns, length } = insertColumns;
        if (!columns.length) return "";
        const sql = columns.length ? `\nVALUES(${columns.map((c) => `:${c}`).join(", ")})` : "";
        return Array.from({ length }, () => sql).join("");
      },
    },

    resolveConditionsInput(conditions: InputData.WhereConditions): SqlParser.WhereConditions {
      if (!conditions) return [];
      if (!(conditions instanceof Array)) {
        conditions = [conditions];
      }

      return conditions.reduce<SqlParser.WhereConditions>((arr, condition) => {
        if (!condition) return arr;
        if (typeof condition === "string") {
          arr.push({ column: condition });
        } else if (condition.column || condition.raw) {
          arr.push(condition);
        }
        return arr;
      }, []);
    },
    resolveConditionsToSql,
  };
}


useParser.getTableAliasedName = function (table: Data.Table) {
  return table.alias ? table.alias : table.name;
};

export type UseParser = ReturnType<typeof useParser>
export default useParser;

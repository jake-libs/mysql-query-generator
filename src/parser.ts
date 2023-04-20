import { Data, InputData, SqlParser } from "../types";

function useParser(getTable: (name: string) => Data.Table | undefined, getDefaultTableName: () => string) {
  const tableParser = {
    getAliasedName: useParser.getTableAliasedName,

    getNameFromTable(table?: Data.Table) {
      return table ? useParser.getTableAliasedName(table) : getDefaultTableName();
    },
    getName(table?: Data.Table | string) {
      if (typeof table === "string") {
        return table;
      }
      return getDefaultTableName();
    },
  };
  function resolveConditionsToSql(conditions: SqlParser.WhereConditions, separator = "AND") {
    function getConditionField(condition: Data.WhereCondition) {
      if (condition.length === 3) {
        return {
          start: condition[0],
          operator: condition[1] || "=",
          end: condition[2],
        };
      } else if (condition.length === 2) {
        return {
          start: condition[0],
          operator: "=",
          end: condition[1],
        };
      }
      return {
        start: condition[0],
        operator: "=",
      };
    }

    function parseStartCondition(condition: Data.WhereCondition["0"]) {
      if (condition.raw) return condition.raw;

      const table = tableParser.getName(condition.table);
      return `${table}.${condition.column}`;
    }

    function parseEndCondition(end: Data.WhereCondition["2"], start: Data.WhereCondition["0"]) {
      if (end === -1) return "";
      if (!end) return `:${start.column}`;
      if (end.raw) return end.raw;

      const table = tableParser.getName(end.table);
      return `${table}.${end.column}`;
    }

    const sql = conditions.map((condition) => {
      const { start, end, operator: conditionSeparator } = getConditionField(condition);
      if (typeof end === "string") {
        return;
      }

      const startSql = parseStartCondition(start);
      const endSql = parseEndCondition(end, start);
      return conditionSeparator === -1 ? startSql : `${startSql} ${conditionSeparator} ${endSql}`;
    }, []);
    return sql.join(` ${separator} `);
  }
  return {
    table: tableParser,
    toSql: {
      selectColumns(columns: SqlParser.SelectColumns) {
        const parseSql = (selectColumn: Data.SelectColumn) => {
          if (selectColumn.raw) return selectColumn.raw;
          const { column, as } = selectColumn;
          if (!column) return;
          const table = tableParser.getName(selectColumn.table);
          return `${table}.${column}${as ? ` AS ${as}` : ""}`;
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
            return `${table.name}${table.as ? ` AS ${table.as}` : ""}`;
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
          const { type = "LEFT", table, as, on } = option;
          sql += `\n${type} JOIN ${table}${as ? ` AS ${as}` : ""} ON ${resolveConditionsToSql(on as SqlParser.WhereConditions)}`;
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

    resolveConditionsInput(
      conditions: InputData.WhereConditions,
      { defaultTable, rawStringToRaw = false }: { defaultTable?: string; rawStringToRaw?: boolean } = {}
    ): SqlParser.WhereConditions {
      if (!conditions || !(conditions instanceof Array)){
        throw new TypeError("Conditions must be an array or an array of conditions, your value: "+conditions)
      }
      if (!(conditions[0] instanceof Array)) {
        conditions = [conditions] as Array<InputData.WhereCondition>;
      }

      const stringToConditionField = (() => {
        if (rawStringToRaw) {
          return (condition: string) => {
            return { raw: condition };
          };
        }
        return (condition: string) => {
          return { column: condition, table: defaultTable };
        };
      })();

      function resolveConditionField(condition: InputData.WhereConditionField): Data.WhereConditionField {
        if (typeof condition === "string") {
          return stringToConditionField(condition);
        }
        if (condition.raw) {
          return condition;
        }
        if (!condition.column) {
          throw new TypeError("Condition field must be string or with 「column」 column");
        }
        return Object.assign({ table: defaultTable }, condition);
      }

      return (<Array<InputData.WhereCondition>>conditions).reduce<SqlParser.WhereConditions>((arr, condition) => {
        if (!condition) return arr;
        // if (typeof condition === "string") {
        //   if (rawStringToRaw) {
        //     return arr.push([stringToConditionField(condition), -1, -1]), arr;
        //   }
        //   condition = [stringToConditionField(condition)];
        // }

        // console.log('condition :>> ', condition);
        condition[0] = resolveConditionField(condition[0]);
        if (condition[2]) condition[2] = resolveConditionField(condition[2]);
        else if (condition[1]) {
          condition[1] = resolveConditionField(condition[1]);
        }

        arr.push(condition as Data.WhereCondition);
        return arr;
      }, []);
    },
    resolveConditionsToSql,
  };
}

useParser.getTableAliasedName = function (table: Data.Table) {
  return table.as ? table.as : table.name;
};

export type UseParser = ReturnType<typeof useParser>;
export default useParser;

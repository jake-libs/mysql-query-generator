import MysqlQueryGenerator from "."

const tool = new MysqlQueryGenerator("manager");
console.log("-----------------select-----------------");
tool
  // .from({ name: " ", alias: "tableAlias" })
  .select(["name", "account", { name: "password", table: "table2" }, { raw: "(SELECT a FROM b)" }])
  // .select({raw:"a,b,c,d,e,f,g"})
  .where(["id"])
  .orderBy(["name"])
  .join({ table: "permission", on: "abc" })
  .limit(2, 10)
  .execute();
console.log("-----------------select-end-----------------");

// *update
console.log("-----------------update-----------------");
tool
  .updateColumns(
    {
      a: 1,
      b: 2,
      c: 3,
    },
    true
  )
  .execute("update");
tool
  .from({ name: "user", alias: "u" })
  .updateColumns({
    column: "id",
    table: "user",
  })
  .updateColumns({
    name: "林政德",
    email: "email",
  })
  .updateColumns({
    raw: "u.name = (select * from other_table)",
  })
  .where(["id", "token"])
  .execute("update");
console.log("-----------------update-end-----------------");

// *create
console.log("-----------------create-----------------");
tool.insertColumns({ a: 1, b: 2, c: 3 }, 3).execute("insert");
tool.insertColumns(["name", "email"]).execute("insert");
console.log("-----------------create-end-----------------");

// *delete
console.log("-----------------delete-----------------");

console.log("-----------------delete-end-----------------");


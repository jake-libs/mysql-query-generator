import MysqlQueryGenerator from ".";

const tool = new MysqlQueryGenerator({ name: "order_ticket", alias: "ot" });
console.log("-----------------select-----------------");
tool
  .select([{ name: "*", table: "shows" }])
  .select([{ name: "id", table: "show_event", alias: "se_id" }])
  .select([{ name: "id", alias: "sl_id" }, "location", "location_en"], "show_location")
  .select([{ raw: "concat(c.name, town.name, sl.address) full_address" }, "start_time", "end_time"], "show_event")
  // .join([
  //   { table: "show_event_ticket", on: { column: "id", targetTable: "order_ticket", value: "t_id" } },
  //   { table: "show_event", on: { column: "s_id", targetTable: "show_event_ticket", value: "id" } },
  //   { table: "shows", on: { column: "id", targetTable: "show_event", value: "id" } },
  //   { table: "show_location", on: { column: "id", targetTable: "show_event", value: "sl_id" } },
  //   { table: "city", on: { column: "id", targetTable: "show_location", value: "city" } },
  //   { table: "town", on: { column: "id", targetTable: "show_location", value: "town" } },
  // ])
  .join([{ table: "show_event_ticket", tableAlias: "t", on: { raw: "t.id = ot.t_id" } }])
  // .join()
  .where("o_id")
  .execute();
console.log("-----------------select-end-----------------");

// *update
console.log("-----------------update-----------------");
// tool
//   .updateColumns(
//     {
//       a: 1,
//       b: 2,
//       c: 3,
//     },
//     true
//   )
//   .execute("update");
// tool
//   .from({ name: "user", alias: "u" })
//   .updateColumns({
//     column: "id",
//     table: "user",
//   })
//   .updateColumns({
//     name: "林政德",
//     email: "email",
//   })
//   .updateColumns({
//     raw: "u.name = (select * from other_table)",
//   })
//   .where(["id", "token"])
//   .execute("update");
console.log("-----------------update-end-----------------");

// *create
console.log("-----------------create-----------------");
// tool.insertColumns({ a: 1, b: 2, c: 3 }, 3).execute("insert");
// tool.insertColumns(["name", "email"]).execute("insert");
console.log("-----------------create-end-----------------");

// *delete
console.log("-----------------delete-----------------");

console.log("-----------------delete-end-----------------");

import MysqlQueryGenerator from ".";

const tool = new MysqlQueryGenerator({ name: "order_ticket", as: "ot" });
console.log("-----------------select-----------------");
// tool.where
// tool.where("name").execute(); // name = :name
// tool.where(["name", "email"]).execute(); // name = :name AND email = :email
// tool.where([["name", "=", "email"], "email"]).execute(); // name =
// tool
//   .from("user")
//   .where([[{ column: "name", table: "user" }, "=", "email"], "email"])
//   .execute();
// tool
//   .from("user")
//   .where([[{ column: "name", table: "user" }, "name"], "email"])
//   .execute();

// tool.from("user").whereRaw("u.name = manager.name").execute();
// tool
//   .from("table2")
//   .select([{ column: "*", table: "s" }])
//   .select([{ column: "id", table: "se", as: "se_id" }])
//   .select([{ column: "id", as: "sl_id" }, "location", "location_en"], "sl")
//   .select([{ raw: "concat(c.name, town.name, sl.address) full_address" }, "start_time", "end_time"], "se")
//   .join([
//     { table: "show_event_ticket", as: "t", on: [[{ column: "id", table: "ot" }, "t_id"]] },
//     { table: "show_event", as: "se", on: ["s1", "s2", "s3"] },
//     { table: "shows", as: "s", on: [[{ column: "id", table: "se" }, "id"]] },
//     { table: "show_location", as: "sl", on: [[{ column: "id", table: "se" }, "sl_id"]] },
//     { table: "city", as: "c", on: [[{ column: "id", table: "sl" }, "city"]] },
//     { table: "town", on: [[{ column: "id", table: "sl" }, "town"]] },
//   ])
//   .where("id")
//   .execute();
console.log("-----------------select-end-----------------");

// *update
console.log("-----------------update-----------------");
// tool.updateColumns(["name"]).execute("update");
// tool
//   .from({ name: "user", as: "u" })
//   .updateColumns(["id"])
//   .updateColumns(
//     {
//       name: "林政德",
//       email: "email",
//     },
//     true
//   )
//   .updateColumns(["u.name = (select * from other_table)"])
//   .where(["id", "token"])
//   .execute("update");
console.log("-----------------update-end-----------------");

// *create
console.log("-----------------create-----------------");
tool.insertColumns({ a: 1, b: 2, c: 3 }, 3).execute("insert");
tool.insertColumns(["name", "email"]).execute("insert");
console.log("-----------------create-end-----------------");

// *delete
console.log("-----------------delete-----------------");

console.log("-----------------delete-end-----------------");

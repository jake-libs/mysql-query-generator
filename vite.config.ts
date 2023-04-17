import { defineConfig } from "vite";
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "MysqlQueryGenerator",
    },
    rollupOptions: {
      external: ["nodemon", "typescript", "ts-node"],
      output: {
        globals: {
          MysqlQueryGenerator: "MysqlQueryGenerator",
        },
      },
    },
  },
});

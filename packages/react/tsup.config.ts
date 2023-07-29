import { defineConfig } from "tsup";

export default defineConfig((overrideOptions) => {
  const isWatch = !!overrideOptions.watch;
  return {
    entry: ["./src/index.ts", "./src/hooks.ts", "./src/fetch-client.ts"],
    clean: !isWatch,
    dts: true,
    splitting: false,
    sourcemap: true,
    treeshake: false,
    format: ["cjs", "esm"],
    target: "es2017",
  };
});

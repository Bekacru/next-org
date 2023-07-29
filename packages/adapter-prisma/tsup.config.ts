import { defineConfig } from "tsup";

export default defineConfig((overrideOptions) => {
  const isWatch = !!overrideOptions.watch;
  return {
    entry: ["./src/index.ts"],
    bundle: false,
    clean: !isWatch,
    minify: false,
    sourcemap: true,
    dts: true,
    format: ["cjs", "esm"],
  };
});

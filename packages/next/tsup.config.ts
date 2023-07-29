import { defineConfig } from "tsup";

export default defineConfig((opts) => {
  const isWatch = !!opts.watch;
  const onSuccess = () => {
    return "cp ./package.json ./dist/package.json";
  };
  return {
    entry: ["./src/index.ts"],
    clean: !isWatch,
    treeshake: true,
    sourcemap: true,
    dts: true,
    format: ["cjs", "esm"],
    onSuccess: onSuccess(),
    external: ["next-auth", "next"],
  };
});

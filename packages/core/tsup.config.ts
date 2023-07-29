import { defineConfig } from "tsup";

export default defineConfig((overrideOptions) => {
    const isWatch = !!overrideOptions.watch;
    return {
        entry: ["./src/index.ts"],
        clean: !isWatch,
        minify: false,
        sourcemap: true,
        dts: true,
        format: ["cjs", "esm"],
        splitting: true,
    };
});

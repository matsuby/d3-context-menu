import babel from "rollup-plugin-babel";
import { uglify } from "rollup-plugin-uglify";
import * as meta from "./package.json";

export default [
  {
    input: meta.module,
    external: "d3-selection",
    output: {
      file: `dist/${meta.name}.js`,
      name: "d3",
      format: "umd",
      indent: false,
      extend: true,
      globals: { "d3-selection": "d3" },
    },
    plugins: [
      babel({
        exclude: "node_modules/**",
        presets: ['@babel/preset-env'],
      }),
    ],
  },
  {
    input: meta.module,
    external: "d3-selection",
    output: {
      file: `dist/${meta.name}.min.js`,
      name: "d3",
      format: "umd",
      indent: false,
      extend: true,
      globals: { "d3-selection": "d3" },
    },
    plugins: [
      babel({
        exclude: "node_modules/**",
        presets: ['@babel/preset-env'],
      }),
      uglify(),
    ],
  },
];

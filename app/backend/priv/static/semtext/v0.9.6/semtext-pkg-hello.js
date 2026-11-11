const s = "hello [name] — print a greeting", i = [
  s,
  "",
  "Greets the given name, or the world. With piped input and no name,",
  "every non-empty input line is greeted (a one-command pipe demo).",
  "",
  "  hello           greet the world",
  "  hello Ada       greet Ada",
  "  echo Pat | hello  greet every piped line",
  "",
  "This is the chunk-side help: richer than the stub answers before the",
  "package loads (the stub prints one line; the real command owns --help",
  "once resident)."
];
function r(e) {
  return `hello, ${e.replace(/\r$/, "")}`;
}
const h = {
  name: "hello",
  usage: s,
  complete: (e) => ["--help", "-h"].filter((n) => n.startsWith(e.word)),
  run(e) {
    if (e.args.includes("--help") || e.args.includes("-h")) {
      for (const o of i) e.out(o);
      return;
    }
    const n = e.args.filter((o) => !o.startsWith("-") || o === "-"), t = e.args.filter((o) => o.startsWith("-") && o !== "-");
    if (t.length > 0) {
      e.err(`hello: unrecognized option '${t[0]}'`), e.err("Try 'hello --help' for more information."), e.exit(2);
      return;
    }
    if (n.length > 0) {
      e.out(r(n.join(" ")));
      return;
    }
    const l = e.stdin ?? "";
    if (l !== "") {
      for (const o of l.split(`
`))
        o.trim() !== "" && e.out(r(o));
      return;
    }
    e.out("hello, world");
  }
}, a = [h], p = {
  hello: [
    "HELLO(1)                  semtext-sh manual",
    "",
    "NAME",
    "     hello — print a greeting (the sample lazy package)",
    "",
    "SYNOPSIS",
    "     hello [name]",
    "     pipeline | hello",
    "",
    "DESCRIPTION",
    "     Greets a name, the world, or every non-empty piped line.",
    "     Ships as the command-package contract proof: the base shell",
    "     carries only the stub (usage, completion, man); this body loads",
    "     as semtext-pkg-hello.js next to the shell bundle on boot."
  ]
}, d = { commands: a, manPages: p };
export {
  a as commands,
  p as manPages,
  d as pkg
};

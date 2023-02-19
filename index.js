import { exponent, UIBuilder } from "@roguecircuitry/htmless";
import { Lexer } from "./lexer.js";
// import { parse, Parser } from "./parser.js";

function mapToObj(map) {
  let result = {};
  for (let [k, v] of map) {
    //@ts-expect-error
    result[k] = v;
  }
  return result;
}
async function main() {
  let ui = new UIBuilder();
  ui.default(exponent);
  ui.create("style").style({
    "body": {
      backgroundColor: "#c4c5c5",
      fontFamily: "courier",
      color: "3e3e3e"
    },
    "#container": {
      flexDirection: "column"
    },
    "#title": {
      textAlign: "center",
      fontSize: "larger"
    },
    "#input, #output": {
      flex: "1",
      borderStyle: "dashed",
      borderWidth: "1px",
      borderColor: "black",
      backgroundColor: "#dee2eb",
      borderRadius: "0.5em",
      overflowY: "auto",
      margin: "0.5em",
      maxHeight: "90vh",
      maxWidth: "50vw",
      flexDirection: "column"
    }
  }).mount(document.head);
  ui.create("div").id("container").mount(document.body);
  let container = ui.e;
  ui.create("span").id("title").textContent("cheedo").mount(container);
  let iosep = ui.create("div").mount(container).id("io-sep").e;

  // let parser = new Parser();

  //create a blank lexer
  let lexer = new Lexer();

  //set it up
  function setup_lexer(lexer) {
    //add rules specific to your desires
    lexer
    //whitespace (not including new lines)
    .selector({
      type: "ws",
      kind: "single",
      selector: " \t"
    })
    //new lines
    .selector({
      type: "lf",
      kind: "single",
      selector: "\n"
    }).selector({
      type: "number-literal",
      kind: "charset",
      selector: "0123456789"
    })
    //keywords and var names
    .selector({
      type: "identifier",
      kind: "charset",
      selector: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_"
    }).selector({
      type: "parenthesis",
      kind: "single",
      selector: "()"
    }).selector({
      type: "curly",
      kind: "single",
      selector: "{}"
    }).selector({
      type: "square",
      kind: "single",
      selector: "[]"
    }).selector({
      type: "dot",
      kind: "single",
      selector: "."
    }).selector({
      type: "comma",
      kind: "single",
      selector: ","
    })
    //comments - not capable of multi-char from-to yet
    .selector({
      type: "comment",
      kind: "from-to",
      selector: {
        from: "#",
        to: "\n",
        toAcceptsEOF: true
      }
    }).selector({
      type: "string-literal",
      kind: "from-to",
      selector: {
        from: "\"",
        to: "\"",
        toAcceptsEOF: false
      }
    }).selector({
      type: "operator",
      kind: "charset",
      selector: "+=-></*"
    });
  }
  setup_lexer(lexer);

  //when the input text changes
  const inputChanged = () => {
    //lexically analyse the source text
    let tokens = lexer.lex(contentInput.value);

    //convert to a readable output for debugging purposes
    let tokensString = "";
    for (let token of tokens) {
      if (token.isT("lf") || token.isT("ws")) continue; //ignore whitespace cause its everywhere..

      tokensString += token.toString() + "\n";
    }

    //write the output so we can see it
    contentOutput.innerText = tokensString;
  };
  let typeHandlerTimer = 0;
  const typeDebounce = 400;
  let contentInput = ui.create("textarea").id("input").on("keyup", () => {
    if (typeHandlerTimer) {
      clearTimeout(typeHandlerTimer);
      typeHandlerTimer = undefined;
    }
    typeHandlerTimer = setTimeout(inputChanged, typeDebounce);
  }).mount(iosep).e;

  //load in example cheedo code
  fetch("./example.ch").then(r => r.text()).then(t => {
    contentInput.value = t;
    inputChanged();
  });
  let contentOutput = ui.create("div").id("output").mount(iosep).e;
}
main();
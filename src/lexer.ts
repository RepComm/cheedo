
export class Token {
  data: string;
  type: string;

  constructor(data?: string, type?: string) {
    this.data = data;
    this.type = type;
  }

  isT(type: string): boolean {
    return this.type === type;
  }
  isD(data: string): boolean {
    return this.data === data;
  }
  isTD(type: string, data: string): boolean {
    return this.type === type && this.data === data;
  }
  toString() {
    let data = this.data.replaceAll("\n", "\\n");
    return `Token { ${this.type} : "${data}" }`;
  }
}

export interface State {
  offset: number;
  src: string;
  results: Token[];
}

export interface Selector {

}
export interface SelectorFromTo {
  from: string;
  to: string;
  toAcceptsEOF?: boolean; //can EOF be used in place of 'to' ?
}
export interface SelectorMap {
  "charset": string;
  "from-to": SelectorFromTo;
  "single": string;
  "string": string;
}

export interface TokenSelector<K extends keyof SelectorMap> {
  type: string;
  kind: K;
  selector: SelectorMap[K];
}

export class Lexer {
  state: State;
  _selectors: Array<TokenSelector<keyof SelectorMap>>;

  constructor() {
    this._selectors = new Array();
  }

  read(n: number = 1): string {
    if (n > this.unread) throw `cannot read ${n}, only ${this.unread} left`;

    if (n < 1) throw `cannot read less than 1, asked for ${n}`;

    if (n === 1) return this.state.src.charAt(this.state.offset);

    let min = Math.min(n, this.unread);
    return this.state.src.substring(this.state.offset, this.state.offset + min);
  }
  readSoftFail (n: number = 1): string {
    n = Math.min(n, this.unread);
    return this.read(n);
  }
  isD(data: string): boolean {
    return this.read(data.length) === data;
  }

  single(s: TokenSelector<"single">): boolean {
    let result = false;

    let data = this.read(1);

    if (s.selector.includes(data)) {

      result = true;

      this.state.results.push(new Token(
        data, s.type
      ));
      this.state.offset++;

    }

    return result;
  }

  charset(s: TokenSelector<"charset">): boolean {
    let init = this.state.offset;
    let start = -1;
    let end = -1;

    while (this.hasNext(1)) {
      let data = this.read(1);

      if (s.selector.includes(data)) {
        if (start === -1) {
          start = this.state.offset;
        } else {
          end = this.state.offset;
        }
        this.state.offset++;
      } else {
        break;
      }
    }

    if (start === -1) {
      this.state.offset = init;
      return false;
    }

    if (end === -1) {
      end = this.state.offset-1;
    }

    let data = this.state.src.substring(start, end + 1);

    this.state.results.push(new Token(
      data, s.type
    ));
    
    return true;
  }

  fromTo(s: TokenSelector<"from-to">): boolean {
    let init = this.state.offset;
    let start = -1;
    let end = -1;

    while (this.hasNext(1)) {
      let data = this.read(1);

      if (start === -1) {
        if (!s.selector.from.includes(data)) return false;
        start = this.state.offset;
        this.state.offset ++;
        continue;
      }

      if (end === -1) {
        if (s.selector.to.includes(data)) {
          end = this.state.offset;
          this.state.offset ++; //read ending char
          break;
        }
      }

      this.state.offset ++;
    }

    if (end === -1) {
      if (s.selector.toAcceptsEOF) {
        end = this.state.offset;
      } else {
        this.state.offset = init;
        return false;
      }
    }

    let data = this.state.src.substring(start, end + 1);

    this.state.results.push(new Token(
      data, s.type
    ));
    
    return true;
  }

  selector<K extends keyof SelectorMap>(s: TokenSelector<K>): this {
    this._selectors.push(s);
    return this;
  }

  get unread(): number {
    return this.state.src.length - this.state.offset;
  }

  hasNext(n: number = 1) {
    return this.unread >= n;
  }

  lex(src: string) {
    this.state = {
      src,
      offset: 0,
      results: new Array()
    };

    //read source until we've read all of it
    while (this.hasNext()) {

      //basic check to see if anything was read
      let firstOffset = this.state.offset;

      //breaking out of several loops at once
      let forLoopBreak = false;

      //selectors are what we match against to find tokens
      for (let s of this._selectors) {

        //there are different kinds of selector
        switch (s.kind) {
          case "charset": //read until you can't find a match for the charset
            if (this.charset(s as TokenSelector<"charset">)) {
              forLoopBreak = true;
            }
            break;
          case "single": //read a single char that matches a charset
            if (this.single(s as TokenSelector<"single">)) {
              forLoopBreak = true;
            }
            break;
          case "from-to":
            if (this.fromTo(s as TokenSelector<"from-to">)) {
              forLoopBreak = true;
            }
            break;
        }

        if (forLoopBreak) break;
      }

      //if we didn't read anything
      if (this.state.offset <= firstOffset) {
        //error message
        console.log("no match for", this.readSoftFail(1), "near", this.readSoftFail(10));
        return this.state.results;
      }

    }

    return this.state.results;
  }
}

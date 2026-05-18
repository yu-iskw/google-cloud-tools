export interface SelectorField {
  name: string;
  children: SelectorField[];
}

export interface SelectorAst {
  fields: SelectorField[];
}

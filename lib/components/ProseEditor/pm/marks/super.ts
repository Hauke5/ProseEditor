import { DOMOutputSpec }   from 'prosemirror-model';
import { toggle, markRulesToDesc, MarkDesc, markMarkdown, MarkRules } 
                           from './common';


const name = 'superscript'
const tag  = 'sup'

const rules:MarkRules = {
   name,
   pasteRules: [
      /(?:^|\s)((?:\^)((?:[^\^]+))(?:\^))/g   // ^...^
   ],
   inputRules: [
      /(?:^|\s)((?:\^)((?:[^\^]+))(?:\^))$/   // ^...^ at the end of the input line
   ],
   bindings: {
      toggle: { key: 'Mod-^', binding:toggle(name) }
   },
   schema: {
      parseDOM: [
         {tag},
         {
            style: 'text-decoration',
            getAttrs: (value: any) => value === name && null,
         },
      ],
      toDOM: (): DOMOutputSpec => [tag, 0],
   },
   // TODO underline is not a real thing in markdown, what is the best option here?
   // I know this is cheating, but underlines are confusing
   // this moves them italic
   markdown: markMarkdown('^', {superscript: { mark: name }}, tag, {before:'strikethrough'}),
}

export const sup:MarkDesc = markRulesToDesc(rules)


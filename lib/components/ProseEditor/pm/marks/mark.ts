import { DOMOutputSpec }   from 'prosemirror-model';
import { toggle, markRulesToDesc, MarkDesc, markMarkdown, MarkRules } 
                           from './common';


const name = 'mark'
const tag  = 'mark'

const rules:MarkRules = {
   name,
   pasteRules: [
      /(?:^|\s)((?:==)((?:[^=]+))(?:==))/g   // ==...==
   ],
   inputRules: [
      /(?:^|\s)((?:==)((?:[^=]+))(?:==))$/   // ==...== at the end of the input line
   ],
   bindings: {
      toggle: { key: 'Mod-=', binding:toggle(name) }
   },
   schema: {
      parseDOM: [
         {tag: 'mark'},
         {
            style: 'text-decoration',
            getAttrs: (value: any) => value === name && null,
         },
      ],
      toDOM: (): DOMOutputSpec => ['mark', 0],
   },
   markdown: markMarkdown('==', {mark: { mark: name }}, tag, {before:'emphasis'}),
}

export const mark:MarkDesc = markRulesToDesc(rules)


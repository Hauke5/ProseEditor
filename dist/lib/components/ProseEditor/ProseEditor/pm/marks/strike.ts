import { DOMOutputSpec }   from 'prosemirror-model';
import { toggle, markRulesToDesc, MarkDesc, markMarkdown, MarkRules } 
                           from './common';

const name = 'strike'
const tag  = 's'

const rules:MarkRules = {
   name,
   pasteRules: [
      /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))/g   // ~~...~~
   ],
   inputRules: [
      /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))$/   // ~~...~~ at the end of the input line
   ],
   bindings: {
      toggle: { key: 'Mod-d', binding:toggle(name) }
   },
   schema: {
      parseDOM: [
         { tag },
         { tag: 'del' },
         { tag: 'strike' },
         {
            style: 'text-decoration',
            getAttrs: (value: any) => value === 'line-through' && null,
         },
      ],
      toDOM: (): DOMOutputSpec => [tag, 0],
   },
   markdown: markMarkdown('~~', {s: { mark: name }}, tag, {}),
}

export const strike:MarkDesc = markRulesToDesc(rules)


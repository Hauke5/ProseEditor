import { DOMOutputSpec }   from 'prosemirror-model';
import { toggle, markRulesToDesc, MarkDesc, markMarkdown, MarkRules } 
                           from './common';


const name = 'underline'
const tag  = 'u'

const rules:MarkRules = {
   name,
   pasteRules: [
      /(?:^|\s)((?:_)((?:[^_]+))(?:_))/g   // _..._
   ],
   inputRules: [
      /(?:^|\s)((?:_)((?:[^_]+))(?:_))$/   // _..._ at the end of the input line
   ],
   bindings: {
      toggle: { key: 'Mod-u', binding:toggle(name) }
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
   markdown: markMarkdown('_', {underline: { mark: name }}, tag, {before:'emphasis'}),
}

export const underline:MarkDesc = markRulesToDesc(rules)


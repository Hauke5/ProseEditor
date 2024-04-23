import { DOMOutputSpec }            from 'prosemirror-model';
import { toggle, MarkDesc, markRulesToDesc, markMarkdown, MarkRules}     
                                    from './common'

const name = 'italic'
const tag  = 'em'

const rules:MarkRules = {
   name,
   pasteRules: [
      /\*([^*]+)\*/g,                        // *...*
   ],
   inputRules: [
      /(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/,  // *...* at the end of the input line
   ],
   bindings: {
      toggle: { key: 'Mod-i', binding:toggle(name) }
   },
   schema: {
      parseDOM: [
         { tag }, 
         { tag: 'i' }, 
         { style: 'font-style=italic' }
      ],
      toDOM: ():DOMOutputSpec => [tag, 0],
   },
   markdown: markMarkdown('*', {em: { mark: name }}, tag, {}),
}

export const italic:MarkDesc = markRulesToDesc(rules)

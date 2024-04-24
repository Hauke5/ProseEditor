import { DOMOutputSpec }            from 'prosemirror-model';
import { toggle, MarkDesc, markMarkdown, MarkRules, markRulesToDesc }   
                                    from './common'

const name = 'bold'
const tag  = 'b'

const rules:MarkRules = {
   name,
   pasteRules: [
      /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))/g,    // **...**
      /(?:^|\s)((?:__)((?:[^__]+))(?:__))/g        // __...__
   ],
   inputRules: [
      /(?:^|\s)((?:__)((?:[^__]+))(?:__))$/,       // __...__ at the end of the input line
      /(?:^|\s)((?:\*\*)((?:[^*]+))(?:\*\*))$/     // **...** at the end of the input line
   ],
   bindings: {
      toggle: { key: 'Mod-b', binding:toggle(name) }
   },
   schema: {
      parseDOM: [
         { tag: 'strong' },
         { tag, getAttrs: (node: any) => node.style.fontWeight !== 'normal' && null },
         { style: 'font-weight', getAttrs: (value: any) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null }
      ],
      toDOM: ():DOMOutputSpec => ['strong', 0],
   },
   markdown: markMarkdown('**', {strong: { mark: name }}, tag, {})
}

export const bold:MarkDesc = markRulesToDesc(rules)



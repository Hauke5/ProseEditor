import { DOMOutputSpec }   from 'prosemirror-model';
import { InputRule }       from 'prosemirror-inputrules';
import { RawPlugins }      from '../plugins';
import { safeInsert }      from '../core/transforms';
import { NodeDesc, getNodeType }       
                           from './common';

const name =    'horizontalRule'                      

export const horizontalRule:NodeDesc = {
   type:       'node',
   name,
   schema: {
      group: 'block',
      parseDOM: [{ tag: 'hr' }],
      toDOM: (): DOMOutputSpec => ['hr'],
   },
   plugins:    pluginsFactory,
   keys:       {},
   commands: {
      isActive:   ()=>false,
      toggle:     ()=>true,
   },
   markdown: {
      toMarkdown(state, node) {
         state.write(node.attrs['markup'] || '---');
         state.closeBlock(node);
      },
      parseMarkdown: { hr: { node: name } },
      tag:     'hr',
      where:   {}
   },
}

function pluginsFactory({ markdownShortcut = true } = {}): RawPlugins {
   return ({ schema }) => {
      const type = getNodeType(schema, name);
      return [markdownShortcut && new InputRule(/^(?:---|___\s|\*\*\*\s)$/,
         (state, match, start, end) => {
            if (!match[0]) return null;
            let tr = state.tr.replaceWith(start - 1, end, type.createChecked());
            // Find the paragraph that contains the "---" shortcut text, we need
            // it below for deciding whether to insert a new paragraph after the
            // hr.
            const $para = state.doc.resolve(start);

            let insertParaAfter = false;
            if ($para.end() != end) {
               // if the paragraph has more characters, e.g. "---abc", then no
               // need to insert a new paragraph
               insertParaAfter = false;
            } else if ($para.after() == $para.end(-1)) {
               // if the paragraph is the last child of its parent, then insert a
               // new paragraph
               insertParaAfter = true;
            } else {
               const nextNode = state.doc.resolve($para.after()).nodeAfter!;
               // if the next node is a hr, then insert a new paragraph
               insertParaAfter = nextNode.type === type;
            }
            return insertParaAfter
               ? safeInsert(getNodeType(state, 'paragraph').createChecked(), tr.mapping.map($para.after()))(tr)
               : tr;
         }
      )];
   };
}

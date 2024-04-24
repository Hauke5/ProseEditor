import { keymap }                from 'prosemirror-keymap';
import { DOMOutputSpec, Node }   from 'prosemirror-model';
import { chainCommands }         from 'prosemirror-commands';
import { exitCode }              from 'prosemirror-commands';
import {MarkdownSerializerState} from 'prosemirror-markdown'
import { RawPlugins }            from '../plugins';
import { GenericKeys }           from '../common';
import { toggle, NodeDesc, isNodeActive, getNodeType }
                                 from './common';

interface HardBreakKeys extends GenericKeys {
   insert:  string
}

const name = 'hardBreak'
const keys = {
   insert: 'Shift-Enter',
}

                                    
export const hardBreak:NodeDesc<HardBreakKeys> = {
   type:       'node',
   name,
   plugins:    pluginsFactory,
   schema: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM: (): DOMOutputSpec => ['br'],
   },
   keys,
   commands: {
      isActive:   isNodeActive(name),
      toggle:     toggle(name),
   },
   markdown: {
      toMarkdown: (state:MarkdownSerializerState, node:Node, parent:Node, index:number) =>{
         for (let i = index + 1; i < parent.childCount; i++) {
            if (parent.child(i).type !== node.type) {
               state.write('\\\n');
               return;
            }
         }
      },
      parseMarkdown: {
         hardbreak: { node: name },
      },
      tag: 'br',
      where:{}
   },
}


function pluginsFactory({ keybindings=keys } = {}): RawPlugins {
   return ({ schema }) => {
      const type = getNodeType(schema, name);
      const command = chainCommands(exitCode, (state, dispatch) => {
         if (dispatch) dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
         return true;
      });
      return [
         keybindings && keymap(Object.fromEntries([[keybindings.insert, command]])),
      ];
   };
}

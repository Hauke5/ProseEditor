import Token                              from 'markdown-it/lib/token.mjs';
import type { MarkdownSerializerState }   from 'prosemirror-markdown';
import { keymap }                         from 'prosemirror-keymap';
import { DOMOutputSpec, Node }            from 'prosemirror-model';
import { textblockTypeInputRule }         from 'prosemirror-inputrules';
import { setBlockType }                   from 'prosemirror-commands';
import { RawPlugins }                     from '../plugins';
import { GenericKeys, insertEmpty }       from '../common';
import { moveNode }                       from '../core/commands';
import { toggle, NodeDesc, isNodeActive, getNodeType, conditionalCommand }   
                                          from './common';


const name =  'codeBlock'
const keys = {
   toCodeBlock: 'Shift-Ctrl-\\',
   moveDown: 'Alt-ArrowDown',
   moveUp: 'Alt-ArrowUp',
   insertEmptyParaAbove: 'Mod-Shift-Enter',
   insertEmptyParaBelow: 'Mod-Enter',
}

interface CodeblockKeys extends GenericKeys {
   toCodeBlock:            string
   moveDown:               string
   moveUp:                 string
   insertEmptyParaAbove:   string
   insertEmptyParaBelow:   string
}

export const codeBlock:NodeDesc<CodeblockKeys> = {
   type:       'node',
   name,
   schema: {
      attrs: {
         language: { default: '' },
      },
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
      toDOM: (): DOMOutputSpec => ['pre', ['code', 0]],
   },
   plugins:    pluginsFactory,
   keys,
   commands: {
      toggle:     toggle(name),
      isActive:   isNodeActive(name),
      },
   markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
         state.write('```' + (node.attrs['language'] || '') + '\n');
         state.text(node.textContent, false);
         state.ensureNewLine();
         state.write('```');
         state.closeBlock(node);
      },
      parseMarkdown: {
         code_block: { block: name, noCloseToken: true },
         fence: {
            block: name,
            getAttrs: (tok: Token) => ({ language: tok.info || '' }),
            noCloseToken: true,
         },
      },
      tag:     'pre',
      where:   {}
   },
}


function pluginsFactory({markdownShortcut = true, keybindings=keys} = {}): RawPlugins {
   return ({ schema }) => {
      const type = getNodeType(schema, name);

      return [
         markdownShortcut && textblockTypeInputRule(/^```$/, type),
         keybindings && keymap(
            Object.fromEntries([
               [keybindings.toCodeBlock,           setBlockType(type)],
               [keybindings.moveUp,                moveNode(type, 'UP')],
               [keybindings.moveDown,              moveNode(type, 'DOWN')],
               [keybindings.insertEmptyParaAbove,  conditionalCommand(
                  isNodeActive(name),
                  insertEmpty(getNodeType(schema, 'paragraph'), 'above', false),
               )],
               [
               keybindings.insertEmptyParaBelow,   conditionalCommand(
                  isNodeActive(name),
                  insertEmpty(getNodeType(schema, 'paragraph'), 'below', false),
               )],
            ]),
         ),
      ];
   };
}


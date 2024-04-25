import Token                           from 'markdown-it/lib/token.mjs';
import { keymap }                      from 'prosemirror-keymap';
import { DOMOutputSpec, Node }         from 'prosemirror-model';
import { Command }                     from 'prosemirror-state';
import { wrappingInputRule }           from 'prosemirror-inputrules';
import type { MarkdownSerializerState }from 'prosemirror-markdown';
import { chainCommands }               from 'prosemirror-commands';

import { RawPlugins }                  from '../plugins';

import { toggleList }                  from './listSupport/list-commands';
import { listIsTight }                 from './listSupport/list-is-tight';
import { isNodeTodo, removeTodo, wrappingInputRuleForTodo } 
                                       from './listSupport/list-todo';
import { GenericKeys, isDirectParentActive }  
                                       from '../common';
import { NodeDesc, getNodeType }       from './common';



const name = 'bulletList'
const keys = {
   toggle:        'Shift-Ctrl-8',
}

interface ListKeys extends GenericKeys {
   toggle:     string
}

export const bulletList:NodeDesc<ListKeys> = {
   type:             'node',
   name,
   schema: {
      content: 'listItem+',
      group:   'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: (): DOMOutputSpec => ['ul', 0],
      attrs: {
         // a style preference attribute for rendering output.
         // For example markdown serializer can render a new line in between or not.
         tight: { default: false },
      },
   },
   plugins:          pluginsFactory,
   keys,
   commands: {
      toggle:           toggle(),
      isActive:         isActive(),
   },
   markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
         state.renderList(node, '  ', () => '- ');
      },
      parseMarkdown: {
         bullet_list: {
            block: name,
            getAttrs: (_: any, tokens: Token[], i: number) => ({ tight: listIsTight(tokens, i) }),
         },
      },
      tag:     'ul',
      where:   {}
   },
}
                                    

function pluginsFactory({markdownShortcut = true, todoMarkdownShortcut = true, keybindings = keys} = {}): RawPlugins {
   return ({ schema }) => {
      const type = getNodeType(schema, name);
      return [
         keybindings && keymap(Object.fromEntries([
            [keybindings.toggle, toggle()]
         ])),
         markdownShortcut && wrappingInputRule(/^\s*([-+*])\s$/, type, undefined, (_str, node) =>
            (node.lastChild && isNodeTodo(node.lastChild, schema))? false : true
         ),
         todoMarkdownShortcut && wrappingInputRuleForTodo(/^\s*(\[ \])\s$/, {
            todoChecked: false,
         }),
      ];
   };
}

function toggle(): Command {
   const fallback: Command = (state, dispatch, view) =>
      toggleList(getNodeType(state, name), getNodeType(state, 'listItem'), false)(state, dispatch, view);
   return chainCommands(removeTodo, fallback) // fallback //
}

function isActive() {
   return isDirectParentActive('listItem', name)
}

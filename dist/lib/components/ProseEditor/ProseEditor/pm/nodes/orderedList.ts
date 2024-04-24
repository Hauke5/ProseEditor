import { Command }                     from 'prosemirror-state';
import { keymap }                      from 'prosemirror-keymap';
import { wrappingInputRule }           from 'prosemirror-inputrules';
import Token                           from 'markdown-it/lib/token.mjs';
import { RawPlugins }                  from '../plugins';
import { toggleList }                  from './listSupport/list-commands';
import { listIsTight }                 from './listSupport/list-is-tight';
import { GenericKeys, isDirectParentActive }                  
                                       from '../common';
import { NodeDesc, getNodeType }       from './common';



const name = 'orderedList'
const keys = {
   toggle: 'Shift-Ctrl-9',
}

interface ListKeys extends GenericKeys {
   toggle:     string
}

export const orderedList:NodeDesc<ListKeys> = {
   type:       'node',
   name,
   schema: {
      attrs: {
         order: {
            default: 1,
         },
         // a style preference attribute which be used for
         // rendering output.
         // For example markdown serializer can render a new line in
         // between or not.
         tight: {
            default: false,
         },
      },
      content: 'listItem+',
      group: 'block',
      parseDOM: [{
         tag: 'ol',
         getAttrs: (dom: any) => ({
            order: dom.hasAttribute('start') ? +dom.getAttribute('start')! : 1,
         }),
      }],
      toDOM: (node) =>
         node.attrs['order'] === 1
            ? ['ol', 0]
            : ['ol', { start: node.attrs['order'] }, 0],
   },
   plugins:          pluginsFactory,
   keys,
   commands: {
      toggle:           toggle(),
      isActive:         isActive(),
   },
   markdown: {
      toMarkdown(state, node) {
         let start = node.attrs['order'] || 1;
         let maxW = String(start + node.childCount - 1).length;
         let space = state.repeat(' ', maxW + 2);
         state.renderList(node, space, (i) => {
            let nStr = String(start + i);
            return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
         });
      },
      parseMarkdown: {
         ordered_list: {
            block: name,
            getAttrs: (tok: Token, tokens: Token[], i: number) => {
               return {
               tight: listIsTight(tokens, i),
               order: +(tok.attrGet('start') ?? 1),
               };
            },
         },
      },
      tag:        'ol',
      where:      {}
   },
}

function pluginsFactory({ keybindings = keys } = {}): RawPlugins {
   return ({ schema }) => {
      const type = getNodeType(schema, name);
      return [
         wrappingInputRule(
            /^(1)[.)]\s$/,
            type,
            (match) => ({ order: +match[1]! }),
            (match, node) => node.childCount + node.attrs['order'] === +match[1]!,
         ),
         keybindings && keymap(Object.fromEntries([[keybindings.toggle, toggleList(type)]])),
      ];
   };
}

function toggle(): Command {
   return (state, dispatch, view) => {
      return toggleList(getNodeType(state, name), getNodeType(state, 'listItem'))(state, dispatch, view);
   };
}


function isActive() {
  return isDirectParentActive('listItem', name)
}

import Token                        from 'markdown-it/lib/token.mjs';
import { keymap }                   from 'prosemirror-keymap';
import { DOMOutputSpec, Node, Schema }             
                                    from 'prosemirror-model';
import { Command, EditorState }     from 'prosemirror-state';
import type { MarkdownSerializerState }   
                                    from 'prosemirror-markdown';
import { chainCommands }            from 'prosemirror-commands';

import { copyEmptyCommand, cutEmptyCommand, MoveDirection, moveNode, parentHasDirectParentOfType } 
                                    from '../core/commands';
import { RawPlugins }               from '../plugins';
import { browser }                  from '../core/browser';
import { insertEmpty, GenericKeys, ItemCommand, StandardCommands }       
                                    from '../common';
import { backspaceKeyCommand, enterKeyCommand, indentList, moveEdgeListItem, outdentList, updateNodeAttrs }                                   
                                    from './listSupport/list-commands';
import { listItemNodeViewPlugin }   from './listSupport/list-item-node-view-plugin';
import { isNodeTodo, setTodoCheckedAttr } 
                                    from './listSupport/list-todo';
import { CommandQuery, conditionalCommand, getNodeType, NodeDesc }    
                                    from './common';


const name = 'listItem'
const tag  = 'li'

const keys = {
   toggleDone: browser.mac ? 'Ctrl-Enter' : 'Ctrl-I',
   indent:     'Tab',
   outdent:    'Shift-Tab',
   moveDown:   'Alt-ArrowDown',
   moveUp:     'Alt-ArrowUp',
   emptyCopy:  'Mod-c',
   emptyCut:   'Mod-x',
   insertEmptyListAbove: 'Mod-Shift-Enter',
   insertEmptyListBelow: 'Mod-Enter',
}
interface ListItemKeys extends GenericKeys {
   toggleDone:    string
   indent:        string
   outdent:       string
   moveDown:      string
   moveUp:        string
   emptyCopy:     string
   emptyCut:      string
   insertEmptyListAbove: string
   insertEmptyListBelow: string
}

interface ListItemQuote extends NodeDesc<ListItemKeys> {
   commands: StandardCommands & {
      indentListItem:   ItemCommand
      outdentListItem:  ItemCommand
      moveListItemUp:   ItemCommand
      moveListItemDown: ItemCommand
   }
}

const { toDOM, parseDOM } = {
   toDOM: (): DOMOutputSpec => [tag, {}, 0],
   parseDOM: [{
      priority: 51,
      getAttrs: (dom: any) => {
         const attrs = dom.getAttribute('data-bangle-attrs');
         if (!attrs) return {}
         return JSON.parse(attrs)
      },
      tag:  'li'
   }],
}


export const listItem:ListItemQuote = {
   type:          'node',
   name,
   schema: {
      content: '(paragraph) (paragraph | bulletList | orderedList)*',
      defining: true,
      draggable: true,
      attrs: {
         // We overload the todoChecked value to
         // decide if its a regular bullet list or a list with todo
         // todoChecked can take following values:
         //   null => regular bullet list
         //   true => todo list with checked
         //   false => todo list with no check
         todoChecked: {
            default: null,
         },
      },
      toDOM,
      parseDOM,
   },
   plugins:       pluginsFactory,
   keys,
   commands: {
      isActive,
      toggle: ()=>false,
      indentListItem,
      outdentListItem,
      moveListItemUp,
      moveListItemDown,
   },
   markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
         if (node.attrs['todoChecked'] != null)
            state.write(node.attrs['todoChecked'] ? '[x] ' : '[ ] ')
         state.renderContent(node);
      },
      parseMarkdown: {
         list_item: {
            block: name,
            getAttrs: (tok: Token) => {
               // overload: undefined=no to do, true/false=todo
               let todoChecked:boolean|undefined = undefined;
               const todoIsDone = tok.attrGet('isDone');
               if (todoIsDone === 'yes') todoChecked = true
               else if (todoIsDone === 'no') todoChecked = false
               return { todoChecked };
            },
         },
      },
      tag:     'li',
      where:   {}
   },
}

function isActive(state: EditorState) {
   const type = getNodeType(state, name);
   const active = parentHasDirectParentOfType(type, [
      getNodeType(state, 'bulletList'),
      getNodeType(state, 'orderedList'),
   ])
   return active(state)
}

const isValidList:CommandQuery = (state: EditorState) => {
   const type = getNodeType(state, name);
   return parentHasDirectParentOfType(type, [
      getNodeType(state, 'bulletList'),
      getNodeType(state, 'orderedList'),
   ])(state)
};


function pluginsFactory({keybindings = keys, nodeView = true} = {}): RawPlugins {
   return ({ schema }: { schema: Schema }) => {
      const type = getNodeType(schema, name);
      return [
         keybindings && keymap({
            [keybindings.toggleDone]: conditionalCommand(isValidList,
               updateNodeAttrs(getNodeType(schema, 'listItem'), (attrs) => ({...attrs,
                  todoChecked: attrs['todoChecked'] == null ? false : !attrs['todoChecked'],
               })),
            ),

            Backspace: backspaceKeyCommand(type),
            Enter: enterKeyCommand(type), ...Object.fromEntries([
               [keybindings.indent, indentListItem()],
               [keybindings.outdent, outdentListItem()],
               [keybindings.moveUp, moveListItemUp()],
               [keybindings.moveDown, moveListItemDown()],
               [keybindings.emptyCut,  conditionalCommand(isValidList, cutEmptyCommand(type))],
               [keybindings.emptyCopy, conditionalCommand(isValidList, copyEmptyCommand(type))],
               [keybindings.insertEmptyListAbove, insertEmptySiblingListAbove()],
               [keybindings.insertEmptyListBelow, insertEmptySiblingListBelow()],
            ]),
         }),
         nodeView && listItemNodeViewPlugin(name),
      ];
   };
}

function indentListItem(): Command {
   return (state, dispatch) => {
      const type = getNodeType(state, name);
      return indentList(type)(state, dispatch);
   };
}

function outdentListItem(): Command {
   return (state, dispatch, view) => {
      const type = getNodeType(state, name);
      return outdentList(type)(state, dispatch, view);
   };
}

const isSelectionInsideTodo = (state: EditorState) => {
   return isNodeTodo(state.selection.$from.node(-1), state.schema);
};

function moveListItem(dir: MoveDirection): Command {
   return (state, dispatch, view) => {
      const type = getNodeType(state, name);

      const isBulletList = parentHasDirectParentOfType(type, [
         getNodeType(state, 'bulletList'),
         getNodeType(state, 'orderedList'),
      ])

      const move = (dir: MoveDirection) =>
         chainCommands(moveNode(type, dir), (state, dispatch, view) => {
            const node = state.selection.$from.node(-3);
            const isParentTodo = isNodeTodo(node, state.schema);
            const result = moveEdgeListItem(type, dir)(state, dispatch, view);
            if (!result) return false;

            // if parent was a todo convert the moved edge node
            // to todo bullet item
            if (isParentTodo && dispatch) {
               const state = view!.state;
               let { tr, schema } = state;
               tr = setTodoCheckedAttr(tr, schema, state.selection.$from.node(-1), state.selection.$from.before(-1));
               dispatch(tr);
            }
            return true;
         });

      return conditionalCommand(isBulletList, move(dir))(state, dispatch, view);
   };
}

function moveListItemUp() {
   return moveListItem('UP');
}
function moveListItemDown() {
   return moveListItem('DOWN');
}

function insertEmptySiblingList(isAbove = true): Command {
   return (state, dispatch, view) => {
      const type = getNodeType(state, name);

      return chainCommands(
         conditionalCommand(
            isSelectionInsideTodo,
            insertEmpty(type, isAbove ? 'above' : 'below', true, {todoChecked: false}),
         ),
         conditionalCommand(isValidList, insertEmpty(type, isAbove ? 'above' : 'below', true)),
      )(state, dispatch, view);
   };
}

function insertEmptySiblingListAbove() {
   return insertEmptySiblingList(true);
}

function insertEmptySiblingListBelow() {
   return insertEmptySiblingList(false);
}

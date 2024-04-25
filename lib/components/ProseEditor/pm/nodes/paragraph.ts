import { keymap }                from 'prosemirror-keymap';
import { DOMOutputSpec }         from 'prosemirror-model';
import { setBlockType }          from 'prosemirror-commands';
import { Command, EditorState }
                                 from 'prosemirror-state';
import { copyEmptyCommand, cutEmptyCommand, jumpToEndOfNode, jumpToStartOfNode, moveNode, parentHasDirectParentOfType } 
                                 from '../core/commands';
import { findParentNodeOfType }  from '../core/node';
import { browser }               from '../core/browser';
import type { RawPlugins }       from '../plugins';
import { insertEmpty, Dispatch, GenericKeys, StandardCommands }    
                                 from '../common';
import { NodeDesc, conditionalCommand, getNodeType } 
                                 from './common';


const name = 'paragraph'
const keys = {
   jumpToEndOfParagraph:    browser.mac ? 'Ctrl-e' : 'Ctrl-End',
   jumpToStartOfParagraph:  browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
   moveDown:                'Alt-ArrowDown',
   moveUp:                  'Alt-ArrowUp',
   emptyCopy:               'Mod-c',
   emptyCut:                'Mod-x',
   insertEmptyParaAbove:    'Mod-Shift-Enter',
   insertEmptyParaBelow:    'Mod-Enter',
   convertToParagraph:      'Ctrl-Shift-0',
}
interface ParagraphKeys extends GenericKeys {
   jumpToEndOfParagraph:    string
   jumpToStartOfParagraph:  string
   moveDown:                string
   moveUp:                  string
   emptyCopy:               string
   emptyCut:                string
   insertEmptyParaAbove:    string
   insertEmptyParaBelow:    string
   convertToParagraph:      string
}
                                    
type ParagraphAccess = NodeDesc<ParagraphKeys> & {
   commands: StandardCommands & {
      convertToParagraph:  Command
      isTopLevelParagraph: (state:EditorState)=>boolean
   }
}

export const paragraph:ParagraphAccess = {
   type:          'node',
   name,
   schema: {
      content:    'inline*',
      group:      'block',
      draggable:  false,
      parseDOM: [
         {tag: 'p'},
      ],
      toDOM: (): DOMOutputSpec => ['p', 0],
   },
   plugins:                pluginsFactory,
   keys,
   commands: {
      toggle:              convertToParagraph(),
      convertToParagraph:  convertToParagraph(),
      isTopLevelParagraph: queryIsTopLevelParagraph(),
      isActive:            isParagraph(),
   },
   markdown: {
      toMarkdown(state, node) {
         state.renderInline(node);
         state.closeBlock(node);
      },
      parseMarkdown: {
         paragraph: {
            block: 'paragraph',
         },
      },
      tag:     'p',
      where:   {}
   },
}


function pluginsFactory({ keybindings = keys } = {}): RawPlugins {
   return ({ schema }) => {
      const type = getNodeType(schema, name);
      // Enables certain command to only work if paragraph is direct child of the `doc` node
      const isTopLevel = parentHasDirectParentOfType(type, getNodeType(schema, 'doc'));
      return [
         keybindings && keymap(Object.fromEntries([
               [keybindings.convertToParagraph, convertToParagraph()],

               [keybindings.moveUp, conditionalCommand(isTopLevel, moveNode(type, 'UP'))],
               [keybindings.moveDown, conditionalCommand(isTopLevel, moveNode(type, 'DOWN'))],

               [keybindings.jumpToStartOfParagraph, jumpToStartOfNode(type)],
               [keybindings.jumpToEndOfParagraph, jumpToEndOfNode(type)],

               [keybindings.emptyCopy, conditionalCommand(isTopLevel, copyEmptyCommand(type))],
               [keybindings.emptyCut, conditionalCommand(isTopLevel, cutEmptyCommand(type))],

               [keybindings.insertEmptyParaAbove, conditionalCommand(isTopLevel, insertEmpty(type, 'above'))],
               [keybindings.insertEmptyParaBelow, conditionalCommand(isTopLevel, insertEmpty(type, 'below'))],
            ]),
         ),
      ];
   };
}

// Commands
export function convertToParagraph(): Command {
   return (state:EditorState, dispatch?:Dispatch) =>
      setBlockType(getNodeType(state, name))(state, dispatch);
}

export function queryIsTopLevelParagraph() {
   return (state: EditorState) => {
      const type = getNodeType(state, name);
      return parentHasDirectParentOfType(type, getNodeType(state, 'doc'))(state);
   };
}

export function isParagraph() {
   return (state: EditorState) => {
      const type = getNodeType(state, name);
      return Boolean(findParentNodeOfType(type)(state.selection));
   };
}

export function insertEmptyParagraphAbove(): Command {
   return insertEmptyParagraph('above')
}
export function insertEmptyParagraphBelow(): Command {
   return insertEmptyParagraph('below')
}
function insertEmptyParagraph(where:'above'|'below'): Command {
   return (state, dispatch, view) => {
      const type = getNodeType(state, name);
      return conditionalCommand(
         parentHasDirectParentOfType(type, getNodeType(state, 'doc')),
         insertEmpty(type, where),
      )(state, dispatch, view);
   };
}

export function jumpToStartOfParagraph(): Command {
   return (state:EditorState, dispatch?:Dispatch) => {
      const type = getNodeType(state, name);
      return jumpToStartOfNode(type)(state, dispatch);
   };
}

export function jumpToEndOfParagraph(): Command {
   return (state:EditorState, dispatch?:Dispatch) => {
      const type = getNodeType(state, name);
      return jumpToEndOfNode(type)(state, dispatch);
   };
}

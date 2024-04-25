import { wrappingInputRule }              from 'prosemirror-inputrules';
import { keymap }                         from 'prosemirror-keymap';
import type { MarkdownSerializerState }   from 'prosemirror-markdown';
import { DOMOutputSpec, Node }            from 'prosemirror-model';
import { Command, EditorState }           from 'prosemirror-state';
import { paragraph }                      from './paragraph';
import { RawPlugins, PluginPayload }      from '../plugins';
import { copyEmptyCommand, cutEmptyCommand, moveNode } 
                                          from '../core/commands';
import { Dispatch, GenericKeys, StandardCommands, insertEmptyParaAbove, insertEmptyParaBelow, wrapInType } 
                                          from '../common';
import { NodeDesc, getNodeType, isNodeActive }         
                                          from './common'


const name = 'blockquote'
const keys = {
   wrapIn:                 'Ctrl-ArrowRight',
   moveDown:               'Alt-ArrowDown',
   moveUp:                 'Alt-ArrowUp',
   emptyCopy:              'Mod-c',
   emptyCut:               'Mod-x',
   insertEmptyParaAbove:   'Mod-Shift-Enter',
   insertEmptyParaBelow:   'Mod-Enter',
}


interface BlockQuoteKeys extends GenericKeys {
   wrapIn:                 string
   moveDown:               string
   moveUp:                 string
   emptyCopy:              string
   emptyCut:               string
   insertEmptyParaAbove:   string
   insertEmptyParaBelow:   string
}

interface BlockQuoteDesc extends NodeDesc<BlockQuoteKeys> {
   commands: StandardCommands & {
      wrapIn:     Command
   }
}

export const blockQuote:BlockQuoteDesc = {
   type:          'node',
   name,
   schema: {
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: (): DOMOutputSpec => ['blockquote', 0],
   },
   plugins:       plugins,
   keys,
   commands:   {
      toggle:        toggle(name),
      wrapIn:        wrapInType(name),
      isActive:      isNodeActive(name),
   },
   markdown: {
      toMarkdown: (state: MarkdownSerializerState, node: Node) =>
         state.wrapBlock('> ', null, node, () => state.renderContent(node)),
      parseMarkdown: {
         blockquote: {block: name },
      },
      tag:     'blockquote',
      where:   {}  
   },
}

function toggle(name:string) {
   return (state:EditorState, dispatch?:Dispatch) => {
      const cmd = isNodeActive(name)(state)
         ? paragraph.commands.convertToParagraph(state, dispatch) 
         : wrapInType(name)(state, dispatch)
      return !!cmd
   }
}


function plugins({markdownShortcut=true, keybindings=keys} = {}): RawPlugins {
   return ({ schema }:PluginPayload) => {
      const type = getNodeType(schema, name);
      return [
         markdownShortcut && wrappingInputRule(/^\s*>\s$/, type),
         keybindings && keymap(Object.fromEntries([
            [keybindings.wrapIn,                wrapInType(name)],
            [keybindings.moveUp,                moveNode(type, 'UP')],
            [keybindings.moveDown,              moveNode(type, 'DOWN')],
            [keybindings.emptyCopy,             copyEmptyCommand(type)],
            [keybindings.emptyCut,              cutEmptyCommand(type)],
            [keybindings.insertEmptyParaAbove,  insertEmptyParaAbove(name)],
            [keybindings.insertEmptyParaBelow,  insertEmptyParaBelow(name)],
         ])),
      ];
   };
}

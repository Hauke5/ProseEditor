import Token                              from 'markdown-it/lib/token.mjs';
import { keymap }                         from 'prosemirror-keymap';
import { Node }                           from 'prosemirror-model';
import { Command, EditorState } 
                                          from 'prosemirror-state';
import type { MarkdownSerializerState }   from 'prosemirror-markdown';
import { setBlockType }                   from 'prosemirror-commands';
import { textblockTypeInputRule }         from 'prosemirror-inputrules';
import { RawPlugins }                     from '../plugins';
import { copyEmptyCommand, cutEmptyCommand, jumpToEndOfNode, jumpToStartOfNode, moveNode } 
                                          from '../core/commands';
import { findParentNodeOfType }           from '../core/node';
import { browser }                        from '../core/browser';
import { GenericKeys, StandardCommands, insertEmptyParaAbove, insertEmptyParaBelow }             
                                          from '../common';
import { NodeDesc, getNodeType }          from './common';


const name = 'heading'
const defaultLevels = [1, 2, 3, 4, 5, 6];

const keys = {
   toH1:                   'Shift-Ctrl-1',
   toH2:                   'Shift-Ctrl-2',
   toH3:                   'Shift-Ctrl-3',
   toH4:                   'Shift-Ctrl-4',
   toH5:                   'Shift-Ctrl-5',
   toH6:                   'Shift-Ctrl-6',
   moveDown:               'Alt-ArrowDown',
   moveUp:                 'Alt-ArrowUp',
   emptyCopy:              'Mod-c',
   emptyCut:               'Mod-x',
   insertEmptyParaAbove:   'Mod-Shift-Enter',
   jumpToStartOfHeading:   browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
   jumpToEndOfHeading:     browser.mac ? 'Ctrl-e' : 'Ctrl-End',
   insertEmptyParaBelow:   'Mod-Enter',
}
interface HeadingKeys extends GenericKeys {
   toH1:                   string
   toH2:                   string
   toH3:                   string
   toH4:                   string
   toH5:                   string
   toH6:                   string
   moveDown:               string
   moveUp:                 string
   emptyCopy:              string
   emptyCut:               string
   insertEmptyParaAbove:   string
   jumpToStartOfHeading:   string
   jumpToEndOfHeading:     string
   insertEmptyParaBelow:   string
}
                                    
type AccessHeading = NodeDesc<HeadingKeys> & {
   commands:   StandardCommands & {
      toggle:     (level:number)=> Command
      isActive:   (level:number)=> Command
   }
}

export const heading:AccessHeading = {
   type:          'node',
   name,
   schema: {
      attrs: {
         level: {
            default: 1,
         },
         collapseContent: {
            default: null,
         },
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: defaultLevels.map((level) => {
         return {
            tag: `h${level}`,
            getAttrs: (dom: any) => {
               const result = { level: parseLevel(level) };
               const attrs = undefined
               if (!attrs) return result

               const obj = JSON.parse(attrs);
               return Object.assign({}, result, obj);
            },
         };
      }),
      toDOM: (node: Node) => {
         const result: any = [`h${node.attrs['level']}`, {}, 0];

         return result;
      },
   },
   plugins:       pluginsFactory(defaultLevels),
   keys,
   commands: {
      toggle:        (level:number)=>toggleHeading(level, name),
      isActive:      (level:number)=>queryIsHeadingActive(level, name),
   },
   markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
         state.write(state.repeat('#', node.attrs['level']) + ' ');
         state.renderInline(node);
         state.closeBlock(node);
      },
      parseMarkdown: {
         heading: {
            block: name,
            getAttrs: (tok: Token) => {
               return { level: parseLevel(tok.tag.slice(1)) };
            },
         },
      },
      tag:     (level) => `h${level}`,
      where:   {}
   },
}

const parseLevel = (levelStr: string | number) => {
   const level = parseInt(levelStr as string, 10);
   return Number.isNaN(level) ? undefined : level;
};

const levelRegex = (level:number) =>  new RegExp(`^(#{1,${level}})\\s$`)

function pluginsFactory(levels:number[]) {
   return ({markdownShortcut=true, keybindings=keys} = {}): RawPlugins => {
      return ({ schema }) => {
         const type = getNodeType(schema, name)

         const levelBindings = Object.fromEntries(
            levels.map((level: number) => [
               keybindings[`toH${level}` as keyof typeof keys],
               setBlockType(type, { level }),
            ]),
         )
         return [
            keybindings &&
            keymap({
               ...levelBindings,
               ...Object.fromEntries([
                  [keybindings['moveUp'], moveNode(type, 'UP')],
                  [keybindings['moveDown'], moveNode(type, 'DOWN')],
                  [keybindings['jumpToStartOfHeading'], jumpToStartOfNode(type)],
                  [keybindings['jumpToEndOfHeading'], jumpToEndOfNode(type)],
                  [keybindings['emptyCopy'], copyEmptyCommand(type)],
                  [keybindings['emptyCut'], cutEmptyCommand(type)],
                  [keybindings['insertEmptyParaAbove'], insertEmptyParaAbove(name, false)],
                  [keybindings['insertEmptyParaBelow'], insertEmptyParaBelow(name, false)],
               ]),
            }),
            ...(markdownShortcut ? levels : []).map((level: number) =>
               textblockTypeInputRule(levelRegex(level), type, () => ({level})),
            ),
         ]
      }
   }
}

function toggleHeading(level = 3, name:string): Command {
   return (state, dispatch) => {
      if (queryIsHeadingActive(level, name)(state)) {
         const para = getNodeType(state, 'paragraph')
         return setBlockType(para)(state, dispatch);
      }
      return setBlockType(getNodeType(state, name), { level })(state, dispatch);
   };
}

function queryIsHeadingActive(level: number, name:string):Command {
   return (state: EditorState):boolean => {
      const match = findParentNodeOfType(getNodeType(state, name))(state.selection);
      if (!match) return false

      const { node } = match;
      if (level == null) return true
      return node.attrs['level'] === level;
   };
}

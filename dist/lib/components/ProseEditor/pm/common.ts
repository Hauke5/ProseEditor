import { MarkdownParser, MarkdownSerializer } 
                                       from 'prosemirror-markdown';
import { wrapIn }                      from 'prosemirror-commands';
import { MarkSpec, Node, NodeSpec, NodeType, Schema }  
                                       from 'prosemirror-model';
import { Command, EditorState, Transaction }        
                                       from 'prosemirror-state';
import { EditorView }                  from 'prosemirror-view';
import { parentHasDirectParentOfType } from './core/commands';
import { assert }          from './core/helpers';
import { UnnestObjValue }              from './core/helpers';
import { RawPlugins }                  from './plugins';
import { conditionalCommand, getNodeType, isNodeActive }   
                                       from './nodes/common';
import { paragraph }                   from './nodes/paragraph';
import { safeInsert }                  from './core/transforms';

export type Dispatch = {(tr:Transaction): void}
export type GenericKeys = {[commandName:string]: string}


export type SpecNode = {
   type:       'node'
   name:       string
   topNode?:   boolean
   schema:     NodeSpec
   markdown?:  Markdown<'nodes'>

}

export type SpecMark = {
   type:       'mark';
   name:       string;
   schema:     MarkSpec;
   markdown?:  Markdown<'marks'>
}

export type Spec<T extends 'marks'|'nodes'='marks'|'nodes'> = T extends 'marks' ? SpecMark : SpecNode

export type ItemDesc<K extends GenericKeys=GenericKeys, T extends 'marks'|'nodes'='marks'|'nodes'> 
   = Spec<T> & {
      /** used as PM plugin in `registry->corePlugins` */
      plugins:    (props?: PluginsFactoryProps<K>)=> RawPlugins
      /** will be converted to keymap and added to the plugins */
      keys:       K
      markdown:   Markdown<T>
      /** how to act on the item; used in `menuItemSpecs`, and occasionally elsewhere, e.g. in blockQuote */
      commands:   StandardCommands
   }

export type Markdown<M extends 'marks'|'nodes'='marks'|'nodes'>  = {
   /** used in markdownSerializer */
   toMarkdown:       UnnestObjValue<MarkdownSerializer[M]>;
   /** used in markdownParser */
   parseMarkdown?:   MarkdownParser['tokens'] 
   /** used in markdownPlugin */
   tag:              M extends 'marks'? string : string | ((...args:any[])=>string)
   /** used in markdownPlugin */
   where:            {before?:string, after?:string}
}

   
                                         
export type PluginsFactoryProps<K extends GenericKeys={}> = {
   markdownShortcut?:      boolean
   keybindings?:           K
   todoMarkdownShortcut?:  boolean
}


export type ItemCommand = Command | ((...args:any[])=> Command)
export type ItemCommands = {[cmdName:string]: ItemCommand}
export type StandardCommands = ItemCommands & {
   isActive:  ItemCommand,
   toggle:    ItemCommand,
}




export type RawSpecs = null | false | undefined | SpecNode | SpecMark | RawSpecs[];


export function isDirectParentActive(name:string, parentName:string) {
   return (state: EditorState):boolean => {
      return parentHasDirectParentOfType(getNodeType(state, name), [getNodeType(state, parentName)])(state);
   };
}

export const getTypeFromSchema = (name:string, schema: Schema) => {
   const markType = schema.marks[name];
   assert(markType, `markType ${name} not found`);
   return markType;
};

export const wrapInType = (name:string) => conditionalCommand(
   (state:EditorState) => !isNodeActive(name)(state),
   (state:EditorState, dispatch?:Dispatch) => wrapIn(getNodeType(state, name))(state, dispatch)
)

export const insertEmptyParaAbove = (name:string, nestable=true) => insertEmptyPara(name, 'above', nestable)
export const insertEmptyParaBelow = (name:string, nestable=true) => insertEmptyPara(name, 'below', nestable)
function insertEmptyPara(name:string, where:'above'|'below', nestable:boolean): Command {
   return (state:EditorState, dispatch?:Dispatch, view?:EditorView) => {
      const type = getNodeType(state, paragraph.name);
      return conditionalCommand(isNodeActive(name), insertEmpty(type, where, nestable))(state, dispatch, view);
   };
}

/**
 *
 * @param {*} type The schema type of object to create
 * @param {*} placement The placement of the node - above or below
 * @param {*} nestable putting this true will create the
 *            empty node at -1. Set this to true   for nodes
 *             which are nested, for example in:
 *              `<ul> p1 <li> p2 <p>abc</p> p7 </li> p8 <ul>`
 *            we want to insert empty `<li>` above, for which we
 *            will  insert it at pos p1 and not p2. If nested was false,
 *            the function would hav inserted at p2.
 */
export function insertEmpty(type: NodeType, placement: 'above' | 'below' = 'above', nestable: boolean = false, attrs?: Node['attrs']): Command {
   const isAbove = placement === 'above';
   const depth = nestable ? -1 : undefined;
   return (state, dispatch) => {
      const insertPos = isAbove
         ? state.selection.$from.before(depth)
         : state.selection.$from.after(depth);
      const nodeToInsert = type.createAndFill(attrs);
      const tr = state.tr;
      let newTr = safeInsert(nodeToInsert!, insertPos)(state.tr);
      if (tr === newTr) return false;
      if (dispatch) dispatch(newTr.scrollIntoView());
      return true;
   };
}


import { EditorView }            from "prosemirror-view";
import { setBlockType }          from "prosemirror-commands";
import { NodeType, Schema }      from "prosemirror-model";
import { Command, EditorState }  from "prosemirror-state";
import { findParentNodeOfType }  from "../core/node";
import { Dispatch, GenericKeys, ItemDesc } 
                                 from "../common";
import { paragraph }             from "./paragraph";

/** 
 * Like a Command, but without the dispatch function; 
 * Checks if command is executable and return `true`/`false`, but does not execute
 */
export type CommandQuery = (state: EditorState, view?: EditorView) => boolean;

export type NodeDesc<K extends GenericKeys={}> = ItemDesc<K, 'nodes'>


export function toggle(name:string) {
   return (state:EditorState, dispatch?:Dispatch) => {
   const nodeType = state.schema.nodes[name]
      const cmd = isNodeActive(name)(state)
         ? paragraph.commands.convertToParagraph(state, dispatch) 
         : setBlockType(nodeType)(state, dispatch)
      return !!cmd
   }
}


export function isNodeActive(name:string):(state: EditorState)=>boolean {
   return (state: EditorState) => {
      const type = getNodeType(state, name);
      const match = findParentNodeOfType(type)(state.selection)
      return !!match
   };
}

export function getNodeType(arg: Schema | EditorState, name: string): NodeType {
   const nodeType =
      arg instanceof EditorState ? arg.schema.nodes[name] : arg.nodes[name];
   if (!nodeType) throw Error(`nodeType ${name} not found`)
   return nodeType;
}

/**
 * ensures that all predicates are `true`, then calls `cmd`. Otherwise, returns `false`
 * @param predicates 
 * @param cmd 
 * @returns 
 */
export function conditionalCommand(predicates: CommandQuery | CommandQuery[], cmd?: Command): Command {
   return (state, dispatch, view) => {
      if (cmd == null) return false;
      if (!Array.isArray(predicates)) predicates = [predicates];
      if (predicates.some((pred) => !pred(state, view))) return false;
      return cmd(state, dispatch, view) || false;
   };
}
// a cleaner alternative??? 
// function filterCommand(predicates: PredicateFunction | PredicateFunction[]) {
//    return (cmd?: Command): Command => (state, dispatch, view) => {
//       if (cmd == null) return false;
//       if (!Array.isArray(predicates)) predicates = [predicates];
//       if (predicates.some((pred) => !pred(state, view))) return false;
//       return cmd(state, dispatch, view) || false;
//    }
// }

/**
 * Gets the paragraph node type from the schema
 * Warning: This will throw if the node type is not found
 * @param arg
 * @returns
 */
export function getParaNodeType(arg: Schema | EditorState): NodeType {
   return getNodeType(arg, 'paragraph')
}

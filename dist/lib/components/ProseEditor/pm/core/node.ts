import { Node as PMNode, NodeType, ResolvedPos } 
                              from 'prosemirror-model';
import { Selection }          from 'prosemirror-state';


type PMNodeWithPos = {
   pos: number, 
   node: PMNode
};

type PMContentNodeWithPos = PMNodeWithPos & {
   start?:  number, 
   depth:   number, 
}

type PMNodeCondition = {(node: PMNode): boolean}


/** Checks if the type a given `node` equals to a given `nodeType`  */
export const equalNodeType = (nodeType:NodeType|NodeType[], node:PMNode):boolean =>
   (nodeType as NodeType[]).includes?.(node.type) || node.type === nodeType

/**
* Flattens descendants of a given prosemirror `node`. 
* If `descend` is `false` (default:`true`), no further descent into the node will occur.
*/
export const flattenNode = (node:PMNode, descend=true):PMNodeWithPos[] => {
   const result = [] as { node:PMNode, pos: number }[]
   node.descendants((child, pos) => {
      result.push({ node: child, pos });
      if (!descend) return false
   })
   return result;
}

/** Returns child nodes of the the prosemirror Node `node` for which `condition` returns truthy */
export const findChildren = (node:PMNode, condition:PMNodeCondition, descend:boolean):PMNodeWithPos[] =>
   flattenNode(node, descend).filter(child => condition(child.node))

/** Returns text nodes for a given prosemirror `node` */
export const findTextNodes = (node:PMNode, descend:boolean):PMNodeWithPos[] =>
   findChildren(node, child => child.isText, descend)

/** Returns inline nodes for a given prosemirror `node` */
export const findInlineNodes = (node:PMNode, descend:boolean):PMNodeWithPos[] =>
   findChildren(node, child => child.isInline, descend)

/** Returns block descendants for a given prosemirror `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`) */
export const findBlockNodes = (node:PMNode, descend:boolean):PMNodeWithPos[] => 
   findChildren(node, child => child.isBlock, descend)


/**
 * Returns the prosemirror parent node closest to `$from` that satisfies `condition`.
 * `start` points to the start position of the node, `pos` points directly before the node.
 * ```javascript
 * const condition = node => node.type === schema.nodes.blockquote;
 * const parent = findParentNode(condition)(selection);
 * ```
 */
export const findConditionalParentNode = (condition:PMNodeCondition) => ({$from}:{$from:ResolvedPos}):PMContentNodeWithPos|null => {
   for (let i = $from.depth; i > 0; i--) {
      const node = $from.node(i);
      if (condition(node)) {
         return {
            pos: i > 0 ? $from.before(i) : 0,
            start: $from.start(i),
            depth: i,
            node
         };
      }
   }
   return null
}

/**
 * Returns parent node of a given `nodeType` closest to `selection`.
 * `start` points to the start position of the node, `pos` points directly before the node.
 * ```javascript
 * const parent = findParentNodeOfType(schema.nodes.paragraph)(selection);
 * ```
 */
export const findParentNodeOfType = (nodeType:NodeType) => (selection:Selection):PMContentNodeWithPos|null =>
   findConditionalParentNode((node:PMNode) => equalNodeType(nodeType, node))(selection)

/**
 * Returns position of the previous node.
 *
 * ```javascript
 * const pos = findPositionOfNodeBefore(tr.selection);
 * ```
 */
export function findPositionOfNodeBefore(selection:Selection):number {
   const { nodeBefore } = selection.$from;
   const maybeSelection = Selection.findFrom(selection.$from, -1);
   if (maybeSelection && nodeBefore) {
      // leaf node
      const parent = findParentNodeOfType(nodeBefore.type)(maybeSelection);
      if (parent) return parent.pos
      return maybeSelection.$from.pos;
   }
   return 0
}

/**
 * Checks if one of a `selection`'s parent nodes pass `condition`.
 * ```javascript
 * if (hasParentNode(node => node.type === schema.nodes.table)(selection)) {
 *   // ....
 * }
 * ```
 */
export const hasParentNode = (condition:PMNodeCondition) =>
   (selection:Selection):boolean => !!findConditionalParentNode(condition)(selection)


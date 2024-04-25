import { Fragment, Node, Node as PMNode, ResolvedPos }
                        from 'prosemirror-model';


export type UnnestObjValue<T> = T extends { [k: string]: infer U } ? U : never;

class AssertionError extends Error {}

/** Throws an AssertionError if value is `undefined` */
export function assert(value: unknown, message: string): asserts value {
   if (value === undefined)
      throw new AssertionError(`failed: ${message}`)
}

/**
 * From Prosemirror https://github.com/prosemirror/prosemirror-markdown/blob/6107527995873d6199bc533a753b614378747056/src/to_markdown.ts#L380
 * Tries to wrap the string with `"` if it doesn't contain a '"', else if `'` if it has no `'`. else `()`
 */
export const quote = (str: string) => 
   str.indexOf('"') === -1 ? `"${str}"` : str.indexOf("'") === -1 ? `'${str}'`: `(${str})`


/** Checks if replacing a node at a given `$pos` inside of the `doc` node with the given `content` is possible. */
export const canReplace = ($pos:ResolvedPos, content:Node|Fragment): boolean => {
   const node = $pos.node($pos.depth);
   return node && node.type.validContent(content instanceof Fragment ? content : Fragment.from(content))
};

/** 
 * Checks if a given `content` can be inserted at the given `$pos`
 * ```javascript
 * const { selection: { $from } } = state;
 * const node = state.schema.nodes.atom.createChecked();
 * if (canInsert($from, node)) ...
 * ```
 */
export function canInsert($pos:ResolvedPos, content:Node|Fragment):boolean {
   const index = $pos.index()
   if (content instanceof Fragment)
      return $pos.parent.canReplace(index, index, content)
   else if (content instanceof PMNode)
      return $pos.parent.canReplaceWith(index, index, content.type)
   return false;
};

/** Checks if a given `node` is an empty paragraph */
export const isEmptyParagraph = (node:PMNode) => {
  return !node || (node.type.name === 'paragraph' && node.nodeSize === 2)
};

export const checkInvalidMovements = (originIndex:number, targetIndex:number, targets:number[], type:string):boolean => {
   const direction = originIndex > targetIndex ? -1 : 1;
   const errorMessage = `Target position is invalid, you can't move the ${type} ${originIndex} to ${targetIndex}, the target can't be split. You could use tryToFit option.`;

   if (direction === 1) {
      if (targets.slice(0, targets.length - 1).indexOf(targetIndex) !== -1) throw new Error(errorMessage)
   } else {
      if (targets.slice(1).indexOf(targetIndex) !== -1) throw new Error(errorMessage)
   }
   return true
}

/**
 * Returns an array of the children on `node`
 */
export function mapChildren(node: Node | Fragment): Node[] {
   const array:Node[] = [];
   for (let i = 0; i < node.childCount; i++) {
      array.push(node.child(i));
   }
   return array;
}

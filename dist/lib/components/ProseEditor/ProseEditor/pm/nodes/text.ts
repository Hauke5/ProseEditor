
import { Node }            from 'prosemirror-model';
import type { SpecNode }   from '../common';

export const spec = specFactory;

const name = 'text';

function specFactory(): SpecNode {
   return {
      type: 'node',
      name,
      schema: {
         group: 'inline',
      },
      markdown: {
         toMarkdown(state: any, node: Node) {
            state.text(node.text);
         },
         tag:     '',
         where:   {}
      },
   };
}

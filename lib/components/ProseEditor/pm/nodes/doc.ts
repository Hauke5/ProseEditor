import type { SpecNode } from '../common'

export const spec = specFactory;

const name = 'doc';

function specFactory({ content = 'block+' } = {}): SpecNode {
   return {
      type: 'node',
      topNode: true,
      name,
      schema: {
         content,
      },
   };
}

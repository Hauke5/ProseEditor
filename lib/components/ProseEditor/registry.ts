import { Schema }          from 'prosemirror-model';
import * as m              from './pm/marks';
import * as n              from './pm/nodes';
import { BaseRawPlugins }  from './pm/plugins';
import { Spec }            from './pm/common';
import * as doc            from './pm/nodes/doc'
import { paragraph }       from './pm/nodes/paragraph';
import * as text           from './pm/nodes/text';
                           

const comps = [m.strike, m.sub, m.sup, m.bold, m.code, m.underline, m.italic, m.link, m.mark, 
               n.blockQuote, n.bulletList, n.codeBlock, n.hardBreak, n.heading, 
               n.horizontalRule, n.image, n.listItem, n.orderedList]

export const {schema, specs} = descToSchema(comps);


export const corePlugins:BaseRawPlugins[] = comps.map(c => {
      const plugins = c.plugins();
      return (typeof plugins==='function') ? plugins({schema}) : plugins
   })
   .filter(p=>p)
   .flat()



function descToSchema(descs:Spec[]) {
   const specs  = createSpecs(descs)
   const schema = createSchema(specs)
   return { specs, schema }
}

function createSpecs(descs:Spec[]) {
   let specs = descs.filter(r => !!r)
   specs.forEach(validateSpec);
   const names = new Set(specs.map((r) => r.name));
   if (specs.length !== names.size) {
      throw new Error('Duplicate spec error, please check your comps');
   }
   // ensure these re set: 
   if (!names.has('paragraph')) specs.unshift(paragraph)
   if (!names.has('text'))      specs.unshift(text.spec())
   if (!names.has('doc'))       specs.unshift(doc.spec())
   return specs
}

function createSchema(specs:Spec[]) {
   return new Schema(specs.reduce((acc, spec)=>{
      // 'mark'/'node' -> ['marks']/['nodes']
      acc[`${spec.type}s`][spec.name] = spec.schema
      if (spec.type==='node' && spec.topNode===true) acc.topNode = spec.name;
      return acc
   }, {
      topNode: undefined as string|undefined,
      nodes: {},
      marks: {},
   }))
}

function validateSpec(spec: Spec) {
   if (!spec.name) 
      throw new Error('Invalid spec. Spec must have a name')
   if (!['node', 'mark'].includes(spec.type)) 
      throw new Error('Invalid spec type')
   if (['node', 'mark'].includes(spec.type) && !spec.schema)
      throw new Error('Invalid spec schema');
}

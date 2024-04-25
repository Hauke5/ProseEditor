import { MarkSpec, NodeSpec, Schema }  from 'prosemirror-model';
import { StateInline }                 from 'markdown-it/index.js';
import markdownIt                      from 'markdown-it';
import type MarkdownIt                 from "markdown-it"
import { MarkdownParser, MarkdownSerializer }              
                                       from 'prosemirror-markdown';
import { schema, specs }               from '../../registry';
import { mark, sub, sup, underline }   from '../marks';
import { Markdown, Spec, SpecMark, SpecNode }
                                       from '../common';
import { todoListMarkdownItPlugin }    from './plugins/todoPlugin';


const getDefaultMarkdownItTokenizer = (markdowns:{[node:string]:Markdown}) =>
  markdownIt()
   .use(todoListMarkdownItPlugin)
   .use(markdownPlugin(mark.name, markdowns))
   .use(markdownPlugin(sub.name, markdowns))
   .use(markdownPlugin(sup.name, markdowns))
   .use(markdownPlugin(underline.name, markdowns))


/** the `markdown` parser (txt -> markdown) */
export const parser = markdownParser(schema, namedMarkdown(specs));
/** the markdown serializer (markdown -> txt) */
export const serializer = markdownSerializer(specs)     // markdownSerializer(comps);



function namedMarkdown(comps:Spec[]):{[node:string]:Markdown} {
   return Object.fromEntries(comps.filter(c =>c.markdown).map(c=>[c.name, c.markdown!]))
}


type MarkSerializer = {
   [k: string]: NonNullable<SpecMark['markdown']>['toMarkdown'];
}
type NodeSerializer = {
   [k: string]: NonNullable<SpecNode['markdown']>['toMarkdown'];
}

   

export function markdownParser(schema:Schema, namedMarkdown:{[node:string]:Markdown}) {
   const markdownItTokenizer = getDefaultMarkdownItTokenizer(namedMarkdown)
     const tokens = Object.fromEntries(Object.entries(namedMarkdown)
      .map(([name, markdown])=>markdown)
      .filter(markdown=>markdown.parseMarkdown)
      .flatMap(markdown=>Object.entries(markdown.parseMarkdown!))
   )
  return new MarkdownParser(schema, markdownItTokenizer, tokens);
}


export function markdownSerializer(specs: (NodeSpec|MarkSpec)[]) {
   const node:NodeSerializer = {} 
   const mark:MarkSerializer = {}
   for (const spec of specs) {
      if (spec.markdown?.toMarkdown)
         if      (spec.type==='node') node[spec.name] = spec.markdown.toMarkdown
         else if (spec.type==='mark') mark[spec.name] = spec.markdown.toMarkdown
   }
   return new MarkdownSerializer(node, mark);
}



// same as UNESCAPE_MD_RE plus a space
const UNESCAPE_RE = /\\([ \\!"#$%&'()*+,./:;<=>?@[\]^_`{|}~-])/g

function markdownPlugin(name:string, markdowns:{[node:string]:Markdown<'marks'>}) { 
   const markdown = markdowns[name]
   if (!markdown?.parseMarkdown) throw Error(`expected markdown missing in plugin '${name}'`)
   const tag = markdown?.tag
   const ruleName = Object.keys(markdown.parseMarkdown)[0]
   if (typeof markdown.toMarkdown.open !== 'string')
      throw Error(`expected markdown.toMarkdown.open to be a string in plugin '${name}'`)
   const markerSeq = markdown.toMarkdown.open
   const rule = markRule(markerSeq, ruleName, tag)
   return (md:MarkdownIt) => {
      if (markdown.where.before)
         md.inline.ruler.before(markdown.where.before, ruleName, rule)
      else
         md.inline.ruler.after(markdown.where.after ?? 'emphasis', ruleName, rule)
   }
}

function markRule (markerSeq:string, ruleName:string, tag:string) { 
   const name = `markPlugin_${ruleName}`
   // using `name` and named rule to provide the rule with a name in the debugger
   const rule = {[name]: (state:StateInline, silent:boolean) => {
      const max = state.posMax
      const start = state.pos
      if (state.src.indexOf(markerSeq, state.pos) !== start) { return false }
      if (silent) { return false } // don't run any pairs in validation mode
      if (start + 2 >= max) { return false }

      state.pos = start + markerSeq.length
      let found = false

      while (state.pos < max) {
         const index = state.src.indexOf(markerSeq, state.pos)
         if (index === state.pos) {
            found = true
            break
         }
         state.md.inline.skipToken(state)
      }

      if (!found || start + 1 === state.pos) {
         state.pos = start
         return false
      }

      const content = state.src.slice(start + markerSeq.length, state.pos)

      // don't allow unescaped spaces/newlines inside
      // HS 3/30/24: disabled this to allow for multi-word marks, which would include unescaped spaces
      // if (content.match(/(^|[^\\])(\\\\)*\s/)) {
      //    state.pos = start
      //    return false
      // }

      // found!
      state.posMax = state.pos
      state.pos = start + markerSeq.length

      // Earlier we checked !silent, but this implementation does not need it
      const token_so = state.push(`${ruleName}_open`, tag, 1)
      token_so.markup = markerSeq

      const token_t = state.push('text', '', 0)
      token_t.content = content.replace(UNESCAPE_RE, '$1')

      const token_sc = state.push(`${ruleName}_close`, tag, -1)
      token_sc.markup = markerSeq

      state.pos = state.posMax + markerSeq.length
      state.posMax = max
      return true
   }}
   return rule[name]
}

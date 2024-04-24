import { InputRule }                from 'prosemirror-inputrules';
import { keymap }                   from 'prosemirror-keymap'
import { MarkdownSerializer }       from 'prosemirror-markdown'
import { Mark, MarkSpec, MarkType, Schema, Fragment, Node, Slice }         
                                    from 'prosemirror-model'
import { Command, EditorState, Plugin }     
                                    from 'prosemirror-state'
import { toggleMark }               from 'prosemirror-commands'
import { UnnestObjValue, assert } 
                                    from '../core/helpers'
import { ItemDesc, getTypeFromSchema, Dispatch, Markdown, GenericKeys } 
                                    from '../common'
                                    
                  
                                                                  
export type MarksMarkdown = Markdown<'marks'> & {
   toMarkdown:       UnnestObjValue<MarkdownSerializer['marks']>;
}

export interface MarkRules {
   name:       string
   pasteRules: RegExp[]
   inputRules: RegExp[]
   bindings:   { [name:string]: { key:string, binding:Command }}
   schema:     MarkSpec
   markdown:   MarksMarkdown
}

interface MarkKeys extends GenericKeys {
   toggle:  string
}

export type MarkDesc = ItemDesc<MarkKeys,'marks'> 

export const markRulesToDesc = (rules:MarkRules):MarkDesc => {
   return {
      type:       'mark',
      name:       rules.name,
      // spec:       specFactory(rules),
      schema:     rules.schema,
      plugins:    markPlugins(rules) ,
      keys:{
         toggle:  rules.bindings.toggle?.key
      },
      markdown:   rules.markdown,
      commands: {
         toggle:     rules.bindings.toggle.binding,
         isActive:   isMarkActive(rules.name),
      }
   }
}

export function toggle(name:string): Command {
   return (state:EditorState, dispatch?:Dispatch) => {
      const markType = state.schema.marks[name];
      assert(markType, `markType ${name} not found`);
      return toggleMark(markType)(state, dispatch);
   };
}

function isMarkActiveInSelection(mark: MarkType): (state: EditorState) => boolean {
   return (state) => {
      const { from, $from, to, empty } = state.selection;
      if (empty) return Boolean(mark.isInSet(state.tr.storedMarks || $from.marks()))
      return Boolean(state.doc.rangeHasMark(from, to, mark));
   };
}
export function isMarkActive(name:string):(state: EditorState)=>boolean {
   return (state: EditorState) => {
      const markType = state.schema.marks[name];
      assert(markType, `markType ${name} not found`);
      return isMarkActiveInSelection(markType)(state);
   };
}

export type Where = {
   before?:    string
   after?:     string
}

export const markMarkdown = (mark:string, parse:{[markName:string]:{mark:string}}, tag:string, where:Where):MarksMarkdown => ({
   toMarkdown: {
      open:    mark,
      close:   mark,
      mixable: true,
      expelEnclosingWhitespace: true,
   },
   parseMarkdown: parse,
   tag,
   where
})

function markPlugins(rules:MarkRules) {
   return () => ({schema}:{schema:Schema}) => {
      const type = getTypeFromSchema(rules.name, schema);
      const map = Object.fromEntries(Object.values(rules.bindings).map(({key,binding})=>[key, binding]))
      
      return [
         ...rules.pasteRules.map(r => markPasteRule(r, type)),
         ...rules.inputRules.map(r => markInputRule(r, type)),
         keymap(map)
      ]
   }
}

function getMarksBetween(start: number, end: number, state: EditorState) {
  let marks: Array<{ start: number; end: number; mark: Mark }> = [];

  state.doc.nodesBetween(start, end, (node, pos) => {
    marks = [
      ...marks,
      ...node.marks.map((mark) => ({
        start: pos,
        end: pos + node.nodeSize,
        mark,
      })),
    ];
  });

  return marks;
}

function markInputRule(regexp: RegExp, markType: MarkType): InputRule {
   return new InputRule(regexp, (state, match, start, end) => {
      const { tr } = state;
      const m = match.length - 1;
      let markEnd = end;
      let markStart = start;

      const matchMths = match[m];
      const firstMatch = match[0];
      const mathOneBeforeM = match[m - 1];

      if (matchMths != null && firstMatch != null && mathOneBeforeM != null) {
         const matchStart = start + firstMatch.indexOf(mathOneBeforeM);
         const matchEnd = matchStart + mathOneBeforeM.length - 1;
         const textStart = matchStart + mathOneBeforeM.lastIndexOf(matchMths);
         const textEnd = textStart + matchMths.length;

         const excludedMarks = getMarksBetween(start, end, state)
         .filter(item => item.mark.type.excludes(markType))
         .filter(item => item.end > matchStart)

         if (excludedMarks.length)   return null;
         if (textEnd < matchEnd)     tr.delete(textEnd, matchEnd)
         if (textStart > matchStart) tr.delete(matchStart, textStart)
         
         markStart = matchStart;
         markEnd = markStart + matchMths.length;
      }

      tr.addMark(markStart, markEnd, markType.create());
      tr.removeStoredMark(markType);
      return tr;
   });
}


function markPasteRule(regexp:RegExp, type:MarkType, getAttrs?:Mark['attrs'] | ((match: RegExpMatchArray) => Mark['attrs'])) {
   const handler = (fragment: Fragment, parent?: Node) => {
      const nodes: Node[] = [];
      fragment.forEach((child) => {
         if (child.isText) {
            const { text, marks } = child;
            let pos = 0;
            let match:RegExpMatchArray|null
            const isLink = !!marks.filter((x) => x.type.name === 'link')[0];

            while (!isLink && (match = regexp.exec(text!)) !== null) {
               if (parent && parent.type.allowsMarkType(type) && match[1]) {
                  const start = match.index!;
                  const end = start + match[0]!.length;
                  const textStart = start + match[0]!.indexOf(match[1]);
                  const textEnd = textStart + match[1].length;
                  const attrs = getAttrs instanceof Function ? getAttrs(match) : getAttrs;

                  // adding text before markdown to nodes
                  if (start > 0) nodes.push(child.cut(pos, start))

                  // adding the markdown part to nodes
                  nodes.push(child
                     .cut(textStart, textEnd)
                     .mark(type.create(attrs).addToSet(child.marks)),
                  );
                  pos = end;
               }
            }

            // adding rest of text to nodes
            if (pos < text!.length) nodes.push(child.cut(pos))
         } else {
            nodes.push(child.copy(handler(child.content, child)));
         }
      })
      return Fragment.fromArray(nodes);
   }

   return new Plugin({
      props: {
         transformPasted: (slice) => new Slice(handler(slice.content), slice.openStart, slice.openEnd),
      },
   })
}

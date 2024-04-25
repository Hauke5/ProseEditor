import { Node }                  from "prosemirror-model";
import { Plugin, PluginKey, EditorState } 
                                 from "prosemirror-state";
import { Decoration, DecorationSet } 
                                 from "prosemirror-view";
import { pluginTiming }          from "../hooks/useTimings";
import { useCurrentView }        from "../hooks/useCurrentView";


const pluginName = "tocPlugin"
export const TOCPluginKey = new PluginKey<TocPluginState>(pluginName)

const {tmInit, tmApply, tmDecos} = pluginTiming(pluginName)

export interface TOCSStateEntry {
   id:      string, 
   level:   number,
   text:    string,
   deco?:   Decoration,
   pos:     number
}
export interface TocPluginState {
   entries: TOCSStateEntry[]
   set:     DecorationSet     // decos to add id tags to heading nodes
} 

export type TOCState = TOCSStateEntry[]

/**
 * A plugin that creates a Table of Content for the current document by listing the hierarchy of headings.
 * Retrieve the plugin state to get the `TOCSStateEntry[]` list
 * ```
 *    const entries = TOCPluginKey.getState(currentView.state)?.entries
 * ``` 
 */
export const tocPlugin = () => new Plugin<TocPluginState>({
   key: TOCPluginKey,
   state: {
      init(_, state) { 
         return tmInit<TocPluginState>(() => {
            const {entries, set} = updateTOC(state)
            return {entries, set}
         })
      },
      apply(tr, old, oldState, newState) { 
         return tmApply<TocPluginState>(() => {
            let entries = old.entries
            let set = old.set
            if (tr.docChanged && hasHeader(tr.selection.$anchor.parent)) {
               return updateTOC(newState)
            }
            set = set.map(tr.mapping, newState.doc)
            entries.forEach(entry => {
               entry.pos = tr.mapping.map(entry.pos)
            })
            return {entries, set}
         })
      },
   },
   props: {
      decorations(state) { return tmDecos(() => {
         return this.getState(state)?.set
      })},
   }
});

/**
 * A hook that returns a `variable` rule to generate the TOC for the current doc.
 * @returns 
 */
export function useTOCRule() {
   const view  = useCurrentView()
   
   return {
      toc: {
         text: ():JSX.Element => {
            const h = [0,0,0,0,0,0]
            const state = view.current? TOCPluginKey.getState(view.current.state)?.entries : [] as TOCSStateEntry[]
            if (!state) return <div></div>
            return <div>
               {state.map(entry => {
                  h[entry.level-1]++
                  const pre = h.slice(0, entry.level).join('.')
                  return <div key={`${entry.level}_${entry.text}`}>
                     {`${pre}: ${entry.text}`}
                  </div>
               })}
            </div>
         },
         comment: 'inserts a table of content'
      }
   }
}

/** returns a new `TocPluginState`  */
function updateTOC(state:EditorState):TocPluginState {
   const entries = buildTOC(state.doc)
   const set = DecorationSet.create(state.doc, entries?.map(toc => toc.deco).filter(deco=>deco) as Decoration[])
   return {entries, set}
}

function hasHeader(node: Node):boolean {
   let header = false
   if (node.type.name === 'heading') return true
   node.descendants((node: Node, pos: number) => {
      if (node.type.name === 'heading') header = true
   })
   return header
}

/** generates `id` decorations for the document that can be linked to from the TOC */
function buildTOC(doc: Node):TOCState {
   const result:TOCState = []
   doc.descendants((node: Node, pos: number) => {
      if (node.type.name === 'heading') {
         const id = getUniqueID()   // `a${pos}`
         const title = id
         const headingText = (node.content as any).content.reduce((acc:number, c:any) => `${acc}${(c.text ?? '')}`, ''); 
            const resolved = doc.resolve(pos)
            const entry:TOCSStateEntry = {id, level:node.attrs.level, text:headingText, pos:resolved.parentOffset}
            result.push(entry)
            entry.deco = Decoration.node(pos, pos+headingText.length+2, {id, title})
         // }
      }
   })
   return result
}

function getUniqueID() {
   const id = crypto.randomUUID()
   return id
}
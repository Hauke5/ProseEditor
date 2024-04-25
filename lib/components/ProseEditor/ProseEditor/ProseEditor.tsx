import { MouseEvent, useEffect, useId, useRef }     
                                    from 'react';
import { DOMParser, Node, Schema }  from 'prosemirror-model';
import { EditorState, Plugin, Transaction }   
                                    from 'prosemirror-state';
import { EditorView }               from 'prosemirror-view';
import * as Inputrules              from 'prosemirror-inputrules';
import { keymap }                   from 'prosemirror-keymap';
import { undo, redo }               from 'prosemirror-history'
import { BaseProps }                from '@/lib/components/BaseProps';
import { pluginLoader }             from './pm/plugins';
import { changedSelectionPlugin, changeContentPlugin }   
                                    from './plugins/changedPlugin';
import { parser, serializer }       from './pm/markdown/markdown';
import { OpenPopup, ProseEditorPopupMenu }     
                                    from './menu/ProseEditorPopupMenu';
import styles                       from './styles/proseEditor.module.scss'
import { corePlugins, schema }      from './registry';
import { useProseEditorContext }    from './hooks/useProseEditorContext';


export function serialize(state:EditorState) {  
   return serializer.serialize(state.doc)
}

export interface ProseEditorProps extends BaseProps{
   panelID?:         string
   newContent?:      string
   plugins?:         ()=>Plugin[]
   newView?:         (view:EditorView)=>void
   usePopupMenu?:    boolean
}
/**
 * Provides a Prosemirror Editor.
 * All parameters are optional:
 * - `panelID` sets the id of the `<div>` used by `Prosemirror` to attach the doc nodes. 
 * This will be set using `useId()` if omitted
 * - `newContent`: provides the initial content to be shown in the editor
 * - `plugins`:   allows a set of app-specific plugins to be installed upon creating the editor
 * - `newView`: allows a callback to be informed of the `view` instance for this editor
 * - `usePopupMenu` (default: `true`) will produce a popup menu for formatting options at the cursor location 
 * @param param 
 * @returns 
 */
export function ProseEditor({panelID, newContent, className, usePopupMenu=true, plugins, newView, ...props}:ProseEditorProps) {
   const {addView}         = useProseEditorContext()
   const view              = useRef<EditorView>()
   const id                = useId()
   const openPopup         = useRef<OpenPopup>()

   useEffect(()=>{ 
      if (typeof newContent === 'string') 
         view.current = createView(newContent)
      else   
         view.current = createView('Your Text Here')
      return () => view.current?.destroy() 
   },[newContent])

   return <>
      <div id={panelID ?? id} onClick={onClick} onContextMenu={openPopupMenu} className={`${styles.editor} ${className}`} {...props}/>   
      {usePopupMenu && view.current && <ProseEditorPopupMenu open={open=>openPopup.current=open} view={view.current}/>}
   </>

   function openPopupMenu(e:MouseEvent) {
      if (usePopupMenu && openPopup.current) {
         e.preventDefault()
         openPopup.current?.(e.clientX, e.clientY)
      }
   }
   function onClick(e:MouseEvent<HTMLDivElement>) {
      // for some reason, checking todo list items doesn't work without this event
      e.preventDefault()
   }
   function createView(content:string) {
      const state = newEditorState(content, plugins?.())
      const view = new EditorView(mount, { state, attributes:{}, dispatchTransaction})
      addView(view)
      newView?.(view)   // inform parent of new view, if defefined
      if (!view.hasFocus()) view.focus();
      return view
   
      function mount(prosemirrorNode: HTMLElement) {
         const parent = document.getElementById(panelID ?? id)
         parent?.replaceChildren(prosemirrorNode)
      }
   }
   function dispatchTransaction(transaction:Transaction) {
      if (view.current) try { 
         view.current.updateState(view.current.state.apply(transaction)) 
      } catch(e) {
         console.warn(`error applying transaction: ${e}`)
         console.trace()
      }
   }
   function defaultKeyBindings() {
      return keymap({
         "Meta-z": () => view.current
            ? undo(view.current.state, view.current.dispatch) 
            : false 
         ,
         "Meta-Shift-z": () => view.current
            ? redo(view.current.state, view.current.dispatch) 
            : false 
         ,
      })
   }
   function newEditorState(content="# New Page", appPlugins?: Plugin<any>[]) {
      const doc = createDocument(schema, content)
      return EditorState.create({doc, plugins: setupPlugins(defaultKeyBindings, appPlugins)});
   }      
}

function createDocument(schema:Schema, content:string): Node {
   let node = parser.parse(content)
   if (!node) {
      const element = document.createElement('div');
      element.innerHTML = 'no content found';
      node = DOMParser.fromSchema(schema).parse(element);
   }
   return node
};

function setupPlugins(defKeyBindings:()=> Plugin<any>, appPlugins:Plugin<any>[]=[]):Plugin<any>[] {
   return  pluginLoader(schema, [
      ...corePlugins,
      defKeyBindings(),
      Inputrules.ellipsis, 
      Inputrules.emDash,
      changeContentPlugin(),
      changedSelectionPlugin(),
      ...appPlugins,
   ]);
}


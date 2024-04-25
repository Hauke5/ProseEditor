import { EditorState, Plugin, PluginKey }    
                        from 'prosemirror-state';
import { EditorView }   from 'prosemirror-view';
import { Dispatch, SetStateAction, useEffect, useId, useState } 
                        from 'react';

/** keeps the state of a plugin and triggers a redraw when it changes */
export function usePluginState<PluginState={}>(pluginKey: PluginKey, view?:EditorView|null):PluginState|null {
   const id                = useId()
   const [state, setState] = useState<PluginState>();

   useEffect(() => {
      if (view) {
         setState(pluginKey.getState(view.state))
         // @ts-ignore EditorView.docView is missing in @types/prosemirror-view
         if (view.docView && !hasWatcher(view.state, getKey(pluginKey, id))) {
            view.updateState(addPluginWatcher(view.state, watcherPlugin(pluginKey, id, setState)))
         }
         return () => {}
      }
   }, [view]);
   return state ?? null;
}


function watcherPlugin<PluginState>(pluginKey: PluginKey, id:string, setState: Dispatch<SetStateAction<PluginState>>) {
   return new Plugin({
      key: new PluginKey(getKey(pluginKey, id)),
      view: () => ({ 
         update: (view, prevState) => {
            const oldState = pluginKey.getState(prevState)
            const newState = pluginKey.getState(view.state)
            if (oldState === newState) return;
            setState(pluginKey.getState(view.state))
         }
      })
   });
}

/** adds a watcher plugin */
const addPluginWatcher = (state: EditorState, watcher: Plugin) => {
   const plugins = [...state.plugins, watcher]
// console.log(`addPluginWatcher(${(watcher as any).key}) -> ${plugins.length}, [${plugins.map((p:any)=>p.key).join(',')}]`)
   return state.reconfigure({plugins});
};    

/** removes a watcher plugin */
const removePluginWatcher = (state: EditorState, key:string) => {
   const plugins = state.plugins.filter((p:any) => p.key.indexOf(key)<0)
// console.log(`removePluginWatcher(${key}) ${state.plugins.length} -> ${plugins.length}, [${plugins.map((p:any)=>p.key).join(',')}]`)
   return state.reconfigure({plugins})
};    

function hasWatcher(state:EditorState, key:string) {
   return state.plugins.some((p:any) => p.key.indexOf(key)===0)
}

function getKey(key:PluginKey, id:string) {
   return `withPluginState_${(key as any).key}_${id}`
}

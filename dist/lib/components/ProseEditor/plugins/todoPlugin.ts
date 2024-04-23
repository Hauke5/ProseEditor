import { Plugin, PluginKey } 
                        from "prosemirror-state";


interface TodoState {
}
const pluginName = "todoPlugin"
export const TodoPluginKey = new PluginKey<TodoState>(pluginName)

export const todoPlugin = () => new Plugin<TodoState>({
   state: {
      init(_, state) { return {} },
      apply(tr, old, oldState, newState) { 
         return {}
      },
   },
   key: TodoPluginKey,
   props: {
      decorations(state) { return null },
   }
});

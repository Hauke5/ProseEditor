import { Plugin, PluginKey }  from 'prosemirror-state';
import { pluginTiming }       from '../hooks/useTimings';

export type ChangedState = number

export const changedContentKey = new PluginKey('changedContent');
export const changedSelectionKey = new PluginKey('changedSelection');

/** changes its internal state when the document changes */
export const changeContentPlugin = () => {
   const {tmInit, tmApply} = pluginTiming('changeContentPlugin')
   return new Plugin<ChangedState>({
      key: changedContentKey,
      state: {
         init: () => tmInit(() => 0),
         apply(tr, pluginState, _oldState, _newState) {
            return tmApply(() => {
               if (tr.docChanged) {
                  return pluginState + 1
               } else {
                  return pluginState
               }
            })
         },
      },
   })
}

export const changedSelectionPlugin = () => {
   const {tmInit, tmApply} = pluginTiming('changeContentPlugin')
   return new Plugin<ChangedState>({
      key: changedSelectionKey,
      state: {
         init: () => tmInit(() => 0),
         apply(tr, pluginState, oldState, newState) {
            return tmApply(() => {
               if (newState.selection.eq(oldState?.selection)) {
                  return pluginState
               } else {
                  return pluginState + 1
               }
            })
         },
      }
   })
}


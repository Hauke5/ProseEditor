import { history, redo, undo }   from 'prosemirror-history';
import { keymap }                from 'prosemirror-keymap';
import { PluginGroup }           from '../pm/plugins';
import type { RawPlugins }       from '../pm/plugins';

export const plugins = pluginsFactory;
export const commands = {
   undo,
   redo,
};
export const defaultKeys = {
   undo: 'Mod-z',
   redo: 'Mod-y',
   redoAlt: 'Shift-Mod-z',
};

const name = 'history';

function pluginsFactory({historyOpts = {}, keybindings = defaultKeys} = {}): RawPlugins {
   return () => {
      return new PluginGroup(name, [
         history(historyOpts),
         keybindings &&
         keymap({
            [keybindings.undo]: undo,
            [keybindings.redo]: redo,
            [keybindings.redoAlt]: redo,
         }),
      ]);
   };
}

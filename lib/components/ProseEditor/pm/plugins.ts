import { baseKeymap }         from 'prosemirror-commands';
import { keymap }             from 'prosemirror-keymap';
import { Schema }             from 'prosemirror-model';
import { Plugin }             from 'prosemirror-state';
import { InputRule, inputRules, undoInputRule } 
                              from 'prosemirror-inputrules';
import { dropCursor }         from 'prosemirror-dropcursor';
import { gapCursor }          from 'prosemirror-gapcursor';
import * as history           from '../plugins/historyPlugin';

export type PluginPayload = {
   schema: Schema
}

export type BaseRawPlugins = null | false | Plugin | InputRule | PluginGroup | BaseRawPlugins[];

export type RawPlugins = BaseRawPlugins | ((payLoad: PluginPayload) => BaseRawPlugins);

export function pluginLoader(schema:Schema, plugins:RawPlugins): Plugin[] {
   const pluginPayload = {schema};

   let [flatPlugins, pluginGroupNames] = flatten(plugins, pluginPayload);

   let defaultPluginGroups: RawPlugins = [];
   if (!pluginGroupNames.has('history')) defaultPluginGroups.push(history.plugins() as BaseRawPlugins);

   // TODO: deprecate the ability pass a callback to the plugins param of pluginGroup
   flatPlugins = flatPlugins.concat(flatten(defaultPluginGroups, pluginPayload)[0]);
   flatPlugins = processInputRules(flatPlugins);
   flatPlugins.push(
      keymap(baseKeymap),
      dropCursor(),
      gapCursor(),
   )
   flatPlugins = flatPlugins.filter(Boolean);

   if (flatPlugins.some((p: any) => !(p instanceof Plugin)))
      throw new Error('Invalid plugin')

   validateNodeViews(flatPlugins, schema);
   return flatPlugins;
}

function processInputRules(plugins: Plugin[]):Plugin[] {
   let newPlugins: any[] = []
   let match: InputRule[] = []
   plugins.forEach((plugin) => (plugin instanceof InputRule) 
      ? match.push(plugin) 
      : newPlugins.push(plugin)
   )
   plugins = [...newPlugins, inputRules({rules: match})]
   plugins.push(keymap({Backspace: undoInputRule}))
   return plugins;
}

function validateNodeViews(plugins: Plugin[], schema:Schema) {
   const nodeViewPlugins = plugins.filter((p: any) => p.props && p.props.nodeViews)
   const nodeViewNames = new Map();
   for (const plugin of nodeViewPlugins) {
      for (const name of Object.keys(plugin.props.nodeViews as any)) {
         if (!schema.nodes[name]) {
            throw new Error(`NodeView validation failed. Spec for '${name}' not found.`);
         }
         if (nodeViewNames.has(name)) {
            throw new Error(`NodeView validation failed. Duplicate nodeViews for '${name}' found.`);
         }
         nodeViewNames.set(name, plugin);
      }
   }
}

/**
 * recursively flattens and resolves `rawPlugins` and collects a set of `PluginGroup` names encountered.
 * @param rawPlugins 
 * @param callbackPayload 
 * @returns a tuple of resolved plugins and encountered `PluginGroup` names
 */
function flatten(rawPlugins: RawPlugins, callbackPayload: PluginPayload): [Plugin[], Set<string>] {
   const pluginGroupNames = new Set<string>()
   // 
   const recurse = (plugins: RawPlugins): any => {
      if (Array.isArray(plugins)) return plugins.flatMap((p: any) => recurse(p)).filter(Boolean)

      if (plugins instanceof PluginGroup) {
         if (pluginGroupNames.has(plugins.name))
            throw new Error(`Duplicate names of pluginGroups ${plugins.name} not allowed.`)
         pluginGroupNames.add(plugins.name);
         return recurse(plugins.plugins);
      }
      if (typeof plugins === 'function') {
         if (!callbackPayload) throw new Error('Found a function but no payload')
         return recurse(plugins(callbackPayload))
      }
      return plugins;
   }
   return [recurse(rawPlugins), pluginGroupNames];
}

interface DeepPluginArray extends Array<Plugin | DeepPluginArray> {}

export class PluginGroup {
   constructor(public name: string, public plugins: DeepPluginArray) {}
}

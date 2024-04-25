# ProseEditor
A [NextJS](https://nextjs.org/) component package providing a markdown-capable rich text editor based on [Prosemirror](https://prosemirror.net/).

{:toc}

## Installation
Use `npm` to install as a library:
```
$ npm i hauke5/prose-editor@latest
``` 

Or use `npx` to create and start a standalone NextJS application with an example for using `<ProseEditor>`:
```
$ npx hauke5/prose-editor@latest
```
This will start a next development server on port 3010
Point a browser to http://localhost:3000/example to run the example

## Usage
In its simplist form, use the `<ProseEditor>` component to add an editor to a component:
```
function EditorSimple({initialText}:{initialText:string}) {
   return <ProseEditor newContent={initialText} />
}
```
This creates an editable window with `initialText` as markdown content. Markdown can also be directly entered into the editor and will be styled as well.

### Retrieving Markdown from the Editor
Use the `newView` attribute in `<ProseEditor>` to register the `EditorView` component that `Prosemirror` is using to retrieve the content of the editor and convert it to Markdown:
```
function EditorSimple({initialText}:{initialText:string}) {
   const view = useRef<EditorView>()
   const getMarkdown = ()=>{
      if (view.current) {
         const markdown = serialize(view.current.state)
         ...
      }
   }
   return <ProseEditor newContent={initialText} newView={(newView:EditorView)=>view.current = newView}/>
}
```

### Watch for Changes in the Editor Content of Text Selection
Instead of managing the view directly, in most cases it will be more convenient to delegate that to the `<ProseEditorContext>` component. Within that context, convenient hooks such as `useContentChange()` and `useSelectionChange()` can be used to react to changes in the editor document. For example. `<ProseEditorMenu>` is a react component that makes use of this to reflect the formatting at the current cursor position, as is the built-in context popup menu. See the `npx` installation, `Editor using Context` above for a live example.
```
function EditorWithContext({initialText}:{initialText:string}) {
   return <ProseEditorContext>
      <Editor initialText={initialText} />
   </ProseEditorContext>
}

function Editor({initialText}:{initialText:string}) {
   const view           = useCurrentView()
   const contentChanged = useContentChange()

   useEffect(()=>{
      if (view.current) {
         const markdown = serialize(view.current.state)
         ...
      }
   },[contentChanged, view.current])

   return <div className={styles.content}>
      <ProseEditorMenu />
      <div className={styles.card}>
         <ProseEditor newContent={initialText}/>
      </div>
   </div>
}
```

### App-specific Plugins
ProseEditor internally defines a set of standard plugins that used in general operations. Use the `plugins` attribute to define additional Prosemirror plugins relevant for your app. The plugins in the following examples ship with `ProseEditor`:
```
   ...
   <ProseEditor newContent={initialText} plugins={plugins}/>
   ...
   function plugins() {
      return [
         foldingHeadingPlugin(),
         wordCountPlugin(),
         foldingTagPlugin(),
         tocPlugin(),
      ]
   }
```

## ProseEditor Plugins
The `<ProseEditor>` component installs, by default, a number of plugins that are believed to be of general use. The `plugins` attribute allows additional, app-specific plugins to be installed:
```
function Component() {
   const varRules                      = useVariableRules()
   const wordCountRule                 = useWordCountRule()
   const tocRule                       = useTOCRule()
   ...
   return <...
      <ProseEditor newContent={content} plugins={appPlugins}/>
   ...>

   function appPlugins():Plugin<any>[] {
      const rules:VariableDefs = Object.assign({}, 
             varRules, wordCountRule, tocRule
      )
      return [
         foldingHeadingPlugin(),
         wordCountPlugin({show:true, className:styles.wordCount}),
         foldingTagPlugin(),
         tocPlugin(),
         variablesPlugin(rules),
      ]
   }
}
```

### Pre-packaged ProseEditor Plugins 

#### foldingHeadingPlugin
allows folding of headings at all levels, and recursively. Folded text only changes `Decorations` on the document, hence the parts can still be copied and saved.

This plugin adds folding triangles on the left margin next to the heading text. It is invisible until hovered over. Collapsed headings carry a right pointing triangle that is always visible.

#### wordCountPlugin
adds a decoration on the right margin of each paragraph showing a live count of the number of words in the paragraph. Headings will show the sum of all words in themselves and all text blocks up to the next heading of the same level.

The total number of words in the document will be displayed at the top right of the page

##### Parameters:
- `show` (default: `true`): shows or hides the word count
- `className`: a `css` class to apply to the decorations

#### foldingTagPlugin
Creates and maintains a list of tags that the document can be ***focused*** on.

The plugin searches the document for words beginning with `#` and turns them into tags. Tags are visually emphasized and clickable. When clicking a tag the document filters and folds away paragraphs that don't contain the tag (without the `#`) and highlights the tag in the remaining visible paragraphs.

The plugin state consists of the set of all tags wrapped in Prosemirror `Decorations`. This can be used elsewhere in the program, for example to show a list of known tags.

Text-folding of blocks not containing a tag can be programmatically triggered by dispatching a transaction that carries the `tag` as `meta` information (using `tr.setMeta(foldingTagPluginKey, tag)`)

#### tocPlugin
A plugin that creates a Table of Content for the current document by listing the hierarchy of headings. The plugin has no immediate visual effect on the page. To programmatically process the heading structure, retrieve the plugin state with `getState` to get the `TOCSStateEntry[]` list,

const entries = TOCPluginKey.getState(currentView.state)?.entries

which can then be rendered into a TOC with appropriate styling.

A react hook, `useTOCRule()`, is also provided for inclusion in the rule set of the `variablesPlugin` below, through which a table of content can be readily rendered.

#### variablesPlugin
A plugin that manages a set of variables, as per their rule definitions. Variables can be placed in the document by bracing a rule name with `{:` and `}` signs, which will be replaced with an up-to-date variable content.

##### Creating new Rules
New rules are simple to create by providing the following structure:
```typescript
{ 
   [ruleName:string]: {
      text:    ()=>ReactNode
      comment: string
   }
}
```   

##### Help
A special `help` rule is included by default. It will replace a `help` variable with a list of defined variable rules, their explanation and current value:
```
{:help}
```

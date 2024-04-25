import { Node, DOMOutputSpec, DOMSerializer }      
               from 'prosemirror-model';
import { Decoration, EditorView }   
               from 'prosemirror-view';
import { EditorState, Plugin, PluginKey, Transaction }              
               from 'prosemirror-state';


const LOG = false;
let log = LOG ? console.log.bind(console, 'list-item-node-view') : () => {};

const TODO_ATTR = 'hs-todo'

export function listItemNodeViewPlugin(name: string) {
   const checkParentBulletList = (state: EditorState, pos: number) => 
      state.doc.resolve(pos).parent.type.name === 'bulletList'

   const hasCheckbox = (instance: NodeView) => instance._node.attrs?.todoChecked

   const removeCheckbox = (instance: NodeView) => {
      const attr = instance.containerDOM!.hasAttribute(TODO_ATTR)
      if (hasCheckbox(instance)) log(`removeCheckbox true, ${attr}`); else log(`removeCheckbox false, ${attr}`)
      if (!instance.containerDOM!.hasAttribute(TODO_ATTR)) return // already removed
      instance.containerDOM!.removeAttribute(TODO_ATTR);
      instance.containerDOM!.removeChild(instance.containerDOM!.firstChild!);
   };

   const setupCheckbox = (attrs: Node['attrs'], updateAttrs: UpdateAttrsFunction, instance: NodeView) => {
      const attr = instance.containerDOM!.hasAttribute(TODO_ATTR)
      log(`setupCheckbox ${hasCheckbox(instance)?true:false}, ${attr}`)
      if (instance.containerDOM!.hasAttribute(TODO_ATTR)) return  // already created
      const checkbox = createCheckbox(attrs['todoChecked'], (newValue: boolean | null) => updateAttrs({todoChecked: newValue}));

      instance.containerDOM!.setAttribute(TODO_ATTR, '');
      instance.containerDOM!.prepend(checkbox);
   };

   const createCheckbox = (todoChecked: boolean | null, onUpdate: (newValue: boolean) => void) => {
      const checkBox = createElement(['span', { contentEditable: false }, ['input', {type: 'checkbox'}]]);
      const inputElement = checkBox.querySelector('input')!;
      if (todoChecked) inputElement.setAttribute('checked', '');

      inputElement.addEventListener('input', (_event) => onUpdate(inputElement.checked));
// HS: added `mousedown` since `input` does not react; and added `!` since this is supposed to be the new value
      inputElement.addEventListener('mousedown', (_event) => onUpdate(!inputElement.checked));
      return checkBox;
   };

   // To style our todo friend different than a regular li
   const liAttrs = {
      // 'data-bangle-name': name,
   }
   return NodeView.createPlugin({
      name,
      containerDOM: ['li', liAttrs],
      contentDOM: ['span', {}],
      renderHandlers: {
         create: (instance, { attrs, updateAttrs, getPos, view }) => {
            log(`creating ${hasCheckbox(instance)?true:false}`)
            const todoChecked = attrs['todoChecked'];
            if (todoChecked != null)    // todo needs to be created
               if (checkParentBulletList(view.state, getPos())) 
                  setupCheckbox(attrs, updateAttrs, instance as NodeView)

            // Connect the two contentDOM and containerDOM for pm to write to
            instance.containerDOM!.appendChild(instance.contentDOM!);
         },

         // We need to achieve a two way binding of the todoChecked state.
         // First binding: dom -> editor : done by  inputElement's `input` event listener
         // Second binding: editor -> dom: Done by the `update` handler below
         update: (instance:NodeView, { attrs, view, getPos, updateAttrs }:NodeViewProps) => {
            const { todoChecked } = attrs;
            log(`updating ${hasCheckbox(instance)?true:false} ${todoChecked}`)
            if (todoChecked == null) {
               removeCheckbox(instance);
               return;
            }

            // if parent is not bulletList i.e. it is orderedList
            if (!checkParentBulletList(view.state, getPos())) return;

            setupCheckbox(attrs, updateAttrs, instance as NodeView);
            const checkbox = instance!.containerDOM!.firstChild!.firstChild! as HTMLInputElement;
            log('updating inputElement, checked = ' + todoChecked);
            checkbox.checked = todoChecked;
         },

         destroy: () => {},
      },
   });
}


const renderHandlersCache: WeakMap<HTMLElement, RenderHandlers> = new WeakMap();

type GetPosFunction = () => number;
type UpdateAttrsFunction = (attrs: Node['attrs']) => void;
type NodeViewProps = {
   node: Node;
   view: EditorView;
   getPos: GetPosFunction;
   decorations: readonly Decoration[];
   selected: boolean;
   attrs: Node['attrs'];
   updateAttrs: UpdateAttrsFunction;
}
type RenderHandlerFunction = (nodeView: NodeView, props: NodeViewProps) => void;
type RenderHandlers = {
   create: RenderHandlerFunction;
   update: RenderHandlerFunction;
   destroy: RenderHandlerFunction;
}

type BaseNodeViewProps = {
   node: Node;
   view: EditorView;
   getPos: () => number;
   decorations: readonly Decoration[];
   contentDOM?: HTMLElement;
   containerDOM?: HTMLElement;
   renderHandlers?: RenderHandlers;
}

abstract class BaseNodeView {
   contentDOM?: HTMLElement;
   containerDOM?: HTMLElement;
   renderHandlers: RenderHandlers;
   opts: { selectionSensitive: boolean };
   _decorations: readonly Decoration[];
   _getPos: () => number;
   _node: Node;
   _selected: boolean;
   _view: EditorView;

   // for pm to get hold of containerDOM
   constructor(
      { node, view, getPos, decorations, containerDOM, contentDOM, renderHandlers = getRenderHandlers(view)}:BaseNodeViewProps ,
      { selectionSensitive = true } = {},
   ) {
      // by PM
      this._node = node;
      this._view = view;
      this._getPos = getPos;
      this._decorations = decorations;
      this._selected = false;

      if (!renderHandlers) 
         throw new Error('You either did not pass the renderHandlers correct or it cannot find render handlers associated with the view.')

      this.renderHandlers = renderHandlers;

      // by the implementor
      this.containerDOM = containerDOM;
      this.contentDOM = contentDOM;

      // This css rule makes sure the content dom has non-zero width
      // so that folks can type inside it
      if (this.contentDOM) {}

      if (this.containerDOM) {}

      if (this._node.type.isAtom && this.contentDOM)
         throw new Error('An atom node cannot have a contentDOM')

      this.opts = { selectionSensitive }

      this.renderHandlers.create(
         this as unknown as NodeView,
         this.getNodeViewProps(),
      );
   }

   // this exists as the name `dom` is too ambiguous
   get dom(): InstanceType<typeof window.Node> {
      return this.containerDOM!;
   }

   getAttrs(): Node['attrs'] {
      return this._node.attrs;
   }

   getNodeViewProps(): NodeViewProps {
      return {
         node: this._node,
         view: this._view,
         getPos: this._getPos,
         decorations: this._decorations,
         selected: this._selected,
         attrs: this._node.attrs,
         updateAttrs: (attrs: Node['attrs']) =>
            this._view.dispatch(updateAttrs(this._getPos(), this._node, attrs, this._view.state.tr)),
      };
   }
}

type NodeViewParams = {
   name: string;
   contentDOM?: DOMOutputSpec;
   containerDOM: DOMOutputSpec;
   renderHandlers?: RenderHandlers;
}
// TODO this is adds unneeded abstraction
//    maybe we can lessen the amount of things it is doing
//    and the abstraction.
class NodeView extends BaseNodeView {
   /**
      * The idea here is to figure out whether your component
      * will be hole-y (will let pm put in contents) or be opaque (example emoji).
      * NOTE: if  passing contentDOM, it is your responsibility to insert it into
      * containerDOM.
      * NOTE: when dealing with renderHandlers like .create or .update
      * donot assume anything about the current state of dom elements. For
      * example, the dom you created in .create handler, may or may not exist,
      * when the .update is called.
      *
      */
   static createPlugin({name, containerDOM: containerDOMSpec, contentDOM: contentDOMSpec, renderHandlers}:NodeViewParams) {
      return new Plugin({
         key: new PluginKey(name + 'NodeView'),
         props: {
            nodeViews: {
               [name]: (node:Node, view:EditorView, getPos:any, decorations) => {
                  const containerDOM = createElement(containerDOMSpec);

                  let contentDOM:HTMLElement|undefined;
                  if (contentDOMSpec) contentDOM = createElement(contentDOMSpec)

                  // getPos for custom marks is boolean
                  // getPos = getPos as GetPosFunction;
                  return new NodeView({node, view, getPos, decorations, containerDOM, contentDOM, renderHandlers});
               },
            },
         },
      });
   }

   deselectNode() {
      this.containerDOM!.classList.remove('ProseMirror-selectednode');
      this._selected = false;
      log('deselectNode node');
      this.renderHandlers.update(this, this.getNodeViewProps());
   }

   // }
   destroy() {
      this.renderHandlers.destroy(this, this.getNodeViewProps());
      this.containerDOM = undefined;
      this.contentDOM = undefined;
   }

   // PM essentially works by watching mutation and then syncing the two states: its own and the DOM.
   ignoreMutation(mutation: MutationRecord | {type: 'selection', target: Element}) {
      // For PM an atom node is a black box, what happens inside it are of no concern to PM
      // and should be ignored.
      if (this._node.type.isAtom) return true

      // donot ignore a selection type mutation
      if (mutation.type === 'selection') return false

      // if a child of containerDOM (the one handled by PM)
      // has any mutation, do not ignore it
      if (this.containerDOM!.contains(mutation.target)) return false

      // if the contentDOM itself was the target
      // do not ignore it. This is important for schema where
      // content: 'inline*' and you end up delete all the content with backspace
      // PM needs to step in and create an empty node.
      if (mutation.target === this.contentDOM) return false
      return true
   }

   selectNode() {
      this.containerDOM!.classList.add('ProseMirror-selectednode');
      this._selected = true;
      log('select node');
      this.renderHandlers.update(this, this.getNodeViewProps());
   }

   update(node: Node, decorations: readonly Decoration[]) {
      log('update node');
      // https://github.com/ProseMirror/prosemirror/issues/648
      if (this._node.type !== node.type) return false

      if (this._node === node && this._decorations === decorations) {
         log('update node no change');
         return true;
      }

      this._node = node;
      this._decorations = decorations;
      log('update node execute');
      this.renderHandlers.update(this, this.getNodeViewProps());

      return true;
   }
}

function getRenderHandlers(view: EditorView) {
   // TODO this assumes parentNode is one level above root
   //   lets make sure it always is or rewrite this to
   //    traverse the ancestry.
   let editorContainer = view.dom.parentNode as HTMLElement;
   const handlers = renderHandlersCache.get(editorContainer);
   return handlers;
}

function updateAttrs(pos: number, node: Node, newAttrs: Node['attrs'], tr: Transaction) {
   return tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      ...newAttrs,
   });
}

function createElement(spec: DOMOutputSpec): HTMLElement {
   const { dom, contentDOM } = DOMSerializer.renderSpec(window.document, spec);
   if (contentDOM) {
      throw new Error('createElement does not support creating contentDOM');
   }
   return dom as HTMLElement
}


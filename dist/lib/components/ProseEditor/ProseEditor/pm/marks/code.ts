import { Node }                     from 'prosemirror-model';
import { EditorState, Selection, TextSelection } 
                                    from 'prosemirror-state';
import { assert }                   from '../core/helpers';
import { conditionalCommand }       from '../nodes/common';
import { Dispatch }                 from '../common';
import { toggle, isMarkActive, MarkDesc, markRulesToDesc, MarkRules } 
                                    from './common';

const name = 'code'
const tag  = '`'

const escapeFilters = [
   // The $cursor is a safe way to check if it is a textSelection,
   // It is also used in a bunch of placed in pm-commands when dealing with marks
   // Ref: https://discuss.prosemirror.net/t/what-is-an-example-of-an-empty-selection-that-has-a-cursor/3071
   (state: EditorState) => state.selection.empty && !!((state.selection as TextSelection).$cursor)
];

const rules:MarkRules = {
   name,
   pasteRules: [
      /(?:`)([^`]+)(?:`)/g,   // '`'
   ],
   inputRules: [
      /(?:`)([^`]+)(?:`)$/,   // '`' at the end of the input line
   ],
   bindings: {
      toggle:     { key: 'Alt-`', binding:toggle(name) },
      ArrowRight: { key: "ArrowRight", binding:conditionalCommand(escapeFilters, moveRight) },
      ArrowLeft:  { key: "ArrowLeft",  binding:conditionalCommand(escapeFilters, moveLeft) },
   },
   schema: {
      excludes: '_', // means all marks are excluded
      parseDOM: [{ tag: name }],
      toDOM: () => [name, 0],
   },
   markdown: {
      toMarkdown: {
         open(_state, _mark, parent, index) {
            return backticksFor(parent.child(index), -1);
         },
         close(_state, _mark, parent, index) {
            return backticksFor(parent.child(index - 1), 1);
         },
         escape: false,
      },
      parseMarkdown: {
         code_inline: { mark: name, noCloseToken: true },
      },
      tag,
      where: {}
   },
}

export const code:MarkDesc = markRulesToDesc(rules)


const getTypeFromState = (state: EditorState) => {
   const markType = state.schema.marks[name];
   assert(markType, `markType ${name} not found`);
   return markType;
};

const posHasCode = (state:EditorState, pos:number) => {
   // This logic exists because
   // in  rtl (right to left) $<code>text#</code>  (where $ and # represent possible cursor positions)
   // at the edges of code only $ and # are valid positions by default.
   // Put other ways, typing at $ cursor pos will not produce regular text,
   // and typing in # will produce code mark text.
   // To know if a pos will be inside code or not we check for a range.
   //    0      1   2   3   4   5   6        7
   // <para/>     a   b   c   d   e    </para>
   // if the mark is [bcd], and we are moving left from 6
   // we will need to check for rangeHasMark(4,5) to get that 5
   // is having a code mark, hence we do a `pos-1`
   // but if we are moving right and from 2, we donot need to add or subtract
   // because just doing rangeHasMark(2, 3) will give us correct answer.

   if (pos < 0 || pos > state.doc.content.size) return false;

   const code = getTypeFromState(state);
   const node = state.doc.nodeAt(pos);
   return node ? node.marks.some((mark) => mark.type === code) : false;
};

function moveRight(state:EditorState, dispatch?:Dispatch) {
   const code = getTypeFromState(state);
   const $cursor = (state.selection as TextSelection).$cursor!;

   let storedMarks = state.tr.storedMarks;

   // const insideCode = markActive(state, code);
   const insideCode = isMarkActive(name)(state);
   const currentPosHasCode = state.doc.rangeHasMark($cursor.pos, $cursor.pos, code);
   const nextPosHasCode = state.doc.rangeHasMark($cursor.pos, $cursor.pos + 1, code);

   const enteringCode = !currentPosHasCode && nextPosHasCode && !(storedMarks && storedMarks.length > 0);
   // entering code mark (from the left edge): don't move the cursor, just add the mark
   if (!insideCode && enteringCode) {
      if (dispatch) dispatch(state.tr.addStoredMark(code.create()));
      return true;
   }

   const exitingCode = !currentPosHasCode && !nextPosHasCode && !(storedMarks && storedMarks.length === 0);
   // exiting code mark: don't move the cursor, just remove the mark
   if (insideCode && exitingCode) {
      if (dispatch) dispatch(state.tr.removeStoredMark(code));
      return true;
   }

   return false;
}

function moveLeft(state:EditorState, dispatch?:Dispatch) {
   const code = getTypeFromState(state);
   // const insideCode = markActive(state, code);
   const insideCode = isMarkActive(name)(state);

   const $cursor = (state.selection as TextSelection).$cursor!;
   const { storedMarks } = state.tr;
   const currentPosHasCode = posHasCode(state, $cursor.pos);
   const leftPosHasCode = posHasCode(state, $cursor.pos - 1);
   const leftLeftPosHasCode = posHasCode(state, $cursor.pos - 2);
   const exitingCode = currentPosHasCode && !leftPosHasCode && Array.isArray(storedMarks);

   if (!insideCode) {
      // at the right edge: remove code mark and move the cursor to the left
      const atRightEdge = !leftPosHasCode && leftLeftPosHasCode &&
         ((exitingCode && Array.isArray(storedMarks) && !storedMarks.length) || (!exitingCode && storedMarks === null))
      if (atRightEdge) {
         const tr = state.tr.setSelection(Selection.near(state.doc.resolve($cursor.pos - 1)));
         if (dispatch) dispatch(tr.removeStoredMark(code));
         return true;
      }
      // entering code mark (from right edge): don't move the cursor, just add the mark
      const enteringCode = !currentPosHasCode && leftPosHasCode && Array.isArray(storedMarks) && !storedMarks.length;
      if (enteringCode) {
         if (dispatch) dispatch(state.tr.addStoredMark(code.create()))
         return true;
      }
   } else { // insideCode
      // at the left edge: add code mark and move the cursor to the left
      const atLeftEdge = leftPosHasCode && !leftLeftPosHasCode &&
         (storedMarks === null || (Array.isArray(storedMarks) && !!storedMarks.length));
      if (atLeftEdge) {
         const tr = state.tr.setSelection(Selection.near(state.doc.resolve($cursor.pos - 1)));
         if (dispatch) dispatch(tr.addStoredMark(code.create()))
         return true;
      }
      // exiting code mark (or at the beginning of the line): don't move the cursor, just remove the mark
      const isFirstChild = $cursor.index($cursor.depth - 1) === 0;
      if (exitingCode || (!$cursor.nodeBefore && isFirstChild)) {
         if (dispatch) dispatch(state.tr.removeStoredMark(code));
         return true;
      }
   }
   return false;
};

function backticksFor(node: Node, side: number) {
   let ticks = /`+/g;
   let m: RegExpExecArray | null;
   let len = 0;
   if (node.isText) {
      while ((m = ticks.exec(node.text!))) {
         if (typeof  m[0] === 'string') len = Math.max(len,  m[0].length);
      }
   }
   let result = len > 0 && side > 0 ? ' `' : '`';
   for (let i = 0; i < len; i++) { result += '`' }
   if (len > 0 && side < 0) result += ' '
   return result;
}

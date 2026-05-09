/**
 * 极简 CodeMirror 6 包装器。
 *
 * 用法：
 *   <CodeEditor value={x} onChange={setX} language="markdown" />
 *
 * - 不在编辑器自身管理 onSave / 快捷键 — 由父级（LibraryPage）的 Save 按钮统一处理
 * - 仅包两种语言：markdown / javascript（jsx 模式用于 pattern template）
 */

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput } from "@codemirror/language";

export type Language = "markdown" | "tsx";

export interface CodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  language: Language;
  className?: string;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, language, className, readOnly }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  // 把最新 onChange 关进 ref，避免重建 view
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const langExt = language === "tsx"
      ? javascript({ jsx: true, typescript: true })
      : markdown();
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        highlightActiveLine(),
        bracketMatching(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        langExt,
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(!!readOnly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            onChangeRef.current(u.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // 只在 language / readOnly 变更时重建（value 走下面的 dispatch）
  }, [language, readOnly]);

  // 当外部 value 变化（切换条目）且与当前 doc 不同时，replace doc
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={hostRef} className={`om-code-editor ${className ?? ""}`} />;
}

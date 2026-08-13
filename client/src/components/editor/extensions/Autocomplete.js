import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const Autocomplete = Extension.create({
  name: "writeflowAutocomplete",
  addOptions() { return { delay: 1400, fetchSuggestion: async () => "" }; },
  addStorage() { return { enabled: false, suggestion: "", position: null }; },
  addCommands() {
    return { setAutocompleteEnabled: (enabled) => ({ tr }) => {
      this.storage.enabled = enabled;
      if (!enabled) { this.storage.suggestion = ""; this.storage.position = null; }
      tr.setMeta("writeflow-autocomplete-refresh", true);
      return true;
    } };
  },
  addProseMirrorPlugins() {
    const extension = this;
    let timer = null;
    let requestNumber = 0;
    const clearSuggestion = (view) => {
      extension.storage.suggestion = "";
      extension.storage.position = null;
      requestNumber += 1;
      if (view) view.dispatch(view.state.tr.setMeta("writeflow-autocomplete-refresh", true));
    };
    return [new Plugin({
      key: new PluginKey("writeflow-autocomplete"),
      props: {
        decorations(state) {
          const { suggestion, position } = extension.storage;
          if (!suggestion || position == null || position > state.doc.content.size) return DecorationSet.empty;
          return DecorationSet.create(state.doc, [Decoration.widget(position, () => {
            const ghost = document.createElement("span");
            ghost.className = "ai-ghost-text";
            ghost.textContent = suggestion;
            ghost.setAttribute("aria-hidden", "true");
            return ghost;
          }, { side: 1 })]);
        },
        handleKeyDown(view, event) {
          if (event.key === "Tab" && extension.storage.enabled && extension.storage.suggestion) {
            event.preventDefault();
            const { suggestion, position } = extension.storage;
            clearSuggestion();
            view.dispatch(view.state.tr.insertText(suggestion, position));
            return true;
          }
          if (extension.storage.suggestion && event.key !== "Shift") clearSuggestion(view);
          return false;
        },
      },
      view() { return {
        update(view, previousState) {
          if (!extension.storage.enabled || previousState.doc.eq(view.state.doc)) return;
          window.clearTimeout(timer);
          clearSuggestion();
          if (!view.state.selection.empty) return;
          timer = window.setTimeout(async () => {
            const position = view.state.selection.from;
            const context = view.state.doc.textBetween(Math.max(0, position - 2000), position, " ").trim();
            if (!context) return;
            const currentRequest = ++requestNumber;
            try {
              const suggestion = await extension.options.fetchSuggestion(context);
              if (currentRequest !== requestNumber || !extension.storage.enabled || !suggestion) return;
              extension.storage.suggestion = String(suggestion).replace(/^\s+/, " ");
              extension.storage.position = view.state.selection.from;
              view.dispatch(view.state.tr.setMeta("writeflow-autocomplete-refresh", true));
            } catch {}
          }, extension.options.delay);
        },
        destroy() { window.clearTimeout(timer); },
      }; },
    })];
  },
});

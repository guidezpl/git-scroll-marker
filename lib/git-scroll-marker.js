'use babel';

import { CompositeDisposable } from 'atom';
import GitScrollMarkerBinding from './git-scroll-marker-binding';

export default {

  consumeScrollMarker(scrollMarkerAPI) {
    const watchedEditors = new WeakSet();
    // this.subscriptions.add(atom.workspace.observeTextEditors(function(editor) {
    atom.workspace.observeTextEditors(editor => {
      if (watchedEditors.has(editor)) return;
      new GitScrollMarkerBinding(editor, scrollMarkerAPI).start()
      watchedEditors.add(editor);
      editor.onDidDestroy(() => watchedEditors.delete(editor));
    })
  },

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
  },

  deactivate() {
    this.subscriptions.dispose();
  }
};

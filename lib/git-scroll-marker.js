'use babel';

import GitScrollMarkerView from './git-scroll-marker-view';
import { CompositeDisposable } from 'atom';

export default {

  gitScrollMarkerView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.gitScrollMarkerView = new GitScrollMarkerView(state.gitScrollMarkerViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gitScrollMarkerView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'git-scroll-marker:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gitScrollMarkerView.destroy();
  },

  serialize() {
    return {
      gitScrollMarkerViewState: this.gitScrollMarkerView.serialize()
    };
  },

  toggle() {
    console.log('GitScrollMarker was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};

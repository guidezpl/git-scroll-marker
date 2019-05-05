'use babel';

import { CompositeDisposable } from 'atom';
import { repositoryForPath } from './helpers';

const MAX_BUFFER_LENGTH_TO_DIFF = 2 * 1024 * 1024;

export default class GitScrollMarkerBinding {
  constructor(editor, scrollMarkerAPI) {
    if (!editor) return console.warn('git-scroll-marker binding created without an editor');
    if (!scrollMarkerAPI) throw Error('git-scroll-marker binding created without scrollMarkerAPI');

    this.editor = editor;
    this.scrollMarkerAPI = scrollMarkerAPI;
    this.subscriptions = new CompositeDisposable();
    this.updateDiffs = this.updateDiffs.bind(this)
  }

  start () {
    const editorElement = this.editor.getElement()

    this.subscribeToRepository()

    this.subscriptions.add(
      this.editor.onDidStopChanging(this.updateDiffs),
      this.editor.onDidChangePath(this.updateDiffs),
      atom.project.onDidChangePaths(() => this.subscribeToRepository()),
      this.editor.onDidDestroy(() => {
        this.cancelUpdate()
        this.subscriptions.dispose()
      })
    )

    this.scheduleUpdate()
  }

  subscribeToRepository () {
    this.repository = repositoryForPath(this.editor.getPath())
    if (this.repository) {
      this.subscriptions.add(
        this.repository.onDidChangeStatuses(() => {
          this.scheduleUpdate()
        })
      )
      this.subscriptions.add(
        this.repository.onDidChangeStatus(changedPath => {
          if (changedPath === this.editor.getPath()) this.scheduleUpdate()
        })
      )
    }
  }

  updateDiffs () {
    if (this.editor.isDestroyed()) return
    const path = this.editor && this.editor.getPath()
    if (
      path &&
      this.editor.getBuffer().getLength() < MAX_BUFFER_LENGTH_TO_DIFF
    ) {
      this.diffs =
      this.repository &&
      this.repository.getLineDiffs(path, this.editor.getText())
      if (this.diffs) this.addDecorations(this.diffs)
    }
  }

  addDecorations (diffs) {
    const addLayer = this.scrollMarkerAPI.getLayer(this.editor, "git-marker-layer-add", "#43d08a");
    const editLayer = this.scrollMarkerAPI.getLayer(this.editor, "git-marker-layer-edit", "#e0c285");
    const removeLayer = this.scrollMarkerAPI.getLayer(this.editor, "git-marker-layer-remove", "#e05252");
    for (const { newStart, oldLines, newLines } of diffs) {
      const startRow = newStart - 1
      const endRow = newStart + newLines - 1
      if (oldLines === 0 && newLines > 0) {
        for (let row = startRow; row <= endRow; row++) {
          addLayer.addMarker(row);
        }
      } else if (newLines === 0 && oldLines > 0) {
        if (startRow < 0) {
          removeLayer.addMarker(0);
        } else {
          removeLayer.addMarker(startRow);
        }
      } else {
        for (let row = startRow; row <= endRow; row++) {
          editLayer.addMarker(row);
        }
      }
    }
  }

  deactivate() {
    this.subscriptions.dispose();
  }

  cancelUpdate() {
    clearImmediate(this.immediateId);
  }

  scheduleUpdate(editor) {
    this.cancelUpdate();
    this.immediateId = setImmediate(this.updateDiffs);
  }
};

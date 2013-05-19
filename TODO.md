## What can you do to help make Tabula better?


1. Bug reports and user interface feedback are always appreciated.
2. Front-end
  * Preview pane: Replace the modal with an always-visible data pane.
3. Back-end
  * Ability to apply a lasso to all subsequent pages in a document.
  * Save a lasso (or set of lassos) for repeated use. Use case: I need to process a document that's published in the same format each month. It'd be quicker for me to set the lasso once and rerun it automatically than to have to set the lasso each month de novo.
  * Get rid of XML representation of PDF files.

## How to contribute


1. Fork Tabula
2. Create a topic branch - `git checkout -b my_branch`
3. Push to your branch - `git push origin my_branch`
4. Create a Pull Request from your branch

### Tests

We want to be extra careful about changes in the table extractor [`lib/tabula.rb`](lib/tabula.rb). It is a highly heuristic process and it can regress easily.
If you're doing changes to the table extraction code, please consider adding tests to [`test/test_table_analyze.rb`](test/test_table_analyzer.rb)


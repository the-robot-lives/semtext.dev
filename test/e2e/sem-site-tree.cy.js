// BDD spec — sem-site-tree / node · source: spec/schema/sem-site-tree.md
//
// Feature: a site tree authored as nested nodes renders CSS-only with
//          JavaScript off — block rows, guide borders, per-tree ordinal
//          counters and attr(label)/attr(path) ::before labels — and
//          degradation never hides a branch
//   Scenario: the nojs artifact renders the live spec demo non-0x0, roles intact
//   Scenario: the label is attr(label), falling back to attr(path)
//   Scenario: nodes number depth-first, each tree its own counter scope
//   Scenario: guides — every node row carries its left border
//   Scenario: JS-off a collapsed branch stays expanded (hide rule gated)
//   Scenario: class-form alias (div.sem-site-tree › div.sem-node) renders identically
//   Scenario: data-* wins over the bare spelling when the bare one is absent
//   Scenario: the enhanced page shows the same record until the lazy engine lands

const cs = (el, pseudo) => el.ownerDocument.defaultView.getComputedStyle(el, pseudo);

describe('sem-site-tree', () => {
  describe('nojs artifact — /spec/conventions.nojs.html', () => {
    beforeEach(() => cy.visit('/spec/conventions.nojs.html'));

    it('ships no script and renders the live demo non-0x0', () => {
      cy.request('/spec/conventions.nojs.html').its('body').should('not.match', /<script/i);
      cy.get('#x-site-tree').should('be.visible');
      // the authored demo: 1 dir > 1 dir > 2 files, nested freely
      cy.get('#x-site-tree node').should('have.length', 4).each(($n) => {
        cy.wrap($n).should('be.visible');
      });
    });

    it('labels come from attr(label), falling back to attr(path)', () => {
      cy.get('#x-site-tree > node').first().then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('Specs');
      });
      // no label authored — the path is the display label (schema: "path —
      // the node's identity. Display label if no label")
      cy.get('#x-site-tree node[path="spec/schema"]').then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('spec/schema');
      });
      cy.get('#x-site-tree node[path="spec/schema/sem-site-tree.md"]').then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('spec/schema/sem-site-tree.md');
      });
    });

    it('numbers nodes depth-first, the counter scoped to the tree', () => {
      // Chrome serializes counter() unresolved in computed ::before content
      // (attr() resolves; counters never do) — the same convention
      // sem-references.cy.js asserts under. Presence of the named counter in
      // every node's label + the increment/reset computed properties is the
      // observable form of "depth-first numbering from the tree's own scope":
      // the increment fires at each node in DOM order inside the container
      // that resets the counter.
      cy.get('#x-site-tree').then(($t) => {
        expect(cs($t[0]).counterReset).to.contain('sem-tree-node');
      });
      cy.get('#x-site-tree node').each(($n, i) => {
        expect(cs($n[0]).counterIncrement, `node ${i} increment`).to.contain('sem-tree-node');
        expect(cs($n[0], '::before').content, `node ${i} label`).to.match(/counter\(sem-tree-node\)/);
      });
      cy.get('#x-site-tree node[path="spec/schema/sem-site-tree.md"]').then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('sem-site-tree.md');
      });
    });

    it('guides: every node row carries its left border', () => {
      cy.get('#x-site-tree node').each(($n, i) => {
        expect(cs($n[0]).borderLeftWidth, `node ${i} guide`).to.not.equal('0px');
        expect(cs($n[0]).borderLeftStyle).to.not.equal('none');
      });
    });

    it('authored a11y roles survive with no script', () => {
      cy.get('#x-site-tree').should('have.attr', 'role', 'tree');
      cy.get('#x-site-tree > node').first().should('have.attr', 'role', 'treeitem');
      cy.get('#x-site-tree node[path="spec/schema"]').should('have.attr', 'role', 'group');
    });

    it('a collapsed branch renders expanded — degradation never loses content', () => {
      cy.document().then((doc) => {
        const t = doc.createElement('sem-site-tree');
        t.id = 'x-collapsed-probe';
        t.setAttribute('label', 'Probe');
        t.innerHTML =
          '<node path="p" label="Parent" kind="dir" collapsed>' +
          '<node path="p/child.md" kind="file"></node>' +
          '</node>';
        doc.body.appendChild(t);
      });
      // no [data-sem-upgraded] anywhere → the hide rule must not fire
      cy.get('#x-collapsed-probe node[path="p/child.md"]').should('be.visible');
      cy.get('#x-collapsed-probe node[path="p"]').then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('Parent');
      });
    });
  });

  describe('class-form alias — injected on /demo/index.nojs.html', () => {
    beforeEach(() => cy.visit('/demo/index.nojs.html'));

    it('div.sem-site-tree › div.sem-node[data-path] renders the same chrome', () => {
      cy.document().then((doc) => {
        const t = doc.createElement('div');
        t.className = 'sem-site-tree';
        t.id = 'x-alias-probe';
        t.innerHTML =
          '<div class="sem-node" data-path="a" data-label="Alpha"></div>' +
          '<div class="sem-node" data-path="b"></div>';
        doc.body.appendChild(t);
      });
      cy.get('#x-alias-probe .sem-node').should('have.length', 2).each(($n) => {
        cy.wrap($n).should('be.visible');
        expect(cs($n[0]).borderLeftWidth).to.not.equal('0px');
      });
      cy.get('#x-alias-probe .sem-node').first().then(($n) => {
        expect(cs($n[0], '::before').content).to.match(/counter\(sem-tree-node\)/);
        expect(cs($n[0], '::before').content).to.contain('Alpha');
      });
      // data-path stands in when no data-label is authored
      cy.get('#x-alias-probe .sem-node').last().then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('b');
      });
    });

    it('data-* wins over the bare spelling when the bare one is absent', () => {
      cy.document().then((doc) => {
        const t = doc.createElement('sem-site-tree');
        t.id = 'x-dual-probe';
        t.innerHTML = '<node path="d" data-label="Data"></node>';
        doc.body.appendChild(t);
      });
      cy.get('#x-dual-probe node').then(($n) => {
        const c = cs($n[0], '::before').content;
        expect(c).to.contain('Data');
        expect(c).to.not.contain('d.');
      });
    });

    it('a second tree restarts the counter — scopes never share a number', () => {
      cy.document().then((doc) => {
        for (const [id, path] of [['x-scope-a', 'one'], ['x-scope-b', 'two']]) {
          const t = doc.createElement('sem-site-tree');
          t.id = id;
          t.innerHTML = `<node path="${path}"></node>`;
          doc.body.appendChild(t);
        }
      });
      // each tree carries its OWN counter-reset (the scope boundary), so its
      // nodes count from 1 regardless of any sibling tree
      cy.get('#x-scope-a').then(($t) => {
        expect(cs($t[0]).counterReset).to.contain('sem-tree-node');
      });
      cy.get('#x-scope-b').then(($t) => {
        expect(cs($t[0]).counterReset).to.contain('sem-tree-node');
      });
      cy.get('#x-scope-a node').then(($n) => {
        expect(cs($n[0], '::before').content).to.match(/counter\(sem-tree-node\)/);
        expect(cs($n[0], '::before').content).to.contain('one');
      });
      cy.get('#x-scope-b node').then(($n) => {
        expect(cs($n[0], '::before').content).to.match(/counter\(sem-tree-node\)/);
        expect(cs($n[0], '::before').content).to.contain('two');
      });
    });
  });

  describe('enhanced page — /spec/conventions.html', () => {
    beforeEach(() => cy.visit('/spec/conventions.html'));

    it('renders the same visible record (the runtime has no tree engine yet)', () => {
      // honest current-tier pin: no tree engine ships in this bundle, so the
      // container carries no upgrade marker and the CSS chrome carries the
      // labels — the same guarantees the nojs artifact proves. When the lazy
      // chunks/sem-site-tree.js engine lands it will stamp
      // [data-sem-upgraded] and take the labels over as buttons/spans; this
      // test is meant to be repinned THEN, not papered over now.
      cy.get('#x-site-tree').should('be.visible').and('not.have.attr', 'data-sem-upgraded');
      cy.get('#x-site-tree node').should('have.length', 4).each(($n) => {
        cy.wrap($n).should('be.visible');
      });
      cy.get('#x-site-tree > node').first().then(($n) => {
        expect(cs($n[0], '::before').content).to.contain('Specs');
      });
    });
  });
});

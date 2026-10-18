// BDD spec — sem-thought · source: spec/schema/sem-thought.md
// Fixture serves the repo root; run any static server on port 4173.
// The JS-off scenario uses the demo's `__semJsOff` kill-switch hook.
//
// Feature: sem-thought — display-only typed thought bubble
//   Scenario: class-form bubbles render typed (label, distinct accents)
//   Scenario: unknown type carries no per-type accent, still readable
//   Scenario: JS-off — every bubble's text is readable
//   Scenario: Lit upgrade — data-type mirror, type class, role, label
//   Scenario: Lit unknown type — degrades to its own plain text, muted
//   Scenario: Lit no type — plain bubble, nothing applied

const style = (el, pseudo) =>
  el.ownerDocument.defaultView.getComputedStyle(el, pseudo);

describe('sem-thought — class baseline (web/demo/index.html)', () => {
  beforeEach(() => cy.visit('/demo/index.html'));

  it('renders typed bubbles with a type label and distinct accents', () => {
    cy.get('.sem-thought[data-type]').should('have.length', 4);
    cy.get('#t-obs').should('be.visible').and(($t) => {
      expect(style($t[0], '::before').content).to.contain('observation');
    });
    cy.get('#t-mind').should(($t) => {
      expect(style($t[0], '::before').content).to.contain('mind-read');
    });
    // three typed accents are pairwise distinct; each resolves a per-type
    // --sem-thought-current; the unknown bubble resolves none
    cy.get('#t-obs, #t-mind, #t-tangent, #t-unknown').should(($els) => {
      const c = Object.fromEntries([...$els].map((el) => [
        el.id, style(el).getPropertyValue('--sem-thought-current').trim(),
      ]));
      expect(c['t-obs'], 'observation accent').to.not.be.empty;
      expect(c['t-mind'], 'mind-read accent').to.not.be.empty;
      expect(c['t-tangent'], 'tangent accent').to.not.be.empty;
      expect(new Set([c['t-obs'], c['t-mind'], c['t-tangent']]).size, 'accents distinct')
        .to.equal(3);
      expect(c['t-unknown'], 'unknown has no per-type accent').to.equal('');
    });
    // the three accents are actually painted differently
    cy.get('#t-obs, #t-mind, #t-tangent').should(($els) => {
      const colors = new Set([...$els].map((el) => style(el).borderLeftColor));
      expect(colors.size).to.equal(3);
    });
    // CSS-only tail: the ::after dot exists
    cy.get('#t-obs').should(($t) => {
      expect(style($t[0], '::after').content).to.not.equal('none');
    });
  });

  it('unknown type: readable bubble, no type accent (JS never rescues class form)', () => {
    cy.get('#t-unknown')
      .should('contain', 'An unknown type')
      .and('be.visible');
    // class form mints no record and gets no runtime writes — authored
    // markup is the whole contract here; label still names what was authored
    cy.get('#t-unknown').should('have.attr', 'data-type', 'hallucination');
    cy.get('#t-unknown').should(($t) => {
      expect(style($t[0], '::before').content).to.contain('hallucination');
    });
  });

  it('JS-off: every bubble still readable', () => {
    cy.visit('/demo/index.html', {
      onBeforeLoad(win) { win.__semJsOff = true; }
    });
    cy.get('.sem-thought[data-type]').each(($t) => {
      expect($t.text().trim().length).to.be.greaterThan(0);
      expect($t).to.be.visible;
    });
  });
});

describe('sem-thought — Lit upgrade (web/demo/standalone-lit.html)', () => {
  beforeEach(() => cy.visit('/demo/standalone-lit.html'));

  it('registers and upgrades sem-thought; typed self-annotation applied', () => {
    cy.window().then((win) => {
      expect(win.customElements.get('sem-thought')).to.exist;
    });
    cy.get('#lit-thought').should('have.attr', 'data-sem-upgraded', '');
    cy.get('#lit-thought').should('have.attr', 'role', 'note');
    cy.get('#lit-thought').should('have.attr', 'data-type', 'observation');
    cy.get('#lit-thought').should('have.class', 'sem-thought-observation');
    cy.get('#lit-thought').should('not.have.attr', 'data-sem-fallback');
    cy.get('#lit-thought-mindread').should('have.attr', 'data-type', 'mind-read');
    cy.get('#lit-thought-mindread').should('have.class', 'sem-thought-mind-read');
  });

  it('type label renders from the data- mirror after upgrade', () => {
    cy.get('#lit-thought').should(($t) => {
      const content = style($t[0], '::before').content;
      expect(content).to.contain('observation');
    });
  });

  it('unknown type: degrades to its own plain text, muted accent', () => {
    cy.get('#lit-thought-unknown').should('have.attr', 'data-type', 'hallucination');
    cy.get('#lit-thought-unknown').should('have.class', 'sem-thought-unknown');
    cy.get('#lit-thought-unknown').should('not.have.class', 'sem-thought-hallucination');
    cy.get('#lit-thought-unknown').should(($t) => {
      // content flattened: no element children, one text node's worth
      expect($t[0].children).to.have.length(0);
      expect($t.text()).to.contain('degrades to this plain text');
      // the warning class mutes the accent: differs from a typed bubble's
      expect(style($t[0]).borderLeftColor)
        .to.not.equal(style($t[0].ownerDocument.getElementById('lit-thought')).borderLeftColor);
    });
  });

  it('no type: plain bubble — no mirror, no type class, content untouched', () => {
    cy.get('#lit-thought-plain').should('not.have.attr', 'data-type');
    cy.get('#lit-thought-plain').should('not.have.class', 'sem-thought-unknown');
    cy.get('#lit-thought-plain').should('contain', 'plain bubble');
    cy.get('#lit-thought-plain').should(($t) => {
      expect($t[0].children.length).to.be.greaterThan(0);
    });
  });
});

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('Testing Admin Specifications Builder & Mobile Directory View...');

const adminPath = path.join(__dirname, '..', 'admin.html');
const adminHtml = fs.readFileSync(adminPath, 'utf8');

// 1. Dynamic Specifications Builder UI Markup
assert(adminHtml.includes('id="specs-builder-wrap"'), 'admin.html should have #specs-builder-wrap');
assert(adminHtml.includes('id="specs-builder-grid"'), 'admin.html should have #specs-builder-grid');
assert(adminHtml.includes('id="drafted-desc-preview"'), 'admin.html should have #drafted-desc-preview');
assert(adminHtml.includes('id="btn-toggle-raw-desc"'), 'admin.html should have #btn-toggle-raw-desc');
assert(adminHtml.includes('id="raw-desc-container"'), 'admin.html should have #raw-desc-container');

// 2. Specifications Catalog & Definitions
assert(adminHtml.includes('SPEC_DEFINITIONS = {'), 'SPEC_DEFINITIONS catalog must be defined');
assert(adminHtml.includes("key: 'processor'"), 'Laptops specs must have processor spec');
assert(adminHtml.includes("key: 'graphics'"), 'Laptops specs must have graphics (GPU) spec');
assert(adminHtml.includes("key: 'battery'"), 'Laptops specs must have battery & cycle spec');
assert(adminHtml.includes('Apple M3 Pro'), 'Laptops specs must include Apple Silicon options');
assert(adminHtml.includes('NVIDIA GeForce RTX'), 'Laptops specs must include NVIDIA graphics options');

// 3. Dynamic Custom Spec Option & Auto-Drafting Functions
assert(adminHtml.includes('function renderSpecsBuilder'), 'renderSpecsBuilder function must exist');
assert(adminHtml.includes('window.toggleCustomSpecInput'), 'toggleCustomSpecInput function must exist');
assert(adminHtml.includes('window.saveNewSpecOption'), 'saveNewSpecOption function must exist');
assert(adminHtml.includes('window.updateDraftedDescription'), 'updateDraftedDescription function must exist');
assert(adminHtml.includes('window.toggleRawDescEdit'), 'toggleRawDescEdit function must exist');
assert(adminHtml.includes('detectSpecsFromGadget'), 'detectSpecsFromGadget helper must exist');

// 4. Mobile Directory Overflow & Cards View
assert(adminHtml.includes('id="admin-gadgets-cards-container"'), '#admin-gadgets-cards-container must exist');
assert(adminHtml.includes('class="directory-view-mode-bar"'), '.directory-view-mode-bar switcher must exist');
assert(adminHtml.includes('mobile-swipe-hint'), '.mobile-swipe-hint must exist');
assert(adminHtml.includes('window.setDirectoryViewMode'), 'setDirectoryViewMode function must exist');
assert(adminHtml.includes('function renderGadgetsCards'), 'renderGadgetsCards function must exist');

// 5. CSS Touch Scroll & Minimum Width
assert(adminHtml.includes('overflow-x: auto'), 'table-container must have overflow-x: auto');
assert(adminHtml.includes('-webkit-overflow-scrolling: touch'), 'table-container must have smooth touch scrolling');
assert(adminHtml.includes('min-width: 660px'), 'admin-table must have min-width for mobile scrolling');

console.log('✓ All Admin Specs Builder & Mobile Cards tests passed successfully!');

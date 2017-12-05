/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';
import * as path from 'path';

import {createTestEnvironment} from './util';

const fixtureDir = path.join(__dirname, '..', '..', 'src', 'test', 'static');

suite('DefinitionFinder', function() {
  const indexFile = path.join('editor-service', 'index.html');
  const tagPosition = {line: 7, column: 9};
  const localAttributePosition = {line: 7, column: 31};
  const deepAttributePosition = {line: 7, column: 49};

  let testName = `it supports getting the definition of ` +
      `an element from its tag`;
  test(testName, async() => {
    const {client, underliner} = await createTestEnvironment(fixtureDir);
    assert.deepEqual(
        await underliner.underline(
            await client.getDefinition(indexFile, tagPosition)),
        `
  Polymer({
          ~
    is: 'behavior-test-elem',
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    behaviors: [MyNamespace.SimpleBehavior],
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    properties: {
~~~~~~~~~~~~~~~~~
      /** A property defined directly on behavior-test-elem. */
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      localProperty: {
~~~~~~~~~~~~~~~~~~~~~~
        type: Boolean,
~~~~~~~~~~~~~~~~~~~~~~
        value: true,
~~~~~~~~~~~~~~~~~~~~
        notify: true
~~~~~~~~~~~~~~~~~~~~
      },
~~~~~~~~
      nonNotifyingProperty: {
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        type: String
~~~~~~~~~~~~~~~~~~~~
      },
~~~~~~~~
      notifyingProperty: {
~~~~~~~~~~~~~~~~~~~~~~~~~~
        type: String,
~~~~~~~~~~~~~~~~~~~~~
        notify: true
~~~~~~~~~~~~~~~~~~~~
      },
~~~~~~~~
      /** This is used entirely for internal purposes ok. */
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      _privateProperty: {
~~~~~~~~~~~~~~~~~~~~~~~~~
        type: String,
~~~~~~~~~~~~~~~~~~~~~
        value: 'don\\'t look!'
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      }
~~~~~~~
    },
~~~~~~


    created: function() {
~~~~~~~~~~~~~~~~~~~~~~~~~
      console.log('created!');
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    }
~~~~~
  });
~~~`);
  });


  test('it supports getting the definition of a local attribute', async() => {
    const {client, underliner} = await createTestEnvironment(fixtureDir);
    assert.deepEqual(
        await underliner.underline(
            await client.getDefinition(indexFile, localAttributePosition)),
        `
      localProperty: {
      ~~~~~~~~~~~~~~~~
        type: Boolean,
~~~~~~~~~~~~~~~~~~~~~~
        value: true,
~~~~~~~~~~~~~~~~~~~~
        notify: true
~~~~~~~~~~~~~~~~~~~~
      },
~~~~~~~`);
  });

  testName = 'it supports getting the definition of an attribute ' +
      'defined in a behavior';
  test(testName, async() => {
    const {client, underliner} = await createTestEnvironment(fixtureDir);

    assert.deepEqual(
        await underliner.underline(
            await client.getDefinition(indexFile, deepAttributePosition)),
        `
      deeplyInheritedProperty: {
      ~~~~~~~~~~~~~~~~~~~~~~~~~~
        type: Array,
~~~~~~~~~~~~~~~~~~~~
        value: function() {
~~~~~~~~~~~~~~~~~~~~~~~~~~~
          return [];
~~~~~~~~~~~~~~~~~~~~
        },
~~~~~~~~~~
        notify: true
~~~~~~~~~~~~~~~~~~~~
      }
~~~~~~~`);
  });

  test('it supports properties in databindings.', async() => {
    const fooPropUsePosition = {line: 2, column: 16};
    const internalPropUsePosition = {line: 3, column: 12};
    const {client, underliner} = await createTestEnvironment(fixtureDir);

    let location = (await client.getDefinition(
        'polymer/element-with-databinding.html', fooPropUsePosition))!;

    assert.deepEqual(await underliner.underline(location), `
        foo: String,
        ~~~~~~~~~~~`);
    location = (await client.getDefinition(
        'polymer/element-with-databinding.html', internalPropUsePosition))!;
    assert.deepEqual(await underliner.underline(location), `
        _internal: String,
        ~~~~~~~~~~~~~~~~~`);
  });


  testName = `it supports getting references to an element from its tag`;
  test(testName, async() => {
    const contentsPath = path.join('editor-service', 'references.html');
    const {client, underliner} = await createTestEnvironment(fixtureDir);
    await client.openFile(contentsPath);

    let references =
        await client.getReferences(contentsPath, {line: 7, column: 3});
    let ranges = await underliner.underline(references);
    assert.deepEqual(ranges, [
      `
  <anonymous-class one></anonymous-class>
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
      `
  <anonymous-class two></anonymous-class>
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
    ]);

    references =
        await client.getReferences(contentsPath, {line: 7, column: 3}, true);
    ranges = await underliner.underline(references);
    assert.deepEqual(ranges, [
      `
customElements.define('anonymous-class', class extends HTMLElement{});
                                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
      `
  <anonymous-class one></anonymous-class>
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
      `
  <anonymous-class two></anonymous-class>
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
    ]);

    references = await client.getReferences(contentsPath, {line: 8, column: 3});
    ranges = await underliner.underline(references);

    assert.deepEqual(ranges, [
      `
  <simple-element one></simple-element>
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`,
      `
    <simple-element two></simple-element>
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~`
    ]);
  });

  test(`supports getting workspace symbols`, async() => {
    const {client} =
        await createTestEnvironment(path.join(fixtureDir, 'editor-service'));
    assert.deepEqual(
        (await client.getWorkspaceSymbols('')).map((s) => s.name), [
          'slot-test-elem',
          'slot-one-test-elem',
          'behavior-user',
        ]);
    assert.deepEqual(
        (await client.getWorkspaceSymbols('one')).map((s) => s.name), [
          'slot-one-test-elem',
        ]);
  });

  test(`supports getting document symbols`, async() => {
    const {client} =
        await createTestEnvironment(path.join(fixtureDir, 'editor-service'));
    assert.deepEqual(
        (await client.getDocumentSymbols('slot-test-elem.html'))
            .map((s) => s.name),
        [
          'slot-test-elem',
          'slot-one-test-elem',
        ]);
    assert.deepEqual(
        (await client.getWorkspaceSymbols('slot.html')).map((s) => s.name), []);
  });
});
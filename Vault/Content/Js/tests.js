/*
    var vault = {
        init: _init,
        showDetail: _showDetail,
        loadCredential: _loadCredential,
        confirmDelete: _confirmDelete,
        deleteCredential: _deleteCredential,
        changePassword: _changePassword,
        exportData: _exportData
    };

    var testMethods = {
        insertCopyLink: _insertCopyLink,
        insertSpinner: _insertSpinner,
        htmlEncode: _htmlEncode,
        htmlDecode: _htmlDecode,
        encryptObject: _encryptObject,
        decryptObject: _decryptObject,
        removeFromList: _removeFromList,
        updateDescription: _updateDescription,
        loadCredentials: _loadCredentials,
        generatePasswordHash: _generatePasswordHash,
        generatePasswordHash64: _generatePasswordHash64,
        buildDataTable: _buildDataTable,
        createCredentialTable: _createCredentialTable,
        createCredentialTableRow: _createCredentialTableRow,
        validateRecord: _validateRecord,
        utf8_to_b64: _utf8_to_b64,
        b64_to_utf8: _b64_to_utf8,
        contains: _contains,
        truncate: _truncate,
        search: _search,
        sortCredentials: _sortCredentials
    };
*/

QUnit.begin(function () {
    console.log('start tests');
});

QUnit.testStart(function () {
    Vault.init(true);
});

QUnit.testDone(function () {
    console.log('end test');
});

QUnit.done(function () {
    console.log('end tests');
});

QUnit.test('Got Vault', function (assert) {
    assert.ok(typeof Vault !== 'undefined');
});

QUnit.test('Test _htmlEncode', function (assert) {
    var testString = '<a href="test.asp?q=1&r=2">This: Is a test\' link! + Symbols</a>';
    console.log(Vault.htmlEncode(testString));
    assert.ok(Vault.htmlEncode(testString) === '&lt;a href="test.asp?q=1&amp;r=2"&gt;This: Is a test\' link! + Symbols&lt;/a&gt;');
});

QUnit.test('Test _htmlDecode', function (assert) {
    var testString = '&lt;a href=&quot;test.asp?q=1&amp;r=2&quot;&gt;This: Is a test\' link! + Symbols&lt;/a&gt;';
    assert.ok(Vault.htmlDecode(testString) === '<a href="test.asp?q=1&r=2">This: Is a test\' link! + Symbols</a>');
});

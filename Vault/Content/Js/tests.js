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
        encryptObject: _encryptObject,
        decryptObject: _decryptObject,
        removeFromList: _removeFromList,
        updateDescription: _updateDescription,
        defaultAjaxErrorCallback: _defaultAjaxErrorCallback,
        ajaxPost: _ajaxPost,
        loadCredentials: _loadCredentials,
        showDetail: _showDetail,
        defaultAcceptAction: _defaultAcceptAction,
        defaultCloseAction: _defaultCloseAction,
        showModal: _showModal,
        setUpCredentialEditModal: _setUpCredentialEditModal,
        loadCredential: _loadCredential,
        deleteCredential: _deleteCredential,
        confirmDelete: _confirmDelete,
        generatePasswordHash: _generatePasswordHash,
        generatePasswordHash64: _generatePasswordHash64,
        changePassword: _changePassword,
        exportData: _exportData,
        options: _options,
        buildDataTable: _buildDataTable,
        createCredentialTable: _createCredentialTable,
        createCredentialTableRow: _createCredentialTableRow,
        validateRecord: _validateRecord,
        utf8_to_b64: _utf8_to_b64,
        b64_to_utf8: _b64_to_utf8,
        contains: _contains,
        truncate: _truncate,
        search: _search,
        debounce: _debounce,
        sortCredentials: _sortCredentials,
        init: _init
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

QUnit.test('Test _insertCopyLink', function (assert) {
    var copyLink = $(Vault.insertCopyLink('http://www.test.com'));
    assert.ok(copyLink.find('param[name="FlashVars"]').length);
});
